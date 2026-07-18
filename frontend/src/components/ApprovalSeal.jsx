// A wax-seal style ring divided into N wedges — one per required signature.
// Wedges fill in brass as approvals arrive; the ring locks in verified green once executed.
export default function ApprovalSeal({ total, filled, executed, size = 64 }) {
  const segments = Math.max(total, 1);
  const r = size / 2 - 4;
  const cx = size / 2;
  const cy = size / 2;
  const gapDeg = segments > 1 ? 6 : 0;
  const segDeg = 360 / segments - gapDeg;

  const wedges = [];
  for (let i = 0; i < segments; i++) {
    const start = i * (360 / segments) - 90 + gapDeg / 2;
    const end = start + segDeg;
    const isFilled = i < filled;
    wedges.push(
      <path
        key={i}
        d={describeArc(cx, cy, r, start, end)}
        fill="none"
        stroke={executed ? "var(--verified)" : isFilled ? "var(--brass)" : "var(--paper-line)"}
        strokeWidth={isFilled || executed ? 6 : 4}
        strokeLinecap="round"
        style={{ transition: "stroke 300ms ease, stroke-width 300ms ease" }}
      />
    );
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${filled} of ${total} approvals`}>
      {wedges}
      <text
        x={cx}
        y={cy + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        className="font-mono"
        fontSize={size * 0.24}
        fontWeight={600}
        fill={executed ? "var(--verified)" : "var(--ink)"}
      >
        {executed ? "✓" : `${filled}/${total}`}
      </text>
    </svg>
  );
}

// angleDeg: 0 = straight up, increasing clockwise
function polarToCartesian(cx, cy, r, angleDeg) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArc = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}
