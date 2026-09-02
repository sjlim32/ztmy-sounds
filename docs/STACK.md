# 기술 스택

| 영역          | 사용 기술                                                                                  |
| ------------- | ------------------------------------------------------------------------------------------ |
| 프레임워크    | Next.js 16 (App Router, Turbopack)                                                         |
| UI            | React 19, TypeScript                                                                       |
| 패키지 매니저 | pnpm                                                                                       |
| 스타일        | Tailwind CSS v4 — 커스텀 브레이크포인트(`tablet`/`pc`/`wide`)와 색상 토큰(`ztmy-*`) 시스템 |
| 포맷터        | Prettier + `prettier-plugin-tailwindcss` (`pnpm format`)                                   |
| 콘텐츠        | MDX (`@next/mdx`) — 줄글 콘텐츠 전용                                                       |
| PWA           | `@serwist/turbopack` (오프라인 캐싱)                                                       |
| 영상 재생     | YouTube IFrame API                                                                         |
| 아이콘        | 커스텀 SVG 컴포넌트 (`src/components/icons/`) — 외부 아이콘 라이브러리 미사용              |
| 폰트          | Geist Sans/Mono, RocknRoll One (Google Fonts) — 851MkPOP (로컬 폰트)                       |
| 배포          | Cloudflare Pages (`wrangler.jsonc`, `pnpm pages:deploy`)                                   |
