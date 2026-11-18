import { describe, expect, test } from "vitest";
import { buildGuideFeedXml } from "@/features/guide/lib/feed";
import type { Song } from "@/features/guide/lib/types";

function song(id: string, summary?: string): Song {
  return {
    id,
    title: { jp: `${id}-jp`, kr: `${id}-kr`, en: `${id}-en` },
    youtubeId: "x",
    ...(summary !== undefined && { description: { summary } }),
    lyrics: [],
  };
}

describe("buildGuideFeedXml", () => {
  const fallback = new Date("2026-11-18T00:00:00Z");
  const xml = buildGuideFeedXml(
    [song("old", "T I P"), song("new"), song("uncommitted")],
    new Map([
      ["old", new Date("2026-08-20T00:00:00Z")],
      ["new", new Date("2026-09-02T00:00:00Z")],
    ]),
    fallback,
  );

  test("설명은 곡 페이지와 같은 문구(summary 라벨을 쓰지 않음)", () => {
    expect(xml).toContain(
      "<description>old-kr (old-en) 샤모지 응원 가이드</description>",
    );
    expect(xml).not.toContain("T I P");
  });

  test("날짜가 없는 곡은 fallbackDate, 최신순", () => {
    expect(xml).toContain(`<pubDate>${fallback.toUTCString()}</pubDate>`);
    const order = ["uncommitted", "new", "old"].map((id) =>
      xml.indexOf(`/guide/${id}</link>`),
    );
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });
});
