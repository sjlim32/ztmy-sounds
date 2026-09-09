import type { Album } from "./types";

export const ALBUM_TYPE_ORDER = [
  "FULL",
  "MINI",
  "EP",
] as const satisfies readonly Album["album_type"][];

export const ALBUM_TYPE_SHORT_LABEL: Record<Album["album_type"], string> = {
  FULL: "정규",
  MINI: "미니",
  EP: "EP",
};

export const ALBUM_TYPE_SECTION_LABEL: Record<Album["album_type"], string> = {
  FULL: "정규 앨범",
  MINI: "미니 앨범",
  EP: "EP",
};
