import React from "react";

const StatCard = ({ icon: Icon, label, value }) => {
  return (
    <div className="bg-white border border-[#e2e8f0] rounded-[16px] p-[18px] shadow-[0_6px_18px_rgba(0,0,0,0.06)] flex items-center gap-[12px]">
      <div className="h-[40px] w-[40px] rounded-[12px] bg-[#eef2ff] flex items-center justify-center text-[#4f46e5]">
        <Icon size={18} />
      </div>
      <div>
        <div className="text-[12px] uppercase tracking-[0.08em] text-[#64748b]">
          {label}
        </div>
        <div className="text-[22px] font-extrabold text-[#0f172a] leading-[1.1] mt-[2px]">
          {value}
        </div>
      </div>
    </div>
  );
};

export default StatCard;