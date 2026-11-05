import { afterEach, expect, test, vi } from "vitest";
import { toAssetUrl, withAssetUrls } from "@/lib/asset-url";

afterEach(() => {
  vi.unstubAllEnvs();
});

test("프로덕션에선 R2 주소를 같은 출처 /r2/ 경로로 바꾼다", () => {
  vi.stubEnv("NODE_ENV", "production");
  expect(
    toAssetUrl("https://assets.ztmy-sounds.fans/single/byoushin.webp"),
  ).toBe("/r2/single/byoushin.webp");
});

test("개발 환경에선 원래 주소를 그대로 쓴다", () => {
  vi.stubEnv("NODE_ENV", "development");
  expect(
    toAssetUrl("https://assets.ztmy-sounds.fans/single/byoushin.webp"),
  ).toBe("https://assets.ztmy-sounds.fans/single/byoushin.webp");
});

test("다른 주소와 null은 그대로", () => {
  vi.stubEnv("NODE_ENV", "production");
  expect(toAssetUrl("https://example.com/a.webp")).toBe(
    "https://example.com/a.webp",
  );
  expect(toAssetUrl("/assets/logo/ztmy-sounds-logo.webp")).toBe(
    "/assets/logo/ztmy-sounds-logo.webp",
  );
  expect(toAssetUrl(null)).toBeNull();
});

test("withAssetUrls는 이미지 컬럼만 바꾸고 나머지는 그대로 둔다", () => {
  vi.stubEnv("NODE_ENV", "production");
  const row = {
    id: "x",
    title: "https://assets.ztmy-sounds.fans/not-an-image-column",
    cover_image_url: "https://assets.ztmy-sounds.fans/a.webp",
    poster_image_url: null,
    icon_image_url: "https://assets.ztmy-sounds.fans/i.webp",
    additional_image_urls: ["https://assets.ztmy-sounds.fans/b.webp"],
    book_image_urls: ["https://assets.ztmy-sounds.fans/c.webp"],
  };
  expect(withAssetUrls(row)).toEqual({
    ...row,
    cover_image_url: "/r2/a.webp",
    icon_image_url: "/r2/i.webp",
    additional_image_urls: ["/r2/b.webp"],
    book_image_urls: ["/r2/c.webp"],
  });
});

test("withAssetUrls는 additional_image_urls가 null이어도 된다", () => {
  vi.stubEnv("NODE_ENV", "production");
  expect(withAssetUrls({ additional_image_urls: null })).toEqual({
    additional_image_urls: null,
  });
});
