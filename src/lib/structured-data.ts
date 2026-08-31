import { ARTIST } from "@/data/artist";
import { SOCIAL_LINKS } from "@/data/social-links";
import type { VisitEvent } from "@/data/event";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/seo";

const OFFICIAL_URL = "https://zutomayo.net";

/** MusicGroup은 아티스트 본인이 아니라 이 팬페이지가 다루는 대상이므로,
 * url은 공식 홈페이지를 가리키고 이 사이트는 sameAs에 넣지 않습니다. */
export function buildMusicGroupJsonLd() {
  return {
    "@type": "MusicGroup",
    name: ARTIST.name.kr,
    alternateName: [ARTIST.name.jp, ARTIST.name.en],
    url: OFFICIAL_URL,
    sameAs: SOCIAL_LINKS.map((link) => link.url),
  };
}

export function buildWebSiteJsonLd() {
  return {
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    inLanguage: "ko",
  };
}

export function buildSiteJsonLdGraph() {
  return {
    "@context": "https://schema.org",
    "@graph": [buildWebSiteJsonLd(), buildMusicGroupJsonLd()],
  };
}

/** "2026.09.06" + "20:50" -> "2026-09-06T20:50:00+09:00" (KST 고정) */
function toKstIsoString(date: string, time: string) {
  const [year, month, day] = date.split(".");
  return `${year}-${month}-${day}T${time}:00+09:00`;
}

export function buildMusicEventJsonLd(event: VisitEvent) {
  return {
    "@context": "https://schema.org",
    "@type": "MusicEvent",
    name: event.tourName,
    startDate: toKstIsoString(event.date, event.time),
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    url: event.tourUrl,
    image: `${SITE_URL}${event.tourImg}`,
    location: {
      "@type": "Place",
      name: event.place,
      url: event.placeUrl,
    },
    performer: buildMusicGroupJsonLd(),
  };
}
