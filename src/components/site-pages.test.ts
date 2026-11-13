import { describe, expect, test } from "vitest";
import { getParentPage } from "@/components/site-pages";

describe("getParentPage", () => {
  test("주소의 마지막 칸을 뗀 한 단계 위 페이지", () => {
    expect(getParentPage("/guide/byoushin")).toEqual({
      href: "/guide",
      label: "응원 가이드 곡 목록으로 돌아가기",
    });
    expect(getParentPage("/zutopia/stats")?.href).toBe("/zutopia");
    expect(getParentPage("/zutopia/lives/zomcra")?.href).toBe("/zutopia/lives");
  });

  test("최상위 페이지는 null", () => {
    expect(getParentPage("/guide")).toBeNull();
    expect(getParentPage("/")).toBeNull();
  });

  test("이름이 없는 곳은 일반 문구", () => {
    expect(getParentPage("/zutopia/albums/x")?.label).toBe(
      "이전 단계로 돌아가기",
    );
  });
});
