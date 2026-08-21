export interface MobileHeaderRoute {
  /** 이 경로로 시작하는 pathname에 매칭됩니다. */
  path: string;
  title: string;
}

export const MOBILE_HEADER_ROUTES: readonly MobileHeaderRoute[] = [
  { path: "/guide", title: "응원 가이드" },
  { path: "/info", title: "공연 정보" },
];
