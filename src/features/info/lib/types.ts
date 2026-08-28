import type { SocialPlatform } from "@/lib/social-platform";

export type InfoEvent = {
  id: string;
  name: string;
  date: string;
  place: string;
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
};

/** Footer의 SOCIAL_LINKS와 같은 platform 키를 공유해서 같은 아이콘 매핑을 씁니다. */
export type SocialUrl = Url & {
  platform: SocialPlatform;
};

export type Img = {
  name: string;
  asset: string;
};
