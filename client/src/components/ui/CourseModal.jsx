import { useCallback } from "react";
import { Formik, Form } from "formik";
import { useAddCourseMutation, useUpdateCourseMutation } from "@api/modules/courseApi";
import { getVideoDuration } from "@utils/form/profile/getVideoDuration";
import { courseHandler } from "@utils/form/profile/courseHandler";
import Modal from "@components/ui/Modal";
import FormikInput from "./Form/FormikInput";
import CourseVideos from "./CourseVideos";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const CourseModal = ({ open, onClose, course }) => {
    const [addCourse, { isLoading: isSaving }] = useAddCourseMutation();
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

        // remove from list
        setFieldValue("videos", values.videos.filter((_, i) => i !== index));

        // if it's an existing DB item (has id and no file), schedule deletion
        if (removed?.id && !removed?.file) {
            setFieldValue("removedVideoIds", [
            ...(values.removedVideoIds || []),
            removed.id,
            ]);
        }
    };

    const handleUpdateVideoField = useCallback((index, field, value, values, setFieldValue) => {
        const updated = values.videos.map((v, i) =>
            i === index ? { ...v, [field]: value } : v
        );
        setFieldValue("videos", updated);
    }, []);

    const normalizeVideos = (videos) =>
        videos.map((v) => ({
            id: v.id,
            file: null,           // no file since it’s already uploaded
            url: v.url?.startsWith("http")
            ? v.url
            : `${API_BASE_URL}${v.url}`,           // 👈 keep backend URL
            mimetype:v.type,
            title: v.title || "", // if your DB stores these
            description: v.description || "",
            duration: v.duration,
        })
    );

    const formatDuration = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    };

    return (
        <Modal open={open} onClose={onClose} title="Add Course" size="xl">
            <Formik
                enableReinitialize
                initialValues={{
                    title: course?.title || "",
                    description: course?.description || "",
                    price: course?.price || "",
                    thumbnail: null, // don’t prefill with file, only preview
                    videos: course?.videos ? normalizeVideos(course.videos) : [], // adapt if API returns video data
                    removedVideoIds: [],
                }}
                onSubmit={(values, formikHelpers) => {
                    if (isEdit) {
                    courseHandler(
                        values,
                        { updateCourse, courseId: course.id },
                        formikHelpers.resetForm,
                        onClose
                    );
                    } else {
                    courseHandler(values, { addCourse }, formikHelpers.resetForm, onClose);
                    }
                }}
            >
                {({ values, setFieldValue }) => {
                    const totalDuration = values.videos.reduce(
                        (sum, v) => sum + (v.duration || 0),
                        0
                    );

                    return (
                        <Form
                        className="space-y-4"
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && e.target.tagName !== "TEXTAREA") {
                            e.preventDefault(); 
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
                            {values.thumbnail ? (
                                <img
                                    src={URL.createObjectURL(values.thumbnail)}
                                    alt="Thumbnail preview"
                                    className="mt-[8px] w-[250px] h-[150px] object-cover rounded-md border"
                                />
                            ) : course?.thumbnail_url ? (
                                <img
                                    src={`${API_BASE_URL}${course.thumbnail_url}`}
                                    alt="Current thumbnail"
                                    className="mt-[8px] w-[250px] h-[150px] object-cover rounded-md border"
                                />
                            ) : null}
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
                        {totalDuration > 0 && (
                            <p className="text-gray-600 text-sm mt-[8px]">
                            Total course length: {formatDuration(totalDuration)}
                            </p>
                        )}

                        <div className="flex justify-end gap-2 pt-4">
                            <button type="button" className="btn-secondary mr-[5px]" onClick={onClose}>
                                Cancel
                            </button>
                            <button type="submit" disabled={isSaving} className="btn-primary">
                                {isSaving ? "Saving..." : isEdit ? "Update Course" : "Save Course"}
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
