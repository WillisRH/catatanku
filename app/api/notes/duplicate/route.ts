import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/encryption";
import { validateCsrfToken } from "@/lib/csrf";

function checkCsrf(req: Request, userId: string): boolean {
  const token = req.headers.get("X-CSRF-Token");
  if (!token) return false;
  return validateCsrfToken(userId, token);
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!checkCsrf(req, session.user.id)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { sourceId } = await req.json();
  if (!sourceId) return NextResponse.json({ error: "Missing sourceId" }, { status: 400 });

  const source = await prisma.note.findUnique({ where: { id: sourceId } });

  if (!source) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (source.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if ((source as any).isLocked) return NextResponse.json({ error: "Cannot duplicate a locked note" }, { status: 403 });

  const rawTitle = decrypt(source.title || "");
  const newTitle = rawTitle.trim() ? `Salinan ${rawTitle}` : "Salinan";

  const duplicate = await prisma.note.create({
    data: {
      id: uid(),
      date: source.date,
      title: encrypt(newTitle),
      text: source.text,
      mood: source.mood,
      stickers: source.stickers,
      ts: BigInt(Date.now()),
      userId: session.user.id,
      // @ts-ignore
      isLocked: false,
      // @ts-ignore
      isPinned: false,
      // @ts-ignore
      color: (source as any).color || "",
      // @ts-ignore
      theme: (source as any).theme || "",
      // @ts-ignore
      tags: (source as any).tags || [],
      // @ts-ignore
      font: (source as any).font || null,
      // @ts-ignore
      shareId: null,
    },
  });

  return NextResponse.json({
    ...duplicate,
    ts: Number(duplicate.ts),
    title: newTitle,
    text: decrypt(source.text || ""),
  });
}
