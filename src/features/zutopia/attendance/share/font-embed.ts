/**
 * 이미지 만들기용 글꼴 CSS — html-to-image는 기본으로 쓰는 글꼴 이름의
 * @font-face를 unicode-range와 상관없이 전부(LINE Seed JP만 서브셋 250여 개,
 * woff·woff2 둘 다) 받아 SVG에 넣는다(약 10MB). 이미지에 실제로 들어간 글자가
 * 속한 서브셋의 woff2만 골라 직접 만들어 넘긴다(fontEmbedCSS).
 */

/** "U+0-FF, U+131, U+4E??" → [[0,255],[305,305],[0x4E00,0x4EFF]] */
export function parseUnicodeRange(range: string): [number, number][] {
  return range
    .split(",")
    .map((part) => part.trim().replace(/^U\+/i, ""))
    .filter(Boolean)
    .map((part): [number, number] => {
      if (part.includes("?"))
        return [
          parseInt(part.replaceAll("?", "0"), 16),
          parseInt(part.replaceAll("?", "F"), 16),
        ];
      const [from, to] = part.split("-");
      return [parseInt(from, 16), parseInt(to ?? from, 16)];
    });
}

/** 글자 하나라도 범위 안에 있으면 true. 범위가 없으면(전체) 언제나 true. */
export function rangeCovers(
  ranges: [number, number][],
  codes: ReadonlySet<number>,
): boolean {
  if (ranges.length === 0) return true;
  for (const code of codes)
    if (ranges.some(([from, to]) => code >= from && code <= to)) return true;
  return false;
}

/** @font-face src 값에서 woff2 주소만 꺼낸다. 없으면 null. */
export function pickWoff2Url(src: string): string | null {
  for (const part of src.split(/,(?![^(]*\))/)) {
    const match = /url\(\s*(['"]?)(.+?)\1\s*\)\s*format\(\s*['"]?woff2/i.exec(
      part,
    );
    if (match) return match[2];
  }
  return null;
}

function toDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function familyNames(node: HTMLElement): Set<string> {
  const names = new Set<string>();
  for (const el of [node, ...node.querySelectorAll<HTMLElement>("*")])
    for (const name of getComputedStyle(el).fontFamily.split(","))
      names.add(name.trim().replace(/^['"]|['"]$/g, ""));
  return names;
}

/**
 * node 안 글자에 필요한 @font-face만 woff2 data URL로 담은 CSS. 페이지가 이미
 * 받아 둔 글꼴 파일이면 브라우저 캐시에서 온다.
 */
export async function buildFontEmbedCss(node: HTMLElement): Promise<string> {
  const codes = new Set(
    [...(node.textContent ?? "")].map((char) => char.codePointAt(0)!),
  );
  const families = familyNames(node);
  const rules: Promise<string | null>[] = [];
  for (const sheet of document.styleSheets) {
    let cssRules: CSSRuleList;
    try {
      cssRules = sheet.cssRules;
    } catch {
      continue; // 다른 출처 스타일시트는 읽을 수 없다.
    }
    for (const rule of cssRules) {
      if (!(rule instanceof CSSFontFaceRule)) continue;
      const style = rule.style;
      const family = style
        .getPropertyValue("font-family")
        .trim()
        .replace(/^['"]|['"]$/g, "");
      if (!families.has(family)) continue;
      const range = style.getPropertyValue("unicode-range");
      if (range && !rangeCovers(parseUnicodeRange(range), codes)) continue;
      const url = pickWoff2Url(style.getPropertyValue("src"));
      if (!url) continue;
      const absolute = new URL(url, sheet.href ?? location.href).href;
      rules.push(
        fetch(absolute)
          .then((response) => response.blob())
          .then(toDataUrl)
          .then(
            (data) =>
              `@font-face{font-family:"${family}";font-style:${style.getPropertyValue("font-style") || "normal"};font-weight:${style.getPropertyValue("font-weight") || "400"};${range ? `unicode-range:${range};` : ""}src:url(${data}) format("woff2");}`,
          )
          .catch(() => null),
      );
    }
  }
  return (await Promise.all(rules)).filter(Boolean).join("\n");
}
