import { describe, expect, test } from "vitest";
import { saveActions } from "@/features/zutopia/attendance/share/save-actions";

describe("saveActions", () => {
  test("휴대폰(터치) + 공유 가능: 사진 저장·공유가 주, 파일 저장은 보조", () => {
    expect(saveActions({ canShare: true, touch: true })).toEqual([
      { kind: "share", label: "사진 저장 · 공유", primary: true },
      { kind: "download", label: "파일로 저장", primary: false },
    ]);
  });

  test("PC + 공유 가능: 이미지 저장이 주, 공유는 보조", () => {
    expect(saveActions({ canShare: true, touch: false })).toEqual([
      { kind: "download", label: "이미지 저장", primary: true },
      { kind: "share", label: "공유", primary: false },
    ]);
  });

  test("공유를 못 하면 이미지 저장 하나", () => {
    for (const touch of [true, false])
      expect(saveActions({ canShare: false, touch })).toEqual([
        { kind: "download", label: "이미지 저장", primary: true },
      ]);
  });
});
