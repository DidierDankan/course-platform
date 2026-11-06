import { Link } from "react-router-dom";
import { Play } from "lucide-react";
import CourseCTA from "@components/ui/CourseCTA";
import FavoriteButton from "@components/ui/FavoriteButton";
import { formatPrice } from "@utils/currency";
import { formatDuration } from "@utils/duration";

const API_BASE_URL = import.meta.env.VITE_API_URL;
const NEW_COURSE_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

// Only labels the data can back up: no invented "Bestseller".
function courseLabel(course) {
  if (Number(course.price) === 0) return "Free";
  const created = Date.parse(course.created_at);
  if (Number.isFinite(created) && Date.now() - created < NEW_COURSE_DAYS * DAY_MS) return "New";
  return null;
}

// Markup and class names from the reference (design/*/src/App.tsx CourseCard).
const CourseCard = ({ course }) => {
  const previewUrl = `/courses/${course.id}`;
  const thumb = course.thumbnail_url ? `${API_BASE_URL}${course.thumbnail_url}` : null;
  const label = courseLabel(course);

  return (
    <article className="course-card">
      <div className="card-visual">
        <Link to={previewUrl} aria-label={`Preview ${course.title}`}>
          {thumb ? (
            <img className="course-image" src={thumb} alt="" loading="lazy" />
          ) : (
            <div className="course-image course-image-fallback" />
          )}
          <span className="preview-play" aria-hidden="true">
            <Play size={16} />
          </span>
        </Link>
        {label && <span className="card-label">{label}</span>}
        <FavoriteButton courseId={course.id} />
      </div>

      <div className="card-body">
        <h3>
          <Link to={previewUrl}>{course.title}</Link>
        </h3>
        {course.seller_id ? (
          <Link to={`/sellers/${course.seller_id}`} className="instructor">
            By {course.tutor_name || "Instructor"}
          </Link>
        ) : (
          course.tutor_name && <span className="instructor">By {course.tutor_name}</span>
        )}
        <p>{course.description}</p>
        <div className="card-meta">
          <span>{formatDuration(course.total_duration)}</span>
          <span>Self-paced</span>
          <span>{formatPrice(course.price)}</span>
        </div>
        <CourseCTA courseId={course.id} price={course.price} sellerId={course.seller_id} />
      </div>
    </article>
  );
};

export default CourseCard;
