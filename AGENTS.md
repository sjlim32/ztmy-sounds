<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## 프로젝트 문서

프로젝트 관련 컨텍스트(스택/컨벤션/알려진 주의사항)는 `docs/` 폴더를 확인하세요
(`docs/STACK.md`, `docs/CONVENTIONS.md`, `docs/RULES.md`).

## 작업 팁

- `rm -rf .next/cache/fetch-cache` - Supabase 데이터를 고쳤는데 빌드 결과가 그대로일 때(빌드가 조회 결과를 캐시함)
- `node_modules/.bin/esbuild x.ts --bundle --platform=node --format=esm --packages=external --outfile=x.mjs && node --env-file=.env.local x.mjs` - `@/` 경로 모듈로 Supabase 데이터를 확인하는 임시 스크립트(프로젝트 루트에서 실행, 끝나면 삭제)
- `pnpm exec supabase` - Supabase CLI는 전역이 아니라 devDependency. 스키마 변경 SQL은 `supabase/migrations/`에 남김
