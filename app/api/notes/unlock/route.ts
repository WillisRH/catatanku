import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";
import { invalidate, CK } from "@/lib/redis";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, password, pin } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const note = await (prisma.note.findUnique as any)({
    where: { id, userId: session.user.id },
    select: {
      id: true, date: true, title: true, text: true, mood: true, stickers: true, tags: true,
      font: true, ts: true, userId: true, createdAt: true, updatedAt: true,
      isLocked: true, lockType: true, notePinHash: true,
      isPinned: true, isProfilePinned: true, color: true, theme: true, shareId: true,
      songId: true, songTitle: true, songArtwork: true, songPreview: true, shareMusic: true,
      lat: true, lng: true,
    },
  });
  if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const lockType: string = note.lockType ?? "password";

  if (lockType === "pin") {
    if (!pin) return NextResponse.json({ error: "PIN diperlukan." }, { status: 400 });
    if (!note.notePinHash) return NextResponse.json({ verified: false }, { status: 401 });
    const valid = await bcrypt.compare(String(pin), note.notePinHash);
    if (!valid) return NextResponse.json({ verified: false }, { status: 401 });
  } else {
    // password-based
    if (!password) return NextResponse.json({ error: "Kata sandi diperlukan." }, { status: 400 });
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { password: true } });
    if (!user?.password) return NextResponse.json({ error: "No password set" }, { status: 400 });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return NextResponse.json({ verified: false }, { status: 401 });
  }

  return NextResponse.json({
    ...note,
    title: decrypt(note.title || ""),
    text: decrypt(note.text || ""),
    ts: Number(note.ts),
    notePinHash: undefined, // never send hash to client
    verified: true,
  });
}
