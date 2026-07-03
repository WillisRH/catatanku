import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/encryption";
import { cached, invalidate, CK } from "@/lib/redis";
import { validateCsrfToken } from "@/lib/csrf";

function checkCsrf(req: Request, userId: string): boolean {
  const token = req.headers.get("X-CSRF-Token");
  if (!token) return false;
  return validateCsrfToken(userId, token);
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const decryptedNotes = await cached(CK.userNotes(userId), async () => {
    const notes = await prisma.note.findMany({
      where: {
        OR: [
          { userId },
          {
            collabInvite: { not: null },
            collabMembers: { some: { userId, isBanned: false } }
          }
        ]
      },
      include: {
        collabMembers: {
          where: { userId }
        }
      },
      orderBy: { ts: 'desc' }
    });

    return notes.map(note => {
      const isCollab = note.userId !== userId && note.collabMembers?.length > 0;
      
      if ((note as any).isLocked) {
        const rawTitle = decrypt(note.title || '');
        const rawText  = decrypt(note.text  || '');
        const titleWords = rawTitle.trim() ? rawTitle.trim().split(/\s+/).length : 0;
        const textWords  = rawText.trim()  ? rawText.trim().split(/\s+/).filter(Boolean).length : 0;
        return { id: note.id, date: note.date, mood: note.mood, stickers: note.stickers, ts: Number(note.ts), isLocked: true, lockType: (note as any).lockType ?? 'password', title: '', text: '', userId: note.userId, createdAt: note.createdAt, updatedAt: note.updatedAt, isPinned: (note as any).isPinned || false, isProfilePinned: (note as any).isProfilePinned || false, color: (note as any).color || '', theme: (note as any).theme || '', shareId: (note as any).shareId || null, isOneTime: (note as any).isOneTime || false, isModerated: (note as any).isModerated || false, tags: (note as any).tags || [], font: (note as any).font || null, titleWords, textWords, isCollab };
      }
      return { ...note, title: decrypt(note.title || ''), text: decrypt(note.text || ''), ts: Number(note.ts), theme: (note as any).theme || '', isCollab };
    });
  }, 60);

  return NextResponse.json(decryptedNotes, {
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!checkCsrf(req, session.user.id)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, date, title, text, mood, stickers, ts, isLocked, isPinned, isProfilePinned, color, theme, tags, font, songId, songTitle, songArtwork, songPreview, shareMusic, lat, lng } = await req.json();

  try {
    // If ID is provided, verify ownership first to prevent IDOR
    if (id && id !== 'new') {
      const existing = await prisma.note.findUnique({
        where: { id }
      });
      if (existing && existing.userId !== session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const note = await prisma.note.upsert({
      where: { id: id || 'new' },
      update: {
        title: encrypt(title || ''),
        text: encrypt(text || ''),
        mood,
        // @ts-ignore
        isLocked,
        // @ts-ignore
        isPinned,
        // @ts-ignore
        isProfilePinned,
        // @ts-ignore
        color,
        // @ts-ignore
        theme,
        stickers,
        // @ts-ignore
        tags: tags || [],
        // @ts-ignore
        font: font || null,
        // @ts-ignore
        songId: songId || null,
        // @ts-ignore
        songTitle: songTitle || null,
        // @ts-ignore
        songArtwork: songArtwork || null,
        // @ts-ignore
        songPreview: songPreview || null,
        // @ts-ignore
        shareMusic: shareMusic ?? true,
        // @ts-ignore
        lat: lat ?? null,
        // @ts-ignore
        lng: lng ?? null,
        ts: BigInt(ts || Date.now()),
        date
      },
      create: {
        id: id && id !== 'new' ? id : undefined,
        date,
        title: encrypt(title || ''),
        text: encrypt(text || ''),
        mood,
        // @ts-ignore
        isLocked,
        // @ts-ignore
        isPinned,
        // @ts-ignore
        isProfilePinned,
        // @ts-ignore
        color,
        // @ts-ignore
        theme,
        stickers,
        // @ts-ignore
        tags: tags || [],
        // @ts-ignore
        font: font || null,
        // @ts-ignore
        songId: songId || null,
        // @ts-ignore
        songTitle: songTitle || null,
        // @ts-ignore
        songArtwork: songArtwork || null,
        // @ts-ignore
        songPreview: songPreview || null,
        // @ts-ignore
        shareMusic: shareMusic ?? true,
        // @ts-ignore
        lat: lat ?? null,
        // @ts-ignore
        lng: lng ?? null,
        ts: BigInt(ts || Date.now()),
        userId: session.user.id
      }
    });
    const keys = [
      CK.userNotes(session.user.id),
      CK.note(note.id),
      CK.sharedNote(note.id),
      note.shareId ? CK.sharedNote(note.shareId) : "",
      CK.sharedUserNotes(session.user.id),
      CK.userPage(session.user.id),
      CK.userPublicNotes(session.user.id),
    ].filter(Boolean);
    await invalidate(...keys);
    return NextResponse.json({ ...note, ts: Number(note.ts) });
  } catch (e: any) {
    if (e?.code === 'P2003') return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    throw e;
  }
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!checkCsrf(req, session.user.id)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

  try {
    const note = await prisma.note.delete({
      where: { id, userId: session.user.id }
    });
    const keys = [
      CK.userNotes(session.user.id),
      CK.note(id),
      CK.sharedNote(id),
      note.shareId ? CK.sharedNote(note.shareId) : "",
      CK.sharedUserNotes(session.user.id),
      CK.userPage(session.user.id),
      CK.userPublicNotes(session.user.id),
    ].filter(Boolean);
    await invalidate(...keys);
  } catch (e: any) {
    if (e?.code === 'P2025') return NextResponse.json({ error: "Not found" }, { status: 404 });
    throw e;
  }

  return NextResponse.json({ success: true });
}
