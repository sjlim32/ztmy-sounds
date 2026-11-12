import { describe, expect, test } from "vitest";
import {
  displayVenue,
  extractKoreanCity,
  isOnlineText,
  ONLINE_LABEL,
  splitRegion,
} from "./region";

describe("온라인 공연 표기", () => {
  test("region·venue가 online이면 온라인 라이브", () => {
    expect(isOnlineText(" Online ")).toBe(true);
    expect(splitRegion("online")).toEqual({
      city: ONLINE_LABEL,
      original: null,
    });
    expect(extractKoreanCity("online")).toBe("온라인 라이브");
    expect(displayVenue("online")).toBe("온라인 라이브");
  });

  test("그 밖엔 그대로", () => {
    expect(splitRegion("大阪 (오사카)")).toEqual({
      city: "오사카",
      original: "大阪",
    });
    expect(displayVenue("Zepp DiverCity")).toBe("Zepp DiverCity");
    expect(isOnlineText(null)).toBe(false);
  });
});
