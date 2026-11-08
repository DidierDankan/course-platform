import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { ArrowRight, Clock } from "lucide-react";
import { useGetMyEnrollmentsQuery } from "@api/modules/enrollmentApi";
import ProgressBar from "@components/ui/ProgressBar";
import { formatPrice } from "@utils/currency";

const API_BASE_URL = import.meta.env.VITE_API_URL;

function MyCourseCard({ item }) {
  const thumb = item.thumbnail_url ? `${API_BASE_URL}${item.thumbnail_url}` : null;

  return (
    <article className="panel my-course">
      <div className="my-course-image">
        {thumb ? (
          <img className="course-image" src={thumb} alt="" loading="lazy" />
        ) : (
          <div className="course-image course-image-fallback" />
        )}
      </div>

      <div className="my-course-body">
        <div className="my-course-head">
          <div>
            <h3>{item.title}</h3>
            {item.description && <p>{item.description}</p>}
          </div>
          <Link to={`/courses/${item.course_id}/watch`} className="button button-primary button-small">
            Continue <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>

        <ProgressBar value={item.progress} />

        <div className="my-course-meta">
          <span>
            <Clock size={12} aria-hidden="true" /> Last update:{" "}
            {item.updated_at ? new Date(item.updated_at).toLocaleDateString() : "—"}
          </span>
          <span>{formatPrice(item.price)}</span>
        </div>
      </div>
    </article>
  );
}

export default function MyCourses() {
  const { profile } = useSelector((s) => s.user || {});
  const { data, isLoading, isError, refetch } = useGetMyEnrollmentsQuery();

  const enrollments = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.enrollments)) return data.enrollments;
    return [];
  }, [data]);

  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return enrollments;
    return enrollments.filter((e) => {
      const title = (e.title || "").toLowerCase();
      const desc = (e.description || "").toLowerCase();
      return title.includes(query) || desc.includes(query);
    });
  }, [enrollments, q]);

  const name = profile?.full_name || "Student";

  if (isLoading) {
    return (
      <main className="page-main page-main-narrow">
        <div className="page-inline-loader" role="status" aria-label="Loading your courses">
          <span className="spinner" aria-hidden="true" />
        </div>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="page-main page-main-narrow">
        <div className="empty-state" role="alert">
          <h3>Couldn&apos;t load your courses</h3>
          <p>Something went wrong on our side. Try again in a moment.</p>
          <button type="button" className="button button-secondary" onClick={refetch}>
            Try again
          </button>
        </div>
      </main>
    );
  }

  let list;
  if (filtered.length) {
    list = (
      <div className="my-course-list">
        {filtered.map((e) => (
          <MyCourseCard key={e.course_id} item={e} />
        ))}
      </div>
    );
  } else if (enrollments.length) {
    list = (
      <div className="empty-state">
        <h3>No matches</h3>
        <p>None of your courses match that search.</p>
        <button type="button" className="button button-secondary" onClick={() => setQ("")}>
          Clear search
        </button>
      </div>
    );
  } else {
    list = (
      <div className="empty-state">
        <h3>No courses yet</h3>
        <p>Courses you buy or enroll in will show up here.</p>
        <Link to="/courses" className="button button-secondary">
          Browse courses
        </Link>
      </div>
    );
  }

  return (
    <main className="page-main page-main-narrow">
      <header className="page-heading">
        <span className="section-index">My courses</span>
        <h1>{name}&apos;s courses</h1>
        <p>Pick up where you left off.</p>
      </header>

      {enrollments.length > 0 && (
        <label className="field my-search">
          <span>Search your courses</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search your courses…"
            maxLength={100}
          />
        </label>
      )}

      {list}
    </main>
  );
}
