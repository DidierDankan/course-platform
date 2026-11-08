// src/view/courses/BrowseCourses.jsx
import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import CourseFilters from "@components/ui/CourseFilters";
import CourseCard from "@components/ui/CourseCard";
import CourseCardPlaceholders from "@components/ui/CourseCardPlaceholders";
import { useBrowseCoursesInfiniteQuery } from "@api/modules/courseApi";
import { useLoadMoreTrigger } from "@hooks/useLoadMoreTrigger";
import { EMPTY_FILTERS, parseFilters, serializeFilters, toApiParams } from "@utils/courseFilters";

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

  const {
    data,
    isError,
    isFetching,
    isFetchingNextPage,
    isFetchNextPageError,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useBrowseCoursesInfiniteQuery(apiParams);

  // While a new filter loads, `data` is still the previous filter's result: that's what stops the page
  // from emptying and collapsing. Empty and error states only ever reflect a finished request.
  const courses = useMemo(() => data?.pages.flat() ?? [], [data]);
  const isRefreshing = isFetching && !isFetchingNextPage;
  const loadFailed = isError && !isFetchNextPageError;

  // No automatic retry after a failed page: it would loop forever while the server is down.
  const loadMoreRef = useLoadMoreTrigger(fetchNextPage, hasNextPage && !isFetching && !isFetchNextPageError);

  let results;
  if (loadFailed && !isRefreshing) {
    results = (
      <div className="empty-state" role="alert">
        <h3>Courses didn&apos;t load</h3>
        <p>Something went wrong on our side. Try again in a moment.</p>
        <button type="button" className="button button-secondary" onClick={refetch}>
          Try again
        </button>
      </div>
    );
  } else if (courses.length > 0) {
    results = (
      <>
        <div className="course-list">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
        {hasNextPage && <div ref={loadMoreRef} className="load-more-trigger" />}
        {isFetchingNextPage && (
          <div className="results-more" role="status" aria-label="Loading more courses">
            <span className="spinner" aria-hidden="true" />
          </div>
        )}
        {isFetchNextPageError && !isFetchingNextPage && (
          <div className="results-more" role="alert">
            <p>Couldn&apos;t load more courses.</p>
            <button type="button" className="button button-secondary button-small" onClick={() => fetchNextPage()}>
              Try again
            </button>
          </div>
        )}
      </>
    );
  } else if (isRefreshing) {
    results = (
      <div className="course-list">
        <CourseCardPlaceholders />
      </div>
    );
  } else {
    results = (
      <div className="empty-state">
        <h3>No courses match</h3>
        <p>Try a different search or remove a filter.</p>
        <button type="button" className="button button-secondary" onClick={() => onFiltersChange(EMPTY_FILTERS)}>
          Clear filters
        </button>
      </div>
    );
  }

  const showRefreshing = isRefreshing && courses.length > 0;

  return (
    <main className="page-main">
      <header className="page-heading">
        <span className="section-index">Browse courses</span>
        <h1>Find your next lesson</h1>
        <p>Search, filter, and pick the right course for you.</p>
      </header>

      <CourseFilters value={filters} onChange={onFiltersChange} />

      <section className={`results ${showRefreshing ? "is-refreshing" : ""}`} aria-label="Courses" aria-busy={isFetching}>
        {showRefreshing && (
          <div className="results-status" role="status" aria-label="Updating results">
            <span className="spinner" aria-hidden="true" />
          </div>
        )}
        {results}
      </section>
    </main>
  );
}
