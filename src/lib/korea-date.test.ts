import { describe, expect, test } from "vitest";
import { koreaDate } from "@/lib/korea-date";

describe("koreaDate", () => {
  test("UTC 15시 이후는 한국 날짜로 다음 날", () => {
    expect(koreaDate(new Date("2026-11-05T14:59:00Z"))).toBe("2026-11-05");
    expect(koreaDate(new Date("2026-11-05T15:00:00Z"))).toBe("2026-11-06");
  });
});
