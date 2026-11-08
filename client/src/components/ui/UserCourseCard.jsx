import { Link } from "react-router-dom";
import { BookOpen, PlayCircle } from "lucide-react";
import ProgressBar from "@components/ui/ProgressBar";

const UserCourseCard = ({ course, actionLabel = "Continue", actionTo, variant = "default" }) => {
  const Icon = variant === "continue" ? PlayCircle : BookOpen;

  return (
    <div className="panel user-course">
      <div className="user-course-body">
        <div className="user-course-title">
          <div className="stat-icon" aria-hidden="true">
            <Icon size={18} />
          </div>
          <h3>{course.title}</h3>
        </div>
        {"progress" in course && <ProgressBar value={course.progress} />}
      </div>

      {actionTo && (
        <Link to={actionTo} className="button button-primary button-small">
          {actionLabel}
        </Link>
      )}
    </div>
  );
};

export default UserCourseCard;
