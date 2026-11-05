import { encode } from "uqr";

/**
 * QR 코드 — 칸마다 사각형을 하나의 path로 그린 SVG(흰 바탕, 검은 칸).
 * 이미지 안에 그대로 들어가도록 외부 그림 없이 그린다. 가장 작게 그리려고 오류
 * 보정은 가장 낮은 L(칸 수가 가장 적다 — 주소 길이 기준 29칸 + 여백 2칸씩).
 * 저장된 이미지는 손상될 일이 없어 L로 충분하다.
 */
export function QrCode({ value, size }: { value: string; size: number }) {
  const qr = encode(value, { ecc: "L", border: 2 });
  let path = "";
  qr.data.forEach((row, y) =>
    row.forEach((on, x) => {
      if (on) path += `M${x} ${y}h1v1h-1z`;
    }),
  );
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${qr.size} ${qr.size}`}
      shapeRendering="crispEdges"
      aria-hidden
      style={{ display: "block", borderRadius: 6 }}
    >
      <rect width={qr.size} height={qr.size} fill="#fff" />
      <path d={path} fill="#050223" />
    </svg>
  );
}
