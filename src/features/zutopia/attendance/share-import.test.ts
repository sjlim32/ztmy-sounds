import { describe, expect, test } from "vitest";
import { importableIds } from "@/features/zutopia/attendance/share-import";

describe("importableIds", () => {
  const units = [{ id: "a:2026-01-01" }, { id: "b:2026-02-01" }];

  test("지금 데이터에 있는 공연일만 남긴다", () => {
    expect(importableIds(["a:2026-01-01", "x:2020-01-01"], units)).toEqual([
      "a:2026-01-01",
    ]);
  });

  test("하나도 안 맞으면 빈 목록 — 화면은 '바꾸기'를 내놓지 않는다", () => {
    expect(importableIds([], units)).toEqual([]);
    expect(importableIds(["x:2020-01-01"], units)).toEqual([]);
  });
});
