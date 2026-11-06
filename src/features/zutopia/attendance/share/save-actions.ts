export interface SaveAction {
  kind: "share" | "download";
  label: string;
  primary: boolean;
}

/**
 * 완성 이미지의 저장 버튼 구성. 휴대폰(터치)에서는 공유 시트가 "사진에 저장"으로
 * 가는 가장 쉬운 길이라 주 버튼(내려받기는 iOS에서 '파일' 앱으로 간다). PC에서는
 * 공유 창(macOS 공유 메뉴·Windows 공유)이 사진 저장과 거리가 멀어 내려받기가 주
 * 버튼, 공유는 보조. 공유를 못 하는 브라우저는 내려받기 하나.
 */
export function saveActions({
  canShare,
  touch,
}: {
  canShare: boolean;
  touch: boolean;
}): SaveAction[] {
  if (!canShare) return [{ kind: "download", label: "저장", primary: true }];
  return touch
    ? [
        { kind: "share", label: "공유", primary: true },
        { kind: "download", label: "저장", primary: false },
      ]
    : [
        { kind: "download", label: "저장", primary: true },
        { kind: "share", label: "공유", primary: false },
      ];
}
