import type { CallIconName } from "@/lib/guide/types";

export type TextPart =
  | { type: "text"; value: string }
  | { type: "icon"; value: CallIconName };

const ICON_NAMES: CallIconName[] = ["wave", "clap", "mic"];
const TOKEN_PATTERN = new RegExp(`\\[(${ICON_NAMES.join("|")})\\]`, "g");

/**
 * Splits a lyric string on inline "[wave]" / "[clap]" / "[mic]" tokens so
 * they can be rendered as icons in place, e.g.
 * "[wave] hey hey" -> [{type:"icon",value:"wave"}, {type:"text",value:" hey hey"}]
 */
export function parseIconTokens(text: string): TextPart[] {
  const parts: TextPart[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(TOKEN_PATTERN)) {
    const index = match.index ?? 0;

    if (index > lastIndex) {
      parts.push({ type: "text", value: text.slice(lastIndex, index) });
    }

    parts.push({ type: "icon", value: match[1] as CallIconName });
    lastIndex = index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: "text", value: text.slice(lastIndex) });
  }

  return parts;
}

export function hasIconToken(text: string, name: CallIconName): boolean {
  return text.includes(`[${name}]`);
}
