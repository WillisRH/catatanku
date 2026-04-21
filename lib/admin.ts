import { auth } from "./auth";
import { prisma } from "./prisma";
import { validateCsrfToken } from "./csrf";
import { NextResponse } from "next/server";

/**
 * Always re-queries the DB — never trusts JWT alone (role can be stale).
 * Returns { userId } for active, non-suspended admins; null otherwise.
 */
export async function requireAdmin(): Promise<{ userId: string } | null> {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, isSuspended: true },
  });

  if (!user || user.role !== "admin" || user.isSuspended) return null;

  return { userId };
}

/**
 * Combines requireAdmin + CSRF validation in one call.
 * Returns { userId } on success, or a 403 NextResponse to return immediately.
 */
export async function requireAdminWithCsrf(
  req: Request
): Promise<{ userId: string } | NextResponse> {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const csrfToken = req.headers.get("X-CSRF-Token");
  if (!csrfToken || !validateCsrfToken(admin.userId, csrfToken)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return admin;
}
