import { CALL_TAGS, type CallTag } from "@/lib/guide/types";

export type TextPart =
  { type: "text"; value: string } | { type: "icon"; value: CallTag };

const TOKEN_PATTERN = new RegExp(`\\[(${CALL_TAGS.join("|")})\\]`, "g");

// 가사 문자열을 인라인 "[swing]" / "[clap]" / "[call]" 토큰 기준으로 나눠서, 해당 위치에 아이콘을 렌더링할 수 있게 합니다.
export function parseIconTokens(text: string): TextPart[] {
  const parts: TextPart[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(TOKEN_PATTERN)) {
    const index = match.index ?? 0;

    if (index > lastIndex) {
      parts.push({ type: "text", value: text.slice(lastIndex, index) });
    }

    parts.push({ type: "icon", value: match[1] as CallTag });
    lastIndex = index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: "text", value: text.slice(lastIndex) });
  }

  return parts;
}

export function hasIconToken(text: string, name: CallTag): boolean {
  return text.includes(`[${name}]`);
}

export type EmphasisPart =
  { type: "text"; value: string } | { type: "emphasis"; value: string };

const EMPHASIS_PATTERN = /\*\*(.+?)\*\*/g;

// 가사 문자열을 인라인 "**텍스트**" 마커 기준으로 나눠서, 감싼 부분을 강조
export function parseEmphasis(text: string): EmphasisPart[] {
  const parts: EmphasisPart[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(EMPHASIS_PATTERN)) {
    const index = match.index ?? 0;

    if (index > lastIndex) {
      parts.push({ type: "text", value: text.slice(lastIndex, index) });
    }

    parts.push({ type: "emphasis", value: match[1] });
    lastIndex = index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: "text", value: text.slice(lastIndex) });
  }

  return parts;
}
