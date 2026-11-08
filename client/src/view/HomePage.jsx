import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { ArrowRight, Play, Search } from "lucide-react";
import { useGetAllCoursesQuery } from "@api/modules/courseApi";
import CourseCard from "@components/ui/CourseCard";
import CourseCardPlaceholders from "@components/ui/CourseCardPlaceholders";
import CourseCarousel from "@components/ui/CourseCarousel";
import { APP_NAME } from "@utils/brand";

const API_BASE_URL = import.meta.env.VITE_API_URL;

// Home shows a fixed set in a carousel (CLAUDE.md "Phase 2 decisions"); the full, filterable list is /courses.
const POPULAR_LIMIT = 8;

// The featured course is simply the most popular one, so one request feeds both the hero
// and the row: no second limit=1 call for the same data.
function Hero({ featured }) {
  const thumb = featured?.thumbnail_url ? `${API_BASE_URL}${featured.thumbnail_url}` : null;

  return (
    <div className="hero-media">
      {thumb ? (
        <img className="course-image" src={thumb} alt="" fetchPriority="high" />
      ) : (
        <div className="course-image course-image-fallback" aria-hidden="true" />
      )}
      <div className="hero-shade" />
      <div className="hero-content">
        <div className="hero-kicker">
          <span className="live-dot" aria-hidden="true" /> Big skills. Zero boring.
        </div>
        <h1>
          Learn from people who <em>live</em> the craft.
        </h1>
        <p>Brilliant video courses from independent makers. Buy once, learn your way, keep forever.</p>
        <div className="hero-actions">
          <Link className="button button-primary" to="/courses">
            <Play size={15} aria-hidden="true" /> Explore courses
          </Link>
          {featured && (
            <Link className="trailer-button" to={`/courses/${featured.id}`}>
              <span>
                <Play size={14} aria-hidden="true" />
              </span>
              Preview the featured course
            </Link>
          )}
        </div>
      </div>
      {featured && (
        <Link className="hero-side-note" to={`/courses/${featured.id}`}>
          <span>Featured</span>
          <strong>{featured.title}</strong>
          {featured.tutor_name && <small>with {featured.tutor_name}</small>}
        </Link>
      )}
    </div>
  );
}

function SearchDock() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const onSubmit = (event) => {
    event.preventDefault();
    const q = query.trim();
    navigate(q ? `/courses?${new URLSearchParams({ q })}` : "/courses");
  };

  return (
    <div className="search-dock">
      <form className="search-bar" role="search" onSubmit={onSubmit}>
        <Search size={20} aria-hidden="true" />
        <label className="sr-only" htmlFor="course-search">
          Search courses, skills, or instructors
        </label>
        <input
          id="course-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search courses, skills, or instructors"
          maxLength={100}
        />
        <button type="submit">
          <span className="search-label">Search</span> <ArrowRight size={16} aria-hidden="true" />
        </button>
      </form>
    </div>
  );
}

function PopularCourses({ courses, isLoading, isError, refetch }) {
  let content;
  if (isLoading) {
    content = (
      <div className="course-list" aria-busy="true" aria-label="Loading courses">
        <CourseCardPlaceholders />
      </div>
    );
  } else if (isError) {
    content = (
      <div className="empty-state" role="alert">
        <h3>Courses didn&apos;t load</h3>
        <p>Something went wrong on our side. Try again in a moment.</p>
        <button type="button" className="button button-secondary" onClick={refetch}>
          Try again
        </button>
      </div>
    );
  } else if (courses.length === 0) {
    content = (
      <div className="empty-state">
        <h3>No courses yet</h3>
        <p>The first instructors are setting up. Want to be one of them?</p>
        <Link className="button button-secondary" to="/auth/register">
          Teach on {APP_NAME} <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    );
  } else {
    content = (
      <CourseCarousel label="Popular courses">
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </CourseCarousel>
    );
  }

  return (
    <section className="courses-section" id="popular" aria-labelledby="popular-title">
      <div className="section-heading">
        <div>
          <span className="section-index">01 / Popular courses</span>
          <h2 id="popular-title">Find your next obsession.</h2>
        </div>
        <Link className="text-link" to="/courses">
          <span className="text-link-label">View all courses</span> <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </div>
      {content}
    </section>
  );
}

function TeachSection() {
  const { user } = useSelector((s) => s.auth);
  const isInstructor = user?.role === "seller" || user?.role === "admin";

  return (
    <section className="teach-section" aria-labelledby="teach-title">
      <div className="teach-number" aria-hidden="true">
        <Play size={20} />
      </div>
      <div>
        <span className="section-index">Teach on {APP_NAME}</span>
        <h2 id="teach-title">
          Your knowledge.
          <br />
          Your rules.
        </h2>
      </div>
      <div className="teach-copy">
        <p>
          Build a course on your terms. We give independent instructors the tools and support to turn deep
          expertise into courses people want to finish.
        </p>
        {isInstructor ? (
          <Link className="button button-ink" to="/profile/portfolio">
            Go to your courses <ArrowRight size={17} aria-hidden="true" />
          </Link>
        ) : (
          <Link className="button button-ink" to="/auth/register">
            Become an instructor <ArrowRight size={17} aria-hidden="true" />
          </Link>
        )}
      </div>
    </section>
  );
}

export default function HomePage() {
  const { data, isLoading, isError, refetch } = useGetAllCoursesQuery({ limit: POPULAR_LIMIT, sort: "popular" });
  const courses = Array.isArray(data) ? data : [];

  return (
    <main>
      <section className="hero">
        <Hero featured={courses[0]} />
        <SearchDock />
      </section>
      <PopularCourses courses={courses} isLoading={isLoading} isError={isError} refetch={refetch} />
      <TeachSection />
    </main>
  );
}
