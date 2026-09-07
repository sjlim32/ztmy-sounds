import type { SocialPlatform } from "@/lib/social-platform";

export type SectionDef = {
  id: string;
  label: string;
};

export type InfoEvent = {
  id: string;
  name: string;
  date: string;
  place: string;
  // 이벤트마다 실을 섹션 구성이 다를 수 있어서(예: 어떤 공연은 굿즈가 없음),
  // 전역 상수가 아니라 이벤트 데이터 자체에 둡니다.
  sections: SectionDef[];
  url: {
    main: string;
    place: string;
    ticket: Url[];
    official: SocialUrl[];
    sub?: Url[];
  };
  img: {
    main: string;
    sub?: Img[];
  };
};

export type Url = {
  name: string;
  href: string;
  disabled?: boolean;
};

/** Footer의 SOCIAL_LINKS와 같은 platform 키를 공유해서 같은 아이콘 매핑을 씁니다. */
export type SocialUrl = Url & {
  platform: SocialPlatform;
};

export type Img = {
  name: string;
  asset: string;
  // 이벤트 자신의 sections 중 하나의 id와 매칭됩니다. 전역 유니언이 아니라
  // string인 이유는 위 sections와 동일합니다.
  section: string;
};
