export interface Event {
  label: string;
  accent: "home" | "away";
  tourName: string;
  tourImg: string;
  tourUrl: string;
  place: string;
  placeDesc?: string;
  placeUrl: string;
  date: string;
  time: string;
}

// event.accent(home: 내한 / away: 원정)에 따른 상단 테두리 색.
export const accentBorder = {
  home: "border-ztmy-magenta/40",
  away: "border-ztmy-sky/40",
} satisfies Record<Event["accent"], string>;

export const visitEvent: Event = {
  label: "NEXT VISIT",
  accent: "home",
  tourName: "사운드 플래닛 페스티널 2026",
  tourImg: "/assets/next-visit/sound-planet-3.webp",
  tourUrl: "https://soundplanetfestival.co.kr/",
  place: "PARADISE CITY",
  placeUrl: "https://maps.app.goo.gl/TXhUQEc1cXpRPY1b8",
  date: "2026.09.06",
  time: "20:50",
};

// date는 "YYYY.MM.DD" 단일 날짜이거나, 다일차 공연(예: 2일간 열리는
// 페스티벌)이면 "YYYY.MM.DD·DD"처럼 가운데 점(·) 뒤에 마지막 날의 일(day)만
// 붙여서 씁니다(예: "2026.10.10·11" = 10/10~10/11). 화면에는 이 표기를 그대로
// 보여주면 되지만, 카운트다운/구조화 데이터처럼 실제 날짜 파싱이 필요한
// 곳에서는 가운데 점 앞부분(첫째 날)을 기준으로 계산합니다.
export function getEventStartDate(event: Event): string {
  return event.date.split("·")[0];
}

// 다일차 공연의 마지막 날짜. "YYYY.MM.DD·DD" 형식이면 시작일과 같은 해/월에
// 가운데 점 뒤 일(day)을 붙여 "YYYY.MM.DD"로 복원합니다. 가운데 점이 없으면
// 시작일과 동일합니다.
export function getEventEndDate(event: Event): string {
  const [start, endDay] = event.date.split("·");
  if (!endDay) return start;
  const [year, month] = start.split(".");
  return `${year}.${month}.${endDay}`;
}

// 화면 표시용 날짜 문자열. "YYYY.MM.DD·DD" 표기는 그 자체가 이미 원하는
// 표시 형태라 가공 없이 그대로 보여줍니다.
export function formatEventDate(event: Event): string {
  return event.date;
}

export const originEvent: Event = {
  label: "NEXT STAGE",
  accent: "away",
  tourName: "LEGACY ZOMBIE LABO 「文禍伝雷」",
  tourImg: "/assets/next-stage/bunka-denrai.webp",
  tourUrl: "https://zutomayo.net/bunka-denrai/",
  place: "平城宮跡歴史公園 ",
  placeDesc: "헤이조궁터 역사공원",
  placeUrl: "https://maps.app.goo.gl/A4VAKugihbhTjSg48",
  date: "2026.10.10·11",
  time: "17:30",
};
