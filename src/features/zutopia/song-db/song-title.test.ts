import { expect, test } from "vitest";
import { secondaryTitle } from "@/features/zutopia/song-db/song-title";

test("한국어 · 영어", () => {
  expect(
    secondaryTitle({
      title: "秒針を噛む",
      titleKo: "초침을 깨물다",
      titleEn: "Byoushinwo Kamu",
    }),
  ).toBe("초침을 깨물다 · Byoushinwo Kamu");
});

test("원어나 한국어와 같은 영어는 생략", () => {
  expect(secondaryTitle({ title: "Ham", titleKo: "햄", titleEn: "Ham" })).toBe(
    "햄",
  );
  expect(
    secondaryTitle({ title: "MILABO", titleKo: "MILABO", titleEn: "MILABO" }),
  ).toBe("MILABO");
});

test("영어가 비어 있으면 한국어만", () => {
  expect(secondaryTitle({ title: "a", titleKo: "가", titleEn: " " })).toBe(
    "가",
  );
});
