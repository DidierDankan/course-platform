import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, ExternalLink, Lock } from "lucide-react";
import { useGetSellerPublicQuery } from "@api/modules/publicApi";
import CourseCard from "@components/ui/CourseCard";

const API_BASE_URL = import.meta.env.VITE_API_URL;
const FALLBACK_NAME = "Instructor";

const normalizeMediaUrl = (p) => {
  if (!p) return "";
  // already absolute
  if (/^https?:\/\//i.test(p)) return p;

  // already starts with /
  if (p.startsWith("/")) return `${API_BASE_URL}${p}`;

  // filename only -> assume uploads
  return `${API_BASE_URL}/uploads/${p}`;
};

const ensureHttp = (url) => {
  if (!url) return "";
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
};

const initialsOf = (name) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");

// Falls back to initials when there's no photo or the file can't be loaded.
function InstructorAvatar({ src, name }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className="instructor-avatar instructor-initials" aria-hidden="true">
        {initialsOf(name)}
      </div>
    );
  }
  return <img className="instructor-avatar" src={src} alt="" loading="lazy" onError={() => setFailed(true)} />;
}

function InstructorDetails({ seller, skills, qualifications }) {
  return (
    <>
      {seller.bio && (
        <div className="instructor-block">
          <h3>About</h3>
          <p>{seller.bio}</p>
        </div>
      )}

      {seller.website && (
        <a className="instructor-link" href={ensureHttp(seller.website)} target="_blank" rel="noreferrer">
          <ExternalLink size={15} aria-hidden="true" />
          {seller.website}
        </a>
      )}

      {skills.length > 0 && (
        <div className="instructor-block">
          <h3>Skills</h3>
          <ul className="skill-list">
            {skills.map((skill) => (
              <li key={skill}>{skill}</li>
            ))}
          </ul>
        </div>
      )}

      {qualifications.length > 0 && (
        <div className="instructor-block">
          <h3>Qualifications</h3>
          <div className="qualification-list">
            {qualifications.map((q, idx) => (
              <div key={idx} className="qualification">
                <strong>{q.title}</strong>
                {q.institution && <span>{q.institution}</span>}
                {q.description && <p>{q.description}</p>}
                {q.certificate_url && (
                  <a href={ensureHttp(q.certificate_url)} target="_blank" rel="noreferrer">
                    View certificate
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

const SellerPublic = () => {
  const { sellerId } = useParams();
  const { data, isLoading, isError, error, refetch } = useGetSellerPublicQuery(sellerId, {
    skip: !sellerId,
  });

  const seller = data?.seller || null;
  const courses = Array.isArray(data?.courses) ? data.courses : [];
  const isAuthed = !!data?.isAuthenticated;

  const skills = useMemo(() => {
    const s = seller?.skills;
    return Array.isArray(s) ? s : [];
  }, [seller?.skills]);

  const qualifications = useMemo(() => {
    const q = seller?.qualifications;
    return Array.isArray(q) ? q : [];
  }, [seller?.qualifications]);

  if (isLoading) {
    return (
      <main className="page-main">
        <div className="page-inline-loader" role="status" aria-label="Loading instructor">
          <span className="spinner" aria-hidden="true" />
        </div>
      </main>
    );
  }

  // The server answered "no such instructor": nothing to retry.
  const notFound = error?.status === 404 || (!isError && data?.ok && !seller);

  if (!notFound && (isError || !data?.ok)) {
    return (
      <main className="page-main page-main-narrow">
        <div className="empty-state" role="alert">
          <h3>Couldn&apos;t load this instructor</h3>
          <p>Something went wrong on our side. Try again in a moment.</p>
          <button type="button" className="button button-secondary" onClick={refetch}>
            Try again
          </button>
        </div>
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="page-main page-main-narrow">
        <div className="empty-state">
          <h3>Instructor not found</h3>
          <p>This instructor doesn&apos;t exist or is no longer available.</p>
          <Link to="/courses" className="button button-secondary">
            Browse courses
          </Link>
        </div>
      </main>
    );
  }

  const name = seller.full_name || FALLBACK_NAME;

  return (
    <main className="page-main">
      <header className="page-heading">
        <span className="section-index">Instructor</span>
        <h1>{name}</h1>
        <p>Browse courses and learn from this instructor.</p>
      </header>

      <section className="panel instructor-profile" aria-label="Instructor profile">
        <InstructorAvatar src={normalizeMediaUrl(seller.profile_image)} name={name} />
        <div className="instructor-info">
          {isAuthed ? (
            <InstructorDetails seller={seller} skills={skills} qualifications={qualifications} />
          ) : (
            <div className="instructor-locked">
              <strong>
                <Lock size={16} aria-hidden="true" /> Instructor details are visible after login
              </strong>
              <p>Sign in to view bio, skills, qualifications and links.</p>
              <Link to="/auth/login" className="button button-secondary button-small">
                Sign in
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="instructor-section" aria-labelledby="instructor-courses">
        <div className="lesson-heading">
          <h2 id="instructor-courses">Courses by {name}</h2>
          <Link to="/courses" className="text-link">
            <span className="text-link-label">Browse all</span> <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>

        {courses.length === 0 ? (
          <div className="empty-state">
            <h3>No courses yet</h3>
            <p>This instructor hasn&apos;t published a course yet.</p>
          </div>
        ) : (
          <div className="course-list">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default SellerPublic;
