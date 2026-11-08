import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { useWatchCourseQuery } from "@api/modules/courseApi";
import { useUpdateProgressMutation } from "@api/modules/enrollmentApi";
import { ListVideo } from "lucide-react";
import { formatDuration } from "@utils/duration";

const API_ORIGIN = import.meta.env.VITE_API_URL;

const toAbsoluteUrl = (url) => {
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

  const role = useSelector((s) => s.auth.user?.role);
  // Sellers watch their own courses here, but /user/courses is a student-only route.
  const backLink = role === "seller"
    ? { to: "/profile/portfolio", label: "My portfolio" }
    : { to: "/user/courses", label: "My courses" };

  const { data, isLoading, isError, error } = useWatchCourseQuery(courseId);
  const [updateProgress] = useUpdateProgressMutation();

  const course = data?.course;
  // Memoized so the [] fallback is the same array every render (stable useMemo deps below).
  const lessons = useMemo(() => (Array.isArray(data?.lessons) ? data.lessons : []), [data?.lessons]);
  const enrollment = data?.enrollment;

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

  // Seek to the saved position when metadata loads, but only in the lesson that position belongs to.
  useEffect(() => {
    const el = videoRef.current;
    if (!el || !enrollment || !activeLesson) return;
    if (activeLesson.id !== enrollment.last_watched_media_id) return;

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
    if (!enrollment) return; // owner/admin preview: nothing to save
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
      completed: lessonPct >= 98,           // only mark completed near the end
      lastWatchedMediaId: activeLessonId,   // current lesson
      lastPositionSeconds: current,         // resume point
    });
  };

  const handleEnded = async () => {
    if (enrollment) {
      await updateProgress({
        courseId,
        completed: true,                      // ended = completed
        lastWatchedMediaId: activeLessonId,
        lastPositionSeconds: 0,               // reset on completion
      });
    }

    // Auto-next lesson
    const idx = lessons.findIndex((l) => l.id === activeLessonId);
    const next = lessons[idx + 1];
    if (next) setActiveLessonId(next.id);
  };

  if (isLoading) {
    return (
      <main className="page-main">
        <div className="page-inline-loader" role="status" aria-label="Loading course">
          <span className="spinner" aria-hidden="true" />
        </div>
      </main>
    );
  }

  if (isError) {
    const notEnrolled = error?.status === 403;
    return (
      <main className="page-main page-main-narrow">
        <div className="empty-state" role="alert">
          <h3>Can&apos;t open this course</h3>
          <p>
            {notEnrolled
              ? "You need to enroll in this course before you can watch it."
              : "It may not exist any more, or something went wrong on our side."}
          </p>
          <Link to={notEnrolled ? `/courses/${courseId}` : "/courses"} className="button button-secondary">
            {notEnrolled ? "View the course" : "Browse courses"}
          </Link>
        </div>
      </main>
    );
  }

  if (!course || !activeLesson) {
    return (
      <main className="page-main page-main-narrow">
        <div className="empty-state">
          <h3>No lessons yet</h3>
          <p>This course doesn&apos;t have any lessons to watch yet.</p>
          <Link to={backLink.to} className="button button-secondary">
            {backLink.label}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page-main watch-layout">
      <section className="panel" aria-label="Video player">
        <div className="watch-head">
          <header className="page-heading">
            <span className="section-index">Now watching</span>
            <h1>{course.title}</h1>
            <p>{activeLesson.title}</p>
          </header>
          <Link to={backLink.to} className="text-link">
            {backLink.label}
          </Link>
        </div>

        <video
          ref={videoRef}
          src={toAbsoluteUrl(activeLesson?.url)}
          controls
          className="watch-video"
          onPause={handleTimeUpdate}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
        />

        {activeLesson.description && <p className="watch-description">{activeLesson.description}</p>}
      </section>

      <aside className="panel" aria-label="Lessons">
        <div className="watch-lessons-title">
          <div className="stat-icon" aria-hidden="true">
            <ListVideo size={18} />
          </div>
          <div>
            <div className="stat-label">Lessons</div>
            <strong>
              {lessons.length} {lessons.length === 1 ? "lesson" : "lessons"}
            </strong>
          </div>
        </div>

        <ul className="watch-lessons">
          {lessons.map((l, index) => (
            <li key={l.id}>
              <button
                type="button"
                className="watch-lesson"
                aria-current={l.id === activeLessonId}
                onClick={() => setActiveLessonId(l.id)}
              >
                <strong>{l.title || `Lesson ${index + 1}`}</strong>
                {l.duration != null && <small>{formatDuration(l.duration)}</small>}
              </button>
            </li>
          ))}
        </ul>
      </aside>
    </main>
  );
}
