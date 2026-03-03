import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { apiSlice } from "@api/apiSlice";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    // Invalidate dashboard/enrollments so UI updates without refresh
    dispatch(apiSlice.util.invalidateTags(["Enrollments", "Dashboard", "Payment"]));

    const t = setTimeout(() => navigate("/user/dashboard"), 1200);
    return () => clearTimeout(t);
  }, [dispatch, navigate]);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center px-6">
      <div className="bg-white border border-[#e2e8f0] rounded-[16px] p-[20px] shadow-[0_6px_18px_rgba(0,0,0,0.06)] max-w-[520px] w-full">
        <h1 className="text-[20px] font-bold text-[#1e293b]">Payment successful ✅</h1>
        <p className="mt-[6px] text-[14px] text-[#475569]">
          Your access is being activated. Redirecting to your dashboard…
        </p>
      </div>
    </div>
  );
}