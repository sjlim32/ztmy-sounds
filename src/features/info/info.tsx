import { InfoEvent } from "@/features/info/lib/types";

// app/(pages)/info/page.tsx의 <main> id이자 ScrollToTopButton의
// containerId — InfoTabs가 탭 전환 시 이 컨테이너를 맨 위로 스크롤하는데,
// 두 곳에서 같은 문자열을 따로 적으면 어긋날 수 있어 여기 하나로 둔다.
export const INFO_SCROLL_CONTAINER_ID = "info-scroll-container";

// 본문에서 탭 내용이 시작하는 지점의 id — 탭 바는 헤더(SiteHeader)에 있어서,
// 탭을 바꾸면 이 지점이 화면 맨 위에 오도록 스크롤한다(InfoTabs).
export const INFO_TAB_ANCHOR_ID = "info-tab-content";

/** 정보 페이지 탭 4종(탭 바는 헤더에 있다). */
export type InfoTabId = "schedule" | "map" | "ticket" | "prologue";

/** 주소에 해시가 없을 때 열리는 탭. */
export const DEFAULT_INFO_TAB: InfoTabId = "schedule";

export const INFO_TABS: { id: InfoTabId; label: string }[] = [
  { id: "schedule", label: "투어 일정" },
  { id: "map", label: "공연 지도" },
  { id: "ticket", label: "티켓 정보" },
  { id: "prologue", label: "투어 소개" },
];

/**
 * 탭 → 그 탭에 속한 sections id 목록.
 */
export const INFO_TAB_SECTIONS: Record<InfoTabId, string[]> = {
  schedule: ["schedule"],
  map: ["map"],
  ticket: ["ticket"],
  prologue: ["prologue"],
};

// 여기서 다루는 공연이 바뀌면(다음 공연 안내로 교체), src/data/event.ts의
// originEvent/visitEvent 중 "지금 이 공연"에 해당하는 쪽도 함께 갱신해야
// 합니다 — src/app/(pages)/info/page.tsx의 메타데이터(OG·Twitter·JSON-LD)가
// 그 이벤트를 참조해서, 안 맞추면 실제 안내 내용과 다른 공연이 공유
// 미리보기/구조화 데이터에 노출됩니다.
export const INFORMATION: InfoEvent = {
  id: "apicula-denki",
  name: "아피쿠라 전기 「アピクラ電機」",
  date: "2027년 1월 15일 ~ 5월 23일",
  place: "전국 23개 도시 (총 36공연)",
  sections: [
    { id: "schedule", label: "투어 일정" },
    { id: "map", label: "공연 지도" },
    { id: "ticket", label: "티켓 정보" },
    { id: "prologue", label: "투어 소개" },
  ],
  url: {
    main: "https://zutomayo.net/apicula/",
    place: "https://maps.app.goo.gl/6JdViGdHH1Vwn6hX9",
    ticket: [
      {
        name: "PREMIUM 선행 (국내)",
        href: "https://zutomayo.net/apicula-denki_apply_pre/",
      },
      {
        name: "Apply (Outside Japan)",
        href: "https://zutomayo.net/apicula-denki_apply_pre_en/",
      },
    ],
    official: [
      {
        name: "공식 홈페이지",
        href: "https://zutomayo.net/apicula/",
        platform: "web",
      },
      {
        name: "공식 X",
        href: "https://twitter.com/zutomayo",
        platform: "x",
      },
    ],
  },
  img: {
    main: "/assets/info/apicula-denki_kv.webp",
    sub: [
      {
        name: "전체 공연 지도 (전국 23개 도시 배치도)",
        asset: "/assets/info/apicula-denki_tour-maps.webp",
        section: "schedule",
      },
      {
        name: "일정 번역본 (홀별 정원수)",
        asset: "/assets/info/apicula-denki_schedule-kr.webp",
        section: "schedule",
      },
      {
        name: "투어 일정표 (공식 원문)",
        asset: "/assets/info/apicula-denki_schedule.webp",
        section: "schedule",
      },
      {
        name: "전체 공연 지도",
        asset: "/assets/info/apicula-denki_tour-maps.webp",
        section: "map",
      },
      {
        name: "키비주얼",
        asset: "/assets/info/apicula-denki_kv.webp",
        section: "prologue",
      },
    ],
  },
};
