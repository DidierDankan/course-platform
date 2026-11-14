import { Link } from "react-router-dom";

// A ranked list as horizontal bars: one row per item, the bar's length is its share of the top value.
// Plain HTML: an ordered list reads in rank order for screen readers, so it needs no separate table, and long course
// titles wrap instead of being cut. Every row is labelled (five rows): the value at the bar's tip, a detail under it.
export default function RankedBars({ label, items, formatValue, formatDetail, hrefFor }) {
  const max = Math.max(1, ...items.map((item) => item.value));

  return (
    <ol className="ranked-bars" aria-label={label}>
      {items.map((item) => (
        <li key={item.id} className="ranked-bar">
          <div className="ranked-bar-head">
            <Link to={hrefFor(item)} className="ranked-bar-title text-link">
              {item.title}
            </Link>
            <span className="ranked-bar-value">{formatValue(item.value)}</span>
          </div>
          <div className="ranked-bar-track" aria-hidden="true">
            <div className="ranked-bar-fill" style={{ width: `${(item.value / max) * 100}%` }} />
          </div>
          {formatDetail && <div className="ranked-bar-detail">{formatDetail(item)}</div>}
        </li>
      ))}
    </ol>
  );
}
