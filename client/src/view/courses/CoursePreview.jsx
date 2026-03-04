import React, { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { BookOpen, Lock, Play, Clock } from "lucide-react";
import Spinner from "@components/ui/Spinner";
import CourseCTA from "@components/ui/CourseCTA";
import { useGetPublicCourseQuery } from "@api/modules/courseApi";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const formatDuration = (seconds) => {
  const s = Number(seconds);
  if (!s || Number.isNaN(s)) return "0s";

  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = Math.floor(s % 60);

  if (hrs > 0) return `${hrs}h ${mins}m`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
};

export default function CoursePreview() {
  const { id } = useParams();
  const courseId = Number(id);

  const { data, isLoading, isError, error, refetch } = useGetPublicCourseQuery(courseId, {
    skip: !courseId,
  });

  const course = data?.course;

  const previewLesson = useMemo(() => {
    const lessons = course?.lessons || [];
    return lessons.find((l) => l.is_preview === 1 && l.url) || null;
  }, [course?.lessons]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] pt-[72px]">
        <div className="max-w-[900px] mx-auto px-[20px] py-[28px]">
          <Spinner />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] pt-[72px]">
        <main className="max-w-[900px] mx-auto px-[20px] py-[28px]">
          <div className="bg-white border border-[#e2e8f0] rounded-[16px] p-[18px] shadow-[0_6px_18px_rgba(0,0,0,0.06)]">
            <div className="text-[18px] font-bold text-[#1e293b]">
              Couldn’t load course
            </div>
            <div className="mt-[6px] text-[14px] text-[#475569]">
              {error?.data?.message || error?.error || "Unknown error"}
            </div>
            <button
              onClick={refetch}
              className="mt-[14px] inline-flex rounded-[12px] bg-[#4f46e5] px-[14px] py-[10px] text-[13px] font-semibold text-white hover:opacity-95"
            >
              Retry
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (!course) return null;

  const thumbnail = course.thumbnail_url
    ? `${API_BASE_URL}${course.thumbnail_url}`
    : "https://images.unsplash.com/photo-1522199710521-72d69614c702?q=80&w=1600&auto=format&fit=crop";

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] pt-[72px]">
      <main className="max-w-[900px] mx-auto px-[20px] py-[28px]">
        {/* Badge + Heading */}
        <div className="text-center mb-[20px]">
          <div className="inline-flex items-center gap-[8px] text-[12px] uppercase tracking-[0.08em] text-[#475569] bg-[#e2e8f0] rounded-[999px] px-[10px] py-[4px] mb-[10px]">
            <BookOpen size={14} />
            <span>Course preview</span>
          </div>

          <h1 className="text-[28px] sm:text-[34px] font-extrabold leading-[1.2] text-[#1e293b]">
            {course.title}
          </h1>

          <p className="mt-[6px] text-[#475569] text-[15px]">
            {course.description || "No description provided."}
          </p>

          <div className="mt-[14px] flex flex-col sm:flex-row items-center justify-center gap-[10px]">
            <div className="flex items-center gap-[10px]">
              <CourseCTA
                courseId={course.id}
                price={course.price}
                sellerId={course.seller_id}
              />

              {/* ❤️ Favorite */}
              <FavoriteButton courseId={course.id} />
            </div>

            <Link
              to="/courses"
              className="text-[14px] text-[#4f46e5] font-medium hover:underline"
            >
              Back to courses
            </Link>
          </div>
        </div>

        {/* Preview player card */}
        <div className="bg-white border border-[#e2e8f0] shadow-[0_8px_24px_rgba(0,0,0,0.08)] rounded-[16px] overflow-hidden">
          <div className="aspect-video bg-black">
            {previewLesson?.url ? (
              <video
                src={`${API_BASE_URL}${previewLesson.url}`}
                controls
                className="w-full h-full"
              />
            ) : (
              <div className="w-full h-full relative">
                <img src={thumbnail} alt="Course thumbnail" className="w-full h-full object-cover opacity-90" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="inline-flex items-center gap-[10px] bg-black/55 text-white px-[14px] py-[10px] rounded-[14px]">
                    <Play size={18} />
                    <span className="text-[14px] font-semibold">No preview video available</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-[18px]">
            <div className="text-[14px] font-semibold text-[#1e293b]">
              What you’ll learn
            </div>
            <div className="mt-[6px] text-[14px] text-[#475569]">
              Preview one lesson below. The rest is locked until you purchase / enroll.
            </div>
          </div>
        </div>

        {/* Lessons list */}
        <section className="mt-[22px]">
          <div className="flex items-center justify-between mb-[12px]">
            <h2 className="text-[18px] sm:text-[20px] font-bold text-[#1e293b]">
              Lessons
            </h2>
            <div className="text-[13px] text-[#475569]">
              {course.lessons?.length || 0} lessons
            </div>
          </div>

          <div className="bg-white border border-[#e2e8f0] rounded-[16px] shadow-[0_6px_18px_rgba(0,0,0,0.06)] overflow-hidden">
            {(course.lessons || []).length ? (
              <ul className="divide-y divide-[#e2e8f0]">
                {(course.lessons || []).map((l) => {
                  const isPreview = l.is_preview === 1;
                  return (
                    <li key={l.id} className="p-[14px] flex items-start justify-between gap-[12px]">
                      <div className="min-w-0">
                        <div className="flex items-center gap-[8px]">
                          <div className="text-[13px] font-semibold text-[#1e293b] truncate">
                            {l.position ? `${l.position}. ` : ""}{l.title}
                          </div>

                          {isPreview ? (
                            <span className="text-[11px] font-semibold text-[#166534] bg-[#dcfce7] px-[8px] py-[2px] rounded-[999px]">
                              Preview
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-[6px] text-[11px] font-semibold text-[#475569] bg-[#f1f5f9] px-[8px] py-[2px] rounded-[999px]">
                              <Lock size={12} /> Locked
                            </span>
                          )}
                        </div>

                        {l.description ? (
                          <div className="mt-[4px] text-[13px] text-[#475569] line-clamp-2">
                            {l.description}
                          </div>
                        ) : null}
                      </div>

                      <div className="shrink-0 inline-flex items-center gap-[6px] text-[12px] text-[#334155]">
                        <Clock size={14} />
                        <span>{formatDuration(l.duration)}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="p-[16px] text-[14px] text-[#475569]">
                No lessons yet.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}