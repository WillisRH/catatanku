import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";
import { cached, CK } from "@/lib/redis";

/** GET — fetch a single note by ID (owner or collab member) */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const result = await cached(CK.note(id), async () => {
    const note = await (prisma.note.findFirst as any)({
      where: {
        id,
        OR: [{ userId }, { collabMembers: { some: { userId, isBanned: false } } }],
      },
      select: {
        id: true, date: true, title: true, text: true, mood: true, stickers: true,
        tags: true, font: true, ts: true, userId: true, isLocked: true, lockType: true,
        isPinned: true, isProfilePinned: true, color: true, theme: true, shareId: true,
        songId: true, songTitle: true, songArtwork: true, songPreview: true, shareMusic: true,
        isOneTime: true, collabInvite: true,
      },
    });

    if (!note) return null;

    return {
      ...note,
      title: note.isLocked ? "" : (decrypt(note.title || "") || ""),
      text: note.isLocked ? "" : (decrypt(note.text || "") || ""),
      ts: Number(note.ts),
    };
  }, 30);

  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(result);
}
