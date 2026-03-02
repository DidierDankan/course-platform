import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useGetCoursesQuery, useDeleteCourseMutation } from "@api/modules/courseApi";
import { Plus, Pencil, Trash2, BookOpen } from "lucide-react";

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

  const handleCancel = () => {
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
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a]">

      <main className="max-w-[1000px] mx-auto px-[20px] py-[28px]">
        {/* Heading */}
        <div className="text-center mb-[24px]">
          <div className="inline-flex items-center gap-[8px] text-[12px] uppercase tracking-[0.08em] text-[#475569] bg-[#e2e8f0] rounded-[999px] px-[10px] py-[4px] mb-[10px]">
            <BookOpen size={14} />
            <span>Your Teaching Portfolio</span>
          </div>

          <h1 className="text-[28px] sm:text-[32px] font-extrabold leading-[1.15] text-[#1e293b]">
            Manage Your Courses
          </h1>
          <p className="mt-[6px] text-[14px] text-[#475569]">
            Add, update, or remove your published courses.
          </p>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between mb-[20px]">
          <h2 className="text-[18px] font-bold text-[#1e293b]">My Courses</h2>
          <button
            onClick={handleAdd}
            className="inline-flex items-center gap-[8px] bg-[#4f46e5] hover:bg-[#4338ca] text-white font-medium text-[14px] px-[14px] py-[8px] rounded-[8px] shadow-[0_4px_12px_rgba(79,70,229,0.2)] transition"
          >
            <Plus size={16} />
            Add Course
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="text-center text-[#475569] py-[40px]">Loading...</div>
        ) : !courses?.length ? (
          <div className="text-center py-[60px] bg-white border border-[#e2e8f0] rounded-[12px] shadow-[0_6px_24px_rgba(0,0,0,0.06)]">
            <p className="text-[15px] text-[#475569]">
              You haven’t added any courses yet.
            </p>
            <button
              onClick={handleAdd}
              className="mt-[16px] bg-[#4f46e5] hover:bg-[#4338ca] text-white px-[18px] py-[10px] rounded-[8px] text-[14px] shadow-[0_4px_12px_rgba(79,70,229,0.2)]"
            >
              Create your first course
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-[18px]">
            {courses.map((course) => (
              <div
                key={course.id}
                className="rounded-[14px] border border-[#e2e8f0] bg-white shadow-[0_6px_24px_rgba(0,0,0,0.08)] hover:shadow-[0_10px_32px_rgba(0,0,0,0.12)] transition p-[16px]"
              >
                {/* Thumbnail */}
                {course.thumbnail_url && (
                  <img
                    src={`${API_BASE_URL}${course.thumbnail_url}`}
                    alt={`${course.title} thumbnail`}
                    className="w-full h-[160px] object-cover rounded-[10px] border border-[#e2e8f0] mb-[12px]"
                  />
                )}

                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-[8px]">
                    <h2 className="text-[16px] font-semibold text-[#1e293b] leading-tight">
                      {course.title}
                    </h2>
                    <p className="text-[13px] text-[#475569] mt-[6px] line-clamp-2">
                      {course.description}
                    </p>
                    <p className="mt-[10px] text-[15px] font-bold text-[#4f46e5]">
                      ${course.price}
                    </p>
                  </div>

                  <div className="flex gap-[10px]">
                    <button
                      onClick={() => handleEdit(course)}
                      className="p-[6px] text-[#334155] hover:text-[#4f46e5] transition"
                      title="Edit"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(course)}
                      className="p-[6px] text-[#dc2626] hover:text-[#b91c1c] transition disabled:opacity-50"
                      title="Delete"
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

        {/* Modal */}
        <CourseModal
          open={modalOpen}
          onClose={handleCancel}
          course={selectedCourse}
        />
      </main>
    </div>
  );
};

export default PortfolioPage;
