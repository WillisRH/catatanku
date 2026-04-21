import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateCsrfToken } from "@/lib/csrf";
import bcrypt from "bcryptjs";

// POST — lock a note with a password or PIN credential
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = req.headers.get("X-CSRF-Token");
  if (!token || !validateCsrfToken(session.user.id, token))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { noteId, lockType, password, pin } = await req.json();
  if (!noteId || !lockType) return NextResponse.json({ error: "Missing fields." }, { status: 400 });
  if (lockType !== "password" && lockType !== "pin")
    return NextResponse.json({ error: "Invalid lockType." }, { status: 400 });

  // Verify note ownership
  const note = await prisma.note.findUnique({ where: { id: noteId }, select: { userId: true } });
  if (!note || note.userId !== session.user.id)
    return NextResponse.json({ error: "Not found." }, { status: 404 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { password: true } });
  if (!user) return NextResponse.json({ error: "User tidak ditemukan." }, { status: 404 });

  let notePinHash: string | null = null;

  if (lockType === "password") {
    if (!user.password)
      return NextResponse.json({ error: "Belum ada kata sandi akun. Buat kata sandi dulu." }, { status: 400 });
    if (!password)
      return NextResponse.json({ error: "Masukkan kata sandi untuk mengunci." }, { status: 400 });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return NextResponse.json({ error: "Kata sandi salah." }, { status: 401 });
  } else {
    // PIN
    if (!pin || typeof pin !== "string" || !/^\d{4,6}$/.test(pin))
      return NextResponse.json({ error: "PIN harus 4–6 digit angka." }, { status: 400 });
    notePinHash = await bcrypt.hash(pin, 10);
  }

  await (prisma.note.update as any)({
    where: { id: noteId },
    data: { isLocked: true, lockType, notePinHash },
  });

  return NextResponse.json({ success: true, lockType });
}

// DELETE — remove lock from an already-unlocked note (no re-auth needed since session already holds unlock)
export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = req.headers.get("X-CSRF-Token");
  if (!token || !validateCsrfToken(session.user.id, token))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { noteId } = await req.json();
  if (!noteId) return NextResponse.json({ error: "Missing noteId." }, { status: 400 });

  const note = await prisma.note.findUnique({ where: { id: noteId }, select: { userId: true } });
  if (!note || note.userId !== session.user.id)
    return NextResponse.json({ error: "Not found." }, { status: 404 });

  await (prisma.note.update as any)({
    where: { id: noteId },
    data: { isLocked: false, lockType: "password", notePinHash: null },
  });

  return NextResponse.json({ success: true });
}
