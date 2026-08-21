import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CBT Sagaya - Ujian Online",
    short_name: "CBT Sagaya",
    description: "Portal Aplikasi Ujian Online Siswa CBT Sagaya",
    start_url: "/dashboard/student",
    scope: "/",
    display: "standalone",
    display_override: ["fullscreen", "standalone", "minimal-ui", "browser"],
    background_color: "#f8fafc",
    theme_color: "#2563eb",
    orientation: "portrait",
    categories: ["education", "productivity"],
    icons: [
      {
        src: "/icons/icon-192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
