import type { NextConfig } from "next";
import createMDX from "@next/mdx";
import { withSerwist } from "@serwist/turbopack";

const nextConfig: NextConfig = {
  output: "export",
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  images: { unoptimized: true }, // output: "export"는 Next 기본 이미지 최적화 API(/​_next/image)를 못 쓰므로 비활성화
  allowedDevOrigins: ["192.168.45.182"], // 같은 네트워크에서 개발 서버 접속 허용
};

const withMDX = createMDX({});

export default withSerwist(withMDX(nextConfig));
