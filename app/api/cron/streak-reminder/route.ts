import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import admin from "@/lib/firebase-admin";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const yesterdayUTC = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const yesterday = yesterdayUTC.toISOString().slice(0, 10);

  const users = await prisma.user.findMany({
    where: {
      lastActiveDate: yesterday,
      fcmTokens: { some: {} },
    },
    select: { id: true, fcmTokens: { select: { id: true, token: true } } },
  });

  let sent = 0;
  let failed = 0;

  await Promise.all(
    users.flatMap((user) =>
      user.fcmTokens.map(async ({ id, token }) => {
        try {
          await admin.messaging().send({
            token,
            notification: {
              title: "Jangan putus streakmu! 🔥",
              body: "Kamu belum nulis hari ini. Yuk tulis catatanmu sekarang!",
            },
            webpush: {
              fcmOptions: {
                link: process.env.NEXT_PUBLIC_APP_URL ?? "https://catatanku-silk.vercel.app/",
              },
            },
          });
          sent++;
        } catch (err: any) {
          failed++;
          const code = err?.errorInfo?.code ?? err?.code ?? "";
          if (
            code === "messaging/registration-token-not-registered" ||
            code === "messaging/invalid-registration-token"
          ) {
            await prisma.fcmToken.delete({ where: { id } });
          }
        }
      })
    )
  );

  return NextResponse.json({ sent, failed });
}
