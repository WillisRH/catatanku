import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import admin from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const { shareId } = await req.json();
    if (!shareId) return NextResponse.json({ error: "Missing shareId" }, { status: 400 });

    const note = await prisma.note.findUnique({
      where: { shareId },
      include: { user: { include: { fcmTokens: true } } }
    });

    if (!note) return NextResponse.json({ error: "Note not found" }, { status: 404 });
    if (!note.isOneTime) return NextResponse.json({ ok: true, message: "Not a one-time note" });

    // Revoke access
    await prisma.note.update({
      where: { id: note.id },
      data: { shareId: null, isOneTime: false }
    });

    // Notify owner
    const tokens = note.user.fcmTokens.map(t => t.token);
    if (tokens.length > 0) {
      const message = {
        notification: {
          title: "Catatan Dibaca",
          body: `Catatan "Sekali Lihat" kamu baru saja dibaca dan tautannya telah hangus secara otomatis.`,
        },
        tokens
      };
      // Note: In real world, we might want to decrypt the title first, 
      // but we don't have the user's secret key here (it's usually handled by the client or a vault).
      // For now, we'll just say "Catatan Sekali Lihat kamu".
      
      try {
        await admin.messaging().sendEachForMulticast(message);
      } catch (err) {
        console.error("FCM Error:", err);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error in share/viewed:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
