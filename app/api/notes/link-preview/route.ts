import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  try {
    new URL(url); // validate URL
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; CatatankuBot/1.0; +https://catatanku.app)" },
      signal: AbortSignal.timeout(6000),
    });
    const html = await res.text();

    const getMeta = (prop: string) => {
      const m =
        html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']*)["']`, "i")) ||
        html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${prop}["']`, "i"));
      return m?.[1]?.trim() || "";
    };

    const title =
      getMeta("og:title") ||
      getMeta("twitter:title") ||
      html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() ||
      "";

    const description =
      getMeta("og:description") ||
      getMeta("twitter:description") ||
      getMeta("description") ||
      "";

    const image = getMeta("og:image") || getMeta("twitter:image") || "";

    // Resolve favicon
    const faviconMatch =
      html.match(/<link[^>]+rel=["'][^"']*shortcut icon[^"']*["'][^>]+href=["']([^"']+)["']/i) ||
      html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["'][^"']*shortcut icon[^"']*["']/i) ||
      html.match(/<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]+href=["']([^"']+)["']/i) ||
      html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["'][^"']*icon[^"']*["']/i);

    const base = new URL(url);
    const faviconRaw = faviconMatch?.[1] || "/favicon.ico";
    const favicon = faviconRaw.startsWith("http")
      ? faviconRaw
      : `${base.origin}${faviconRaw.startsWith("/") ? "" : "/"}${faviconRaw}`;

    return NextResponse.json({
      url,
      title: title.slice(0, 200),
      description: description.slice(0, 400),
      image,
      favicon,
    });
  } catch {
    return NextResponse.json({ url, title: "", description: "", image: "", favicon: "" });
  }
}
