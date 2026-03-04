import { useMemo } from "react";
import { Clock } from "lucide-react";
import { useSelector } from "react-redux";
import CourseCTA from "@components/ui/CourseCTA";
import { Link } from "react-router-dom";
import FavoriteButton from "./FavoriteButton";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const formatDuration = (seconds) => {
  if (!seconds || isNaN(seconds)) return "0m";
  const mins = Math.floor(seconds / 60);
  const hrs = Math.floor(mins / 60);
  if (hrs > 0) return `${hrs}h ${mins % 60}m`;
  return `${mins}m`;
};

const CourseCard = ({ course }) => {
  const { user } = useSelector((s) => s.auth || {});

  const totalSeconds = useMemo(
    () => Number(course?.total_duration) || 0,
    [course?.total_duration]
  );

  const thumb = course?.thumbnail_url
    ? `${API_BASE_URL}${course.thumbnail_url}`
    : "https://images.unsplash.com/photo-1522199710521-72d69614c702?q=80&w=1200&auto=format&fit=crop";

  return (
    <div className="relative rounded-[12px] border border-[#e5e7eb] bg-[#ffffff] shadow-[0_6px_24px_rgba(0,0,0,0.08)] overflow-hidden hover:shadow-[0_12px_32px_rgba(0,0,0,0.12)] transition-shadow flex flex-col">
      {/* Thumbnail */}
      <Link to={`/courses/${course.id}`}>
        <img
          src={thumb}
          alt={`${course.title} thumbnail`}
          className="w-full h-[180px] object-cover"
          loading="lazy"
        />
      </Link>
      <div className="absolute top-[10px] right-[10px] z-10">
        <FavoriteButton courseId={course.id} />
      </div>

      <div className="p-[14px] flex flex-col flex-1">
        {/* Title */}
        <h3 className="text-[16px] font-semibold leading-[1.35] mb-[6px]">
          {course.title}
        </h3>

        {/* ✅ Tutor link */}
        {(course?.seller_id || course?.tutor_name) && (
          <div className="text-[12px] text-[#475569] mb-[8px]">
            By{" "}
            {course?.seller_id ? (
              <Link
                to={`/sellers/${course.seller_id}`}
                onClick={(e) => e.stopPropagation()}
                className="text-[#4f46e5] font-semibold hover:underline"
              >
                {course.tutor_name || "Instructor"}
              </Link>
            ) : (
              <span className="font-semibold">{course.tutor_name}</span>
            )}
          </div>
        )}

        {/* Description */}
        <p className="text-[13px] text-[#475569] line-clamp-2 mb-[10px] flex-1">
          {course.description}
        </p>

        {/* Duration + Price */}
        <div className="flex items-center justify-between mb-[12px]">
          <div className="inline-flex items-center gap-[6px] text-[12px] text-[#334155]">
            <Clock size={16} />
            <span>{formatDuration(totalSeconds)}</span>
          </div>
          <div className="text-[14px] font-bold text-[#1e40af]">
            ${Number(course.price).toFixed(2)}
          </div>
        </div>

        {/* ✅ CTA */}
        <CourseCTA
          courseId={course.id}
          price={course.price}
          sellerId={course.seller_id}
        />
      </div>
    </div>
  );
};

export default CourseCard;