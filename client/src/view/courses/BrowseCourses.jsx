// src/view/courses/BrowseCourses.jsx
import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { BookOpen } from "lucide-react";
import CourseFilters from "@components/ui/CourseFilters";
import CourseCard from "@components/ui/CourseCard";
import Spinner from "@components/ui/Spinner";
import { useBrowseCoursesInfiniteQuery } from "@api/modules/courseApi";
import { useLoadMoreTrigger } from "@hooks/useLoadMoreTrigger";
import { parseFilters, serializeFilters, toApiParams } from "@utils/courseFilters";

export default function BrowseCourses() {
  // The URL is the only copy of the filters: shareable, and Back / reload just work.
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => parseFilters(searchParams), [searchParams]);
  const apiParams = useMemo(() => toApiParams(filters), [filters]);

  // replace: typing updates the current history entry, so Back doesn't undo one keystroke at a time.
  const onFiltersChange = useCallback(
    (next, { replace = false } = {}) => setSearchParams(serializeFilters(next), { replace }),
    [setSearchParams]
  );

  const { data, isLoading, isError, isFetching, isFetchNextPageError, hasNextPage, fetchNextPage } =
    useBrowseCoursesInfiniteQuery(apiParams);
  const courses = useMemo(() => data?.pages.flat() ?? [], [data]);
  // No automatic retry after a failed page: it would loop forever while the server is down.
  const loadMoreRef = useLoadMoreTrigger(fetchNextPage, hasNextPage && !isFetching && !isFetchNextPageError);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a]">
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
        <CourseFilters value={filters} onChange={onFiltersChange} />

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

              {hasNextPage && (
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