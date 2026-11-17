import { useState } from "react";
import StarInput from "@components/ui/StarInput";
import { LIMITS } from "@utils/form/limits";
import { useDeleteReviewMutation, useMyReviewQuery, useSaveReviewMutation } from "@api/modules/reviewApi";

// The enrolled student's review of this course, on the watch page. The server decides who may review (enrolled,
// not the owner); this form only shows for an enrollment. One review per course: saving again replaces it.
export default function ReviewForm({ courseId }) {
  const { data, isLoading, isError } = useMyReviewQuery(courseId);
  if (isLoading) return null; // the player is the page's content; the form appears when ready
  if (isError) {
    return (
      <p className="review-form-note" role="alert">
        Couldn&apos;t load your review. Reload the page to try again.
      </p>
    );
  }
  // key: a fresh form when the saved review changes, so the fields start from what is stored
  const saved = data?.review ?? null;
  return <ReviewFields key={saved ? `${saved.id}-${saved.updated_at}` : "new"} courseId={courseId} saved={saved} />;
}

function ReviewFields({ courseId, saved }) {
  const [rating, setRating] = useState(saved?.rating ?? null);
  const [body, setBody] = useState(saved?.body ?? "");
  const [message, setMessage] = useState(null);
  const [saveReview, { isLoading: saving }] = useSaveReviewMutation();
  const [deleteReview, { isLoading: deleting }] = useDeleteReviewMutation();
  const busy = saving || deleting;

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!rating) {
      setMessage({ kind: "error", text: "Choose a rating from 1 to 5 stars." });
      return;
    }
    try {
      await saveReview({ courseId, rating, body: body.trim() || null }).unwrap();
      setMessage({ kind: "ok", text: saved ? "Your review was updated." : "Thanks! Your review is published." });
    } catch (err) {
      setMessage({ kind: "error", text: err?.data?.errors?.[0] || err?.data?.message || "Couldn't save your review." });
    }
  };

  const onDelete = async () => {
    try {
      await deleteReview({ courseId }).unwrap();
    } catch (err) {
      setMessage({ kind: "error", text: err?.data?.message || "Couldn't delete your review." });
    }
  };

  return (
    <form className="review-form" onSubmit={onSubmit} aria-labelledby="review-form-title">
      <h2 id="review-form-title">{saved ? "Your review" : "Rate this course"}</h2>
      <StarInput name={`rating-${courseId}`} value={rating} onChange={setRating} disabled={busy} />
      <label className="field">
        <span>What did you think? (optional)</span>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={LIMITS.reviewBody}
          rows={3}
          disabled={busy}
        />
        <small>
          {body.length} / {LIMITS.reviewBody}
        </small>
      </label>
      {message && (
        <p className={`review-form-note ${message.kind === "error" ? "is-error" : ""}`} role={message.kind === "error" ? "alert" : "status"}>
          {message.text}
        </p>
      )}
      <div className="review-form-actions">
        <button type="submit" className={`button button-primary button-small ${saving ? "is-loading" : ""}`} disabled={busy}>
          {saved ? "Update review" : "Publish review"}
        </button>
        {saved && (
          <button type="button" className="button button-ghost button-small" onClick={onDelete} disabled={busy}>
            Delete
          </button>
        )}
      </div>
    </form>
  );
}
