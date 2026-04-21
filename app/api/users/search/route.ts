import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (q.length < 1) return NextResponse.json([]);

  // Admins can see suspended users in search; regular users cannot
  const viewer = await (prisma.user.findUnique as any)({
    where: { id: session.user.id },
    select: { role: true },
  });
  const isAdmin = viewer?.role === "admin";

  const users = await (prisma.user.findMany as any)({
    where: {
      id: { not: session.user.id },
      ...(isAdmin ? {} : { isSuspended: false }),
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { username: { contains: q, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
      isSuspended: true,
      _count: { select: { notes: { where: { shareId: { not: null } } } } },
    },
    take: 15,
  });

  return NextResponse.json(
    users.map((u: any) => ({
      id: u.id,
      name: u.name,
      username: u.username,
      image: u.image,
      sharedCount: u._count.notes,
      isSuspended: isAdmin ? !!u.isSuspended : false,
    }))
  );
}
