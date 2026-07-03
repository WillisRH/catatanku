import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import admin from "@/lib/firebase-admin";
import { invalidate, CK } from "@/lib/redis";
import { decrypt } from "@/lib/encryption";

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

    const keys = [
      CK.note(note.id),
      CK.userNotes(note.userId),
      CK.sharedNote(note.id),
      shareId ? CK.sharedNote(shareId) : "",
      CK.sharedUserNotes(note.userId),
    ].filter(Boolean);
    await invalidate(...keys);

    // Notify owner
    const tokens = note.user.fcmTokens.map(t => t.token);
    if (tokens.length > 0) {
      const rawTitle = decrypt(note.title || "");
      const titleStr = rawTitle ? `"${rawTitle}"` : "Sekali Lihat";
      const notifTitle = "Catatan Dibaca";
      const notifBody = `Catatan Sekali Lihat ${titleStr} kamu baru saja dibaca dan tautannya telah hangus secara otomatis.`;
      const message = {
        notification: {
          title: notifTitle,
          body: notifBody,
        },
        data: {
          title: notifTitle,
          body: notifBody,
        },
        tokens
      };
      
      try {
        const result = await admin.messaging().sendEachForMulticast(message);
        console.log("[FCM] sent:", result.successCount, "success,", result.failureCount, "failures");
        result.responses.forEach((resp, idx) => {
          if (!resp.success) {
            console.error(`[FCM] token[${idx}] error:`, resp.error?.code, resp.error?.message);
          }
        });
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
