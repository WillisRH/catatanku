import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateCsrfToken } from "@/lib/csrf";

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = req.headers.get("X-CSRF-Token");
  if (!token || !validateCsrfToken(session.user.id, token))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { noteId, pin } = await req.json();
  if (!noteId || typeof pin !== "boolean")
    return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const note = await (prisma.note.findUnique as any)({ where: { id: noteId }, select: { userId: true } });
  if (!note || note.userId !== session.user.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await (prisma.note.update as any)({
    where: { id: noteId },
    data: { isProfilePinned: pin },
  });

  return NextResponse.json({ success: true });
}
