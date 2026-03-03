import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useWatchCourseQuery } from "@api/modules/courseApi";
import { useUpdateProgressMutation } from "@api/modules/enrollmentApi";
import { PlayCircle, ListVideo } from "lucide-react";

const API_ORIGIN = import.meta.env.VITE_API_URL || "http://localhost:3001";

export const toAbsoluteUrl = (url) => {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;     // already absolute
  if (url.startsWith("/")) return `${API_ORIGIN}${url}`; // "/uploads/.."
  return `${API_ORIGIN}/${url}`;
};

export default function WatchCourse() {
  const { id } = useParams();
  const courseId = Number(id);

  const videoRef = useRef(null);
  const saveTimer = useRef(null);

  const { data, isLoading, isError, error } = useWatchCourseQuery(courseId);
  const [updateProgress] = useUpdateProgressMutation();

  const course = data?.course;
  const lessons = Array.isArray(data?.lessons) ? data.lessons : [];
  const enrollment = data?.enrollment;

  console.log("COURSE", course)

  const initialLessonId = useMemo(() => {
    if (!lessons.length) return null;
    return enrollment?.last_watched_media_id || lessons[0].id;
  }, [lessons, enrollment?.last_watched_media_id]);

  const [activeLessonId, setActiveLessonId] = useState(null);

  useEffect(() => {
    if (initialLessonId) setActiveLessonId(initialLessonId);
  }, [initialLessonId]);

  const activeLesson = useMemo(
    () => lessons.find((l) => l.id === activeLessonId),
    [lessons, activeLessonId]
  );

  // Seek to last saved position when metadata loads
  useEffect(() => {
    const el = videoRef.current;
    if (!el || !enrollment || !activeLesson) return;

    const onLoaded = () => {
      const seconds = Number(enrollment.last_position_seconds || 0);
      if (seconds > 0 && el.duration && seconds < el.duration) {
        el.currentTime = seconds;
      }
    };

    el.addEventListener("loadedmetadata", onLoaded);
    return () => el.removeEventListener("loadedmetadata", onLoaded);
  }, [activeLessonId, enrollment, activeLesson]);

  const debouncedSave = (payload) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => updateProgress(payload), 900);
  };

  const handleTimeUpdate = () => {
    const el = videoRef.current;
    if (!el || !activeLessonId) return;

    const current = Math.floor(el.currentTime || 0);
    if (current <= 0) return; // avoid spamming 0

    const duration = el.duration || 0;
    const lessonPct = duration ? Math.floor((current / duration) * 100) : 0;

    debouncedSave({
      courseId,
      completed: lessonPct >= 98,           // ✅ only mark completed near the end
      lastWatchedMediaId: activeLessonId,   // ✅ current lesson
      lastPositionSeconds: current,         // ✅ resume point
    });
  };

  const handleEnded = async () => {
    const el = videoRef.current;

    await updateProgress({
      courseId,
      completed: true,                      // ✅ ended = completed
      lastWatchedMediaId: activeLessonId,
      lastPositionSeconds: 0,               // ✅ reset on completion
    });

    // Auto-next lesson
    const idx = lessons.findIndex((l) => l.id === activeLessonId);
    const next = lessons[idx + 1];
    if (next) setActiveLessonId(next.id);
  };

  console.log("ACTIVE LESSON", activeLesson)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc]">
        <div className="animate-pulse space-y-4 mt-8 max-w-[1100px] mx-auto px-[20px] py-[28px]">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-[320px] bg-gray-200 rounded-[16px]" />
          <div className="h-[220px] bg-gray-200 rounded-[16px]" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-[#0f172a]">
        <main className="max-w-[900px] mx-auto px-[20px] py-[28px]">
          <div className="bg-white border border-[#e2e8f0] rounded-[16px] p-[18px] shadow-[0_6px_18px_rgba(0,0,0,0.06)]">
            <div className="text-[18px] font-bold text-[#1e293b]">
              Can’t open this course
            </div>
            <div className="mt-[6px] text-[14px] text-[#475569]">
              {error?.data?.message || error?.error || "Unknown error"}
            </div>
            <div className="mt-[12px]">
              <Link to="/user/dashboard" className="text-[14px] text-[#4f46e5] font-medium hover:underline">
                Back to dashboard
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!course || !activeLesson) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-[#0f172a]">
        <main className="max-w-[900px] mx-auto px-[20px] py-[28px]">
          <div className="bg-white border border-[#e2e8f0] rounded-[16px] p-[18px]">
            No lessons found for this course.
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a]">
      <main className="max-w-[1100px] mx-auto px-[20px] py-[28px] grid grid-cols-1 lg:grid-cols-[1fr,360px] gap-[16px]">
        {/* Player */}
        <section className="bg-white border border-[#e2e8f0] rounded-[16px] p-[18px] shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
          <div className="flex items-start justify-between gap-[10px]">
            <div>
              <div className="inline-flex items-center gap-[8px] text-[12px] uppercase tracking-[0.08em] text-[#475569] bg-[#e2e8f0] rounded-[999px] px-[10px] py-[4px] mb-[10px]">
                <PlayCircle size={14} />
                <span>Now watching</span>
              </div>

              <h1 className="text-[20px] sm:text-[24px] font-extrabold text-[#1e293b] leading-[1.2]">
                {course.title}
              </h1>

              <p className="mt-[6px] text-[#475569] text-[14px]">
                {activeLesson.title}
              </p>
            </div>

            <Link
              to="/user/courses"
              className="text-[14px] text-[#4f46e5] font-medium hover:underline"
            >
              My courses
            </Link>
          </div>

          <div className="mt-[14px]">
            <video
              ref={videoRef}
              src={toAbsoluteUrl(activeLesson?.url)}
              controls
              className="w-full rounded-[12px] bg-black"
              onPause={handleTimeUpdate}
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleEnded}
            />
          </div>

          {activeLesson.description && (
            <div className="mt-[12px] text-[14px] text-[#475569] leading-relaxed">
              {activeLesson.description}
            </div>
          )}
        </section>

        {/* Lessons */}
        <aside className="bg-white border border-[#e2e8f0] rounded-[16px] p-[18px] shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
          <div className="flex items-center gap-[8px] mb-[12px]">
            <div className="h-[34px] w-[34px] rounded-[12px] bg-[#eef2ff] text-[#4f46e5] flex items-center justify-center">
              <ListVideo size={18} />
            </div>
            <div>
              <div className="text-[12px] uppercase tracking-[0.08em] text-[#64748b]">
                Lessons
              </div>
              <div className="text-[14px] font-bold text-[#0f172a]">
                {lessons.length} items
              </div>
            </div>
          </div>

          <div className="space-y-[10px]">
            {lessons.map((l) => {
              const active = l.id === activeLessonId;
              return (
                <button
                  key={l.id}
                  onClick={() => setActiveLessonId(l.id)}
                  className={`w-full text-left rounded-[12px] border px-[12px] py-[10px] transition ${
                    active
                      ? "border-[#4f46e5] bg-[#eef2ff]"
                      : "border-[#e2e8f0] bg-white hover:bg-[#f8fafc]"
                  }`}
                >
                  <div className="text-[14px] font-semibold text-[#0f172a] truncate">
                    {l.title || `Lesson ${l.order_index + 1}`}
                  </div>
                  {l.duration != null && (
                    <div className="text-[12px] text-[#64748b] mt-[2px]">
                      {l.duration} min
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </aside>
      </main>
    </div>
  );
}