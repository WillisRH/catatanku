import { NextResponse } from "next/server";
import { requireAdminWithCsrf } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const admin = await requireAdminWithCsrf(req);
  if (admin instanceof NextResponse) return admin;

  const body = await req.json().catch(() => null);
  if (!body || !body.userId || typeof body.suspend !== "boolean") {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  const { userId, suspend, reason, note } = body as { userId: string; suspend: boolean; reason?: string; note?: string };

  if (userId === admin.userId) {
    return NextResponse.json({ error: "Tidak bisa suspend diri sendiri." }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!target) {
    return NextResponse.json({ error: "User tidak ditemukan." }, { status: 404 });
  }
  if (target.role === "admin") {
    return NextResponse.json({ error: "Tidak bisa suspend admin lain." }, { status: 403 });
  }

  await (prisma.user.update as any)({
    where: { id: userId },
    data: {
      isSuspended: suspend,
      suspendReason: suspend ? (reason || null) : null,
      suspendNote: suspend ? (note || null) : null,
    },
  });

  return NextResponse.json({ ok: true });
}
