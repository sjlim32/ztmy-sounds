import { InfoEvent } from "@/features/info/lib/types";

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
    { id: "notice", label: "공연" },
    { id: "map", label: "전체 지도" },
    { id: "matsuri-map", label: "축제 AREA 지도" },
    { id: "matsuri", label: "축제 AREA" },
    { id: "matsuri-notice", label: "축제 공지" },
    { id: "matsuri-workshop", label: "WORK SHOP & MINI GAME" },
    { id: "matsuri-food", label: "Food" },
    { id: "matsuri-sidestage", label: "Side Stage" },
    { id: "matsuri-collabo", label: "Collabo" },
    { id: "popup", label: "Pop Up" },
  ],
  url: {
    main: "https://zutomayo.net/bunka-denrai/",
    place: "https://maps.app.goo.gl/A4VAKugihbhTjSg48",
    ticket: [
      {
        name: "공식 홈페이지",
        href: "https://zutomayo.net/bunka-denrai/",
      },
    ],
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
        name: "축제 공지",
        asset: "/assets/info/matsuri_01.webp",
        section: "matsuri-notice",
      },
      {
        name: "WORK SHOP & MINI GAME",
        asset: "/assets/info/matsuri_02.webp",
        section: "matsuri-workshop",
      },
      {
        name: "WORK SHOP & MINI GAME",
        asset: "/assets/info/matsuri_03.webp",
        section: "matsuri-workshop",
      },
      {
        name: "Food",
        asset: "/assets/info/matsuri_04.webp",
        section: "matsuri-food",
      },
      {
        name: "Side Stage",
        asset: "/assets/info/matsuri_05.webp",
        section: "matsuri-sidestage",
      },
      {
        name: "Collabo",
        asset: "/assets/info/matsuri_06.webp",
        section: "matsuri-collabo",
      },
      {
        name: "Collabo",
        asset: "/assets/info/matsuri_07.webp",
        section: "matsuri-collabo",
      },
      {
        name: "Collabo",
        asset: "/assets/info/matsuri_08.webp",
        section: "matsuri-collabo",
      },
      {
        name: "Collabo",
        asset: "/assets/info/matsuri_09.webp",
        section: "matsuri-collabo",
      },
      {
        name: "pop-up",
        asset: "/assets/info/popup_01.webp",
        section: "popup",
      },
      {
        name: "pop-up",
        asset: "/assets/info/popup_02.webp",
        section: "popup",
      },
    ],
  },
};
