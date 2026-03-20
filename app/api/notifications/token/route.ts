import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { token } = await req.json();
  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  // Upsert — token is unique, so same token won't be duplicated across logins/devices
  await prisma.fcmToken.upsert({
    where: { token },
    create: { token, userId: session.user.id },
    update: { userId: session.user.id },
  });

  return NextResponse.json({ ok: true });
}
