import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  if (!q) return NextResponse.json([]);

  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&entity=song&limit=10`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return NextResponse.json([]);
    const data = await res.json();

    const results = (data.results || []).map((item: any) => ({
      id: String(item.trackId),
      title: item.trackName || "",
      artist: item.artistName || "",
      artwork: (item.artworkUrl100 || "").replace("100x100bb", "300x300bb"),
      previewUrl: item.previewUrl || "",
    })).filter((item: any) => item.previewUrl);

    return NextResponse.json(results);
  } catch {
    return NextResponse.json([]);
  }
}
