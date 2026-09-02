import { CALL_TAGS, type CallTag } from "@/features/guide/lib/types";

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
  | { type: "text"; value: string }
  | { type: "emphasis"; value: string; cheer: boolean; slam: boolean };

/**
 * "**텍스트**"(응원)와 "^텍스트^"(슬램)는 서로 다른 글자를 쓰는 독립된
 * on/off 토글이라, 순서대로 등장한 마커 쌍이 서로 교차해도(예:
 * "**Don't ^stop** 노우리^ 우에니") 정확히 처리됩니다 — "stop" 구간은
 * 응원 마커가 열린 채로 슬램 마커도 열려서 둘 다 켜진 상태가 됩니다.
 * ("**" 안에서 * 하나만 짝 없이 나오는 경우처럼) 단독 별표는 토글하지 않고
 * 그냥 텍스트로 남겨둡니다 — 기존 "**텍스트**" 데이터와 호환하기 위함.
 */
export function parseEmphasis(text: string): EmphasisPart[] {
  const parts: EmphasisPart[] = [];
  let cheerOpen = false;
  let slamOpen = false;
  let buffer = "";

  const flush = () => {
    if (!buffer) return;
    parts.push(
      cheerOpen || slamOpen
        ? { type: "emphasis", value: buffer, cheer: cheerOpen, slam: slamOpen }
        : { type: "text", value: buffer },
    );
    buffer = "";
  };

  let i = 0;
  while (i < text.length) {
    if (text[i] === "*" && text[i + 1] === "*") {
      flush();
      cheerOpen = !cheerOpen;
      i += 2;
    } else if (text[i] === "^") {
      flush();
      slamOpen = !slamOpen;
      i += 1;
    } else {
      buffer += text[i];
      i += 1;
    }
  }
  flush();

  return parts;
}
