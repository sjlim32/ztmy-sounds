"use client";

import { useEffect } from "react";

/**
 * 첫 화면을 그린 뒤에 불러오는 @font-face들 — 루트 레이아웃에서 import하면 모든
 * 페이지가 이 CSS를 다 받을 때까지 화면을 못 그린다.
 *
 * - LINE Seed JP(일본어 한자용, fontsource): 일본어 조각 @font-face 248개(압축해도
 *   약 70KB). 가나는 LINE Seed KR에 있어서 바로 보이고, 한자만 잠깐 시스템 글꼴로
 *   보였다가 바뀐다(어차피 display: swap이라 글꼴 파일을 받는 동안은 같다).
 * - LINE Seed KR 나머지 조각: 사이트에 없는 KS X 1001 음절·기호(검색어 입력 등).
 *   scripts/subset-fonts.mjs가 정확한 unicode-range로 만든 CSS라, 기본 조각 글자만
 *   있는 페이지에선 글꼴 파일을 받지 않는다.
 */
export function DeferredFonts() {
  useEffect(() => {
    void import("@fontsource/line-seed-jp/400.css");
    void import("@fontsource/line-seed-jp/700.css");
    void import("@/fonts/subset/line-seed-kr-rest.css");
  }, []);
  return null;
}
