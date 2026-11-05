import { tallyParts } from "./tally-parts";

/**
 * 횟수 탤리 — 세로줄 4개 + 사선 1개가 5회 한 묶음, 남은 횟수만큼 세로줄,
 * 20회를 넘으면 뒤에 "+N". 폰트와 상관없이 같은 모양이 나오게 SVG로 그린다.
 * size는 세로줄 높이(px).
 */
export function Tally({
  count,
  size,
  color,
}: {
  count: number;
  size: number;
  color: string;
}) {
  const { bundles, rest, overflow } = tallyParts(count);
  const stroke = Math.max(2, size / 9);
  const gap = size * 0.24; // 세로줄 간격
  const bundleWidth = gap * 3 + stroke;
  const bundleGap = size * 0.42;
  const marks = [
    ...Array.from({ length: bundles }, () => 5),
    ...(rest ? [rest] : []),
  ];
  const width =
    marks.reduce(
      (sum, n) => sum + (n === 5 ? bundleWidth : gap * (n - 1) + stroke),
      0,
    ) +
    bundleGap * Math.max(0, marks.length - 1) +
    stroke;

  let x = stroke / 2;
  const groups = marks.map((n, i) => {
    const start = x;
    const lines = Array.from({ length: Math.min(n, 4) }, (_, j) => (
      <line
        key={j}
        x1={start + gap * j}
        y1={stroke / 2}
        x2={start + gap * j}
        y2={size - stroke / 2}
      />
    ));
    const slash =
      n === 5 ? (
        <line
          x1={start - gap * 0.4}
          y1={size * 0.78}
          x2={start + gap * 3 + gap * 0.4}
          y2={size * 0.22}
        />
      ) : null;
    x += (n === 5 ? bundleWidth : gap * (n - 1) + stroke) + bundleGap;
    return (
      <g key={i}>
        {lines}
        {slash}
      </g>
    );
  });

  return (
    <span
      style={{ display: "inline-flex", alignItems: "center", gap: size * 0.3 }}
    >
      <svg
        width={width}
        height={size}
        viewBox={`0 0 ${width} ${size}`}
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        fill="none"
        aria-hidden
      >
        {groups}
      </svg>
      {overflow > 0 && (
        <span
          style={{
            color,
            fontSize: size * 0.95,
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          +{overflow}
        </span>
      )}
    </span>
  );
}
