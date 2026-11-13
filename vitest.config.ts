import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// 순수 로직(데이터 가공·계산)만 테스트한다 — 화면 컴포넌트 테스트는 두지 않는다.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["src/**/*.test.ts", "scripts/**/*.test.mjs"],
    environment: "node",
  },
});
