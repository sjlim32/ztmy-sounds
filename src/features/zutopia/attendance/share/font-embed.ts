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

/** @font-face 하나 — 고르기에 필요한 값만. cssText는 원래 규칙(내보낼 때 src만 바꾼다). */
export interface FontFace {
  family: string;
  /** font-weight 범위(단일 값이면 같은 두 수) */
  weight: [number, number];
  url: string;
  /** unicode-range(없으면 빈 배열 = 전체) */
  range: [number, number][];
  cssText?: string;
}

/**
 * 이미지에 필요한 면만 고른다 — 쓰인 글꼴·굵기마다, 이미지 글자가 든 서브셋에서
 * 그 굵기에 가장 가까운 면 하나. 같은 파일(같은 서브셋)을 여러 굵기가 쓰면 하나로
 * 합치고 굵기를 범위로 넓힌다(파일을 두 번 넣지 않게).
 */
export function selectFontFaces(
  faces: FontFace[],
  used: ReadonlyMap<string, ReadonlySet<number>>,
  codes: ReadonlySet<number>,
): FontFace[] {
  const distance = (face: FontFace, weight: number) =>
    weight < face.weight[0]
      ? face.weight[0] - weight
      : weight > face.weight[1]
        ? weight - face.weight[1]
        : 0;
  const picked = new Map<string, { face: FontFace; weights: number[] }>();
  for (const [family, weights] of used) {
    const candidates = faces.filter(
      (face) => face.family === family && rangeCovers(face.range, codes),
    );
    // 서브셋(unicode-range)마다 따로 고른다.
    const groups = new Map<string, FontFace[]>();
    for (const face of candidates) {
      const key = JSON.stringify(face.range);
      groups.set(key, [...(groups.get(key) ?? []), face]);
    }
    for (const [rangeKey, group] of groups)
      for (const weight of weights) {
        const best = group.reduce((a, b) =>
          distance(b, weight) < distance(a, weight) ? b : a,
        );
        const key = `${best.url}|${rangeKey}`;
        const entry = picked.get(key);
        if (entry) entry.weights.push(weight);
        else picked.set(key, { face: best, weights: [weight] });
      }
  }
  const order = new Map(faces.map((face, index) => [face, index]));
  return [...picked.values()]
    .sort((a, b) => order.get(a.face)! - order.get(b.face)!)
    .map(({ face, weights }) => ({
      ...face,
      weight: [Math.min(...weights), Math.max(...weights)],
    }));
}

function toDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function stripQuotes(name: string) {
  return name.trim().replace(/^['"]|['"]$/g, "");
}

/** node 안에서 쓰인 (글꼴 이름 → 굵기들). 글꼴 목록의 모든 이름을 넣는다(대체 글꼴 포함). */
function usedFonts(node: HTMLElement): Map<string, Set<number>> {
  const used = new Map<string, Set<number>>();
  for (const el of [node, ...node.querySelectorAll<HTMLElement>("*")]) {
    const style = getComputedStyle(el);
    const weight = Number(style.fontWeight) || 400;
    for (const name of style.fontFamily.split(",")) {
      const family = stripQuotes(name);
      used.set(family, (used.get(family) ?? new Set()).add(weight));
    }
  }
  return used;
}

function parseWeight(value: string): [number, number] {
  const parts = value.trim().split(/\s+/).map(Number);
  const [min, max] = [parts[0] || 400, parts[1] || parts[0] || 400];
  return [min, max];
}

/**
 * node 안 글자·굵기에 필요한 @font-face만 woff2 data URL로 담은 CSS. 원래 규칙의
 * 다른 속성(ascent-override 같은 세로 보정)은 그대로 두고 src·굵기만 바꾼다.
 * 페이지가 이미 받아 둔 글꼴 파일이면 브라우저 캐시에서 온다.
 */
export async function buildFontEmbedCss(node: HTMLElement): Promise<string> {
  const codes = new Set(
    [...(node.textContent ?? "")].map((char) => char.codePointAt(0)!),
  );
  const faces: FontFace[] = [];
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
      const url = pickWoff2Url(style.getPropertyValue("src"));
      if (!url) continue;
      const range = style.getPropertyValue("unicode-range");
      faces.push({
        family: stripQuotes(style.getPropertyValue("font-family")),
        weight: parseWeight(style.getPropertyValue("font-weight") || "400"),
        url: new URL(url, sheet.href ?? location.href).href,
        range: range ? parseUnicodeRange(range) : [],
        cssText: rule.cssText,
      });
    }
  }
  const picked = selectFontFaces(faces, usedFonts(node), codes);
  const data = new Map<string, Promise<string | null>>();
  const rules = picked.map(async (face) => {
    if (!data.has(face.url))
      data.set(
        face.url,
        fetch(face.url)
          .then((response) => response.blob())
          .then(toDataUrl)
          .catch(() => null),
      );
    const url = await data.get(face.url)!;
    if (!url || !face.cssText) return null;
    const weight =
      face.weight[0] === face.weight[1]
        ? `${face.weight[0]}`
        : `${face.weight[0]} ${face.weight[1]}`;
    return face.cssText
      .replace(/src:[^;]+;?/, `src: url("${url}") format("woff2");`)
      .replace(/font-weight:[^;]+;?/, `font-weight: ${weight};`);
  });
  return (await Promise.all(rules)).filter(Boolean).join("\n");
}
