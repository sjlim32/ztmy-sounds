import type { NextConfig } from "next";
import createMDX from "@next/mdx";
import { withSerwist } from "@serwist/turbopack";

const nextConfig: NextConfig = {
  // output:"export"는 next dev에서도 강제되어(API Route가 요청마다 500 에러)
  // /tools의 /api/transcript 같은 개발용 동적 라우트를 못 씁니다. 그래서 실제
  // 배포 빌드(next build)에서만 켜고, 개발 서버에서는 꺼둡니다.
  ...(process.env.NODE_ENV === "production" ? { output: "export" as const } : {}),
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  images: { unoptimized: true }, // output: "export"는 Next 기본 이미지 최적화 API(/​_next/image)를 못 쓰므로 비활성화
  allowedDevOrigins: ["192.168.45.182"], // 같은 네트워크에서 개발 서버 접속 허용
};

const withMDX = createMDX({});

export default withSerwist(withMDX(nextConfig));
