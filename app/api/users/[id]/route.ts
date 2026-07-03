import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";
import { cached, CK } from "@/lib/redis";

const EMOJIS = ["👍", "❤️", "🔥", "✨", "🎉"];
const pr = (prisma as any).profileReaction;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Run auth + cached data in parallel for fastest response
  const [session, cachedData] = await Promise.all([
    auth(),
    cached(CK.userPage(id), async () => {
      const [u, rx] = await Promise.all([
        (prisma.user.findUnique as any)({
          where: { id },
          select: {
            id: true, name: true, username: true, image: true, profileTheme: true,
            bio: true, instagram: true, twitter: true, tiktok: true, isPrivate: true,
            isSuspended: true, suspendReason: true, displayedMedal: true, currentStreak: true,
            longestStreak: true, medals: true, createdAt: true,
            _count: { select: { notes: { where: { shareId: { not: null } } } } },
            notes: {
              where: { isProfilePinned: true },
              orderBy: { ts: 'desc' },
              select: { id: true, title: true, text: true, mood: true, date: true, theme: true, color: true, shareId: true, isLocked: true, ts: true }
            }
          },
        }),
        pr.groupBy({
          by: ["emoji"],
          where: { toUserId: id },
          _count: { emoji: true },
        }),
      ]);

      if (!u) return { user: null, reactions: [], pinnedNotes: [] };

      // Pre-decrypt pinned notes in cache to avoid re-decrypting on every hit
      const pinnedNotes = u.notes ? u.notes.map((n: any) => {
        if (n.isLocked) {
          return { ...n, title: '', text: '', isLocked: true, ts: Number(n.ts) };
        }
        return {
          ...n,
          title: decrypt(n.title) || '',
          text: decrypt(n.text) || '',
          ts: Number(n.ts)
        };
      }) : [];

      return { user: { ...u, notes: undefined }, reactions: rx, pinnedNotes };
    }, 120), // 120s TTL — profile data doesn't change often
  ]);

  const { user, reactions, pinnedNotes } = cachedData;

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const viewerId = (session?.user as any)?.id as string | undefined;
  const isOwner = viewerId === id;

  // Fetch viewer-specific data in parallel (myReactions + admin check)
  const [myReactions, isViewerAdmin] = await Promise.all([
    viewerId
      ? cached<{ emoji: string }[]>(`my-reactions:${viewerId}:${id}`, () =>
          pr.findMany({ where: { toUserId: id, fromUserId: viewerId }, select: { emoji: true } }),
        60)
      : Promise.resolve<{ emoji: string }[]>([]),
    (viewerId && !isOwner)
      ? cached(`viewer-admin:${viewerId}`, async () => {
          const viewer = await (prisma.user.findUnique as any)({
            where: { id: viewerId },
            select: { role: true, isSuspended: true },
          });
          return viewer?.role === "admin" && !viewer?.isSuspended;
        }, 300) // Admin status cached 5 min
      : Promise.resolve(false),
  ]);

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
      isLoggedIn: !!viewerId,
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
    }, {
      headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=120" }
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
    isLoggedIn: !!viewerId,
    isOwner,
    isViewerAdmin,
    isPrivate: !!user.isPrivate,
    isSuspended: isViewerAdmin ? !!user.isSuspended : false,
    suspendReason: isViewerAdmin ? (user.suspendReason || null) : null,
    displayedMedal: user.displayedMedal,
    medals: user.medals || [],
    pinnedNotes,
    reactions: EMOJIS.map(e => ({ emoji: e, count: reactionCounts[e] ?? 0 })),
    myReactions: myReactions.map((r: any) => r.emoji) as string[],
  }, {
    headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=120" }
  });
}

