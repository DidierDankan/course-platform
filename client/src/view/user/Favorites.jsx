import { Link } from "react-router-dom";
import CourseCard from "@components/ui/CourseCard";
import CourseCardPlaceholders from "@components/ui/CourseCardPlaceholders";
import { useGetMyFavoritesQuery } from "@api/modules/favoritesApi";

export default function FavoritesPage() {
  const { data, isLoading, isError, refetch } = useGetMyFavoritesQuery();
  const favorites = data?.favorites || [];

  let content;
  if (isLoading) {
    content = (
      <div className="course-list" aria-busy="true" aria-label="Loading favorites">
        <CourseCardPlaceholders />
      </div>
    );
  } else if (isError) {
    content = (
      <div className="empty-state" role="alert">
        <h3>Couldn&apos;t load your favorites</h3>
        <p>Something went wrong on our side. Try again in a moment.</p>
        <button type="button" className="button button-secondary" onClick={refetch}>
          Try again
        </button>
      </div>
    );
  } else if (favorites.length === 0) {
    content = (
      <div className="empty-state">
        <h3>No favorites yet</h3>
        <p>Click the heart on any course to save it here.</p>
        <Link to="/courses" className="button button-secondary">
          Browse courses
        </Link>
      </div>
    );
  } else {
    content = (
      <div className="course-list">
        {favorites.map((c) => (
          <CourseCard key={c.course_id || c.id} course={{ ...c, id: c.course_id ?? c.id }} />
        ))}
      </div>
    );
  }

  return (
    <main className="page-main">
      <header className="page-heading">
        <span className="section-index">Favorites</span>
        <h1>Saved courses</h1>
        <p>Your bookmarked courses in one place.</p>
      </header>
      {content}
    </main>
  );
}
