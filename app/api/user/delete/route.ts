import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

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
  await prisma.user.delete({ where: { id: session.user.id } });

  return NextResponse.json({ success: true });
}
