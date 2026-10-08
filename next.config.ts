import { execFileSync } from "node:child_process";
import type { NextConfig } from "next";
import createMDX from "@next/mdx";
import { withSerwist } from "@serwist/turbopack";

// 로컬 폰트 서브셋(src/fonts/subset/, git 미포함)을 dev·build가 시작하기 전에
// 만듭니다 — layout.tsx의 next/font가 이 파일들을 읽습니다. 입력이 같으면 바로 끝납니다.
execFileSync(process.execPath, ["scripts/subset-fonts.mjs"], {
  stdio: "inherit",
});

const nextConfig: NextConfig = {
  output: "export",
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  images: { unoptimized: true }, // output: "export"는 Next 기본 이미지 최적화 API(/​_next/image)를 못 쓰므로 비활성화
  allowedDevOrigins: ["192.168.45.182", "172.30.1.82"], // 같은 네트워크에서 개발 서버 접속 허용
};

const withMDX = createMDX({});

export default withSerwist(withMDX(nextConfig));
