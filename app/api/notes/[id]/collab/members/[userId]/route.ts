import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { invalidate, CK } from "@/lib/redis";

/** PATCH — ban a member (owner only) */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const session = await auth();
  const callerId = (session?.user as any)?.id as string | undefined;
  if (!callerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: noteId, userId: targetUserId } = await params;

  const note = await (prisma.note.findFirst as any)({
    where: { id: noteId, userId: callerId },
    select: { id: true },
  });
  if (!note) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await (prisma.noteCollabMember.update as any)({
    where: { noteId_userId: { noteId, userId: targetUserId } },
    data: { isBanned: true },
  });

  await invalidate(CK.collab(noteId), CK.userNotes(targetUserId));
  return NextResponse.json({ ok: true });
}

/** DELETE — kick a member (owner only) or leave (self) */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const session = await auth();
  const callerId = (session?.user as any)?.id as string | undefined;
  if (!callerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: noteId, userId: targetUserId } = await params;

  const note = await (prisma.note.findFirst as any)({
    where: { id: noteId },
    select: { userId: true },
  });
  if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwner = note.userId === callerId;
  const isSelf = callerId === targetUserId;

  // Only owner can kick others; anyone can leave themselves
  if (!isOwner && !isSelf)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Can't kick the owner
  if (isOwner && targetUserId === note.userId)
    return NextResponse.json({ error: "Cannot remove owner" }, { status: 400 });

  await (prisma.noteCollabMember.deleteMany as any)({
    where: { noteId, userId: targetUserId },
  });

  await invalidate(CK.collab(noteId), CK.userNotes(targetUserId));
  return NextResponse.json({ ok: true });
}
