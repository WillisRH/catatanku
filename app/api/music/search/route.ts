import { NextResponse } from "next/server";
import { cached, CK } from "@/lib/redis";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  if (!q) return NextResponse.json([]);

  try {
    const results = await cached(CK.musicSearch(q), async () => {
      const url = `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&entity=song&limit=10`;
      const res = await fetch(url, { next: { revalidate: 60 } });
      if (!res.ok) return [];
      const data = await res.json();

      return (data.results || []).map((item: any) => ({
        id: String(item.trackId),
        title: item.trackName || "",
        artist: item.artistName || "",
        artwork: (item.artworkUrl100 || "").replace("100x100bb", "300x300bb"),
        previewUrl: item.previewUrl || "",
      })).filter((item: any) => item.previewUrl);
    }, 300); // 5 min TTL

    return NextResponse.json(results);
  } catch {
    return NextResponse.json([]);
  }
}
