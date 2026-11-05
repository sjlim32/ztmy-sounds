import { encode } from "uqr";

/**
 * QR 코드 — 칸마다 사각형을 하나의 path로 그린 SVG(흰 바탕, 검은 칸).
 * 이미지 안에 그대로 들어가도록 외부 그림 없이 그린다.
 */
export function QrCode({ value, size }: { value: string; size: number }) {
  const qr = encode(value, { border: 2 });
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
