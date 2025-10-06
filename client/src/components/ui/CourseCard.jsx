import { useMemo } from "react";
import { Clock } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const formatDuration = (seconds) => {
  if (!seconds || isNaN(seconds)) return "0m";
  const mins = Math.floor(seconds / 60);
  const hrs = Math.floor(mins / 60);
  if (hrs > 0) return `${hrs}h ${mins % 60}m`;
  return `${mins}m`;
};

const CourseCard = ({ course }) => {
  // ✅ Use precomputed total_duration from backend
  const totalSeconds = useMemo(() => Number(course?.total_duration) || 0, [course?.total_duration]);

  const thumb = course?.thumbnail_url
    ? `${API_BASE_URL}${course.thumbnail_url}`
    : "https://images.unsplash.com/photo-1522199710521-72d69614c702?q=80&w=1200&auto=format&fit=crop"; // fallback

  return (
    <div className="rounded-[12px] border border-[#e5e7eb] bg-[#ffffff] shadow-[0_6px_24px_rgba(0,0,0,0.08)] overflow-hidden hover:shadow-[0_12px_32px_rgba(0,0,0,0.12)] transition-shadow">
      <img
        src={thumb}
        alt={`${course.title} thumbnail`}
        className="w-full h-[180px] object-cover"
        loading="lazy"
      />

      <div className="p-[14px]">
        <h3 className="text-[16px] font-semibold leading-[1.35] mb-[6px]">{course.title}</h3>
        <p className="text-[13px] text-[#475569] line-clamp-2 mb-[10px]">
          {course.description}
        </p>

        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-[6px] text-[12px] text-[#334155]">
            <Clock size={16} /> <span>{formatDuration(totalSeconds)}</span>
          </div>
          <div className="text-[14px] font-bold text-[#1e40af]">
            ${Number(course.price).toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
