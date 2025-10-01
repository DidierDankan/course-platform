// utils/form/buildCourseFormData.js
export const buildCourseFormData = (values) => {
  const formData = new FormData();

  formData.append("title", values.title ?? "");
  formData.append("description", values.description ?? "");
  formData.append("price", values.price ?? "");

  if (values.thumbnail) {
    formData.append("thumbnail", values.thumbnail);
  }

  const newFiles = [];
  const newMetas = [];
  const existing = [];
  const deleted = values.removedVideoIds || [];

  values.videos.forEach((v) => {
    if (v.file) {
      // NEW upload
      newFiles.push(v.file);
      newMetas.push({
        title: v.title ?? "",
        description: v.description ?? "",
        duration: v.duration ?? null,
      });
    } else if (v.id && !v.file) {
      // EXISTING (metadata-only update)
      existing.push({
        id: v.id,
        title: v.title ?? "",
        description: v.description ?? "",
        duration: v.duration ?? null,
      });
    }
  });

  // Append all new files first
  newFiles.forEach((file) => formData.append("videos", file));
  // Then metas in matching order
  newMetas.forEach((meta) => formData.append("meta[]", JSON.stringify(meta)));

  // Existing (metadata-only)
  existing.forEach((v) =>
    formData.append("existingVideos[]", JSON.stringify(v))
  );

  // Deletions
  deleted.forEach((id) =>
    formData.append("deletedVideos[]", String(id))
  );

  return formData;
};

export const courseHandler = async (values, { addCourse, updateCourse, courseId }, resetForm, onClose) => {
  try {
    const formData = buildCourseFormData(values);

    if (courseId) {
      // UPDATE existing course
      await updateCourse({ id: courseId, formData }).unwrap();
    } else {
      // CREATE new course
      await addCourse(formData).unwrap();
    }

    resetForm();
    onClose();
  } catch (err) {
    console.error("Failed to save course:", err);
  }
};
