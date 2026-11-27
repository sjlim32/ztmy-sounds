import { describe, expect, test } from "vitest";
import {
  secondaryTitle,
  setlistTitles,
} from "@/features/zutopia/song-db/song-title";

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

describe("setlistTitles", () => {
  test("한국어 제목이 첫 줄, 원제 · 영어가 둘째 줄", () => {
    expect(
      setlistTitles({ title: "残機", titleKo: "잔기", titleEn: "Time Left" }),
    ).toEqual({ primary: "잔기", secondary: "残機 · Time Left" });
  });

  test("영어가 비었거나 겹치면 빼고, 한국어가 원제와 같으면 원제 한 번만", () => {
    expect(
      setlistTitles({ title: "サターン", titleKo: "새턴", titleEn: "" }),
    ).toEqual({ primary: "새턴", secondary: "サターン" });
    expect(
      setlistTitles({ title: "Ham", titleKo: "Ham", titleEn: "Ham" }),
    ).toEqual({ primary: "Ham", secondary: null });
    expect(
      setlistTitles({ title: "JK BOMBER", titleKo: "", titleEn: "JK BOMBER" }),
    ).toEqual({ primary: "JK BOMBER", secondary: null });
  });
});
