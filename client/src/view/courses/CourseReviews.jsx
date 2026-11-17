import { Star } from "lucide-react";
import Rating from "@components/ui/Rating";
import { useCourseReviewsInfiniteQuery } from "@api/modules/reviewApi";

const dateFormat = new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" });

// The public list of a course's reviews, newest first, with "Show more". React escapes the text: a review is
// rendered as plain text, never as HTML.
export default function CourseReviews({ courseId }) {
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useCourseReviewsInfiniteQuery(courseId);

  const pages = data?.pages ?? [];
  const reviews = pages.flatMap((page) => page.reviews);
  const summary = pages[0]?.summary;

  return (
    <section className="lesson-section" aria-labelledby="reviews-title">
      <div className="lesson-heading">
        <h2 id="reviews-title">Reviews</h2>
        {summary && <Rating average={summary.average} count={summary.count} emptyText="No reviews yet" />}
      </div>

      <div className="panel">
        {isLoading && (
          <div className="page-inline-loader" role="status" aria-label="Loading reviews">
            <span className="spinner" aria-hidden="true" />
          </div>
        )}

        {isError && (
          <div role="alert">
            <p>Couldn&apos;t load the reviews.</p>
            <button type="button" className="button button-secondary button-small" onClick={refetch}>
              Try again
            </button>
          </div>
        )}

        {!isLoading && !isError && reviews.length === 0 && (
          <p className="review-empty">No reviews yet. Students who enroll can rate this course from the lesson page.</p>
        )}

        {reviews.length > 0 && (
          <ul className="review-list">
            {reviews.map((review) => (
              <li key={review.id} className="review">
                <div className="review-head">
                  <span className="review-stars" aria-label={`${review.rating} out of 5`}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star key={i} size={14} aria-hidden="true" className={i < review.rating ? "is-on" : undefined} />
                    ))}
                  </span>
                  <strong>{review.author}</strong>
                  <time dateTime={review.created_at}>{dateFormat.format(new Date(review.created_at))}</time>
                </div>
                {review.body && <p className="review-body">{review.body}</p>}
              </li>
            ))}
          </ul>
        )}

        {hasNextPage && (
          <button
            type="button"
            className="button button-secondary button-small"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? "Loading…" : "Show more reviews"}
          </button>
        )}
      </div>
    </section>
  );
}
