import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { useCreateCheckoutSessionMutation } from "@api/modules/paymentApi";
import { useCheckEnrollmentQuery } from "@api/modules/enrollmentApi";

export default function CourseCTA({ courseId, price }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((s) => s.auth || {});

  const { data: enrData, isLoading: enrLoading } = useCheckEnrollmentQuery(courseId, {
    skip: !courseId || !user, // 👈 don't check if not logged in
  });

  const enrolled = !!enrData?.enrolled;

  const [createCheckout, { isLoading: paying }] = useCreateCheckoutSessionMutation();

  const onBuy = async () => {
    // 🔐 Not logged in → go to login
    if (!user) {
      navigate("/auth/login", {
        state: { from: location.pathname },
      });
      return;
    }

    // 💳 Logged in → create Stripe session
    const res = await createCheckout(courseId).unwrap();
    window.location.href = res.url;
  };

  if (enrLoading) return null;

  if (user && enrolled) {
    return (
      <Link
        to={`/courses/${courseId}/watch`}
        className="inline-flex rounded-[12px] bg-[#4f46e5] px-[14px] py-[10px] text-[13px] font-semibold text-white hover:opacity-95"
      >
        Continue learning
      </Link>
    );
  }

  return (
    <button
      onClick={onBuy}
      disabled={paying}
      className="inline-flex rounded-[12px] bg-[#0f172a] px-[14px] py-[10px] text-[13px] font-semibold text-white hover:opacity-95 disabled:opacity-60"
    >
      {paying ? "Redirecting…" : `Buy for €${price}`}
    </button>
  );
}