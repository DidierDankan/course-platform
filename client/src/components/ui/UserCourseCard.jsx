import React from "react";
import { BookOpen, PlayCircle } from "lucide-react";
import ProgressBar from "@components/ui/ProgressBar";

import { Link } from "react-router-dom";

const UserCourseCard = ({ course, actionLabel = "Continue", actionTo, variant = "default" }) => {
  const isContinue = variant === "continue";

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-[16px] p-[18px] shadow-[0_6px_18px_rgba(0,0,0,0.06)] flex items-start justify-between gap-[16px]">
      <div className="min-w-0">
        <div className="flex items-center gap-[8px]">
          <div
            className={`h-[34px] w-[34px] rounded-[12px] flex items-center justify-center ${
              isContinue ? "bg-[#ecfeff] text-[#0ea5e9]" : "bg-[#eef2ff] text-[#4f46e5]"
            }`}
          >
            {isContinue ? <PlayCircle size={18} /> : <BookOpen size={18} />}
          </div>
          <h3 className="text-[16px] font-bold text-[#0f172a] truncate">
            {course.title}
          </h3>
        </div>

        {"progress" in course && <ProgressBar value={course.progress} />}
      </div>

      {actionTo && (
        <Link
          to={actionTo}
          className="shrink-0 inline-flex items-center justify-center rounded-[12px] bg-[#4f46e5] px-[12px] py-[10px] text-[13px] font-semibold text-white hover:opacity-95"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
};

export default UserCourseCard;