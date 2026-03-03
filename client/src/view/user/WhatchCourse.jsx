// src/pages/user/WatchCourse.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useWatchCourseQuery } from "@api/modules/courseApi"; // you'll add this endpoint
import { useUpdateProgressMutation } from "@api/modules/enrollmentApi";

export default function WatchCourse() {
  const { id } = useParams();
  const courseId = Number(id);

  const videoRef = useRef(null);
  const saveTimerRef = useRef(null);

  const { data, isLoading, isError } = useWatchCourseQuery(courseId);
  const [updateProgress] = useUpdateProgressMutation();

  const enrollment = data?.enrollment;
  const lessons = data?.lessons || [];

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

  // Seek to last position once metadata is loaded
  useEffect(() => {
    const el = videoRef.current;
    if (!el || !enrollment) return;

    const onLoaded = () => {
      const seconds = Number(enrollment.last_position_seconds || 0);
      if (seconds > 0 && seconds < el.duration) {
        el.currentTime = seconds;
      }
    };

    el.addEventListener("loadedmetadata", onLoaded);
    return () => el.removeEventListener("loadedmetadata", onLoaded);
  }, [activeLessonId, enrollment]);

  const debouncedSave = (payload) => {
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      updateProgress(payload);
    }, 800);
  };

  const handleTimeUpdate = () => {
    const el = videoRef.current;
    if (!el || !activeLessonId) return;

    const progress = el.duration ? Math.floor((el.currentTime / el.duration) * 100) : 0;

    debouncedSave({
      courseId,
      progress,
      completed: progress >= 98,
      lastWatchedMediaId: activeLessonId,
      lastPositionSeconds: Math.floor(el.currentTime),
    });
  };

  const handleEnded = async () => {
    if (!activeLessonId) return;

    await updateProgress({
      courseId,
      progress: 100,
      completed: true,
      lastWatchedMediaId: activeLessonId,
      lastPositionSeconds: 0,
    });

    // optional: auto-play next lesson
    const idx = lessons.findIndex((l) => l.id === activeLessonId);
    const next = lessons[idx + 1];
    if (next) setActiveLessonId(next.id);
  };

  if (isLoading) return <div className="p-6">Loading…</div>;
  if (isError) return <div className="p-6">Not allowed / error.</div>;
  if (!activeLesson) return <div className="p-6">No lessons found.</div>;

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="max-w-[1100px] mx-auto px-[20px] py-[24px] grid grid-cols-1 lg:grid-cols-[1fr,360px] gap-[18px]">
        <div className="bg-white border border-[#e2e8f0] rounded-[16px] p-[16px] shadow-[0_6px_18px_rgba(0,0,0,0.06)]">
          <h1 className="text-[20px] font-bold text-[#1e293b] mb-[10px]">
            {data.course?.title}
          </h1>

          <video
            ref={videoRef}
            src={activeLesson.url}
            controls
            className="w-full rounded-[12px] bg-black"
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
          />

          <div className="mt-[10px] text-[14px] text-[#475569]">
            {activeLesson.title || "Lesson"}
          </div>
        </div>

        <aside className="bg-white border border-[#e2e8f0] rounded-[16px] p-[16px] shadow-[0_6px_18px_rgba(0,0,0,0.06)]">
          <div className="text-[14px] font-semibold text-[#475569] mb-[10px]">
            Lessons
          </div>
          <div className="space-y-[8px]">
            {lessons.map((l) => (
              <button
                key={l.id}
                onClick={() => setActiveLessonId(l.id)}
                className={`w-full text-left rounded-[12px] border px-[12px] py-[10px] ${
                  l.id === activeLessonId
                    ? "border-[#4f46e5] bg-[#eef2ff]"
                    : "border-[#e2e8f0] bg-white hover:bg-[#f8fafc]"
                }`}
              >
                <div className="text-[14px] font-semibold text-[#0f172a]">
                  {l.title || `Lesson ${l.id}`}
                </div>
                {l.duration && (
                  <div className="text-[12px] text-[#64748b]">{l.duration} min</div>
                )}
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}