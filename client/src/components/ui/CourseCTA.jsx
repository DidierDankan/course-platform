import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { ArrowRight } from "lucide-react";
import { useCreateCheckoutSessionMutation } from "@api/modules/paymentApi";
import { useCheckEnrollmentQuery } from "@api/modules/enrollmentApi";
import { formatPrice } from "@utils/currency";

// The course's call to action, one of:
//   owner              -> "View course"        (owners watch their own course without enrolling)
//   logged out         -> "Login to buy"        (login, then back here)
//   checking access    -> spinner              (enrollment check in flight)
//   enrolled           -> progress + "Continue learning"
//   paying             -> "Redirecting…"        (Stripe Checkout session being created)
//   otherwise          -> "Buy for $X"
// What the button offers is UX only: the server decides who may watch (protectVideos) and
// who may buy (checkout refuses your own course; enrollment only comes from the verified webhook).
export default function CourseCTA({ courseId, price, sellerId }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((s) => s.auth || {});

  const isOwner = !!user && Number(user.id) === Number(sellerId);
  const { data: enrData, isLoading: checking } = useCheckEnrollmentQuery(courseId, {
    skip: !courseId || !user || isOwner,
  });
  const [createCheckout, { isLoading: paying }] = useCreateCheckoutSessionMutation();

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
        Login to buy <ArrowRight size={16} aria-hidden="true" />
      </button>
    );
  }

  if (checking) {
    return (
      <button type="button" className="card-action is-loading" disabled aria-busy="true">
        <span className="spinner" aria-hidden="true" />
        <span className="sr-only">Checking your access</span>
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

  const onBuy = async () => {
    try {
      const res = await createCheckout(courseId).unwrap();
      window.location.assign(res.url);
    } catch (err) {
      alert(err?.data?.message || "Could not start checkout. Please try again.");
    }
  };

  return (
    <button
      type="button"
      className={`card-action ${paying ? "is-loading" : ""}`}
      onClick={onBuy}
      disabled={paying}
      aria-busy={paying}
    >
      {paying ? (
        <>
          <span className="spinner" aria-hidden="true" /> Redirecting…
        </>
      ) : (
        <>
          Buy for {formatPrice(price)} <ArrowRight size={16} aria-hidden="true" />
        </>
      )}
    </button>
  );
}
