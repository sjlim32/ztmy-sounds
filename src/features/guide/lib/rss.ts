/** RSS 2.0 문서를 만드는 순수 함수 — 데이터 조회(git 날짜 등)는 호출하는 쪽이 한다. */

export interface RssItem {
  title: string;
  link: string;
  description: string;
  pubDate: Date;
}

export interface RssChannel {
  title: string;
  link: string;
  /** 피드 자기 주소 — atom:link rel="self"로 넣는다(피드 검사기가 요구). */
  feedUrl: string;
  description: string;
  language: string;
  items: RssItem[];
}

export function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** 항목은 최신순으로 정렬하고, lastBuildDate는 가장 최근 항목 날짜로 둔다
 * (빌드 시각을 쓰면 내용이 같아도 매 배포마다 피드가 바뀐 것처럼 보인다). */
export function buildRssXml(channel: RssChannel): string {
  const items = [...channel.items].sort(
    (a, b) => b.pubDate.getTime() - a.pubDate.getTime(),
  );
  const lastBuildDate = items[0]?.pubDate;

  const itemXml = items
    .map(
      (item) => `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.link)}</link>
      <guid isPermaLink="true">${escapeXml(item.link)}</guid>
      <description>${escapeXml(item.description)}</description>
      <pubDate>${item.pubDate.toUTCString()}</pubDate>
    </item>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(channel.title)}</title>
    <link>${escapeXml(channel.link)}</link>
    <atom:link href="${escapeXml(channel.feedUrl)}" rel="self" type="application/rss+xml" />
    <description>${escapeXml(channel.description)}</description>
    <language>${escapeXml(channel.language)}</language>${
      lastBuildDate
        ? `\n    <lastBuildDate>${lastBuildDate.toUTCString()}</lastBuildDate>`
        : ""
    }
${itemXml}
  </channel>
</rss>
`;
}
