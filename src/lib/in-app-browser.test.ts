import { describe, expect, test } from "vitest";
import { detectInAppBrowser, openExternalUrl } from "@/lib/in-app-browser";

describe("detectInAppBrowser", () => {
  test("카카오톡·인스타그램·페이스북·라인", () => {
    expect(
      detectInAppBrowser("Mozilla/5.0 (iPhone) AppleWebKit KAKAOTALK 10.4.5"),
    ).toBe("카카오톡");
    expect(detectInAppBrowser("... Instagram 300.0.0 ...")).toBe("인스타그램");
    expect(detectInAppBrowser("... [FBAN/FBIOS;FBAV/450.0]")).toBe("페이스북");
    expect(detectInAppBrowser("... Line/13.1.0")).toBe("라인");
  });

  test("일반 브라우저는 null", () => {
    expect(
      detectInAppBrowser(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Version/18.0 Mobile/15E148 Safari/604.1",
      ),
    ).toBeNull();
  });
});

describe("openExternalUrl", () => {
  test("카카오톡은 외부 브라우저로 여는 주소, 그 밖엔 null", () => {
    expect(openExternalUrl("카카오톡", "https://a.b/c#code=ZT1x")).toBe(
      "kakaotalk://web/openExternal?url=https%3A%2F%2Fa.b%2Fc%23code%3DZT1x",
    );
    expect(openExternalUrl("인스타그램", "https://a.b")).toBeNull();
  });
});
