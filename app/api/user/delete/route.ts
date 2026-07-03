import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { invalidate, invalidatePrefix, CK } from "@/lib/redis";

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { password } = await req.json();
  if (!password) return NextResponse.json({ error: "Password required" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.password) return NextResponse.json({ error: "No password set" }, { status: 400 });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return NextResponse.json({ error: "Kata sandi salah" }, { status: 401 });

  // Cascade delete: notes and fcmTokens deleted via Prisma onDelete: Cascade
  // Fetch note IDs and share IDs first so we can invalidate their caches
  const notes = await prisma.note.findMany({
    where: { userId: session.user.id },
    select: { id: true, shareId: true },
  });

  await prisma.user.delete({ where: { id: session.user.id } });

  const keys = [
    CK.userProfile(session.user.id),
    CK.publicProfile(session.user.id),
    CK.userPage(session.user.id),
    CK.userNotes(session.user.id),
    CK.sharedUserNotes(session.user.id),
    ...notes.map(n => CK.note(n.id)),
    ...notes.map(n => n.shareId ? CK.sharedNote(n.shareId) : "").filter(Boolean),
  ];
  await invalidate(...keys);
  await invalidatePrefix("users:search:");

  return NextResponse.json({ success: true });
}
