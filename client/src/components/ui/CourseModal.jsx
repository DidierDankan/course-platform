import { useCallback } from "react";
import { Formik, Form } from "formik";
import { useAddCourseMutation } from "@api/modules/courseApi";
import { getVideoDuration } from "@utils/form/profile/getVideoDuration";
import { courseHandler } from "@utils/form/profile/courseHandler";
import Modal from "@components/ui/Modal";
import FormikInput from "./Form/FormikInput";
import CourseVideos from "./CourseVideos";

const CourseModal = ({ open, onClose }) => {
    const [addCourse, { isLoading: isSaving }] = useAddCourseMutation();

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
        setFieldValue(
            "videos",
            values.videos.filter((_, i) => i !== index)
        );
    };

    const handleUpdateVideoField = useCallback((index, field, value, values, setFieldValue) => {
        const updated = values.videos.map((v, i) =>
            i === index ? { ...v, [field]: value } : v
        );
        setFieldValue("videos", updated);
    }, []);


  return (
    <Modal open={open} onClose={onClose} title="Add Course" size="xl">
      <Formik
        initialValues={{
          title: "",
          description: "",
          price: "",
          thumbnail: null,
          videos: [], // ✅ we track videos here
        }}
        onSubmit={(values, formikHelpers) =>
            courseHandler(values, { addCourse }, formikHelpers.resetForm, onClose)
        }
      >
        {({ values, setFieldValue }) => {

            return (
                <Form
                className="space-y-4"
                onKeyDown={(e) => {
                    if (e.key === "Enter" && e.target.tagName !== "TEXTAREA") {
                    e.preventDefault(); // 🚫 block form submit on Enter
                    }
                }}
                >
                <FormikInput name="title" label="Course Title" />
                <FormikInput name="description" label="Description" as="textarea" />
                <FormikInput name="price" label="Price (USD)" type="number" />

                {/* ✅ Thumbnail Upload */}
                <div>
                    <label className="block font-medium mb-1">Course Thumbnail</label>
                    <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFieldValue("thumbnail", e.target.files[0])}
                    />
                    {values.thumbnail && (
                    <img
                        src={URL.createObjectURL(values.thumbnail)}
                        alt="Thumbnail preview"
                        className="mt-2 w-[250px] h-[150px] object-cover rounded-md border"
                    />
                    )}
                </div>

                {/* ✅ Videos Upload */}
                <CourseVideos
                    videos={values.videos}
                    onRemove={(index) => handleRemoveVideo(index, setFieldValue, values)}
                    onUpdate={(index, field, value) =>
                    handleUpdateVideoField(index, field, value, values, setFieldValue)
                    }
                    onAdd={(e) => handleVideosChange(e, setFieldValue, values)}
                />

                <div className="flex justify-end gap-2 pt-4">
                    <button type="button" className="btn-secondary" onClick={onClose}>
                    Cancel
                    </button>
                    <button type="submit" disabled={isSaving} className="btn-primary">
                    {isSaving ? "Saving..." : "Save Course"}
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
