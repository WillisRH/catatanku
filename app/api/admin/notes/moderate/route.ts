import { NextResponse } from "next/server";
import { requireAdminWithCsrf } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { invalidate, CK } from "@/lib/redis";

export async function POST(req: Request) {
  const admin = await requireAdminWithCsrf(req);
  if (admin instanceof NextResponse) return admin;

  const body = await req.json().catch(() => null);
  if (!body?.noteId || typeof body.hide !== "boolean") {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const { noteId, hide } = body as { noteId: string; hide: boolean };

  const note = await (prisma.note.findUnique as any)({
    where: { id: noteId },
    select: { id: true, userId: true, shareId: true },
  });
  if (!note) return NextResponse.json({ error: "Catatan tidak ditemukan." }, { status: 404 });

  await (prisma.note.update as any)({
    where: { id: noteId },
    data: { isModerated: hide },
  });

  const keys = [
    CK.note(noteId),
    CK.sharedNote(noteId),
    note.shareId ? CK.sharedNote(note.shareId) : "",
    CK.userNotes(note.userId),
    CK.sharedUserNotes(note.userId),
    CK.userPage(note.userId),
    CK.userPublicNotes(note.userId),
  ].filter(Boolean);
  await invalidate(...keys);

  return NextResponse.json({ ok: true });
}
