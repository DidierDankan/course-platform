// src/view/courses/BrowseCourses.jsx
import { useState } from "react";
import { BookOpen } from "lucide-react";
import CourseFilters from "@components/ui/CourseFilters";
import CourseCard from "@components/ui/CourseCard";
import Spinner from "@components/ui/Spinner";
import { useInfiniteCourses } from "@hooks/useInfiniteCourses";

export default function BrowseCourses() {
  const [filters, setFilters] = useState({
    q: "",
    sort: "newest",
    minPrice: "",
    maxPrice: "",
    free: "",
    subscriptionOnly: "",
    durationBucket: "",
  });

  const { courses, isLoading, isError, hasMore, loadMoreRef } = useInfiniteCourses(12, filters);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] pt-[72px]">
      <main className="max-w-[1100px] mx-auto px-[16px] py-[20px]">
        {/* Header */}
        <div className="text-center mb-[18px]">
          <div className="inline-flex items-center gap-[8px] text-[12px] uppercase tracking-[0.08em] text-[#475569] bg-[#e2e8f0] rounded-[999px] px-[10px] py-[4px] mb-[10px]">
            <BookOpen size={14} />
            <span>Browse courses</span>
          </div>
          <h1 className="text-[26px] sm:text-[32px] font-extrabold leading-[1.15] text-[#1e293b]">
            Find your next lesson
          </h1>
          <p className="mt-[6px] text-[14px] text-[#475569]">
            Search, filter, and pick the right course for you.
          </p>
        </div>

        {/* Filters */}
        <CourseFilters value={filters} onChange={setFilters} />

        {/* Results */}
        <section className="mt-[16px]">
          {isLoading && courses.length === 0 ? (
            <Spinner />
          ) : isError ? (
            <div className="text-[#b91c1c] text-[14px] mt-[12px]">Failed to load courses.</div>
          ) : courses.length === 0 ? (
            <div className="bg-white border border-[#e2e8f0] rounded-[16px] p-[18px] shadow-[0_6px_18px_rgba(0,0,0,0.06)] text-[14px] text-[#475569] mt-[12px]">
              No courses match your filters.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[14px] mt-[12px]">
                {courses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>

              {hasMore && (
                <div ref={loadMoreRef} className="mt-[16px] h-[1px] bg-transparent" />
              )}

              {isLoading && courses.length > 0 && (
                <div className="mt-[14px] flex justify-center">
                  <Spinner />
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}