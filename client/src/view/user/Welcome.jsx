import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { BookOpen, Trophy } from "lucide-react";
import { useGetMyDashboardQuery } from "@api/modules/dashboardApi";
import StatCard from "@components/ui/StatCard";
import UserCourseCard from "@components/ui/UserCourseCard";

export default function UserDashboard() {
  const { profile, isLoading: profileLoading } = useSelector((s) => s.user || {});
  const { data, isLoading, isError, refetch } = useGetMyDashboardQuery();

  const name = profile?.full_name || "Student";

  if (profileLoading || isLoading) {
    return (
      <main className="page-main page-main-narrow">
        <div className="page-inline-loader" role="status" aria-label="Loading your dashboard">
          <span className="spinner" aria-hidden="true" />
        </div>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="page-main page-main-narrow">
        <div className="empty-state" role="alert">
          <h3>Couldn&apos;t load your dashboard</h3>
          <p>Something went wrong on our side. Try again in a moment.</p>
          <button type="button" className="button button-secondary" onClick={refetch}>
            Try again
          </button>
        </div>
      </main>
    );
  }

  const stats = data?.stats || { enrolled: 0, completed: 0 };
  const continueLearning = data?.continueLearning || null;
  const myCourses = Array.isArray(data?.myCourses) ? data.myCourses : [];
  const favorites = Array.isArray(data?.favorites) ? data.favorites : [];

  return (
    <main className="page-main page-main-narrow">
      <header className="page-heading">
        <span className="section-index">Student dashboard</span>
        <h1>Welcome back, {name}</h1>
        <p>Your learning progress and shortcuts.</p>
      </header>

      <div className="stat-grid">
        <StatCard icon={BookOpen} label="Enrolled courses" value={stats.enrolled ?? 0} />
        <StatCard icon={Trophy} label="Completed courses" value={stats.completed ?? 0} />
      </div>

      <section className="student-section" aria-labelledby="continue-title">
        <div className="lesson-heading">
          <h2 id="continue-title">Continue learning</h2>
        </div>
        {continueLearning ? (
          <UserCourseCard
            course={continueLearning}
            variant="continue"
            actionLabel="Continue"
            actionTo={`/courses/${continueLearning.course_id}/watch`}
          />
        ) : (
          <div className="panel">
            <p className="panel-note">You don&apos;t have any courses yet. Browse the catalog to start learning.</p>
            <Link to="/courses" className="button button-primary button-small">
              Browse courses
            </Link>
          </div>
        )}
      </section>

      <section className="student-section" aria-labelledby="my-courses-title">
        <div className="lesson-heading">
          <h2 id="my-courses-title">My courses</h2>
          <Link to="/user/courses" className="text-link">
            See all
          </Link>
        </div>
        {myCourses.length ? (
          <div className="user-course-grid">
            {myCourses.map((c) => (
              <UserCourseCard
                key={c.course_id}
                course={c}
                actionLabel="Continue"
                actionTo={`/courses/${c.course_id}/watch`}
              />
            ))}
          </div>
        ) : (
          <div className="panel">
            <p className="panel-note">No courses yet.</p>
          </div>
        )}
      </section>

      <section className="student-section" aria-labelledby="favorites-title">
        <div className="lesson-heading">
          <h2 id="favorites-title">Favorites</h2>
          <Link to="/user/favorites" className="text-link">
            See all
          </Link>
        </div>
        {favorites.length ? (
          <div className="user-course-grid">
            {favorites.map((f) => (
              <UserCourseCard key={f.course_id} course={f} actionLabel="View" actionTo={`/courses/${f.course_id}`} />
            ))}
          </div>
        ) : (
          <div className="panel">
            <p className="panel-note">No favorites yet. Tap the heart on any course to save it.</p>
          </div>
        )}
      </section>
    </main>
  );
}
