import { Star } from "lucide-react";
import { RATING_MAX } from "@utils/form/limits";

const STARS = Array.from({ length: RATING_MAX }, (_, i) => i + 1);

// Choose 1-5 stars. Native radio buttons underneath (visually hidden), so the arrow keys, the focus ring and screen
// readers work without extra code; each star's label says its value ("4 stars").
export default function StarInput({ name, value, onChange, legend = "Your rating", disabled = false }) {
  return (
    <fieldset className="star-input" disabled={disabled}>
      <legend className="stat-label">{legend}</legend>
      <div className="star-input-row">
        {STARS.map((n) => (
          <label key={n} className={n <= (value ?? 0) ? "is-on" : undefined}>
            <input
              type="radio"
              name={name}
              value={n}
              checked={value === n}
              onChange={() => onChange(n)}
              className="visually-hidden"
            />
            <Star size={22} aria-hidden="true" />
            <span className="visually-hidden">{n === 1 ? "1 star" : `${n} stars`}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
