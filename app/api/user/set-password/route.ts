import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// POST — set an initial password for Google-only accounts (no existing password)
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { password, confirmPassword } = await req.json();
  if (!password || !confirmPassword)
    return NextResponse.json({ error: "Semua field wajib diisi." }, { status: 400 });
  if (password !== confirmPassword)
    return NextResponse.json({ error: "Kata sandi tidak cocok." }, { status: 400 });
  if (password.length < 6)
    return NextResponse.json({ error: "Kata sandi minimal 6 karakter." }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { password: true } });
  if (!user) return NextResponse.json({ error: "User tidak ditemukan." }, { status: 404 });
  if (user.password) return NextResponse.json({ error: "Akun ini sudah punya kata sandi." }, { status: 400 });

  const hashed = await bcrypt.hash(password, 12);
  await prisma.user.update({ where: { id: session.user.id }, data: { password: hashed } });

  return NextResponse.json({ success: true });
}
