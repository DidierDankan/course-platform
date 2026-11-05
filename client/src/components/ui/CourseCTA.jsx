import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { useCreateCheckoutSessionMutation } from "@api/modules/paymentApi";
import { useCheckEnrollmentQuery } from "@api/modules/enrollmentApi";
import { formatPrice } from "@utils/currency";

export default function CourseCTA({ courseId, price, sellerId }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((s) => s.auth || {});

  const { data: enrData, isLoading: enrLoading } = useCheckEnrollmentQuery(courseId, {
    skip: !courseId || !user, // 👈 don't check if not logged in
  });

  const enrolled = !!enrData?.enrolled;

  const [createCheckout, { isLoading: paying }] = useCreateCheckoutSessionMutation();

  const onBuy = async () => {
    if (!user) {
      navigate("/auth/login", { state: { from: location.pathname } });
      return;
    }
    try {
      const res = await createCheckout(courseId).unwrap();
      window.location.href = res.url;
    } catch (err) {
      alert(err?.data?.message || "Could not start checkout. Please try again.");
    }
  };

  if (user && Number(user.id) === Number(sellerId)) {
    return (
      <Link
        to={`/courses/${courseId}/watch`}
        className="inline-flex rounded-[12px] border border-[#4f46e5] px-[14px] py-[10px] text-[13px] font-semibold text-[#4f46e5] hover:bg-[#eef2ff]"
      >
        Your course · Watch
      </Link>
    );
  }

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
      {paying ? "Redirecting…" : `Buy for ${formatPrice(price)}`}
    </button>
  );
}