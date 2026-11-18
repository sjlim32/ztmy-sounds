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
    // 마지막 괄호 안에 괄호가 한 겹 더 있는 장소명
    expect(
      splitRegion(
        "幕張メッセ国際展示場 (1~11ホール) (마쿠하리 멧세 국제전시장(1~11홀))",
      ),
    ).toEqual({
      city: "마쿠하리 멧세 국제전시장(1~11홀)",
      original: "幕張メッセ国際展示場 (1~11ホール)",
    });
    expect(isOnlineText(null)).toBe(false);
  });
});
