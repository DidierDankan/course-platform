import React from "react";

const ProgressBar = ({ value }) => {
  const pct = Math.max(0, Math.min(100, Number(value || 0)));
  return (
    <div className="mt-[10px]">
      <div className="flex items-center justify-between text-[12px] text-[#64748b]">
        <span>Progress</span>
        <span className="font-semibold text-[#0f172a]">{pct}%</span>
      </div>
      <div className="mt-[6px] h-[8px] w-full rounded-[999px] bg-[#e2e8f0] overflow-hidden">
        <div
          className="h-full bg-[#4f46e5]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;