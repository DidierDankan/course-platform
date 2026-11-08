// src/components/ui/CourseFilters.jsx
import { useEffect, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { CURRENCY } from "@utils/currency";
import { DURATION_OPTIONS, EMPTY_FILTERS, SORT_OPTIONS } from "@utils/courseFilters";

export default function CourseFilters({ value, onChange }) {
  const [q, setQ] = useState(value.q || "");

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      onChange({ ...value, q }, { replace: true });
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

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
            {SORT_OPTIONS.map((s) => (
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
            value={value.duration}
            onChange={(e) => onChange({ ...value, duration: e.target.value })}
            className="mt-[6px] w-full border border-[#cbd5e1] rounded-[12px] px-[12px] py-[10px] text-[14px] bg-white"
          >
            {DURATION_OPTIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        {/* Price */}
        <div>
          <label className="text-[13px] text-[#475569]">Min price ({CURRENCY.code})</label>
          <input
            type="number"
            value={value.minPrice || ""}
            onChange={(e) => onChange({ ...value, minPrice: e.target.value }, { replace: true })}
            className="mt-[6px] w-full border border-[#cbd5e1] rounded-[12px] px-[12px] py-[10px] text-[14px]"
          />
        </div>

        <div>
          <label className="text-[13px] text-[#475569]">Max price ({CURRENCY.code})</label>
          <input
            type="number"
            value={value.maxPrice || ""}
            onChange={(e) => onChange({ ...value, maxPrice: e.target.value }, { replace: true })}
            className="mt-[6px] w-full border border-[#cbd5e1] rounded-[12px] px-[12px] py-[10px] text-[14px]"
          />
        </div>

        {/* Toggles */}
        <div className="md:col-span-2 flex items-end gap-[14px]">
          <label className="inline-flex items-center gap-[8px] text-[14px] text-[#334155]">
            <input
              type="checkbox"
              checked={value.free}
              onChange={(e) => onChange({ ...value, free: e.target.checked })}
            />
            Free only
          </label>

          <button
            type="button"
            onClick={() => onChange(EMPTY_FILTERS)}
            className="ml-auto text-[13px] font-medium text-[#4f46e5] hover:underline"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}