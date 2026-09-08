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
    { id: "notice", label: "공연 정보" },
    { id: "map", label: "지도" },
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
        name: "지도",
        asset: "/assets/info/heijyoukyo-map-0617.webp",
        section: "map",
      },
    ],
  },
};
