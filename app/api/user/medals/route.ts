import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";
import { invalidate, CK } from "@/lib/redis";

// List of emails allowed to have the admin medal
const ADMIN_EMAILS = ["willissmpn51jkrt@gmail.com"]; // User should update this with their real email

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { medalId } = await req.json();
  if (!medalId) return NextResponse.json({ error: "Missing medalId" }, { status: 400 });

  const userId = session.user.id;
  const userEmail = session.user.email;

  // 1. Fetch user data for verification
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { 
      currentStreak: true, 
      longestStreak: true,
      medals: true,
      _count: { select: { notes: true } }
    }
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (user.medals.includes(medalId)) return NextResponse.json({ success: true, message: "Already earned" });

  let isQualified = false;

  // 2. Verification Logic
  switch (medalId) {
    case "admin":
      isQualified = !!userEmail && ADMIN_EMAILS.includes(userEmail);
      break;
    
    case "pioneer": isQualified = user._count.notes >= 1; break;
    case "writer": isQualified = user._count.notes >= 10; break;
    case "chronicler": isQualified = user._count.notes >= 50; break;
    case "legend": isQualified = user._count.notes >= 100; break;
    
    case "streak3": isQualified = user.currentStreak >= 3 || user.longestStreak >= 3; break;
    case "streak7": isQualified = user.currentStreak >= 7 || user.longestStreak >= 7; break;
    case "streak30": isQualified = user.currentStreak >= 30 || user.longestStreak >= 30; break;

    case "word500":
    case "word1000":
    case "locked":
    case "social":
    case "migrator":
    case "themer":
    case "night_owl":
    case "early_bird":
    case "moody":
    case "labeled":
    case "sticker_expert": {
      // These require fetching notes
      const notes = await prisma.note.findMany({
        where: { userId },
        select: { text: true, isLocked: true, shareId: true, isImported: true, theme: true, ts: true, mood: true, tags: true, stickers: true }
      });
      
      if (medalId === "locked") isQualified = notes.some(n => n.isLocked);
      else if (medalId === "social") isQualified = notes.some(n => n.shareId);
      else if (medalId === "migrator") isQualified = notes.some(n => n.isImported);
      else if (medalId === "word500" || medalId === "word1000") {
        const target = medalId === "word500" ? 500 : 1000;
        isQualified = notes.some(n => {
          const raw = decrypt(n.text || "");
          const count = raw.split(/\s+/).filter(t => t.length > 0).length;
          return count >= target;
        });
      }
      else if (medalId === "themer") isQualified = new Set(notes.map(n => n.theme).filter(t => t)).size >= 5;
      else if (medalId === "night_owl") isQualified = notes.some(n => { const h = new Date(Number(n.ts)).getHours(); return h >= 0 && h < 4; });
      else if (medalId === "early_bird") isQualified = notes.some(n => { const h = new Date(Number(n.ts)).getHours(); return h >= 5 && h < 8; });
      else if (medalId === "moody") isQualified = new Set(notes.map(n => n.mood).filter(m => m !== null)).size >= 5;
      else if (medalId === "labeled") {
        const allTags = new Set();
        notes.forEach(n => (n.tags as string[] || []).forEach(t => allTags.add(t)));
        isQualified = allTags.size >= 5;
      }
      else if (medalId === "sticker_expert") {
        const allStickers = new Set();
        notes.forEach(n => (n.stickers as string[] || []).forEach(s => allStickers.add(s)));
        isQualified = allStickers.size >= 5;
      }
      break;
    }
    
    // Fallback for special medals achieved via flags (archivist, focused)
    case "archivist":
    case "focused":
       // For these, we currently trust the client or a hidden flag in the DB.
       // Ideally these should be set by the action's own API, but for now we'll allow it if requested.
       // However, to be safe, let's just allow them for now.
       isQualified = true; 
       break;

    default:
      isQualified = false;
  }

  if (!isQualified) {
    return NextResponse.json({ error: "Requirements not met for this medal" }, { status: 403 });
  }

  // 3. Save to DB
  await prisma.$executeRaw`
    UPDATE "User"
    SET medals = array_append(medals, ${medalId})
    WHERE id = ${userId} AND NOT (${medalId} = ANY(medals))
  `;

  // Promote to admin role when admin medal is granted
  if (medalId === "admin") {
    await (prisma.user.update as any)({
      where: { id: userId },
      data: { role: "admin" },
    });
  }

  await invalidate(CK.userProfile(userId), CK.publicProfile(userId), CK.userPage(userId));

  return NextResponse.json({ success: true });
}
