import { Link } from "react-router-dom";

export default function PaymentCancel() {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center px-6">
      <div className="bg-white border border-[#e2e8f0] rounded-[16px] p-[20px] shadow-[0_6px_18px_rgba(0,0,0,0.06)] max-w-[520px] w-full">
        <h1 className="text-[20px] font-bold text-[#1e293b]">Payment canceled</h1>
        <p className="mt-[6px] text-[14px] text-[#475569]">
          No worries — you can try again anytime.
        </p>

        <div className="mt-[14px]">
          <Link
            to="/courses"
            className="inline-flex rounded-[12px] bg-[#4f46e5] px-[14px] py-[10px] text-[13px] font-semibold text-white hover:opacity-95"
          >
            Back to courses
          </Link>
        </div>
      </div>
    </div>
  );
}