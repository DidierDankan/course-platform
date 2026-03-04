// src/components/ui/CourseFilters.jsx
import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";

const DURATIONS = [
  { label: "Any duration", value: "" },
  { label: "Short (< 30m)", value: "short" },
  { label: "Medium (30–120m)", value: "medium" },
  { label: "Long (> 120m)", value: "long" },
];

const SORTS = [
  { label: "Newest", value: "newest" },
  { label: "Price: low → high", value: "price_asc" },
  { label: "Price: high → low", value: "price_desc" },
  { label: "Duration: longest first", value: "duration_desc" },
];

export default function CourseFilters({ value, onChange }) {
  const [q, setQ] = useState(value.q || "");

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      onChange({ ...value, q });
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const durationToSeconds = (key) => {
    if (key === "short") return { maxDuration: 30 * 60 };
    if (key === "medium") return { minDuration: 30 * 60, maxDuration: 120 * 60 };
    if (key === "long") return { minDuration: 120 * 60 };
    return {};
  };

  const setDurationBucket = (bucket) => {
    const next = { ...value, durationBucket: bucket };
    // remove old duration fields
    delete next.minDuration;
    delete next.maxDuration;

    const d = durationToSeconds(bucket);
    onChange({ ...next, ...d });
  };

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-[16px] p-[16px] shadow-[0_6px_18px_rgba(0,0,0,0.06)]">
      <div className="flex items-center gap-[8px] mb-[12px] text-[#1e293b] font-semibold">
        <SlidersHorizontal size={16} />
        <span>Filters</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-[12px]">
        {/* Search */}
        <div className="md:col-span-2">
          <label className="text-[13px] text-[#475569]">Search</label>
          <div className="mt-[6px] flex items-center gap-[8px] border border-[#cbd5e1] rounded-[12px] px-[12px] py-[10px]">
            <Search size={16} className="text-[#64748b]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search courses, tutor, keywords…"
              className="w-full outline-none text-[14px]"
            />
          </div>
        </div>

        {/* Sort */}
        <div>
          <label className="text-[13px] text-[#475569]">Sort</label>
          <select
            value={value.sort || "newest"}
            onChange={(e) => onChange({ ...value, sort: e.target.value })}
            className="mt-[6px] w-full border border-[#cbd5e1] rounded-[12px] px-[12px] py-[10px] text-[14px] bg-white"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Duration */}
        <div>
          <label className="text-[13px] text-[#475569]">Duration</label>
          <select
            value={value.durationBucket || ""}
            onChange={(e) => setDurationBucket(e.target.value)}
            className="mt-[6px] w-full border border-[#cbd5e1] rounded-[12px] px-[12px] py-[10px] text-[14px] bg-white"
          >
            {DURATIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        {/* Price */}
        <div>
          <label className="text-[13px] text-[#475569]">Min price (€)</label>
          <input
            type="number"
            value={value.minPrice || ""}
            onChange={(e) => onChange({ ...value, minPrice: e.target.value })}
            className="mt-[6px] w-full border border-[#cbd5e1] rounded-[12px] px-[12px] py-[10px] text-[14px]"
          />
        </div>

        <div>
          <label className="text-[13px] text-[#475569]">Max price (€)</label>
          <input
            type="number"
            value={value.maxPrice || ""}
            onChange={(e) => onChange({ ...value, maxPrice: e.target.value })}
            className="mt-[6px] w-full border border-[#cbd5e1] rounded-[12px] px-[12px] py-[10px] text-[14px]"
          />
        </div>

        {/* Toggles */}
        <div className="md:col-span-2 flex items-end gap-[14px]">
          <label className="inline-flex items-center gap-[8px] text-[14px] text-[#334155]">
            <input
              type="checkbox"
              checked={!!value.free}
              onChange={(e) => onChange({ ...value, free: e.target.checked ? 1 : "" })}
            />
            Free only
          </label>

          <label className="inline-flex items-center gap-[8px] text-[14px] text-[#334155]">
            <input
              type="checkbox"
              checked={!!value.subscriptionOnly}
              onChange={(e) =>
                onChange({ ...value, subscriptionOnly: e.target.checked ? 1 : "" })
              }
            />
            Subscription only
          </label>

          <button
            type="button"
            onClick={() =>
              onChange({ q: "", sort: "newest", minPrice: "", maxPrice: "", free: "", subscriptionOnly: "", durationBucket: "" })
            }
            className="ml-auto text-[13px] font-medium text-[#4f46e5] hover:underline"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}