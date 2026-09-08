import type { Album } from "./types";

export const ALBUM_TYPE_ORDER = [
  "full",
  "mini",
  "ep",
] as const satisfies readonly NonNullable<Album["album_type"]>[];

export const ALBUM_TYPE_SHORT_LABEL: Record<
  NonNullable<Album["album_type"]>,
  string
> = {
  full: "정규",
  mini: "미니",
  ep: "EP",
};

export const ALBUM_TYPE_SECTION_LABEL: Record<
  NonNullable<Album["album_type"]>,
  string
> = {
  full: "정규 앨범",
  mini: "미니 앨범",
  ep: "EP",
};
