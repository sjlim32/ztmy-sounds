import type { MetadataRoute } from "next";
import { event } from "@/data/event";

export const dynamic = "force-static";

// TODO: replace with real 192x192 / 512x512 PNG icons in /public before launch.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${event.artist} ${event.tourName} 콜가이드`,
    short_name: "콜가이드",
    description: `${event.artist} ${event.tourName} 떼창/응원 가이드`,
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [],
  };
}
