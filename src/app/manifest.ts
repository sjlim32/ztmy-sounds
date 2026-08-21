import type { MetadataRoute } from "next";
import { ARTIST } from "@/app/(pages)/page";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${ARTIST.name.kr} 응원 가이드`,
    short_name: `${ARTIST.name.en} 응원 가이드`,
    description: `일본의 밴드 ${ARTIST.name.jp}의 응원 도구인 샤모지를 활용한 응원 및 떼창 가이드 사이트입니다.`,
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      {
        src: "/icons/icon-192.webp",
        sizes: "192x192",
        type: "image/webp",
      },
      {
        src: "/icons/icon-512.webp",
        sizes: "512x512",
        type: "image/webp",
      },
    ],
  };
}
