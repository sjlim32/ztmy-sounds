import { InfoEvent } from "@/features/info/lib/types";

// app/(pages)/info/page.tsx의 <main> id이자 ScrollToTopButton의
// containerId — InfoTabs가 탭 전환 시 이 컨테이너를 맨 위로 스크롤하는데,
// 두 곳에서 같은 문자열을 따로 적으면 어긋날 수 있어 여기 하나로 둔다.
export const INFO_SCROLL_CONTAINER_ID = "info-scroll-container";

/** 정보 페이지 상단 탭 4종. */
export type InfoTabId =
  "concert" | "matsuri" | "collabo" | "popup" | "stamp-rally";

export const INFO_TABS: { id: InfoTabId; label: string }[] = [
  { id: "concert", label: "공연" },
  { id: "matsuri", label: "축제" },
  { id: "collabo", label: "콜라보" },
  { id: "popup", label: "팝업" },
  { id: "stamp-rally", label: "스탬프 랠리" },
];

/**
 * 탭 → 그 탭에 속한 sections id 목록. sections 쪽에 tabs를 매달지 않고
 * 이렇게 별도로 관리하는 이유는, section 하나가 여러 탭에 동시에 속할 수
 * 있어서(예: "map"은 공연·축제 둘 다, "matsuri-collabo"는 축제·콜라보 둘
 * 다) 그 소속 관계 자체를 탭 기준으로 한눈에 보는 편이 sections 배열
 * 안에 흩어놓는 것보다 파악하기 쉽기 때문이다.
 */
export const INFO_TAB_SECTIONS: Record<InfoTabId, string[]> = {
  concert: ["gather", "notice", "bonus", "map"],
  matsuri: [
    "map",
    "matsuri-map",
    "matsuri-workshop",
    "matsuri-food",
    "matsuri-sidestage",
    "matsuri-collabo",
  ],
  collabo: ["zutomarosh", "matsuri-collabo"],
  popup: ["popup", "ztmy-mart", "ztmy-stand"],
  "stamp-rally": ["stamp-rally"],
};

