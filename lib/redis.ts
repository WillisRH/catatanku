import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

/**
 * Read-through cache: if key exists in Redis, return it.
 * Otherwise run `fn()`, store the result, and return it.
 * TTL is in seconds (default 60s).
 */
export async function cached<T>(
  key: string,
  fn: () => Promise<T>,
  ttl = 60
): Promise<T> {
  try {
    const hit = await redis.get<T>(key);
    if (hit !== null && hit !== undefined) return hit;
  } catch {
    // Redis down → fall through to DB
  }
  const fresh = await fn();
  try {
    await redis.set(key, JSON.stringify(fresh), { ex: ttl });
  } catch {
    // fire-and-forget
  }
  return fresh;
}

/**
 * Invalidate one or more cache keys (pattern-based via scan or explicit keys).
 */
export async function invalidate(...keys: string[]) {
  try {
    if (keys.length > 0) await redis.del(...keys);
  } catch {
    // fire-and-forget
  }
}

/**
 * Invalidate all keys matching a prefix using SCAN.
 */
export async function invalidatePrefix(prefix: string) {
  try {
    let cursor = 0;
    do {
      const [nextCursor, keys] = await redis.scan(cursor, {
        match: `${prefix}*`,
        count: 100,
      });
      cursor = Number(nextCursor);
      if (keys.length > 0) await redis.del(...keys);
    } while (cursor !== 0);
  } catch {
    // fire-and-forget
  }
}

// ─── Cache key builders ───

export const CK = {
  /** All notes for a user */
  userNotes: (userId: string) => `notes:user:${userId}`,
  /** Single note by ID */
  note: (noteId: string) => `note:${noteId}`,
  /** Shared note by shareId or noteId */
  sharedNote: (shareId: string) => `shared:note:${shareId}`,
  /** Shared notes list of a user (for Zettelkasten links) */
  sharedUserNotes: (userId: string) => `shared:user-notes:${userId}`,
  /** Streak for a user + date */
  streak: (userId: string, today: string) => `streak:${userId}:${today}`,
  /** User profile (own) */
  userProfile: (userId: string) => `profile:${userId}`,
  /** Public user profile */
  publicProfile: (userId: string) => `pub-profile:${userId}`,
  /** Collab info for a note */
  collab: (noteId: string) => `collab:${noteId}`,
  /** Collab invite preview */
  collabInvite: (code: string) => `collab-invite:${code}`,
  /** User medals */
  userMedals: (userId: string) => `medals:${userId}`,
  /** Hijri date (global, changes daily) */
  hijri: () => `hijri:today`,
  /** Music search */
  musicSearch: (q: string) => `music:search:${q}`,
  /** YouTube oembed */
  youtubeOembed: (videoId: string) => `yt:oembed:${videoId}`,
  /** Link preview */
  linkPreview: (url: string) => `link-preview:${url}`,
  /** Users search */
  usersSearch: (q: string, isAdmin: boolean) => `users:search:${q}:${isAdmin}`,
  /** Public user notes */
  userPublicNotes: (userId: string) => `user-public-notes:${userId}`,
  /** User [id] profile page */
  userPage: (userId: string) => `user-page:${userId}`,
  /** Yjs snapshot */
  yjsSnapshot: (noteId: string) => `yjs:${noteId}`,
};
