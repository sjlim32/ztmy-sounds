import type { CallTag, LyricLine } from "@/features/guide/lib/types";

/**
 * 이 가이드 모드(visibleTags)에서 가사 줄에 보여줄 응원 태그와 설명 텍스트.
 * cheer(swing/clap/call)와 slam은 서로 독립적인 필드라 한 줄에 둘 다 있을 수
 * 있어서, 모드가 보여줄 차례인 쪽만 고른다(두 모드의 visibleTags는 겹치지 않음).
 */
export function getVisibleLineTag(
  line: LyricLine,
  visibleTags: readonly CallTag[],
): { tag: CallTag | undefined; text: string | undefined } {
  const rawCheerTag =
    typeof line.cheer === "string" ? undefined : line.cheer?.tag;

  if (rawCheerTag && visibleTags.includes(rawCheerTag)) {
    return {
      tag: rawCheerTag,
      text: typeof line.cheer === "string" ? line.cheer : line.cheer?.text,
    };
  }
  if (line.slam !== undefined && visibleTags.includes("slam")) {
    return { tag: "slam", text: line.slam };
  }
  // 태그 없는 문자열 cheer는 태그 없이 설명만 보여준다
  return {
    tag: undefined,
    text: typeof line.cheer === "string" ? line.cheer : undefined,
  };
}

/**
 * 같은 응원 태그가 연달아 이어지는 구간 안에서 이 줄의 위치. 왼쪽 아이콘 칸에서
 * 구간 첫 줄에만 아이콘을 두고, 나머지는 세로선으로 이어 그리는 데 쓴다.
 * 간주(interlude) 줄은 가운데 정렬이라 구간을 끊는다.
 */
export type TagRunPosition = "single" | "start" | "middle" | "end";

export function getTagRunPositions(
  lyrics: readonly LyricLine[],
  visibleTags: readonly CallTag[],
): (TagRunPosition | undefined)[] {
  const tags = lyrics.map((line) =>
    line.interlude ? undefined : getVisibleLineTag(line, visibleTags).tag,
  );

  return tags.map((tag, i) => {
    if (!tag) return undefined;
    const joinsPrev = tags[i - 1] === tag;
    const joinsNext = tags[i + 1] === tag;
    if (joinsPrev && joinsNext) return "middle";
    if (joinsPrev) return "end";
    if (joinsNext) return "start";
    return "single";
  });
}
