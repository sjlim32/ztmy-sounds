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
- 개발 서버는 프로젝트당 하나만 뜹니다 (`.next/dev/lock`, Next 16.3+). 다른 포트로
  `next dev`를 또 실행해도 실제로 뜨지 않고 기존 서버의 PID/URL만 출력됩니다. 검증이
  필요하면 이미 떠 있는 서버(보통 `localhost:3000`)에 read-only로 접속해서 확인하세요.
- `package.json`엔 있는데 "Cannot find module"로 에러나면 `pnpm install`부터 실행해
  보세요 — `node_modules`가 `pnpm-lock.yaml`과 어긋나 있을 수 있습니다.
- MDX(`*.mdx`) 최상단 코드 블록은 `import`/`export`만 허용되고 순수 `const` 선언은
  안 됩니다 — 본문 JSX에서 쓸 값은 `export const`로 선언하세요.
- MDX에서 태그와 텍스트를 줄바꿈해서 쓰면 안쪽 텍스트가 별도 markdown 문단으로
  재파싱되어 `<p>` 안에 `<p>`가 중첩되는 잘못된 HTML이 되고, 적용한 className이
  조용히 사라집니다. 한 줄로 쓰거나 `mdx-components.tsx` 기본 스타일을 고치세요
  (Prettier가 저장 시 자동으로 여러 줄로 되돌릴 수 있으니 주의).
- `src/mdx-components.tsx`의 커스텀 컴포넌트(h2/p/ul/li 등)는 `...props`를 펼치고
  `className`을 `cn()`으로 병합해야 합니다 — 안 그러면 `.mdx` 파일 안에서 태그에 준
  className이 무시됩니다.
- Tailwind Preflight가 `img { height: auto }`를 깔아둬서 `next/image`의 `height`
  prop을 덮어씁니다 — 크기 고정/크롭(`object-cover`)이 필요한 썸네일은 인라인
  `style={{ width, height }}`도 함께 지정하세요.
