import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";
import { cached, invalidate, CK } from "@/lib/redis";

async function getNoteByCode(inviteCode: string) {
  return (prisma.note.findFirst as any)({
    where: { collabInvite: inviteCode },
    select: {
      id: true,
      title: true,
      userId: true,
      collabPaused: true,
      collabMembers: { select: { userId: true, role: true, isBanned: true } },
      user: { select: { name: true, username: true, image: true } },
    },
  });
}

/** GET — preview note info before joining */
export async function GET(req: Request, { params }: { params: Promise<{ inviteCode: string }> }) {
  const session = await auth();
  if (!(session?.user as any)?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { inviteCode } = await params;

  const result = await cached(CK.collabInvite(inviteCode), async () => {
    const note = await getNoteByCode(inviteCode);
    if (!note) return null;

    return {
      noteId: note.id,
      title: decrypt(note.title || "") || "Catatan tanpa judul",
      ownerName: note.user.name || note.user.username || "Pengguna",
      ownerImage: note.user.image,
      memberCount: note.collabMembers.length,
      collabPaused: note.collabPaused,
      collabMembers: note.collabMembers,
    };
  }, 30);

  if (!result) return NextResponse.json({ error: "Invalid invite" }, { status: 404 });
  
  const userId = (session?.user as any)?.id as string;
  const membership = result.collabMembers.find((m: any) => m.userId === userId);
  
  const finalResult = {
    noteId: result.noteId,
    title: result.title,
    ownerName: result.ownerName,
    ownerImage: result.ownerImage,
    memberCount: result.memberCount,
    collabPaused: result.collabPaused,
    isBanned: membership?.isBanned || false,
  };
  
  return NextResponse.json(finalResult);
}

/** POST — join the collab note */
export async function POST(req: Request, { params }: { params: Promise<{ inviteCode: string }> }) {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { inviteCode } = await params;
  const note = await getNoteByCode(inviteCode);
  if (!note) return NextResponse.json({ error: "Invalid invite" }, { status: 404 });

  // Owner doesn't need to join (they're already the owner)
  if (note.userId === userId) {
    return NextResponse.json({ noteId: note.id, alreadyOwner: true });
  }

  // Check if user is banned from this note
  const membership = note.collabMembers.find((m: any) => m.userId === userId);
  if (membership?.isBanned) {
    return NextResponse.json({ error: "Banned" }, { status: 403 });
  }

  // Fetch joining user's profile for broadcast payload
  const joiningUser = await (prisma.user.findUnique as any)({
    where: { id: userId },
    select: { name: true, username: true, image: true },
  });

  await (prisma.noteCollabMember.upsert as any)({
    where: { noteId_userId: { noteId: note.id, userId } },
    create: { noteId: note.id, userId, role: "editor" },
    update: {},
  });

  // Invalidate collab and invite caches
  await invalidate(CK.collab(note.id), CK.collabInvite(inviteCode), CK.userNotes(userId));

  return NextResponse.json({
    noteId: note.id,
    userId,
    name: joiningUser?.name || joiningUser?.username || "Anon",
    image: joiningUser?.image || null,
  });
}
