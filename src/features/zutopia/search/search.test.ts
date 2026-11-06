import { describe, expect, test } from "vitest";
import { searchZutopia } from "@/features/zutopia/search/search";
import type {
  SearchAlbum,
  SearchLive,
  SearchSong,
  ZutopiaSearchIndex,
} from "@/features/zutopia/search/types";

const song = (
  id: string,
  title: string,
  aliases: string[] = [],
): SearchSong => ({
  id,
  slug: id,
  title,
  titleKo: `${title}-ko`,
  titleEn: `${title}-en`,
  cover: null,
  releaseYear: "2020",
  aliases,
});
const album = (id: string, aliases: string[] = []): SearchAlbum => ({
  id,
  slug: id,
  title: id,
  titleKo: id,
  titleEn: id,
  cover: null,
  releaseYear: "2020",
  songIds: [],
  aliases,
});
const live = (slug: string, aliases: string[] = []): SearchLive => ({
  slug,
  label: slug,
  name: slug,
  titleEn: null,
  date: "",
  year: "2020",
  thumbnail: "",
  songIds: [],
  aliases,
});

const index: ZutopiaSearchIndex = {
  songs: [song("s1", "秒針を噛む", ["니와 투 니라"]), song("s2", "TAIDADA")],
  albums: [album("a1", ["잠잠화"])],
  lives: [live("l1", ["좀크라"])],
};

describe("별명 검색", () => {
  test("별명의 어느 부분만 쳐도 찾는다", () => {
    for (const query of ["니와", "투", "니라", "니와 투 니라", "와투니"])
      expect(
        searchZutopia(index, query).songs.map((hit) => hit.item.id),
      ).toEqual(["s1"]);
  });

  test("앨범·공연(투어)도 별명으로", () => {
    expect(searchZutopia(index, "잠잠").albums[0].item.id).toBe("a1");
    expect(searchZutopia(index, "좀크").lives[0].item.slug).toBe("l1");
  });

  test("띄어 친 단어는 각각 들어 있으면 찾는다(순서 무관), 하나라도 없으면 안 찾는다", () => {
    expect(searchZutopia(index, "니라 니와").songs).toHaveLength(1);
    expect(searchZutopia(index, "니와 타이다다").songs).toHaveLength(0);
  });

  test("별명과 제목을 섞어 쳐도", () => {
    expect(searchZutopia(index, "니와 秒針").songs).toHaveLength(1);
  });
});
