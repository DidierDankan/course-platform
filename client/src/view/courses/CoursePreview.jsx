import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Lock, Play, Clock } from "lucide-react";
import CourseCTA from "@components/ui/CourseCTA";
import { useGetPublicCourseQuery } from "@api/modules/courseApi";
import FavoriteButton from "@components/ui/FavoriteButton";
import { formatDuration } from "@utils/duration";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const CourseNotFound = () => (
  <main className="page-main page-main-narrow">
    <div className="empty-state">
      <h3>Course not found</h3>
      <p>This course doesn&apos;t exist or is no longer available.</p>
      <Link to="/courses" className="button button-secondary">
        Browse courses
      </Link>
    </div>
  </main>
);

function Lesson({ lesson }) {
  const isPreview = lesson.is_preview === 1;
  return (
    <li className="lesson">
      <div className="lesson-body">
        <div className="lesson-title">
          <strong>
            {lesson.order_index ? `${lesson.order_index}. ` : ""}
            {lesson.title}
          </strong>
          {isPreview ? (
            <span className="lesson-badge lesson-badge-preview">Preview</span>
          ) : (
            <span className="lesson-badge">
              <Lock size={11} aria-hidden="true" /> Locked
            </span>
          )}
        </div>
        {lesson.description && <p>{lesson.description}</p>}
      </div>
      <div className="lesson-duration">
        <Clock size={14} aria-hidden="true" />
        <span>{formatDuration(lesson.duration)}</span>
      </div>
    </li>
  );
}

export default function CoursePreview() {
  const { id } = useParams();
  const courseId = Number(id);
  // "abc", "1.5", "0" or "-3" can never be a course, so don't even ask the server.
  const isValidId = Number.isInteger(courseId) && courseId > 0;

  const { data, isLoading, isError, error, refetch } = useGetPublicCourseQuery(courseId, {
    skip: !isValidId,
  });

  const course = data?.course;
  const lessons = useMemo(() => course?.lessons ?? [], [course?.lessons]);
  const previewLesson = useMemo(() => lessons.find((l) => l.is_preview === 1 && l.url) ?? null, [lessons]);

  if (!isValidId) return <CourseNotFound />;

  if (isLoading) {
    return (
      <main className="page-main page-main-narrow">
        <div className="page-inline-loader" role="status" aria-label="Loading course">
          <span className="spinner" aria-hidden="true" />
        </div>
      </main>
    );
  }

  // The server answered "no such course": nothing to retry.
  if (isError && error?.status === 404) return <CourseNotFound />;

  if (isError) {
    return (
      <main className="page-main page-main-narrow">
        <div className="empty-state" role="alert">
          <h3>Couldn&apos;t load this course</h3>
          <p>Something went wrong on our side. Try again in a moment.</p>
          <button type="button" className="button button-secondary" onClick={refetch}>
            Try again
          </button>
        </div>
      </main>
    );
  }

  if (!course) return <CourseNotFound />;

  const thumbnail = course.thumbnail_url ? `${API_BASE_URL}${course.thumbnail_url}` : null;

  return (
    <main className="page-main page-main-narrow">
      <header className="page-heading">
        <span className="section-index">Course preview</span>
        <h1>{course.title}</h1>
        <p>{course.description || "No description provided."}</p>
      </header>

      <div className="preview-actions">
        <div className="preview-cta">
          <CourseCTA courseId={course.id} price={course.price} sellerId={course.seller_id} />
        </div>
        <FavoriteButton courseId={course.id} />
        <Link to="/courses" className="text-link">
          Back to courses
        </Link>
      </div>

      <section className="panel preview-player">
        <div className="preview-media">
          {previewLesson ? (
            <video src={`${API_BASE_URL}${previewLesson.url}`} controls />
          ) : (
            <>
              {thumbnail ? (
                <img className="course-image" src={thumbnail} alt="" />
              ) : (
                <div className="course-image course-image-fallback" />
              )}
              <div className="preview-note">
                <Play size={16} aria-hidden="true" />
                <span>No preview video available</span>
              </div>
            </>
          )}
        </div>
        <div className="preview-copy">
          <h2>What you&apos;ll get</h2>
          <p>
            {previewLesson
              ? "Watch the free lesson above. The rest unlocks when you enroll."
              : "This course has no free lesson yet. Its lessons unlock when you enroll."}
          </p>
        </div>
      </section>

      <section className="lesson-section" aria-labelledby="lessons-title">
        <div className="lesson-heading">
          <h2 id="lessons-title">Lessons</h2>
          <span>
            {lessons.length} {lessons.length === 1 ? "lesson" : "lessons"}
          </span>
        </div>
        <div className="panel lesson-panel">
          {lessons.length ? (
            <ul>
              {lessons.map((lesson) => (
                <Lesson key={lesson.id} lesson={lesson} />
              ))}
            </ul>
          ) : (
            <p className="lesson-empty">No lessons yet.</p>
          )}
        </div>
      </section>
    </main>
  );
}
