import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED = ["👍", "❤️", "🔥", "✨", "🎉"];
const pr = (prisma as any).profileReaction;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: toUserId } = await params;

  // Verify target user exists
  const target = await (prisma.user.findUnique as any)({ where: { id: toUserId }, select: { id: true } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (toUserId === session.user.id) return NextResponse.json({ error: "Cannot react to yourself" }, { status: 400 });

  const { emoji } = await req.json();
  if (!ALLOWED.includes(emoji)) return NextResponse.json({ error: "Invalid emoji" }, { status: 400 });

  // Find any existing reaction from this user to this profile (only 1 allowed)
  const existing = await pr.findFirst({
    where: { fromUserId: session.user.id, toUserId },
  });

  if (existing) {
    if (existing.emoji === emoji) {
      // Already reacted with same emoji — not allowed to remove
      return NextResponse.json({ error: "Already reacted" }, { status: 409 });
    } else {
      // Different emoji → replace
      await pr.update({ where: { id: existing.id }, data: { emoji } });
      return NextResponse.json({ action: "changed", emoji, previous: existing.emoji });
    }
  }

  // No existing → add
  await pr.create({ data: { fromUserId: session.user.id, toUserId, emoji } });
  return NextResponse.json({ action: "added", emoji });
}
