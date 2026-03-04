// src/hooks/useInfiniteCourses.js
import { useEffect, useMemo, useRef, useState } from "react";
import { useGetAllCoursesQuery } from "@api/modules/courseApi";

export const useInfiniteCourses = (limit = 6, filters = {}) => {
  const [page, setPage] = useState(1);
  const [all, setAll] = useState([]);
  const loadMoreRef = useRef(null);

  const queryArgs = useMemo(
    () => ({ page, limit, ...filters }),
    [page, limit, filters]
  );

  const { data, isLoading, isError, error } = useGetAllCoursesQuery(queryArgs);

  // reset when filters change
  useEffect(() => {
    setPage(1);
    setAll([]);
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    if (Array.isArray(data)) {
      setAll((prev) => (page === 1 ? data : [...prev, ...data]));
    }
  }, [data, page]);

  const hasMore = (data?.length || 0) === limit;

  useEffect(() => {
    if (!loadMoreRef.current) return;

    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !isLoading) {
        setPage((p) => p + 1);
      }
    });

    obs.observe(loadMoreRef.current);
    return () => obs.disconnect();
  }, [hasMore, isLoading]);

  return { courses: all, isLoading, isError, error, hasMore, loadMoreRef };
};