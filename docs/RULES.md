# 프로젝트 규칙

- **ずっと真夜中でいいのに。(ZUTOMAYO)** 전용 콜가이드 사이트입니다.

## 알려진 주의사항

- `@serwist/next`가 아니라 `@serwist/turbopack`을 씁니다. 이 프로젝트는 Turbopack으로
  빌드되는데, `@serwist/next`의 서비스워커 빌드는 webpack 전용이라 Turbopack에서는 아무
  경고 없이 서비스워커를 생성하지 못합니다.
- `@next/mdx`는 App Router에서 `src/mdx-components.tsx`(`useMDXComponents` export)가
  없으면 동작하지 않습니다.
- 유튜브 플레이어는 `guide/layout.tsx`에 한 번만 마운트됩니다. 곡 간 이동 시 iframe이
  재생성되지 않도록 하기 위함이니, 곡 상세 페이지 로직을 바꿀 때 이 구조를 깨지 않도록
  주의하세요.
