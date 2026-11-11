import { describe, expect, test } from "vitest";
import { splitParenSuffix } from "./LiveTicket";

describe("splitParenSuffix", () => {
  test("끝 괄호를 부연설명으로 뗀다", () => {
    expect(splitParenSuffix("日本武道館 (일본무도관)")).toEqual({
      main: "日本武道館",
      suffix: "일본무도관",
    });
  });

  test("끝 괄호 안에 괄호가 또 있어도 마지막 괄호 전체를 뗀다", () => {
    expect(
      splitParenSuffix(
        "幕張メッセ国際展示場 (1~11ホール) (마쿠하리 멧세 국제전시장(1~11홀))",
      ),
    ).toEqual({
      main: "幕張メッセ国際展示場 (1~11ホール)",
      suffix: "마쿠하리 멧세 국제전시장(1~11홀)",
    });
  });

  test("괄호가 없거나 공백 없이 붙은 괄호는 그대로 둔다", () => {
    expect(splitParenSuffix("Zepp DiverCity")).toEqual({
      main: "Zepp DiverCity",
      suffix: null,
    });
    expect(splitParenSuffix("国際展示場(1~8ホール)")).toEqual({
      main: "国際展示場(1~8ホール)",
      suffix: null,
    });
  });
});
