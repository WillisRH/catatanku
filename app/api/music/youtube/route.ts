import { NextResponse } from "next/server";

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url")?.trim();
  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  const videoId = extractYouTubeId(url);
  if (!videoId) return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });

  try {
    const oEmbed = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    );
    if (!oEmbed.ok) return NextResponse.json({ error: "Video not found" }, { status: 404 });
    const data = await oEmbed.json();
    return NextResponse.json({
      id: `yt_${videoId}`,
      videoId,
      title: data.title || "",
      author: data.author_name || "",
      thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
