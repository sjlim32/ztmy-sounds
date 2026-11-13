import { createSerwistRoute } from "@serwist/turbopack";

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } =
  createSerwistRoute({
    swSrc: "src/app/(pwa)/sw.ts",
    useNativeEsbuild: true,
    // 기본값은 public/ 전체를 미리 받아서, 첫 접속 직후 가이드·공연 이미지 약
    // 7MB를 페이지와 같은 회선으로 받았다(모바일 첫 로딩이 느려짐). 미리 받기는
    // 빌드 결과물과 화면 틀(배경·커서·아이콘·로고), 모든 응원 가이드가 쓰는 샤모지
    // 응원 아이콘(공연장처럼 통신이 약한 곳에서 처음 열어도 보이게, legacy 폴더 제외)만
    // 두고, 나머지 이미지는 sw.ts의 runtimeCaching(static-image-assets)이 처음 볼 때 캐시한다.
    globPatterns: [
      ".next/static/**/*.{js,css,ico,png,svg,webp,json}",
      "public/{backgrounds,cursors,icons}/**/*",
      "public/assets/logo/**/*",
      "public/assets/guide/shamoji/*.webp",
      // 모든 페이지가 미리 받는 글꼴(LINE Seed KR 기본 조각·곡 제목용 851MkPOP) —
      // 첫 화면에서 이미 받은 파일이라 더 받는 양은 거의 없고, 오프라인에서도 제 글꼴로 보인다.
      ".next/static/media/{LINESeedKR_*_core,851MkPOP_101}*.woff2",
    ],
  });
