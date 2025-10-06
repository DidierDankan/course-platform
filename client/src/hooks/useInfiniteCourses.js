import { useEffect, useRef, useState } from "react";
import { useGetAllCoursesQuery } from "@api/modules/courseApi";

/**
 * Infinite scroll hook for paginated public courses.
 * Works with backend endpoint /api/courses/all?page={n}&limit=6
 */
export function useInfiniteCourses(limit = 6) {
  const [page, setPage] = useState(1);
  const [courses, setCourses] = useState([]);
  const loadMoreRef = useRef(null);

  // ✅ Call your RTK query with pagination
  const { data, isFetching, isError } = useGetAllCoursesQuery({ page, limit });

  // ✅ Append new courses each time `data` changes
  useEffect(() => {
    if (data && Array.isArray(data) && data.length > 0) {
      setCourses((prev) => {
        const newOnes = data.filter((c) => !prev.some((p) => p.id === c.id));
        return [...prev, ...newOnes];
      });
    }
  }, [data]);

  // ✅ Infinite scroll observer
  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || isFetching) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetching && data?.length >= limit) {
          setPage((p) => p + 1);
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [isFetching, data, limit]);

  const hasMore = data?.length >= limit;

  return {
    courses,
    isLoading: isFetching && courses.length === 0,
    isFetching,
    isError,
    hasMore,
    loadMoreRef,
  };
}
