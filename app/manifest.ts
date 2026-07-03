import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Catatanku - Diary Digital",
    short_name: "Catatanku",
    description: "Simpan ceritamu dengan aman dan terenkripsi.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#282C34",
    theme_color: "#61AFEF",
    categories: ["productivity", "lifestyle"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
    screenshots: [],
  };
}
