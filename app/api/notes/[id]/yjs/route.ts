import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function canAccessNote(noteId: string, userId: string) {
  return (prisma.note.findFirst as any)({
    where: {
      id: noteId,
      OR: [{ userId }, { collabMembers: { some: { userId, isBanned: false } } }],
    },
    select: { id: true, userId: true, collabPaused: true },
  });
}

/** GET — fetch persisted snapshot for late joiners (called once on join, not polled) */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const note = await canAccessNote(id, userId);
  if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Get the most recently updated snapshot from any collaborator
  const latest = await (prisma.noteYjsUpdate.findFirst as any)({
    where: { noteId: id, userId: { not: userId } },
    orderBy: { updatedAt: "desc" },
    select: { data: true },
  });

  return NextResponse.json({
    text: latest ? Buffer.from(latest.data).toString("utf8") : null,
  });
}

/** POST — persist current snapshot every ~5s (for late joiners, not for broadcasting) */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const note = await canAccessNote(id, userId);
  if (!note || (note.userId !== userId && note.collabPaused)) {
    return NextResponse.json({ error: "Not found or paused" }, { status: 403 });
  }

  const { text } = await req.json();
  if (text === undefined || text === null) return NextResponse.json({ ok: true });

  await (prisma.noteYjsUpdate.upsert as any)({
    where: { noteId_userId: { noteId: id, userId } },
    create: { noteId: id, userId, data: Buffer.from(text, "utf8") },
    update: { data: Buffer.from(text, "utf8") },
  });

  return NextResponse.json({ ok: true });
}
