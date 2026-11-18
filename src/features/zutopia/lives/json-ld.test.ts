import { describe, expect, test } from "vitest";
import { buildPastLiveJsonLd } from "@/features/zutopia/lives/json-ld";
import { MUSIC_GROUP_ID } from "@/lib/structured-data";

const base = {
  title: "LEGACY ZOMBIE LABO",
  start_date: "2026-10-10T00:00:00+00:00",
  end_date: "2026-10-11T00:00:00+00:00",
  live_date: null,
  live_venue: "平城宮跡 (헤이조 궁터)",
  region: "奈良 (나라)",
  country: "일본",
  image: "https://assets.example/kv.jpg",
};
const URL = "https://ztmy-sounds.fans/zutopia/lives/x";

describe("buildPastLiveJsonLd", () => {
  test("단독 공연: 기간·원어 장소·ISO 나라·performer @id", () => {
    expect(buildPastLiveJsonLd(base, URL)).toMatchObject({
      "@type": "MusicEvent",
      startDate: "2026-10-10",
      endDate: "2026-10-11",
      location: {
        name: "平城宮跡",
        alternateName: "헤이조 궁터",
        address: { addressLocality: "奈良", addressCountry: "JP" },
      },
      performer: { "@type": "MusicGroup", "@id": MUSIC_GROUP_ID },
    });
  });

  test("페스티벌은 즛토마요가 선 날(live_date) 하루", () => {
    const ld = buildPastLiveJsonLd(
      { ...base, live_date: "2026-09-13T00:00:00+00:00" },
      URL,
    );
    expect(ld?.startDate).toBe("2026-09-13");
    expect(ld).not.toHaveProperty("endDate");
  });

  test("하루 공연은 endDate 생략, 표에 없는 나라는 addressCountry 생략", () => {
    const ld = buildPastLiveJsonLd(
      { ...base, end_date: base.start_date, country: "어딘가" },
      URL,
    );
    expect(ld).not.toHaveProperty("endDate");
    expect(ld?.location.address).not.toHaveProperty("addressCountry");
  });

  test("온라인 공연은 null", () => {
    expect(buildPastLiveJsonLd({ ...base, live_venue: "online" }, URL)).toBe(
      null,
    );
    expect(buildPastLiveJsonLd({ ...base, region: "Online" }, URL)).toBe(null);
  });
});
