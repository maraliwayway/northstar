import { formatDate, money } from "../lib/money";

type Point = { x: string; y: number };

function niceStep(range: number, count: number) {
  const raw = range / count;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const normalized = raw / magnitude;
  return (normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10) * magnitude;
}

const tickLabel = (cents: number) => money(cents, Math.abs(cents) >= 100000 ? "compact" : "whole");

// Small dependency-free SVG chart; scales to its container via viewBox.
export function LineChart({ points, height = 200, label, xFormat = "date" }: { points: Point[]; height?: number; label: string; xFormat?: "date" | "raw" }) {
  const width = 640;
  const pad = { top: 14, right: 12, bottom: 28, left: 64 };
  if (points.length < 2) {
    return <p className="chart-empty">The chart appears once there are two or more data points.</p>;
  }

  const ys = points.map((p) => p.y);
  let lo = Math.min(...ys);
  let hi = Math.max(...ys);
  if (lo > 0 && lo < (hi - lo) * 0.6) lo = 0;
  if (hi === lo) hi = lo + 10000;
  const step = niceStep(hi - lo, 4);
  lo = Math.floor(lo / step) * step;
  hi = Math.ceil(hi / step) * step;
  const ticks: number[] = [];
  for (let t = lo; t <= hi + step / 2; t += step) ticks.push(t);

  const x = (i: number) => pad.left + (i / (points.length - 1)) * (width - pad.left - pad.right);
  const y = (v: number) => pad.top + (1 - (v - lo) / (hi - lo)) * (height - pad.top - pad.bottom);
  const baseline = lo > 0 ? lo : hi < 0 ? hi : 0;
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.y).toFixed(1)}`).join(" ");
  const area = `${path} L${x(points.length - 1).toFixed(1)},${y(baseline).toFixed(1)} L${x(0).toFixed(1)},${y(baseline).toFixed(1)} Z`;
  const fmtX = (value: string) => (xFormat === "date" ? formatDate(value, { month: "short", year: "numeric" }) : value);
  const last = points[points.length - 1];

  return (
    <svg className="line-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${label}: from ${money(points[0].y)} to ${money(last.y)}`}>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)} className={t === 0 && lo < 0 ? "zero" : "grid"} />
          <text x={pad.left - 8} y={y(t) + 4} textAnchor="end" className="axis">
            {tickLabel(t)}
          </text>
        </g>
      ))}
      <path d={area} className="area" />
      <path d={path} className="line" />
      <circle cx={x(points.length - 1)} cy={y(last.y)} r="4" className="dot" />
      <text x={pad.left} y={height - 6} className="axis">
        {fmtX(points[0].x)}
      </text>
      <text x={width - pad.right} y={height - 6} textAnchor="end" className="axis">
        {fmtX(last.x)}
      </text>
    </svg>
  );
}
