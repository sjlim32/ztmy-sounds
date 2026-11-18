import { describe, expect, test } from "vitest";
import { buildRssXml, escapeXml } from "@/features/guide/lib/rss";

const base = {
  title: "피드",
  link: "https://example.com/guide",
  feedUrl: "https://example.com/feed.xml",
  description: "설명",
  language: "ko",
};

describe("rss", () => {
  test("escapeXml은 XML 특수문자를 바꾼다", () => {
    expect(escapeXml(`a & <b> "c" 'd'`)).toBe(
      "a &amp; &lt;b&gt; &quot;c&quot; &apos;d&apos;",
    );
  });

  test("항목은 최신순, lastBuildDate는 가장 최근 항목 날짜", () => {
    const xml = buildRssXml({
      ...base,
      items: [
        {
          title: "옛 곡",
          link: "https://example.com/guide/old",
          description: "old",
          pubDate: new Date("2026-08-20T00:00:00Z"),
        },
        {
          title: "새 곡 & <특수>",
          link: "https://example.com/guide/new",
          description: "new",
          pubDate: new Date("2026-09-02T00:00:00Z"),
        },
      ],
    });

    expect(xml.indexOf("새 곡")).toBeLessThan(xml.indexOf("옛 곡"));
    expect(xml).toContain("<title>새 곡 &amp; &lt;특수&gt;</title>");
    expect(xml).toContain(
      "<lastBuildDate>Wed, 02 Sep 2026 00:00:00 GMT</lastBuildDate>",
    );
    expect(xml).toContain(
      '<guid isPermaLink="true">https://example.com/guide/new</guid>',
    );
    expect(xml).toContain(
      '<atom:link href="https://example.com/feed.xml" rel="self" type="application/rss+xml" />',
    );
  });

  test("항목이 없으면 lastBuildDate를 넣지 않는다", () => {
    expect(buildRssXml({ ...base, items: [] })).not.toContain("lastBuildDate");
  });
});
