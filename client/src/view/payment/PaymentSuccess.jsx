import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { apiSlice } from "@api/apiSlice";

const REDIRECT_DELAY_MS = 1200;
// Sellers can buy courses too, but the student dashboard route only allows user and admin.
const STUDENT_AREA_ROLES = ["user", "admin"];

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const role = useSelector((s) => s.auth.user?.role);
  const destination = STUDENT_AREA_ROLES.includes(role) ? "/user/dashboard" : "/courses";

  useEffect(() => {
    // Invalidate dashboard/enrollments so the UI updates without a refresh
    dispatch(apiSlice.util.invalidateTags(["Enrollments", "Dashboard", "Payment"]));

    const timer = setTimeout(() => navigate(destination), REDIRECT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [dispatch, navigate, destination]);

  return (
    <main className="page-main page-main-narrow">
      <div className="empty-state" role="status">
        <span className="spinner" aria-hidden="true" />
        <h1>Payment successful</h1>
        <p>Your access is being activated. Taking you there now…</p>
        <Link to={destination} className="button button-secondary">
          Go now
        </Link>
      </div>
    </main>
  );
}
