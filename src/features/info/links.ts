import { INFORMATION } from "@/features/info/info";

export interface ConcertLink {
  label: string;
  href: string;
}

/** 공연 관련 공식 안내 링크. */
export const OFFICIAL_LINKS: ConcertLink[] = [
  { label: "공식 사이트 (특설 페이지)", href: INFORMATION.url.main },
  { label: "전체 공연장 (구글 지도)", href: INFORMATION.url.place },
  {
    label: "티켓 신청 (국내)",
    href: "https://zutomayo.net/apicula-denki_apply_pre/",
  },
  {
    label: "티켓 신청 (해외)",
    href: "https://zutomayo.net/apicula-denki_apply_pre_en/",
  },
];

/** 입장에 필요한 전자 티켓 앱 — 예매처마다 앱이 다르다. */
export const TICKET_APPS: { name: string; android: string; ios: string }[] = [
  {
    name: "티켓피아 (MOALA)",
    android: "https://play.google.com/store/apps/details?id=fun.moala.pocket",
    ios: "https://apps.apple.com/jp/app/moala-pocket/id1626245204",
  },
  {
    name: "로치케",
    android: "https://play.google.com/store/apps/details?id=jp.lhe.ebillet",
    ios: "https://apps.apple.com/jp/app/%E3%83%AD%E3%83%BC%E3%83%81%E3%82%B1%E9%9B%BB%E5%AD%90%E3%83%81%E3%82%B1%E3%83%83%E3%83%88/id1175974437",
  },
  {
    name: "이플러스 (e+)",
    android:
      "https://play.google.com/store/apps/details?id=jp.eplus.android.all.app",
    ios: "https://apps.apple.com/jp/app/e-%E3%82%A4%E3%83%BC%E3%83%97%E3%83%A9%E3%82%B9-%E3%83%81%E3%82%B1%E3%83%83%E3%83%88-%E3%83%8B%E3%83%A5%E3%83%BC%E3%82%B9-%E3%82%B9%E3%83%9E%E3%83%81%E3%82%B1/id465887673",
  },
];

/** /info의 탭 바로가기 — 해시가 탭 id다(InfoTabContext). */
export const INFO_TAB_LINKS: ConcertLink[] = [
  { label: "공연 정보 전체", href: "/info" },
  { label: "투어 일정", href: "/info#schedule" },
  { label: "공연 지도", href: "/info#map" },
  { label: "티켓 정보", href: "/info#ticket" },
  { label: "투어 소개", href: "/info#prologue" },
];
