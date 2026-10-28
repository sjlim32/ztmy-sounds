import { INFO_TABS, INFORMATION } from "@/features/info/info";

export interface ConcertLink {
  label: string;
  href: string;
  disabled?: boolean;
}

// 홈 공연 안내 패널(ConcertLinks)의 링크 — 따로 적지 않고 /info 페이지가 실제로
// 보여주는 데이터(INFORMATION, INFO_TABS)에서 그대로 만든다. 공연이 바뀌어
// info.tsx만 고쳐도 패널이 이전 공연 정보를 보여주는 일이 없게.

/** 공식 안내 — /info 상단의 공식 링크 + 장소(전체 공연장 지도). */
export const OFFICIAL_LINKS: ConcertLink[] = [
  ...(INFORMATION.url.official ?? []).map((official) => ({
    label: official.name,
    href: official.href,
  })),
  { label: "전체 공연장 (구글 지도)", href: INFORMATION.url.place },
];

/** 티켓 신청 — /info 상단 "티켓" 항목과 같은 링크. */
export const TICKET_LINKS: ConcertLink[] = (INFORMATION.url.ticket ?? []).map(
  (ticket) => ({
    label: ticket.name,
    href: ticket.href,
    disabled: ticket.disabled,
  }),
);

/** /info의 탭 바로가기 — 해시가 탭 id다(lib/use-info-tab.ts). */
export const INFO_TAB_LINKS: ConcertLink[] = [
  { label: "공연 정보 전체", href: "/info" },
  ...INFO_TABS.map((tab) => ({ label: tab.label, href: `/info#${tab.id}` })),
];
