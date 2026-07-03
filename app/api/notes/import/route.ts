import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/encryption";
import { validateCsrfToken } from "@/lib/csrf";
import { invalidate, CK } from "@/lib/redis";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const csrfToken = req.headers.get("X-CSRF-Token");
  if (!csrfToken || !validateCsrfToken(session.user.id, csrfToken)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { notes } = await req.json();

    if (!Array.isArray(notes)) {
      return NextResponse.json({ error: "Invalid data format. Expected an array of notes." }, { status: 400 });
    }

    if (notes.length > 500) {
      return NextResponse.json({ error: "Too many notes. Max 500 per import." }, { status: 400 });
    }

    const userId = session.user.id;
    const now = Date.now();

    // Prepare data for batch create
    const dataToCreate = notes.map((n: any) => ({
      userId,
      date: n.date || new Date().toISOString().split('T')[0],
      title: encrypt(n.title || ''),
      text: encrypt(n.text || ''),
      mood: typeof n.mood === 'number' ? n.mood : null,
      stickers: Array.isArray(n.stickers) ? n.stickers : [],
      isLocked: !!n.isLocked,
      isPinned: !!n.isPinned,
      isProfilePinned: !!n.isProfilePinned,
      color: n.color || '',
      theme: n.theme || '',
      tags: Array.isArray(n.tags) ? n.tags : [],
      font: n.font || null,
      ts: BigInt(n.ts || now),
      isImported: true,
    }));

    // Use createMany for high performance and minimal connection usage
    const result = await prisma.note.createMany({
      data: dataToCreate
    });

    await invalidate(CK.userNotes(userId), CK.sharedUserNotes(userId), CK.userPage(userId), CK.userPublicNotes(userId));

    return NextResponse.json({ 
      success: true, 
      count: result.count 
    });

  } catch (error: any) {
    console.error("Import error:", error);
    return NextResponse.json({ error: "Failed to import notes." }, { status: 500 });
  }
}
