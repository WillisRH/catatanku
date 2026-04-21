import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VALID_MEDALS = [
  "pioneer", "writer", "chronicler", "legend", "streak3", "streak7", "streak30",
  "word500", "word1000", "locked", "labeled", "moody", "sticker_expert", "social", "migrator", 
  "themer", "night_owl", "early_bird", "focused", "archivist", "admin"
];

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const users: any[] = await prisma.$queryRaw`
    SELECT id, name, username, email, image, "profileTheme", "createdAt", "currentStreak", "longestStreak", medals, "companionType", "companionName", "emailVerified", bio, instagram, twitter, tiktok, "isPrivate", "displayedMedal",
           (password IS NOT NULL) AS "hasPassword"
    FROM "User"
    WHERE id = ${session.user.id}
    LIMIT 1
  `;
  const user = users[0];

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, image, username, profileTheme, companionType, companionName, bio, instagram, twitter, tiktok, isPrivate, displayedMedal } = body;

  const data: Record<string, any> = {};
  if (typeof name === "string") data.name = name.trim().slice(0, 60);
  if (typeof image === "string") data.image = image;
  if (typeof profileTheme === "string") data.profileTheme = profileTheme;
  if (typeof companionType === "string") data.companionType = companionType;
  if (typeof companionName === "string") data.companionName = companionName.trim().slice(0, 30);
  if (typeof bio === "string") data.bio = bio.trim().slice(0, 200);
  if (typeof instagram === "string") data.instagram = instagram.trim().replace("@", "").slice(0, 30);
  if (typeof twitter === "string") data.twitter = twitter.trim().replace("@", "").slice(0, 30);
  if (typeof tiktok === "string") data.tiktok = tiktok.trim().replace("@", "").slice(0, 30);
  if (typeof isPrivate === "boolean") data.isPrivate = isPrivate;
  if (typeof isPrivate === "boolean") data.isPrivate = isPrivate;
  
  if (displayedMedal === null) {
    data.displayedMedal = null;
  } else if (typeof displayedMedal === "string") {
    if (!VALID_MEDALS.includes(displayedMedal)) {
      return NextResponse.json({ error: "Medali tidak valid." }, { status: 400 });
    }
    // Verify ownership
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { medals: true }
    });
    if (!user?.medals.includes(displayedMedal)) {
      return NextResponse.json({ error: "Anda belum mendapatkan medali ini." }, { status: 403 });
    }
    data.displayedMedal = displayedMedal;
  }
  
  if (typeof username === "string") {
    const u = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 30);
    if (u.length < 3) return NextResponse.json({ error: "Username minimal 3 karakter." }, { status: 400 });
    const users: any[] = await prisma.$queryRaw`SELECT id FROM "User" WHERE username = ${u} LIMIT 1`;
    const existing = users[0];
    if (existing && existing.id !== session.user.id)
      return NextResponse.json({ error: "Username sudah digunakan." }, { status: 409 });
    data.username = u;
  }

  if (Object.keys(data).length === 0)
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  // Use Raw SQL for update to bypass stale client detection
  const fields = Object.keys(data);
  const assignments = fields.map((f, i) => `"${f}" = $${i + 2}`).join(", ");
  const values = fields.map(f => data[f]);

  await prisma.$executeRawUnsafe(
    `UPDATE "User" SET ${assignments} WHERE id = $1`,
    session.user.id,
    ...values
  );

  return NextResponse.json({ success: true });
}
