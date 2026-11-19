import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useConfirmPaymentMutation } from "@api/modules/paymentApi";

// Stripe sends the buyer here with ?session_id=... The server confirms the purchase with Stripe and records it (the
// webhook does the same, whichever comes first), so the course is there even if the webhook is late (Render's free
// server sleeps). Then the buyer goes straight to the course they bought.
const REDIRECT_DELAY_MS = 900;
const PROCESSING_RETRIES = 3; // 409: Stripe is still processing the payment
const RETRY_DELAY_MS = 2000;
// Sellers can buy courses too, but the student course list only allows user and admin.
const STUDENT_AREA_ROLES = ["user", "admin"];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const role = useSelector((s) => s.auth.user?.role);
  const myCourses = STUDENT_AREA_ROLES.includes(role) ? "/user/courses" : "/courses";
  const [confirmPayment] = useConfirmPaymentMutation();
  const [state, setState] = useState(sessionId ? "confirming" : "unknown"); // confirming | confirmed | processing | failed | unknown

  // No "already started" guard: StrictMode (development) runs this effect, cancels it, and runs it again. A guard would
  // stop the second run while the first one's answer is ignored as cancelled, and the page would wait forever. Each
  // run sends its own request instead; confirming is idempotent (one enrollment however often it's called).
  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;

    (async () => {
      for (let attempt = 0; attempt <= PROCESSING_RETRIES; attempt += 1) {
        try {
          const { courseId } = await confirmPayment(sessionId).unwrap();
          if (cancelled) return;
          setState("confirmed");
          await wait(REDIRECT_DELAY_MS);
          if (!cancelled) navigate(`/courses/${courseId}/watch`, { replace: true });
          return;
        } catch (err) {
          if (cancelled) return;
          if (err?.status === 409 && attempt < PROCESSING_RETRIES) {
            await wait(RETRY_DELAY_MS);
            continue;
          }
          setState(err?.status === 409 ? "processing" : "failed");
          return;
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionId, confirmPayment, navigate]);

  const content = {
    confirming: { title: "Confirming your payment…", text: "This takes a second. Your course opens right after.", busy: true },
    confirmed: { title: "Payment confirmed", text: "Opening your course now…", busy: true },
    processing: {
      title: "Your payment is still processing",
      text: "Stripe hasn't finished it yet. The course appears in your courses as soon as it does; no need to pay again.",
    },
    failed: {
      title: "We couldn't confirm the payment here",
      text: "If you were charged, your payment is safe: the course appears in your courses within a few minutes.",
    },
    unknown: { title: "Thanks for your purchase", text: "Your course appears in your courses within a few minutes." },
  }[state];

  return (
    <main className="page-main page-main-narrow">
      <div className="empty-state" role={content.busy ? "status" : "alert"} aria-busy={content.busy || undefined}>
        {content.busy && <span className="spinner" aria-hidden="true" />}
        <h1>{content.title}</h1>
        <p>{content.text}</p>
        {!content.busy && (
          <Link to={myCourses} className="button button-secondary">
            Go to my courses
          </Link>
        )}
      </div>
    </main>
  );
}
