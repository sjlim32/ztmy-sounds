export interface TourPerformance {
  dates: string;
  venue: string;
  time: string;
  capacity: string;
  pref: string;
}

export interface TourMonthGroup {
  month: number;
  label: string;
  shows: TourPerformance[];
}

export const TOUR_MAP_URL = "https://maps.app.goo.gl/6JdViGdHH1Vwn6hX9";

export const TOUR_FOOTNOTES = [
  "¹ 도쿄 가든 시어터: 착석 약 7,000석",
  "² 센다이 선플라자홀: 콘서트 배치 2,054석",
  "※ 개장(OPEN) 시각은 개연 1시간 전 기준입니다. (아이치·이치카와 등 18:30 개연은 17:30 개장, 4/11 오카야마는 16:00 개장)",
];

export const TOUR_SCHEDULE: TourMonthGroup[] = [
  {
    month: 1,
    label: "1월",
    shows: [
      {
        dates: "15(금)",
        venue: "히로시마 문화학원 HBG홀",
        time: "18:00",
        capacity: "2,001석",
        pref: "히로시마",
      },
      {
        dates: "18(월)·19(화)",
        venue: "이치카와시 문화회관 대홀",
        time: "18:30",
        capacity: "1,758석",
        pref: "치바",
      },
      {
        dates: "21(목)",
        venue: "J:COM홀 하치오지",
        time: "19:00",
        capacity: "1,877석",
        pref: "도쿄",
      },
      {
        dates: "26(화)·27(수)",
        venue: "SGC홀 아리아케",
        time: "19:00",
        capacity: "착석 최대 3,767석",
        pref: "도쿄",
      },
    ],
  },
  {
    month: 2,
    label: "2월",
    shows: [
      {
        dates: "6(토)",
        venue: "후지 로제시어터 대홀",
        time: "18:00",
        capacity: "1,632석",
        pref: "시즈오카",
      },
      {
        dates: "15(월)·16(화)",
        venue: "고베 국제회관 고쿠사이홀",
        time: "19:00",
        capacity: "2,022석",
        pref: "효고",
      },
      {
        dates: "21(일)",
        venue: "오이타 iichiko 그란시어터",
        time: "18:00",
        capacity: "1,966석",
        pref: "오이타",
      },
      {
        dates: "23(화)",
        venue: "구마모토성홀 메인홀",
        time: "19:00",
        capacity: "2,304석",
        pref: "구마모토",
      },
      {
        dates: "27(토)",
        venue: "이와키 알리오스 알파인 대홀",
        time: "18:00",
        capacity: "1,705석",
        pref: "후쿠시마",
      },
    ],
  },
  {
    month: 3,
    label: "3월",
    shows: [
      {
        dates: "4(목)·5(금)",
        venue: "도쿄 가든 시어터",
        time: "19:00",
        capacity: "착석 약 7,000석¹",
        pref: "도쿄",
      },
      {
        dates: "13(토)",
        venue: "마쓰야마 시민회관 대홀",
        time: "18:00",
        capacity: "1,825석",
        pref: "에히메",
      },
      {
        dates: "15(월)",
        venue: "후쿠오카 선팔레스",
        time: "19:00",
        capacity: "2,316석",
        pref: "후쿠오카",
      },
      {
        dates: "16(화)",
        venue: "야마구치 KDDI 이신홀",
        time: "19:00",
        capacity: "최대 1,972석·가변형",
        pref: "야마구치",
      },
      {
        dates: "24(수)·25(목)",
        venue: "아이치현 예술극장 대홀",
        time: "18:30",
        capacity: "2,480석",
        pref: "아이치",
      },
      {
        dates: "30(화)·31(수)",
        venue: "가나자와 가극좌",
        time: "19:00",
        capacity: "1,919석",
        pref: "이시카와",
      },
    ],
  },
  {
    month: 4,
    label: "4월",
    shows: [
      {
        dates: "8(목)",
        venue: "나라 100년회관 대홀",
        time: "19:00",
        capacity: "1,476석",
        pref: "나라",
      },
      {
        dates: "10(토)·11(일)",
        venue: "오카야마 하레노와 대극장",
        time: "토 18:00 / 일 17:00",
        capacity: "1,753석",
        pref: "오카야마",
      },
      {
        dates: "20(화)·21(수)",
        venue: "삿포로 hitaru",
        time: "19:00",
        capacity: "2,302석",
        pref: "홋카이도",
      },
      {
        dates: "27(화)·28(수)",
        venue: "오사카 페스티벌홀",
        time: "19:00",
        capacity: "2,700석",
        pref: "오사카",
      },
    ],
  },
  {
    month: 5,
    label: "5월",
    shows: [
      {
        dates: "1(토)·2(일)",
        venue: "다치카와 스테이지 가든",
        time: "18:00",
        capacity: "착석 2,448석",
        pref: "도쿄",
      },
      {
        dates: "11(화)·12(수)",
        venue: "센다이 선플라자홀",
        time: "19:00",
        capacity: "콘서트 배치 2,054석²",
        pref: "미야기",
      },
      {
        dates: "17(월)·18(화)",
        venue: "컬츠 가와사키홀",
        time: "19:00",
        capacity: "2,013석",
        pref: "카나가와",
      },
      {
        dates: "22(토)·23(일)",
        venue: "와카야마현민문화회관 대홀",
        time: "18:00",
        capacity: "2,000석",
        pref: "와카야마",
      },
    ],
  },
];
