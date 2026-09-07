import type { InfoEvent } from "@/features/info/lib/types";

export const SF_SECTIONS = [
  { id: "event-photos", label: "공연 정보" },
  { id: "event-details", label: "공연 공지" },
  { id: "notice", label: "유의사항" },
  { id: "goods", label: "굿즈" },
  { id: "fnb", label: "F&B" },
];

// 즛토피아 아카이브 항목 — /info의 INFORMATION을 그대로 복사한 스냅샷입니다.
// /info는 앞으로 "현재 공연"이 바뀌면 이 파일과 무관하게 계속 갱신되므로,
// 여기서는 이미지 경로도 원본(/assets/info)이 아니라 아카이브 전용 경로
// (/assets/zutopia/sound-planet-2026)를 가리켜서, 나중에 /assets/info를 새
// 공연 이미지로 정리해도 이 기록은 그대로 남습니다.
export const SOUNDPLANET_2026: InfoEvent = {
  id: "sound-planet-2026",
  name: "사운드 플래닛 페스티벌 2026",
  date: "2026년 9월 6일, 20시 50분",
  place: "영종도 파라다이스 시티",
  sections: SF_SECTIONS,
  url: {
    main: "https://soundplanetfestival.co.kr/",
    place: "https://maps.app.goo.gl/dbGofxRv5T7SbDBG8",
    ticket: [
      {
        name: "멜론 티켓",
        href: "https://ticket.melon.com/performance/index.htm?prodId=213174",
        disabled: true,
      },
      {
        name: "카카오톡 선물하기",
        href: "https://gift.kakao.com/search/result?query=%EC%82%AC%EC%9A%B4%EB%93%9C%ED%94%8C%EB%9E%98%EB%8B%9B&searchType=search_typing_keyword",
      },
    ],
    official: [
      {
        name: "홈페이지",
        href: "https://soundplanetfestival.co.kr/",
        platform: "web",
      },
      {
        name: "X",
        href: "https://x.com/soundplanetfest?s=20",
        platform: "x",
      },
      {
        name: "인스타그램",
        href: "https://www.instagram.com/soundplanetfestival?utm_source=ig_web_button_share_sheet&igsi=ZDNlZDc0MzIxNw==",
        platform: "instagram",
      },
      {
        name: "유튜브",
        href: "https://www.youtube.com/@soundplanetfestival",
        platform: "youtube",
      },
    ],
    sub: [
      {
        name: "인천공항 리무진",
        href: "https://www.airport.kr/ap_ko/976/subview.do",
      },
      {
        name: "공식 셔틀(퀸즈 스마일)",
        href: "https://intro.queenssmile.co.kr/?pathname=/shop/festival/Mzc5/&search=",
      },
    ],
  },
  img: {
    main: "/assets/zutopia/sound-planet-2026/sound-planet-poster.webp",
    sub: [
      {
        name: "오시는 길",
        asset: "/assets/zutopia/sound-planet-2026/how-to-come.webp",
        section: "notice",
      },
      {
        name: "셔틀1",
        asset: "/assets/zutopia/sound-planet-2026/shuttle1.webp",
        section: "notice",
      },
      {
        name: "셔틀2",
        asset: "/assets/zutopia/sound-planet-2026/shuttle2.webp",
        section: "notice",
      },
      {
        name: "지도",
        asset: "/assets/zutopia/sound-planet-2026/map.webp",
        section: "event-photos",
      },
      {
        name: "타임테이블",
        asset: "/assets/zutopia/sound-planet-2026/time-table.webp",
        section: "event-photos",
      },
      {
        name: "반입 금지 물품",
        asset: "/assets/zutopia/sound-planet-2026/ban-list.webp",
        section: "event-photos",
      },
      {
        name: "공연 정보",
        asset: "/assets/zutopia/sound-planet-2026/info1.webp",
        section: "event-details",
      },
      {
        name: "공연 정보",
        asset: "/assets/zutopia/sound-planet-2026/info2.webp",
        section: "event-details",
      },
      {
        name: "공연 정보",
        asset: "/assets/zutopia/sound-planet-2026/info3.webp",
        section: "event-details",
      },
      {
        name: "공연 정보",
        asset: "/assets/zutopia/sound-planet-2026/info4.webp",
        section: "event-details",
      },
      {
        name: "공연 정보",
        asset: "/assets/zutopia/sound-planet-2026/info5.webp",
        section: "event-details",
      },
      {
        name: "공연 정보",
        asset: "/assets/zutopia/sound-planet-2026/info6.webp",
        section: "event-details",
      },
      {
        name: "굿즈",
        asset: "/assets/zutopia/sound-planet-2026/goods1.webp",
        section: "goods",
      },
      {
        name: "굿즈",
        asset: "/assets/zutopia/sound-planet-2026/goods2.webp",
        section: "goods",
      },
      {
        name: "굿즈",
        asset: "/assets/zutopia/sound-planet-2026/goods3.webp",
        section: "goods",
      },
      {
        name: "굿즈",
        asset: "/assets/zutopia/sound-planet-2026/goods4.webp",
        section: "goods",
      },
      {
        name: "굿즈",
        asset: "/assets/zutopia/sound-planet-2026/goods5.webp",
        section: "goods",
      },
      {
        name: "fnb",
        asset: "/assets/zutopia/sound-planet-2026/fnb0.webp",
        section: "fnb",
      },
      {
        name: "fnb",
        asset: "/assets/zutopia/sound-planet-2026/fnb1.webp",
        section: "fnb",
      },
      {
        name: "fnb",
        asset: "/assets/zutopia/sound-planet-2026/fnb2.webp",
        section: "fnb",
      },
      {
        name: "fnb",
        asset: "/assets/zutopia/sound-planet-2026/fnb3.webp",
        section: "fnb",
      },
    ],
  },
};
