import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const notes = await (prisma.note.findMany as any)({
    where: { userId: id, shareId: { not: null } },
    select: { id: true, title: true, shareId: true, isModerated: true, ts: true },
    orderBy: { ts: "desc" },
    take: 200,
  });

  return NextResponse.json(
    notes.map((n: any) => ({
      id: n.id,
      title: decrypt(n.title || "") || "(Tanpa judul)",
      shareId: n.shareId,
      isModerated: !!n.isModerated,
      ts: Number(n.ts),
    }))
  );
}
