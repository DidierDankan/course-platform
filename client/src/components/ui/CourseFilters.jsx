// src/components/ui/CourseFilters.jsx
import { useEffect, useRef, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { CURRENCY } from "@utils/currency";
import {
  DURATION_OPTIONS,
  EMPTY_FILTERS,
  SORT_OPTIONS,
  isPriceRangeInverted,
  serializeFilters,
} from "@utils/courseFilters";

const DEBOUNCE_MS = 350;
const urlOf = (filters) => serializeFilters(filters).toString();
const draftOf = ({ q, minPrice, maxPrice }) => ({ q, minPrice, maxPrice });
// A number input also accepts these while typing; none of them can be part of a price here.
const BLOCKED_PRICE_KEYS = new Set(["-", "+", "e", "E"]);

// `value` is what the URL says. The text and price boxes keep their own draft, so typing
// doesn't send a request per keystroke; the draft reaches the URL after a short pause.
export default function CourseFilters({ value, onChange }) {
  const [draft, setDraft] = useState(() => draftOf(value));
  const valueRef = useRef(value);
  const lastUrl = useRef(urlOf(value));

  const rangeInverted = isPriceRangeInverted(draft.minPrice, draft.maxPrice);

  const commit = (next, options) => {
    lastUrl.current = urlOf(next);
    onChange(next, options);
  };

  // The URL changed from outside this form (Back, a link): show what it says now.
  useEffect(() => {
    valueRef.current = value;
    const url = urlOf(value);
    if (url === lastUrl.current) return;
    lastUrl.current = url;
    setDraft(draftOf(value));
  }, [value]);

  // Reads the latest URL state when it fires, so a sort change during the pause isn't undone.
  useEffect(() => {
    if (isPriceRangeInverted(draft.minPrice, draft.maxPrice)) return undefined;
    const timer = setTimeout(() => {
      const next = { ...valueRef.current, ...draft };
      if (urlOf(next) !== urlOf(valueRef.current)) commit(next, { replace: true });
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // commit only touches a ref and the parent's stable callback
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  // Selects and checkboxes apply at once, together with anything still being typed.
  const applyNow = (patch) => {
    const typed = rangeInverted ? { q: draft.q } : draft;
    commit({ ...value, ...typed, ...patch });
  };

  const setPrice = (field) => (event) => {
    const next = event.target.value;
    if (Number(next) < 0) return; // pasted or stepped below zero
    setDraft((d) => ({ ...d, [field]: next }));
  };
  const blockNonPriceKeys = (event) => {
    if (BLOCKED_PRICE_KEYS.has(event.key)) event.preventDefault();
  };

  const reset = () => {
    setDraft(draftOf(EMPTY_FILTERS));
    commit(EMPTY_FILTERS);
  };

  const priceProps = {
    type: "number",
    min: 0,
    step: 0.01,
    inputMode: "decimal",
    disabled: value.free, // the server ignores price limits for free-only
    onKeyDown: blockNonPriceKeys,
  };

  return (
    <section className="panel filter-panel" aria-label="Filter courses">
      <div className="filter-title">
        <SlidersHorizontal size={16} aria-hidden="true" />
        <span>Filters</span>
      </div>

      <div className="filter-grid">
        <label className="field filter-search">
          <span>Search</span>
          <input
            type="search"
            value={draft.q}
            onChange={(e) => setDraft((d) => ({ ...d, q: e.target.value }))}
            placeholder="Search courses, tutor, keywords…"
            maxLength={100}
          />
        </label>

        <label className="field">
          <span>Sort</span>
          <select value={value.sort} onChange={(e) => applyNow({ sort: e.target.value })}>
            {SORT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Duration</span>
          <select value={value.duration} onChange={(e) => applyNow({ duration: e.target.value })}>
            {DURATION_OPTIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Min price ({CURRENCY.code})</span>
          <input {...priceProps} value={draft.minPrice} onChange={setPrice("minPrice")} />
        </label>

        <label className={`field ${rangeInverted ? "has-error" : ""}`}>
          <span>Max price ({CURRENCY.code})</span>
          <input
            {...priceProps}
            value={draft.maxPrice}
            onChange={setPrice("maxPrice")}
            aria-invalid={rangeInverted}
          />
          {rangeInverted && <small role="alert">Max can&apos;t be lower than min.</small>}
        </label>

        <div className="filter-actions">
          <label className="filter-check">
            <input type="checkbox" checked={value.free} onChange={(e) => applyNow({ free: e.target.checked })} />
            Free only
          </label>
          <button type="button" className="button button-ghost button-small" onClick={reset}>
            Reset
          </button>
        </div>
      </div>
    </section>
  );
}
