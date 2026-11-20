import { describe, expect, test } from "vitest";
import { fetchAllRows } from "./fetch-all";

describe("fetchAllRows", () => {
  test("서버가 한 번에 주는 행이 적어도(max_rows 500) 끝까지 받는다", async () => {
    const table = Array.from({ length: 1234 }, (_, i) => i);
    const calls: [number, number][] = [];
    const { data, error } = await fetchAllRows((from, to) => {
      calls.push([from, to]);
      // 서버 max_rows가 500이라 청한 것보다 적게 준다.
      return Promise.resolve({
        data: table.slice(from, Math.min(to + 1, from + 500)),
        error: null,
      });
    });
    expect(error).toBeNull();
    expect(data).toEqual(table);
    expect(calls.map(([from]) => from)).toEqual([0, 500, 1000, 1234]);
  });

  test("오류면 그때까지 받은 행과 오류", async () => {
    const result = await fetchAllRows(() =>
      Promise.resolve({ data: null, error: { message: "boom" } }),
    );
    expect(result).toEqual({ data: [], error: { message: "boom" } });
  });
});
