# 프로젝트 규칙

- **ずっと真夜中でいいのに。(ZUTOMAYO)** 전용 콜가이드 사이트입니다.

## 알려진 주의사항

- `@serwist/next`가 아니라 `@serwist/turbopack`을 씁니다. 이 프로젝트는 Turbopack으로
  빌드되는데, `@serwist/next`의 서비스워커 빌드는 webpack 전용이라 Turbopack에서는 아무
  경고 없이 서비스워커를 생성하지 못합니다.
- `@next/mdx`는 App Router에서 `src/mdx-components.tsx`(`useMDXComponents` export)가
  없으면 동작하지 않습니다.
- 유튜브 플레이어는 `(pages)/guide/layout.tsx`에 한 번만 마운트됩니다. 곡 간 이동 시
  iframe이 재생성되지 않도록 하기 위함이니, 곡 상세 페이지 로직을 바꿀 때 이 구조를
  깨지 않도록 주의하세요.
- 모바일에서는 사이트 자체(문서/`body`)가 스크롤되지 않습니다. 루트 레이아웃의 `body`가
  `h-dvh overflow-hidden`으로 고정되어 있고, 중간 flex 컨테이너들이 `min-h-0`으로
  높이를 정확히 물려받아, 각 라우트의 내부 컨테이너(`/guide`의 곡 목록 `ul`, `/info`의
  `main` 등)가 자체 `overflow-y-auto`로 스크롤됩니다. 새 페이지/컴포넌트를 이 체인
  안에 추가할 때 중간에 `min-h-0`을 빠뜨리면 그 지점부터 내부 스크롤이 깨지고 다시
  `body`가 스크롤되기 시작하니 주의하세요.
