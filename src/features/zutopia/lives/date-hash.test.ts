import { describe, expect, test } from "vitest";
import { dateHashes, dateIdFromHash, historyStep } from "./date-hash";

const d = (id: string, startDate: string, canceled = false) => ({
  id,
  startDate,
  canceled,
});

describe("dateHashes", () => {
  test("공연 날짜를 해시 값으로", () => {
    expect(dateHashes([d("a", "2023-04-20"), d("b", "2023-04-21")])).toEqual(
      new Map([
        ["a", "2023-04-20"],
        ["b", "2023-04-21"],
      ]),
    );
  });

  test("같은 날짜는 둘째부터 -2, -3(목록 순서)", () => {
    expect([
      ...dateHashes([
        d("x", "2024-05-04"),
        d("y", "2024-05-04"),
        d("z", "2024-05-04"),
      ]).values(),
    ]).toEqual(["2024-05-04", "2024-05-04-2", "2024-05-04-3"]);
  });

  test("취소된 공연일은 빼고, 번호도 세지 않는다", () => {
    const hashes = dateHashes([
      d("c", "2023-04-27", true),
      d("e", "2023-04-27"),
    ]);
    expect(hashes.has("c")).toBe(false);
    expect(hashes.get("e")).toBe("2023-04-27");
  });

  test("타임스탬프 날짜도 날짜 부분만", () => {
    expect(dateHashes([d("a", "2023-04-20T00:00:00+00:00")]).get("a")).toBe(
      "2023-04-20",
    );
  });
});

describe("dateIdFromHash", () => {
  const dates = [
    d("a", "2023-04-20"),
    d("b", "2023-04-21"),
    d("c", "2023-04-27", true),
    d("x", "2024-05-04"),
    d("y", "2024-05-04"),
  ];

  test("# 있어도 없어도 공연일 id", () => {
    expect(dateIdFromHash(dates, "#2023-04-21")).toBe("b");
    expect(dateIdFromHash(dates, "2023-04-21")).toBe("b");
    expect(dateIdFromHash(dates, "#2024-05-04-2")).toBe("y");
  });

  test("비었거나 모르는 해시·취소된 날은 null", () => {
    expect(dateIdFromHash(dates, "")).toBeNull();
    expect(dateIdFromHash(dates, "#")).toBeNull();
    expect(dateIdFromHash(dates, "#2099-01-01")).toBeNull();
    expect(dateIdFromHash(dates, "#2023-04-27")).toBeNull();
  });
});

describe("historyStep", () => {
  test("같은 해시면 아무것도 안 함", () => {
    expect(
      historyStep({ hash: "#2023-04-21", depth: 1 }, "#2023-04-21"),
    ).toEqual({ kind: "none" });
  });

  test("우리가 쌓은 기록에서 닫으면 고르기 전 기록까지 한 번에 뒤로", () => {
    expect(historyStep({ hash: "#2023-04-21", depth: 1 }, "")).toEqual({
      kind: "go",
      delta: -1,
    });
    // 4/20 → 4/21을 연달아 고른 뒤 닫기 — 4/20이 아니라 공통으로
    expect(historyStep({ hash: "#2023-04-21", depth: 2 }, "")).toEqual({
      kind: "go",
      delta: -2,
    });
  });

  test("날짜를 고르면 깊이 하나 더해 새 기록, 공유 링크(깊이 0)에서 닫으면 새 기록", () => {
    expect(historyStep({ hash: "", depth: 0 }, "#2023-04-20")).toEqual({
      kind: "push",
      depth: 1,
    });
    expect(
      historyStep({ hash: "#2023-04-20", depth: 1 }, "#2023-04-21"),
    ).toEqual({ kind: "push", depth: 2 });
    expect(historyStep({ hash: "#2023-04-21", depth: 0 }, "")).toEqual({
      kind: "push",
      depth: 0,
    });
  });
});
