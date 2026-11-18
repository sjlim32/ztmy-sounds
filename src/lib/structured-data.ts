import { ARTIST } from "@/data/artist";
import { SOCIAL_LINKS } from "@/data/social-links";
import { getEventStartDate, getEventEndDate, type Event } from "@/data/event";
import { SITE_URL, SITE_NAME, SITE_BRAND, SITE_DESCRIPTION } from "@/lib/seo";

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
    // 로고·도메인에 쓰인 브랜드명 — 검색 결과의 사이트 이름 후보로 쓰인다.
    alternateName: SITE_BRAND,
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

interface PastLiveForJsonLd {
  title: string;
  start_date: string;
  end_date: string | null;
  live_venue: string;
  region: string;
  country: string;
  poster_image_url: string | null;
}

/**
 * 즛토피아 공연 상세(지난 공연 아카이브)용 MusicEvent. 시간 정보가 없어 날짜만
 * 넣는다(schema.org Date). 온라인 공연은 VirtualLocation으로.
 */
export function buildPastLiveJsonLd(
  live: PastLiveForJsonLd,
  pageUrl: string,
  online: boolean,
) {
  const startDate = live.start_date.split("T")[0];
  const endDate = live.end_date?.split("T")[0];
  return {
    "@context": "https://schema.org",
    "@type": "MusicEvent",
    name: live.title,
    startDate,
    ...(endDate && endDate !== startDate && { endDate }),
    eventAttendanceMode: online
      ? "https://schema.org/OnlineEventAttendanceMode"
      : "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    url: pageUrl,
    ...(live.poster_image_url && { image: live.poster_image_url }),
    location: online
      ? { "@type": "VirtualLocation", url: pageUrl }
      : {
          "@type": "Place",
          name: live.live_venue,
          address: {
            "@type": "PostalAddress",
            addressLocality: live.region,
            addressCountry: live.country,
          },
        },
    performer: buildMusicGroupJsonLd(),
  };
}

export function buildMusicEventJsonLd(event: Event) {
  const startDate = getEventStartDate(event);
  const endDate = getEventEndDate(event);

  return {
    "@context": "https://schema.org",
    "@type": "MusicEvent",
    name: event.tourName,
    startDate: toKstIsoString(startDate, event.time),
    // 다일차 공연(시작일 !== 종료일)일 때만 endDate를 포함합니다.
    ...(startDate !== endDate && {
      endDate: toKstIsoString(endDate, event.time),
    }),
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    url: event.tourUrl,
    // tourImg가 없는 이벤트(예: 아직 포스터가 안 나온 다음 공연)도 있다.
    ...(event.tourImg && { image: `${SITE_URL}${event.tourImg}` }),
    location: {
      "@type": "Place",
      name: event.place,
      url: event.placeUrl,
    },
    performer: buildMusicGroupJsonLd(),
  };
}
