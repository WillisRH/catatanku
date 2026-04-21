import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  // @ts-ignore
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, enable, isOneTime } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  // @ts-ignore
  const note = await prisma.note.findUnique({ where: { id, userId: session.user.id } as any });
  if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (enable && (note as any).isLocked) return NextResponse.json({ error: "Cannot share locked notes" }, { status: 400 });
  if (enable && (note as any).isModerated) return NextResponse.json({ error: "Catatan ini tidak dapat dibagikan." }, { status: 403 });

  const shareId = enable ? crypto.randomUUID().replace(/-/g, '').slice(0, 12) : null;
  // @ts-ignore
  await prisma.note.update({ 
    where: { id, userId: session.user.id } as any, 
    data: { 
      shareId,
      isOneTime: enable ? (!!isOneTime) : false
    } as any 
  });
  return NextResponse.json({ shareId });
}
