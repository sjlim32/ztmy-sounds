export interface SaveAction {
  kind: "share" | "download" | "copy";
  label: string;
  primary: boolean;
}

/**
 * 완성 이미지의 저장 버튼 구성. 휴대폰(터치)에서는 공유 시트가 "사진에 저장"으로
 * 가는 가장 쉬운 길이라 주 버튼(내려받기는 iOS에서 '파일' 앱으로 간다). PC에서는
 * 클립보드 복사 또는 파일 내려받기가 주된 사용 방식이다(OS 공유 창은 거의 쓰이지 않음).
 * 공유/복사를 지원하지 않는 브라우저는 내려받기 하나.
 */
export function saveActions({
  canShare,
  touch,
  canCopy = false,
}: {
  canShare: boolean;
  touch: boolean;
  canCopy?: boolean;
}): SaveAction[] {
  if (touch) {
    if (!canShare) return [{ kind: "download", label: "저장", primary: true }];
    return [
      { kind: "share", label: "공유", primary: true },
      { kind: "download", label: "저장", primary: false },
    ];
  }

  // PC: 클립보드 복사가 되면 (저장 + 복사), 안 되고 공유만 되면 (저장 + 공유), 둘 다 없으면 (저장)
  if (canCopy) {
    return [
      { kind: "download", label: "저장", primary: true },
      { kind: "copy", label: "복사", primary: false },
    ];
  }
  if (canShare) {
    return [
      { kind: "download", label: "저장", primary: true },
      { kind: "share", label: "공유", primary: false },
    ];
  }
  return [{ kind: "download", label: "저장", primary: true }];
}
