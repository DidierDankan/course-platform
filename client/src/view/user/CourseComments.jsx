import { useState } from "react";
import { LIMITS } from "@utils/form/limits";
import {
  useCourseCommentsInfiniteQuery,
  useDeleteCommentMutation,
  usePostCommentMutation,
} from "@api/modules/commentApi";

const timeFormat = new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

// The course's discussion, under the video on the watch page (only enrolled students, the owner and admins reach it,
// and the server checks again). Text is rendered as plain text by React, never as HTML.
export default function CourseComments({ courseId }) {
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useCourseCommentsInfiniteQuery(courseId);
  const comments = (data?.pages ?? []).flatMap((page) => page.comments);

  return (
    <section className="comments" aria-labelledby="comments-title">
      <h2 id="comments-title">Discussion</h2>
      <CommentForm courseId={courseId} />

      {isLoading && (
        <div className="page-inline-loader" role="status" aria-label="Loading comments">
          <span className="spinner" aria-hidden="true" />
        </div>
      )}
      {isError && (
        <div role="alert">
          <p>Couldn&apos;t load the discussion.</p>
          <button type="button" className="button button-secondary button-small" onClick={refetch}>
            Try again
          </button>
        </div>
      )}
      {!isLoading && !isError && comments.length === 0 && (
        <p className="review-empty">No comments yet. Ask a question or share how it went.</p>
      )}

      {comments.length > 0 && (
        <ul className="review-list">
          {comments.map((comment) => (
            <Comment key={comment.id} comment={comment} courseId={courseId} />
          ))}
        </ul>
      )}

      {hasNextPage && (
        <button type="button" className="button button-secondary button-small" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
          {isFetchingNextPage ? "Loading…" : "Show older comments"}
        </button>
      )}
    </section>
  );
}

function Comment({ comment, courseId }) {
  const [deleteComment, { isLoading, isError }] = useDeleteCommentMutation();
  return (
    <li className="review">
      <div className="review-head">
        <strong>{comment.author}</strong>
        {comment.isInstructor && <span className="card-label comment-badge">Instructor</span>}
        <time dateTime={comment.created_at}>{timeFormat.format(new Date(comment.created_at))}</time>
        {comment.canDelete && (
          <button
            type="button"
            className="text-link comment-delete"
            onClick={() => deleteComment({ commentId: comment.id, courseId })}
            disabled={isLoading}
          >
            Delete
          </button>
        )}
      </div>
      <p className="review-body">{comment.body}</p>
      {isError && (
        <p className="review-form-note is-error" role="alert">
          Couldn&apos;t delete this comment.
        </p>
      )}
    </li>
  );
}

function CommentForm({ courseId }) {
  const [body, setBody] = useState("");
  const [error, setError] = useState(null);
  const [postComment, { isLoading }] = usePostCommentMutation();

  const onSubmit = async (event) => {
    event.preventDefault();
    const text = body.trim();
    if (!text) return;
    try {
      await postComment({ courseId, body: text }).unwrap();
      setBody("");
      setError(null);
    } catch (err) {
      setError(err?.data?.errors?.[0] || err?.data?.message || "Couldn't post your comment.");
    }
  };

  return (
    <form className="comment-form" onSubmit={onSubmit}>
      <label className="field">
        <span>Add to the discussion</span>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={LIMITS.commentBody} rows={3} disabled={isLoading} />
      </label>
      {error && (
        <p className="review-form-note is-error" role="alert">
          {error}
        </p>
      )}
      <div className="review-form-actions">
        <button type="submit" className={`button button-primary button-small ${isLoading ? "is-loading" : ""}`} disabled={isLoading || !body.trim()}>
          Post comment
        </button>
      </div>
    </form>
  );
}
