import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";

const EMOJIS = ["👍", "❤️", "🔥", "✨", "🎉"];
const pr = (prisma as any).profileReaction;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();

  const { id } = await params;

  const [user, reactions, myReactions] = await Promise.all([
    (prisma.user.findUnique as any)({
      where: { id },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        profileTheme: true,
        bio: true,
        instagram: true,
        twitter: true,
        tiktok: true,
        isPrivate: true,
        isSuspended: true,
        suspendReason: true,
        displayedMedal: true,
        currentStreak: true,
        longestStreak: true,
        medals: true,
        createdAt: true,
        _count: {
          select: { notes: { where: { shareId: { not: null } } } },
        },
        notes: {
          where: { isProfilePinned: true },
          orderBy: { ts: 'desc' },
          select: {
            id: true,
            title: true,
            text: true,
            mood: true,
            date: true,
            theme: true,
            color: true,
            shareId: true,
            isLocked: true,
            ts: true
          }
        }
      },
    }),
    pr.groupBy({
      by: ["emoji"],
      where: { toUserId: id },
      _count: { emoji: true },
    }),
    session?.user?.id
      ? pr.findMany({ where: { toUserId: id, fromUserId: session.user.id }, select: { emoji: true } })
      : Promise.resolve([]),
  ]);

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwner = session?.user?.id === id;

  // Check if the viewer is an admin — always re-queries DB, never trusts JWT alone
  let isViewerAdmin = false;
  const viewerId = (session?.user as any)?.id as string | undefined;
  if (viewerId && !isOwner) {
    const viewer = await (prisma.user.findUnique as any)({
      where: { id: viewerId },
      select: { role: true, isSuspended: true },
    });
    isViewerAdmin = viewer?.role === "admin" && !viewer?.isSuspended;
  }

  if (user.isPrivate && !isOwner && !isViewerAdmin) {
    return NextResponse.json({
      id: user.id,
      name: user.name,
      username: user.username,
      image: user.image,
      profileTheme: user.profileTheme ?? "cocoa",
      isPrivate: true,
      displayedMedal: user.displayedMedal,
      sharedCount: 0,
      memberSince: user.createdAt,
      isLoggedIn: !!session?.user?.id,
      isOwner: false,
      isViewerAdmin,
      isSuspended: false,
      suspendReason: null,
      pinnedNotes: [],
      reactions: EMOJIS.map(e => ({ emoji: e, count: 0 })),
      myReactions: [],
      bio: null,
      instagram: null,
      twitter: null,
      tiktok: null,
      currentStreak: 0,
      longestStreak: 0,
    });
  }

  // Build counts map: { "👍": 3, "❤️": 1, ... }
  const reactionCounts: Record<string, number> = {};
  for (const r of reactions) reactionCounts[r.emoji] = r._count.emoji;

  return NextResponse.json({
    id: user.id,
    name: user.name,
    username: user.username,
    image: user.image,
    profileTheme: user.profileTheme ?? "cocoa",
    bio: user.bio,
    instagram: user.instagram,
    twitter: user.twitter,
    tiktok: user.tiktok,
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    sharedCount: user._count.notes,
    memberSince: user.createdAt,
    isLoggedIn: !!session?.user?.id,
    isOwner,
    isViewerAdmin,
    isPrivate: !!user.isPrivate,
    isSuspended: isViewerAdmin ? !!user.isSuspended : false,
    suspendReason: isViewerAdmin ? (user.suspendReason || null) : null,
    displayedMedal: user.displayedMedal,
    medals: user.medals || [],
    pinnedNotes: user.notes ? user.notes.map((n: any) => {
      if (n.isLocked) {
        return { ...n, title: '', text: '', isLocked: true, ts: Number(n.ts) };
      }
      return { 
        ...n, 
        title: decrypt(n.title) || '', 
        text: decrypt(n.text) || '', 
        ts: Number(n.ts) 
      };
    }) : [],
    reactions: EMOJIS.map(e => ({ emoji: e, count: reactionCounts[e] ?? 0 })),
    myReactions: myReactions.map((r: any) => r.emoji) as string[],
  });
}
