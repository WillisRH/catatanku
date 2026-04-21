import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let noteIds: string[] | null = null;
  try {
    const body = await req.json();
    if (body.ids && Array.isArray(body.ids)) noteIds = body.ids;
  } catch (e) {}

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true }
  });

  const notes = await prisma.note.findMany({
    where: { 
      userId: session.user.id,
      ...(noteIds ? { id: { in: noteIds } } : {})
    },
    orderBy: { ts: "desc" },
  });

  const notesExport = notes.map((note) => ({
    id: note.id,
    date: note.date,
    title: decrypt(note.title || ""),
    text: decrypt(note.text || ""),
    mood: note.mood,
    stickers: note.stickers,
    tags: (note as any).tags || [],
    font: (note as any).font || null,
    color: (note as any).color || null,
    theme: (note as any).theme || null,
    isLocked: (note as any).isLocked || false,
    isPinned: (note as any).isPinned || false,
    isProfilePinned: (note as any).isProfilePinned || false,
    songTitle: (note as any).songTitle || null,
    ts: Number(note.ts),
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  }));

  const exported = {
    version: "1.1",
    exportDate: new Date().toISOString(),
    owner: {
      name: user?.name || "Unknown",
      email: user?.email || "Unknown",
    },
    notes: notesExport
  };

  return NextResponse.json(exported, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
