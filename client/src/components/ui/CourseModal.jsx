import { useRef } from "react";
import { Formik, Form } from "formik";
import { useAddCourseMutation, useUpdateCourseMutation } from "@api/modules/courseApi";
import { getVideoDuration } from "@utils/form/profile/getVideoDuration";
import { courseHandler } from "@utils/form/profile/courseHandler";
import { CourseSchema } from "@utils/form/profile/courseValidation";
import Modal from "@components/ui/Modal";
import FormField from "@components/ui/Form/FormField";
import CourseVideos from "@components/ui/CourseVideos";
import useObjectUrl from "@hooks/useObjectUrl";
import { CURRENCY } from "@utils/currency";
import { formatDuration } from "@utils/duration";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const toAbsoluteUrl = (url) => (url?.startsWith("http") ? url : `${API_BASE_URL}${url}`);

const normalizeVideos = (videos) =>
  videos.map((v) => ({
    id: v.id,
    file: null, // already uploaded
    url: toAbsoluteUrl(v.url),
    mimetype: v.type,
    title: v.title || "",
    description: v.description || "",
    duration: v.duration,
  }));

function ThumbnailField({ file, currentUrl, onPick }) {
  const inputRef = useRef(null);
  const localUrl = useObjectUrl(file);
  const preview = localUrl ?? (currentUrl ? `${API_BASE_URL}${currentUrl}` : null);

  return (
    <div>
      <span className="field-label">Thumbnail</span>
      <div className="thumbnail-field">
        <div className="thumbnail-preview">
          {preview ? (
            <img className="course-image" src={preview} alt="Course thumbnail" />
          ) : (
            <div className="course-image course-image-fallback" />
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          aria-label="Course thumbnail"
          onChange={(e) => {
            if (e.target.files[0]) onPick(e.target.files[0]);
          }}
        />
        <button type="button" className="button button-secondary button-small" onClick={() => inputRef.current.click()}>
          {preview ? "Change image" : "Upload image"}
        </button>
      </div>
    </div>
  );
}

const CourseModal = ({ open, onClose, course }) => {
  const [addCourse] = useAddCourseMutation();
  const [updateCourse] = useUpdateCourseMutation();

  const isEdit = !!course;

  const handleVideosChange = async (e, setFieldValue, values) => {
    const newFiles = await Promise.all(
      Array.from(e.target.files).map(async (file) => {
        const duration = await getVideoDuration(file);
        return { file, title: "", description: "", duration };
      })
    );
    setFieldValue("videos", [...values.videos, ...newFiles]);
  };

  const handleRemoveVideo = (index, setFieldValue, values) => {
    const removed = values.videos[index];

    setFieldValue("videos", values.videos.filter((_, i) => i !== index));

    // An uploaded lesson also has to be deleted on the server when the course is saved.
    if (removed?.id && !removed?.file) {
      setFieldValue("removedVideoIds", [...(values.removedVideoIds || []), removed.id]);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit course" : "Add course"} size="lg">
      <Formik
        enableReinitialize
        initialValues={{
          title: course?.title || "",
          description: course?.description || "",
          price: course?.price ?? "",
          thumbnail: null, // only a newly picked file; the current image is shown from the course
          videos: course?.videos ? normalizeVideos(course.videos) : [],
          removedVideoIds: [],
        }}
        validationSchema={CourseSchema}
        onSubmit={(values, helpers) =>
          courseHandler(
            values,
            isEdit ? { updateCourse, courseId: course.id } : { addCourse },
            helpers,
            onClose
          )
        }
      >
        {({ values, setFieldValue, isSubmitting, status }) => {
          const totalDuration = values.videos.reduce((sum, v) => sum + (v.duration || 0), 0);

          return (
            <Form
              className="seller-form"
              onKeyDown={(e) => {
                // Enter in a one-line field shouldn't save the whole course by accident.
                if (e.key === "Enter" && e.target.tagName === "INPUT") e.preventDefault();
              }}
            >
              <FormField name="title" label="Course title" />
              <FormField name="description" label="Description" as="textarea" rows={4} />
              <FormField
                name="price"
                label={`Price (${CURRENCY.code})`}
                type="number"
                min="0"
                step="0.01"
                hint="0 makes the course free"
              />

              <ThumbnailField
                file={values.thumbnail}
                currentUrl={course?.thumbnail_url}
                onPick={(file) => setFieldValue("thumbnail", file)}
              />

              <CourseVideos
                videos={values.videos}
                onRemove={(index) => handleRemoveVideo(index, setFieldValue, values)}
                onAdd={(e) => handleVideosChange(e, setFieldValue, values)}
              />
              {totalDuration > 0 && <p className="panel-note">Total course length: {formatDuration(totalDuration)}</p>}

              {status && (
                <p className="form-alert" role="alert">
                  {status}
                </p>
              )}

              <div className="form-actions form-actions-end">
                <button type="button" className="button button-secondary button-small" onClick={onClose}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  aria-busy={isSubmitting}
                  className={`button button-primary button-small ${isSubmitting ? "is-loading" : ""}`}
                >
                  {isSubmitting && <span className="spinner" aria-hidden="true" />}
                  {isSubmitting ? "Saving…" : isEdit ? "Update course" : "Save course"}
                </button>
              </div>
            </Form>
          );
        }}
      </Formik>
    </Modal>
  );
};

export default CourseModal;
