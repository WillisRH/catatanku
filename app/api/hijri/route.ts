import { NextResponse } from "next/server";

export async function GET() {
  try {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();

    const res = await fetch(
      `https://api.aladhan.com/v1/gToH/${day}-${month}-${year}`,
      { next: { revalidate: 3600 } }
    );

    if (!res.ok) throw new Error("Aladhan API error");

    const data = await res.json();
    const hijriMonth: number = data?.data?.hijri?.month?.number;
    const hijriYear: number = parseInt(data?.data?.hijri?.year);
    const hijriDay: number = parseInt(data?.data?.hijri?.day);

    return NextResponse.json({
      hijriMonth,
      hijriYear,
      hijriDay,
      isRamadan: hijriMonth === 9,
      monthName: data?.data?.hijri?.month?.en ?? "",
    });
  } catch {
    return NextResponse.json({ hijriMonth: null, isRamadan: false, error: "failed" });
  }
}
