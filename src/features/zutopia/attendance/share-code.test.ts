import { describe, expect, test } from "vitest";
import {
  decodeAttendance,
  encodeAttendance,
  extractCode,
} from "@/features/zutopia/attendance/share-code";
import type { LiveUnit } from "@/features/zutopia/live-history/types";

function unit(liveId: string, date: string): LiveUnit {
  return {
    id: `${liveId}:${date}`,
    liveId,
    date,
    type: "CONCERT",
    title: "t",
    titleKo: null,
    city: "서울",
    tourId: null,
    dayNumber: null,
    href: null,
    songIds: [],
    imageUrl: null,
    groupImageUrl: null,
  };
}

const A = "448f70aa-1111-4000-8000-000000000001";
const B = "9c508811-2222-4000-8000-000000000002";
const C = "019fe1cc-3333-4000-8000-000000000003";
const units = [
  unit(A, "2026-03-15"),
  unit(A, "2026-03-14"),
  unit(B, "2024-06-15"),
  unit(C, "2025-01-01"),
];

describe("share code", () => {
  test("encode → decode 왕복", () => {
    const attended = new Set([`${A}:2026-03-15`, `${B}:2024-06-15`]);
    const code = encodeAttendance(units, attended);
    expect(code.startsWith("ZT1")).toBe(true);
    expect(decodeAttendance(code, units)?.sort()).toEqual([...attended].sort());
  });

  test("체크 없으면 빈 목록으로 왕복", () => {
    expect(decodeAttendance(encodeAttendance(units, new Set()), units)).toEqual(
      [],
    );
  });

  test("지금 데이터에 없는 공연 ID는 버린다", () => {
    const code = encodeAttendance(units, new Set([`${C}:2025-01-01`]));
    expect(decodeAttendance(code, units.slice(0, 3))).toEqual([]);
  });

  test("공연이 나중에 추가돼도 기존 코드는 그대로 읽힌다", () => {
    const code = encodeAttendance(units, new Set([`${A}:2026-03-14`]));
    const more = [
      unit("ffffffff-4444-4000-8000-000000000004", "2023-01-01"),
      ...units,
    ];
    expect(decodeAttendance(code, more)).toEqual([`${A}:2026-03-14`]);
  });

  test("형식이 아니면 null", () => {
    expect(decodeAttendance("hello", units)).toBeNull();
    expect(decodeAttendance("ZT1@@@", units)).toBeNull();
    expect(decodeAttendance("ZT1AAA", units)).toBeNull(); // 길이가 5바이트 단위가 아님
  });

  test("체크 10개 공연이어도 코드가 짧다", () => {
    const many = Array.from({ length: 10 }, (_, i) =>
      unit(
        `${String(i).padStart(8, "0")}-0000-4000-8000-000000000000`,
        "2026-01-01",
      ),
    );
    const code = encodeAttendance(many, new Set(many.map((u) => u.id)));
    expect(code.length).toBeLessThanOrEqual(72);
  });
});

describe("extractCode", () => {
  test("코드, 링크(#code=, ?code=), 앞뒤 공백 모두", () => {
    expect(extractCode("  ZT1abc_-  ")).toBe("ZT1abc_-");
    expect(
      extractCode("https://ztmy-sounds.fans/zutopia/attendance#code=ZT1abc"),
    ).toBe("ZT1abc");
    expect(extractCode("/zutopia/attendance?code=ZT1xyz")).toBe("ZT1xyz");
    expect(extractCode("그냥 글자")).toBeNull();
  });
});
