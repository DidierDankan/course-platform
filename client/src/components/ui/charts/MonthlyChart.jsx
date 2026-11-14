import { useState } from "react";
import useElementWidth from "@hooks/useElementWidth";
import { monthLong, monthShort, niceMax, tickNumber } from "@utils/charts";

// One measure over the 12 months, as columns (a count per month) or a line (change over time). One series, one axis:
// the title names it, so there is no legend. The SVG is drawn at the element's real width (text never stretches) and
// is hidden from screen readers; the table below it carries every value. Hover a month, or focus the chart and use the
// arrow keys, for the tooltip.
const HEIGHT = 200;
const PAD = { top: 18, right: 14, bottom: 26, left: 46 };
const MAX_COLUMN = 24; // never fill the band: the rest is air
const NARROW_BAND = 34; // below this, only every other month gets an axis label

export default function MonthlyChart({ label, valueHeader, data, kind = "columns", formatValue, formatTick = tickNumber }) {
  const [ref, width] = useElementWidth();
  const [active, setActive] = useState(null);

  const innerWidth = Math.max(width - PAD.left - PAD.right, 0);
  const innerHeight = HEIGHT - PAD.top - PAD.bottom;
  const top = niceMax(Math.max(0, ...data.map((d) => d.value)));
  const band = data.length ? innerWidth / data.length : 0;
  const x = (i) => PAD.left + band * i + band / 2;
  const y = (value) => PAD.top + innerHeight - (value / top) * innerHeight;
  const baseline = y(0);
  const columnWidth = Math.min(MAX_COLUMN, band * 0.6);

  // Label sparingly: the latest month and the highest one (if different and not zero).
  const last = data.length - 1;
  const peak = data.reduce((best, d, i) => (d.value > data[best].value ? i : best), 0);
  const labelled = new Set([last, ...(data[peak]?.value > 0 ? [peak] : [])]);

  const columnPath = (i, value) => {
    const height = baseline - y(value);
    if (height <= 0) return null;
    const r = Math.min(4, columnWidth / 2, height);
    const left = x(i) - columnWidth / 2;
    const right = x(i) + columnWidth / 2;
    const tip = y(value);
    // rounded at the data end, square at the baseline
    return `M${left},${baseline} V${tip + r} Q${left},${tip} ${left + r},${tip} H${right - r} Q${right},${tip} ${right},${tip + r} V${baseline} Z`;
  };
  const linePoints = data.map((d, i) => `${x(i)},${y(d.value)}`).join(" ");
  const areaPath = data.length ? `M${x(0)},${baseline} L${linePoints.replaceAll(" ", " L")} L${x(last)},${baseline} Z` : "";

  const onKeyDown = (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const step = event.key === "ArrowRight" ? 1 : -1;
    setActive((current) => Math.min(last, Math.max(0, (current ?? last) + step)));
  };

  const shown = active !== null ? data[active] : null;

  return (
    <figure className="chart">
      <div
        ref={ref}
        className="chart-plot"
        tabIndex={0}
        aria-label={`${label}. Use the left and right arrow keys to read each month.`}
        onKeyDown={onKeyDown}
        onFocus={() => setActive((current) => current ?? last)}
        onBlur={() => setActive(null)}
        onPointerLeave={() => setActive(null)}
      >
        {width > 0 && (
          <svg width={width} height={HEIGHT} aria-hidden="true" focusable="false">
            {[0, top / 2, top].map((tick) => (
              <g key={tick}>
                <line className="chart-grid" x1={PAD.left} x2={width - PAD.right} y1={y(tick)} y2={y(tick)} />
                <text className="chart-tick" x={PAD.left - 8} y={y(tick)} dy="0.32em" textAnchor="end">
                  {formatTick(tick)}
                </text>
              </g>
            ))}

            {data.map((d, i) =>
              band >= NARROW_BAND || i % 2 === last % 2 ? (
                <text key={d.month} className="chart-tick" x={x(i)} y={HEIGHT - 8} textAnchor="middle">
                  {monthShort(d.month)}
                </text>
              ) : null
            )}

            {kind === "columns" &&
              data.map((d, i) => {
                const path = columnPath(i, d.value);
                return path ? <path key={d.month} className="chart-mark" d={path} /> : null;
              })}

            {kind === "line" && (
              <>
                <path className="chart-area" d={areaPath} />
                <polyline className="chart-line" points={linePoints} />
                {active !== null && <line className="chart-crosshair" x1={x(active)} x2={x(active)} y1={PAD.top} y2={baseline} />}
                {data.map((d, i) =>
                  labelled.has(i) || i === active ? (
                    <circle key={d.month} className="chart-dot" cx={x(i)} cy={y(d.value)} r={4} />
                  ) : null
                )}
              </>
            )}

            {data.map((d, i) =>
              labelled.has(i) && d.value > 0 ? (
                <text key={d.month} className="chart-value" x={x(i)} y={y(d.value) - 8} textAnchor="middle">
                  {formatValue(d.value)}
                </text>
              ) : null
            )}

            {/* hit areas: a whole month band, much bigger than the mark */}
            {data.map((d, i) => (
              <rect
                key={d.month}
                className="chart-hit"
                x={PAD.left + band * i}
                y={PAD.top}
                width={band}
                height={innerHeight}
                onPointerEnter={() => setActive(i)}
                onPointerMove={() => setActive(i)}
              />
            ))}
          </svg>
        )}

        {shown && (
          <div className="chart-tooltip" style={{ left: x(active), top: y(shown.value) }} aria-hidden="true">
            <strong>{formatValue(shown.value)}</strong>
            <span>{monthLong(shown.month)}</span>
          </div>
        )}
      </div>

      <table className="visually-hidden">
        <caption>{label}</caption>
        <thead>
          <tr>
            <th scope="col">Month</th>
            <th scope="col">{valueHeader}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.month}>
              <th scope="row">{monthLong(d.month)}</th>
              <td>{formatValue(d.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
