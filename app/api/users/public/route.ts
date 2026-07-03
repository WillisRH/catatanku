import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cached, CK } from "@/lib/redis";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

  const result = await cached(CK.userPublicNotes(userId), async () => {
    const user = await (prisma.user.findUnique as any)({
      where: { id: userId },
      select: { id: true, name: true, username: true, image: true, isSuspended: true },
    });
    if (!user || user.isSuspended) return null;

    const notes = await prisma.note.findMany({
      where: { userId, shareId: { not: null } },
      select: { shareId: true, title: true, date: true, mood: true, tags: true, ts: true, color: true, theme: true },
      orderBy: { ts: "desc" },
    });

    return {
      user,
      notes: notes.map(n => ({ ...n, ts: n.ts.toString() })),
    };
  }, 30);

  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(result);
}
