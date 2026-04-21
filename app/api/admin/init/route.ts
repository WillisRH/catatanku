import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Emails allowed to self-promote to admin role.
// Must match the list in app/api/user/medals/route.ts
const ADMIN_EMAILS = ["willissmpn51jkrt@gmail.com"];

/**
 * One-time endpoint: promote yourself to admin.
 * Only works if:
 *   1. You are logged in
 *   2. Your email is in ADMIN_EMAILS
 *   3. There are currently NO admins in the DB (prevents abuse once admin exists)
 *      OR you are already an admin (idempotent no-op)
 */
export async function POST() {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const email = session?.user?.email;
  if (!email || !ADMIN_EMAILS.includes(email)) {
    return NextResponse.json({ error: "Email kamu tidak ada di daftar admin." }, { status: 403 });
  }

  // Check current admin count
  const adminCount = await (prisma.user.count as any)({
    where: { role: "admin" },
  });

  // Allow if: no admins exist yet, or the caller is already admin (idempotent)
  const caller = await (prisma.user.findUnique as any)({
    where: { id: userId },
    select: { role: true },
  });

  if (adminCount > 0 && caller?.role !== "admin") {
    return NextResponse.json({ error: "Admin sudah ada. Hubungi admin yang sudah ada untuk promote." }, { status: 403 });
  }

  if (caller?.role === "admin") {
    return NextResponse.json({ ok: true, message: "Kamu sudah admin." });
  }

  await (prisma.user.update as any)({
    where: { id: userId },
    data: { role: "admin" },
  });

  return NextResponse.json({ ok: true, message: "Berhasil! Kamu sekarang admin. Refresh halaman." });
}
