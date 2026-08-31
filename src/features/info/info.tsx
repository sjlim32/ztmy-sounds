import { InfoEvent } from "./lib/types";

export const INFORMATION: InfoEvent = {
  id: "sound-planet",
  name: "사운드 플래닛 페스티벌 2026",
  date: "2026년 9월 6일, 20시 50분",
  place: "영종도 파라다이스 시티",
  url: {
    main: "https://soundplanetfestival.co.kr/",
    place: "https://maps.app.goo.gl/dbGofxRv5T7SbDBG8",
    ticket: [
      {
        name: "멜론 티켓",
        href: "https://ticket.melon.com/performance/index.htm?prodId=213174",
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
    main: "/assets/info/sound-planet-poster.webp",
    sub: [
      { name: "오시는 길", asset: "/assets/info/how-to-come.webp" },
      { name: "입장 안내", asset: "/assets/info/entrance-info.webp" },
      { name: "반입 금지 물품", asset: "/assets/info/ban-list.webp" },
      { name: "라인업", asset: "/assets/info/line-up.webp" },
      { name: "지도", asset: "/assets/info/map.webp" },
      { name: "타임테이블", asset: "/assets/info/time-table.webp" },
      { name: "굿즈 사전구매", asset: "/assets/info/goods0.webp" },
      { name: "굿즈 사전구매", asset: "/assets/info/goods1.webp" },
      { name: "굿즈 사전구매", asset: "/assets/info/goods2.webp" },
      { name: "굿즈 사전구매", asset: "/assets/info/goods3.webp" },
      { name: "굿즈 사전구매", asset: "/assets/info/goods4.webp" },
      { name: "굿즈 사전구매", asset: "/assets/info/goods5.webp" },
    ],
  },
};