// 여기서 다루는 공연이 바뀌면(다음 공연 안내로 교체), src/data/event.ts의
// originEvent/visitEvent 중 "지금 이 공연"에 해당하는 쪽도 함께 갱신해야
// 합니다 — src/app/(pages)/info/page.tsx의 메타데이터(OG·Twitter·JSON-LD)가
// 그 이벤트를 참조해서, 안 맞추면 실제 안내 내용과 다른 공연이 공유
// 미리보기/구조화 데이터에 노출됩니다.
export const INFORMATION: InfoEvent = {
  id: "sound-planet",
  name: "LEGACY ZOMBIE LABO 「문화전뢰(文禍伝雷)」",
  date: "2026년 10월 10일·11일, 17시 30분",
  place: "헤이조궁터 역사공원 (平城宮跡歴史公園)",
  sections: [
    { id: "gather", label: "입장·집합 안내" },
    { id: "notice", label: "공연" },
    { id: "bonus", label: "특전" },
    { id: "map", label: "전체 지도" },
    { id: "matsuri-map", label: "축제 AREA 지도" },
    { id: "matsuri-workshop-guide", label: "워크숍 참여 방법" },
    { id: "matsuri-workshop", label: "워크숍 & 미니 게임" },
    { id: "matsuri-food", label: "음식 코너" },
    { id: "matsuri-sidestage", label: "사이드 스테이지" },
    { id: "matsuri-collabo", label: "나라현 콜라보 상품" },
    { id: "zutomarosh", label: "즛토마로슈" },
    { id: "ztmy-mart", label: "팝업" },
    { id: "ztmy-mart-lineup", label: "MART 상품" },
    { id: "ztmy-stand", label: "팝업" },
    { id: "stamp-rally", label: "스탬프 랠리" },
    { id: "denrai-shuin", label: "전뢰집인 순회" },
  ],
  url: {
    main: "https://zutomayo.net/bunka-denrai/",
    place: "https://maps.app.goo.gl/A4VAKugihbhTjSg48",
    official: [
      {
        name: "홈페이지",
        href: "https://zutomayo.net/bunka-denrai/",
        platform: "web",
      },
    ],
  },
  img: {
    main: "/assets/next-stage/bunka-denrai.webp",
    sub: [
      {
        name: "방문 시 협조 부탁",
        asset: "/assets/info/gather_01.webp",
        section: "gather",
      },
      {
        name: "집합 시간·집합 장소 일람",
        asset: "/assets/info/gather_02.webp",
        section: "gather",
      },
      {
        name: "Premium Area 집합 안내",
        asset: "/assets/info/gather_03.webp",
        section: "gather",
      },
      {
        name: "집합 장소 지도",
        asset: "/assets/info/gather_map.webp",
        section: "gather",
      },
      {
        name: "티켓 정보",
        asset: "/assets/info/ticket.webp",
        section: "notice",
      },
      {
        name: "공연장 지도",
        asset: "/assets/info/heijyoukyo-map-0617.webp",
        section: "notice",
      },
      {
        name: "STAGE AREA 지도",
        asset: "/assets/info/area_map.webp",
        section: "notice",
      },
      {
        name: "특전",
        asset: "/assets/info/ztmy_heijyokyo_ltd-day001.jpg",
        section: "bonus",
      },
      {
        name: "특전",
        asset: "/assets/info/ztmy_heijyokyo_ltd-day002.jpg",
        section: "bonus",
      },
      {
        name: "전체 지도",
        asset: "/assets/info/heijyoukyo-map-all.webp",
        section: "map",
      },
      {
        name: "축제 지도",
        asset: "/assets/info/heijyoukyo-map-matsuri.webp",
        section: "matsuri-map",
      },
      {
        name: "워크숍 참여 방법",
        asset: "/assets/info/matsuri_03.webp",
        section: "matsuri-workshop-guide",
      },
      {
        name: "워크숍 & 미니 게임 1",
        asset: "/assets/info/matsuri_02-01.webp",
        section: "matsuri-workshop",
      },
      {
        name: "워크숍 & 미니 게임 2",
        asset: "/assets/info/matsuri_02-02.webp",
        section: "matsuri-workshop",
      },
      {
        name: "워크숍 & 미니 게임 3",
        asset: "/assets/info/matsuri_02-03.webp",
        section: "matsuri-workshop",
      },
      {
        name: "워크숍 & 미니 게임 4",
        asset: "/assets/info/matsuri_02-04.webp",
        section: "matsuri-workshop",
      },
      {
        name: "워크숍 & 미니 게임 5",
        asset: "/assets/info/matsuri_02-05.webp",
        section: "matsuri-workshop",
      },
      {
        name: "워크숍 & 미니 게임 6",
        asset: "/assets/info/matsuri_02-06.webp",
        section: "matsuri-workshop",
      },
      {
        name: "워크숍 & 미니 게임 7",
        asset: "/assets/info/matsuri_02-07.webp",
        section: "matsuri-workshop",
      },
      {
        name: "워크숍 & 미니 게임 8",
        asset: "/assets/info/matsuri_02-08.webp",
        section: "matsuri-workshop",
      },
      {
        name: "워크숍 & 미니 게임 9",
        asset: "/assets/info/matsuri_02-09.webp",
        section: "matsuri-workshop",
      },
      {
        name: "워크숍 & 미니 게임 10",
        asset: "/assets/info/matsuri_02-10.webp",
        section: "matsuri-workshop",
      },
      {
        name: "음식 코너 1",
        asset: "/assets/info/matsuri_04-01.webp",
        section: "matsuri-food",
      },
      {
        name: "음식 코너 2",
        asset: "/assets/info/matsuri_04-02.webp",
        section: "matsuri-food",
      },
      {
        name: "음식 코너 3",
        asset: "/assets/info/matsuri_04-03.webp",
        section: "matsuri-food",
      },
      {
        name: "음식 코너 4",
        asset: "/assets/info/matsuri_04-04.webp",
        section: "matsuri-food",
      },
      {
        name: "음식 코너 5",
        asset: "/assets/info/matsuri_04-05.webp",
        section: "matsuri-food",
      },
      {
        name: "음식 코너 6",
        asset: "/assets/info/matsuri_04-06.webp",
        section: "matsuri-food",
      },
      {
        name: "Side Stage",
        asset: "/assets/info/matsuri_05.webp",
        section: "matsuri-sidestage",
      },
      {
        name: "zutomarosh",
        asset: "/assets/info/zutomarosh_01.webp",
        section: "zutomarosh",
      },
      {
        name: "zutomarosh",
        asset: "/assets/info/zutomarosh_02.webp",
        section: "zutomarosh",
      },
      {
        name: "zutomarosh",
        asset: "/assets/info/zutomarosh_03.webp",
        section: "zutomarosh",
      },
      {
        name: "ZUTOMAYO MART 출장소 안내",
        asset: "/assets/info/popup-nara.webp",
        section: "ztmy-mart",
      },
      {
        name: "pop-up",
        asset: "/assets/info/popup_03.webp",
        section: "ztmy-mart",
      },
      {
        name: "pop-up",
        asset: "/assets/info/popup_04.webp",
        section: "ztmy-mart",
      },
      {
        name: "MART 상품 라인업 1",
        asset: "/assets/info/nara_lineup-01.jpg",
        section: "ztmy-mart-lineup",
      },
      {
        name: "MART 상품 라인업 2",
        asset: "/assets/info/nara_lineup-02.jpg",
        section: "ztmy-mart-lineup",
      },
      {
        name: "MART 구매 특전",
        asset: "/assets/info/nara_tokten.webp",
        section: "ztmy-mart-lineup",
      },
      {
        name: "ZUTOMAYO STAND 안내",
        asset: "/assets/info/popup-stand.webp",
        section: "ztmy-stand",
      },
      {
        name: "STAND 상품 라인업",
        asset: "/assets/info/stand_lineup.jpg",
        section: "ztmy-stand",
      },
      {
        name: "스탬프 랠리",
        asset: "/assets/info/stamp-rally.webp",
        section: "stamp-rally",
      },
      {
        name: "전뢰집인 순회 지도",
        asset: "/assets/info/stamp_rally-02.jpg",
        section: "denrai-shuin",
      },
    ],
  },
};
