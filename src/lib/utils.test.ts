import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("cn — 사이트 반지름 토큰(rounded-card/control/tag)", () => {
  it("뒤에 온 반지름이 앞의 토큰 반지름을 덮는다", () => {
    expect(cn("rounded-card", "rounded-none")).toBe("rounded-none");
    expect(cn("rounded-lg", "rounded-control")).toBe("rounded-control");
    expect(cn("rounded-control", "rounded-tag")).toBe("rounded-tag");
  });

  it("한쪽 모서리 토큰도 같은 쪽 반지름끼리 덮는다", () => {
    expect(cn("rounded-t-xl", "rounded-t-card")).toBe("rounded-t-card");
  });
});

describe("cn — 사이트 그림자 토큰(shadow-card/float/thumb, drop-shadow-legible)", () => {
  it("뒤에 온 그림자가 앞의 토큰 그림자를 덮는다", () => {
    expect(cn("shadow-card", "shadow-none")).toBe("shadow-none");
    expect(cn("shadow-thumb", "shadow-float")).toBe("shadow-float");
    expect(cn("drop-shadow-legible", "drop-shadow-legible-sm")).toBe(
      "drop-shadow-legible-sm",
    );
  });
});
