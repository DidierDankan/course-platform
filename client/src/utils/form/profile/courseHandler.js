// utils/form/buildCourseFormData.js
const buildCourseFormData = (values) => {
  const formData = new FormData();

  formData.append("title", values.title);
  formData.append("description", values.description);
  formData.append("price", values.price);

  if (values.thumbnail) {
    formData.append("thumbnail", values.thumbnail);
  }

  values.videos.forEach((v) => {
    formData.append("videos", v.file); // ✅ key must match upload.fields()
    formData.append("meta[]", JSON.stringify({
      title: v.title,
      description: v.description,
      duration: v.duration,
    }));
  });

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
