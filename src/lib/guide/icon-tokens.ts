import { CALL_TAGS, type CallTag } from "@/lib/guide/types";

export type TextPart =
  { type: "text"; value: string } | { type: "icon"; value: CallTag };

const TOKEN_PATTERN = new RegExp(`\\[(${CALL_TAGS.join("|")})\\]`, "g");

/**
 * Splits a lyric string on inline "[swing]" / "[clap]" / "[call]" tokens so
 * they can be rendered as icons in place, e.g.
 * "[swing] hey hey" -> [{type:"icon",value:"swing"}, {type:"text",value:" hey hey"}]
 */
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
