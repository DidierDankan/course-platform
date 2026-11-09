import { useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";

import { useGetCoursesQuery, useDeleteCourseMutation } from "@api/modules/courseApi";
import CourseModal from "@components/ui/CourseModal";
import Modal from "@components/ui/Modal";
import { formatPrice } from "@utils/currency";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const PortfolioPage = () => {
  const { profile } = useSelector((state) => state.user);
  const { data: courses, isLoading, isUninitialized, isError, refetch } = useGetCoursesQuery(profile?.id, {
    skip: !profile?.id,
  });
  const [deleteCourse, { isLoading: isDeleting }] = useDeleteCourseMutation();

  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const openEditor = (course) => {
    setSelectedCourse(course);
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setSelectedCourse(null);
    setEditorOpen(false);
  };

  const askToDelete = (course) => {
    setDeleteError(null);
    setCourseToDelete(course);
  };

  const confirmDelete = async () => {
    setDeleteError(null);
    try {
      await deleteCourse(courseToDelete.id).unwrap();
      setCourseToDelete(null);
    } catch (err) {
      setDeleteError(err?.data?.message || "Couldn't delete this course. Please try again.");
    }
  };

  const renderContent = () => {
    // Skipped until the profile arrives: that wait is loading too, not "no courses".
    if (isLoading || isUninitialized) {
      return (
        <div className="page-inline-loader" role="status" aria-label="Loading your courses">
          <span className="spinner" aria-hidden="true" />
        </div>
      );
    }

    if (isError) {
      return (
        <div className="empty-state" role="alert">
          <h3>Couldn&apos;t load your courses</h3>
          <p>Something went wrong on our side. Please try again.</p>
          <button type="button" className="button button-secondary" onClick={refetch}>
            Try again
          </button>
        </div>
      );
    }

    if (!courses?.length) {
      return (
        <div className="empty-state">
          <h3>No courses yet</h3>
          <p>Create your first course and it will show up here.</p>
          <button type="button" className="button button-primary" onClick={() => openEditor(null)}>
            Create your first course
          </button>
        </div>
      );
    }

    return (
      <div className="course-list">
        {courses.map((course) => (
          <article key={course.id} className="course-card">
            <div className="card-visual">
              {course.thumbnail_url ? (
                <img className="course-image" src={`${API_BASE_URL}${course.thumbnail_url}`} alt="" loading="lazy" />
              ) : (
                <div className="course-image course-image-fallback" />
              )}
            </div>
            <div className="card-body">
              <h3>{course.title}</h3>
              <p>{course.description}</p>
              <div className="card-meta">
                <span>{formatPrice(course.price)}</span>
                <span>
                  {course.videos.length} {course.videos.length === 1 ? "lesson" : "lessons"}
                </span>
              </div>
              <div className="portfolio-actions">
                <Link to={`/courses/${course.id}/watch`} className="button button-secondary button-small">
                  <Eye size={16} aria-hidden="true" /> View
                </Link>
                <button type="button" className="button button-secondary button-small" onClick={() => openEditor(course)}>
                  <Pencil size={16} aria-hidden="true" /> Edit
                </button>
                <button
                  type="button"
                  className="icon-button-danger"
                  onClick={() => askToDelete(course)}
                  aria-label={`Delete ${course.title}`}
                >
                  <Trash2 size={18} aria-hidden="true" />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    );
  };

  return (
    <main className="page-main">
      <div className="portfolio-head">
        <header className="page-heading">
          <span className="section-index">Your teaching portfolio</span>
          <h1>Manage your courses</h1>
          <p>Add, update or remove your published courses.</p>
        </header>
        <button type="button" className="button button-primary" onClick={() => openEditor(null)}>
          <Plus size={18} aria-hidden="true" /> Add course
        </button>
      </div>

      {renderContent()}

      <CourseModal open={editorOpen} onClose={closeEditor} course={selectedCourse} />

      <Modal
        open={!!courseToDelete}
        onClose={() => setCourseToDelete(null)}
        title="Delete this course?"
        footer={
          <>
            <button type="button" className="button button-secondary button-small" onClick={() => setCourseToDelete(null)}>
              Cancel
            </button>
            <button
              type="button"
              className={`button button-danger button-small ${isDeleting ? "is-loading" : ""}`}
              onClick={confirmDelete}
              disabled={isDeleting}
              aria-busy={isDeleting}
            >
              {isDeleting && <span className="spinner" aria-hidden="true" />}
              {isDeleting ? "Deleting…" : "Delete course"}
            </button>
          </>
        }
      >
        <p className="panel-note">
          &ldquo;{courseToDelete?.title}&rdquo; and all its lessons will be removed. This can&apos;t be undone.
        </p>
        {deleteError && (
          <p className="form-alert modal-alert" role="alert">
            {deleteError}
          </p>
        )}
      </Modal>
    </main>
  );
};

export default PortfolioPage;
