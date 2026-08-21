import type { NextConfig } from "next";
import createMDX from "@next/mdx";
import { withSerwist } from "@serwist/turbopack";

const nextConfig: NextConfig = {
  output: "export",
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  // output: "export"는 Next 기본 이미지 최적화 API(/​_next/image)를 못 쓰므로 비활성화
  images: { unoptimized: true },
};

const withMDX = createMDX({});

export default withSerwist(withMDX(nextConfig));
