export interface VisitEvent {
  tourName: string;
  tourImg: string;
  tourUrl: string;
  place: string;
  placeUrl: string;
  date: string;
  time: string;
}

export const visitEvent: VisitEvent = {
  tourName: "사운드 플래닛 페스티널 2026",
  tourImg: "/assets/next-visit/sound-planet-3.webp",
  tourUrl: "https://soundplanetfestival.co.kr/",
  place: "PARADISE CITY",
  placeUrl: "https://maps.app.goo.gl/TXhUQEc1cXpRPY1b8",
  date: "2026.09.06",
  time: "20:50",
};

// TODO 원정 정보 추가 예정
// export interface OriginEvent {
//   tourName: string;
//   tourImg: string;
//   tourUrl: string;
//   place: string;
//   placeUrl: string;
//   date: string;
//   time: string;
// }

// export const originEvent: OriginEvent = {
//   tourName: "LEGACY ZOMCRAB LABO ",
//   tourImg: "",
//   tourUrl: "",
//   place: "",
//   placeUrl: "",
//   date: "2026.10.04",
//   time: "17:00",
// };
