import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, password } = await req.json();
  if (!id || !password) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  // Verify password
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.password) return NextResponse.json({ error: "No password set" }, { status: 400 });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return NextResponse.json({ verified: false }, { status: 401 });

  // Fetch and decrypt the note
  const note = await prisma.note.findUnique({
    where: { id, userId: session.user.id },
  });
  if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    ...note,
    title: decrypt(note.title || ''),
    text: decrypt(note.text || ''),
    ts: Number(note.ts),
    verified: true,
  });
}
