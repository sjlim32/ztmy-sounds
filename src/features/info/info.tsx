import { InfoEvent } from "@/features/info/lib/types";

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
