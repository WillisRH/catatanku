import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { invalidate, cached, CK } from "@/lib/redis";

function generateInviteCode() {
  return (
    Math.random().toString(36).slice(2, 8) +
    Math.random().toString(36).slice(2, 8)
  ).toUpperCase();
}


/** GET — return collab state (invite code + members) for any participant */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const result = await cached(CK.collab(id), async () => {
    const note = await (prisma.note.findFirst as any)({
      where: {
        id,
        OR: [{ userId }, { collabMembers: { some: { userId } } }],
      },
      select: { id: true, userId: true, collabInvite: true, collabPaused: true },
    });
    if (!note) return null;

    const members = await (prisma.noteCollabMember.findMany as any)({
      where: { noteId: id },
      include: {
        user: { select: { id: true, name: true, username: true, image: true } },
      },
      orderBy: { joinedAt: "asc" },
    });

    return {
      userId: note.userId,
      inviteCode: note.collabInvite,
      collabPaused: note.collabPaused,
      members: members.map((m: any) => ({
        userId: m.userId,
        name: m.user.name || m.user.username || "Anon",
        image: m.user.image,
        role: m.role,
        isBanned: m.isBanned,
        joinedAt: m.joinedAt,
      })),
    };
  }, 30);

  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
  
  // Compute isOwner per-request, not in cache
  const finalResult = {
    ...result,
    isOwner: result.userId === userId,
  };
  
  return NextResponse.json(finalResult);
}

/** POST — enable collab on the note (owner only), returns invite code */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const note = await (prisma.note.findFirst as any)({
    where: { id, userId },
    select: { id: true, collabInvite: true },
  });
  if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (note.collabInvite) {
    return NextResponse.json({ inviteCode: note.collabInvite });
  }

  let inviteCode = generateInviteCode();
  for (let i = 0; i < 5; i++) {
    const existing = await (prisma.note.findFirst as any)({
      where: { collabInvite: inviteCode },
      select: { id: true },
    });
    if (!existing) break;
    inviteCode = generateInviteCode();
  }

  await (prisma.note.update as any)({ where: { id }, data: { collabInvite: inviteCode } });

  await (prisma.noteCollabMember.upsert as any)({
    where: { noteId_userId: { noteId: id, userId } },
    create: { noteId: id, userId, role: "owner" },
    update: { role: "owner" },
  });

  await invalidate(CK.collab(id), CK.note(id), CK.userNotes(userId));
  return NextResponse.json({ inviteCode });
}

/** PATCH — pause or resume collab (owner only) */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const note = await (prisma.note.findFirst as any)({
    where: { id, userId },
    select: { id: true, collabPaused: true },
  });
  if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { paused } = await req.json();
  await (prisma.note.update as any)({ where: { id }, data: { collabPaused: !!paused } });

  await invalidate(CK.collab(id));
  return NextResponse.json({ paused: !!paused });
}

/** DELETE — disable collab (owner only) */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const note = await (prisma.note.findFirst as any)({
    where: { id, userId },
    select: { id: true },
  });
  if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await Promise.all([
    (prisma.note.update as any)({ where: { id }, data: { collabInvite: null } }),
    prisma.noteCollabMember.deleteMany({ where: { noteId: id } }),
    prisma.noteYjsUpdate.deleteMany({ where: { noteId: id } }),
  ]);

  await invalidate(CK.collab(id), CK.note(id), CK.userNotes(userId));
  return NextResponse.json({ ok: true });
}
