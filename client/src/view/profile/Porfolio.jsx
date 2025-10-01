import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useGetCoursesQuery, useDeleteCourseMutation } from "@api/modules/courseApi";
import { Plus, Pencil, Trash2 } from "lucide-react";

import Header from "@components/ui/Header";
import CourseModal from "@components/ui/CourseModal";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const PortfolioPage = () => {
  const { profile } = useSelector((state) => state.user);
  const { data: courses, isLoading } = useGetCoursesQuery(profile?.id, {
    skip: !profile?.id,
  });
  const [deleteCourse, { isLoading: isDeleting }] = useDeleteCourseMutation();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const handleEdit = (course) => {
    setSelectedCourse(course);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedCourse(null);
    setModalOpen(true);
  };

  const handlecancel = () => {
    setSelectedCourse(null);
    setModalOpen(false);
  };


  const handleDelete = async (course) => {
    if (!confirm(`Are you sure you want to delete "${course.title}"?`)) return;

    try {
      await deleteCourse(course.id).unwrap();
    } catch (err) {
      console.error("Failed to delete course:", err);
      alert("Failed to delete course. Please try again.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4">
        <Header />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Courses</h1>
        <button
          onClick={handleAdd}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} /> Add Course
        </button>
      </div>

      {isLoading ? (
        <p>Loading...</p>
      ) : !courses?.length ? (
        <p className="text-gray-500 text-sm">
          You haven’t added any courses yet.
        </p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {courses.map((course) => (
            <div
              key={course.id}
              className="rounded-lg border border-gray-200 p-4 shadow-sm bg-white"
            >
              {/* ✅ Thumbnail */}
              {course.thumbnail_url && (
                <img
                  src={`${API_BASE_URL}${course.thumbnail_url}`}
                  alt={`${course.title} thumbnail`}
                  className="w-24 h-24 object-cover rounded-md border"
                />
              )}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{course.title}</h2>
                  <p className="text-gray-600 text-sm mt-1">
                    {course.description}
                  </p>
                  <p className="mt-2 font-medium text-blue-700">
                    ${course.price}
                  </p>
                </div>
                <div>
                  <button
                    onClick={() => handleEdit(course)}
                    className="p-1 text-gray-600 hover:text-blue-600 mr-[15px]"
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(course)}
                    className="p-1 text-red-600 hover:text-red-800 disabled:opacity-50"
                    title="Delete course"
                    disabled={isDeleting}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Add/Edit */}
      <CourseModal open={modalOpen} onClose={handlecancel} course={selectedCourse} />
    </div>
  );
};

export default PortfolioPage;
