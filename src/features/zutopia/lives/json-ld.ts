import { ARTIST } from "@/data/artist";
import { MUSIC_GROUP_ID } from "@/lib/structured-data";
import { isOnlineLive, splitRegion } from "@/features/zutopia/lives/region";

/** lives.country(한글) → ISO 3166-1 alpha-2 — schema.org가 권장하는 표기. 표에 없는
 * 나라는 addressCountry를 넣지 않는다(새 나라가 생기면 여기에 추가). */
const COUNTRY_CODE: Record<string, string> = {
  일본: "JP",
  한국: "KR",
  중국: "CN",
  대만: "TW",
  태국: "TH",
  싱가포르: "SG",
};

interface PastLiveForJsonLd {
  title: string;
  start_date: string;
  end_date: string | null;
  live_date: string | null;
  live_venue: string;
  region: string;
  country: string;
  /** 대표 이미지(포스터 → 아이콘, 호출하는 쪽에서 고름) */
  image: string | null;
}

/** "平城宮跡 (헤이조 궁터)" → 원어 "平城宮跡" (괄호가 없으면 그대로). */
function originalName(text: string): string {
  const { city, original } = splitRegion(text);
  return original ?? city;
}

/**
 * 즛토피아 공연 상세(지난 공연 아카이브)용 MusicEvent. 온라인 공연은 null — Google
 * 이벤트는 실제 장소가 있어야 하고, VirtualLocation에 넣을 시청 주소도 없다.
 * 날짜는 즛토마요가 선 날(live_date, 페스티벌)이 있으면 그날 하루, 없으면 공연
 * 기간(start~end). 시간 정보가 없어 날짜만 넣는다(schema.org Date).
 * 장소·지역은 "원어 (한글)" 표기에서 원어만 — 장소의 한글은 alternateName으로 남긴다.
 */
export function buildPastLiveJsonLd(live: PastLiveForJsonLd, pageUrl: string) {
  if (isOnlineLive(live)) return null;
  const day = (iso: string) => iso.split("T")[0];
  const startDate = day(live.live_date ?? live.start_date);
  const endDate =
    !live.live_date && live.end_date ? day(live.end_date) : undefined;
  const venue = splitRegion(live.live_venue);
  const countryCode = COUNTRY_CODE[live.country];
  return {
    "@context": "https://schema.org",
    "@type": "MusicEvent",
    name: live.title,
    startDate,
    ...(endDate && endDate !== startDate && { endDate }),
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    url: pageUrl,
    ...(live.image && { image: live.image }),
    location: {
      "@type": "Place",
      name: venue.original ?? venue.city,
      ...(venue.original && { alternateName: venue.city }),
      address: {
        "@type": "PostalAddress",
        addressLocality: originalName(live.region),
        ...(countryCode && { addressCountry: countryCode }),
      },
    },
    // 루트 레이아웃 @graph의 MusicGroup과 같은 대상(@id) — 다른 <script>의 노드를
    // 합쳐 읽지 않는 도구도 있어 이름은 같이 넣는다.
    performer: {
      "@type": "MusicGroup",
      "@id": MUSIC_GROUP_ID,
      name: ARTIST.name.kr,
    },
  };
}
