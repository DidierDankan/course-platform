import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { ArrowRight } from "lucide-react";
import { useCreateCheckoutSessionMutation } from "@api/modules/paymentApi";
import { useCheckEnrollmentQuery, useEnrollInCourseMutation } from "@api/modules/enrollmentApi";
import { formatPrice } from "@utils/currency";

// The course's call to action, one of:
//   owner              -> "View course"        (owners watch their own course without enrolling)
//   logged out         -> "Login to buy" / "Login to enroll"  (login, then back here)
//   checking access    -> spinner              (enrollment check in flight)
//   enrolled           -> progress + "Continue learning"
//   paid course        -> "Buy for $X", then "Redirecting…" while the Stripe session is created
//   free course        -> "Enroll for free", then "Enrolling…"
// What the button offers is UX only: the server decides who may watch (protectVideos), who may buy
// (checkout refuses your own course; enrollment only comes from the verified webhook) and who may
// enroll for free (POST /api/enrollments refuses paid and subscription courses).
export default function CourseCTA({ courseId, price, sellerId }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((s) => s.auth || {});
  const [error, setError] = useState("");

  const isOwner = !!user && Number(user.id) === Number(sellerId);
  const isFree = Number(price) === 0;
  const { data: enrData, isFetching } = useCheckEnrollmentQuery(courseId, {
    skip: !courseId || !user || isOwner,
  });
  const [createCheckout, { isLoading: paying }] = useCreateCheckoutSessionMutation();
  const [enroll, { isLoading: enrolling }] = useEnrollInCourseMutation();

  const watchUrl = `/courses/${courseId}/watch`;

  if (isOwner) {
    return (
      <Link to={watchUrl} className="card-action">
        View course <ArrowRight size={16} aria-hidden="true" />
      </Link>
    );
  }

  if (!user) {
    return (
      <button
        type="button"
        className="card-action"
        onClick={() => navigate("/auth/login", { state: { from: location.pathname } })}
      >
        {isFree ? "Login to enroll" : "Login to buy"} <ArrowRight size={16} aria-hidden="true" />
      </button>
    );
  }

  if (enrData?.enrolled) {
    const progress = Math.min(Math.max(Number(enrData.enrollment?.progress) || 0, 0), 100);
    return (
      <>
        <div className="mini-progress">
          <div
            className="progress-track"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Course progress"
          >
            <span style={{ width: `${progress}%` }} />
          </div>
          <small>{progress}% complete</small>
        </div>
        <Link to={watchUrl} className="card-action">
          Continue learning <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </>
    );
  }

  // isFetching, not isLoading: it also covers the re-check right after enrolling,
  // so the button doesn't flash back to "Enroll for free" before "Continue learning".
  if (isFetching && !enrolling) {
    return (
      <button type="button" className="card-action is-loading" disabled aria-busy="true">
        <span className="spinner" aria-hidden="true" />
        <span className="sr-only">Checking your access</span>
      </button>
    );
  }

  const onBuy = async () => {
    setError("");
    try {
      const res = await createCheckout(courseId).unwrap();
      window.location.assign(res.url);
    } catch (err) {
      setError(err?.data?.message || "Could not start checkout. Please try again.");
    }
  };

  const onEnroll = async () => {
    setError("");
    try {
      await enroll(courseId).unwrap();
    } catch (err) {
      setError(err?.data?.message || "Could not enroll. Please try again.");
    }
  };

  const busy = paying || enrolling;

  return (
    <>
      <button
        type="button"
        className={`card-action ${busy ? "is-loading" : ""}`}
        onClick={isFree ? onEnroll : onBuy}
        disabled={busy}
        aria-busy={busy}
      >
        {busy ? (
          <>
            <span className="spinner" aria-hidden="true" /> {isFree ? "Enrolling…" : "Redirecting…"}
          </>
        ) : (
          <>
            {isFree ? "Enroll for free" : `Buy for ${formatPrice(price)}`} <ArrowRight size={16} aria-hidden="true" />
          </>
        )}
      </button>
      {error && (
        <p className="card-action-error" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
