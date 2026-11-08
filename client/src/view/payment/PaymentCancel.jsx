import { Link } from "react-router-dom";

export default function PaymentCancel() {
  return (
    <main className="page-main page-main-narrow">
      <div className="empty-state">
        <h1>Payment canceled</h1>
        <p>No worries, you weren&apos;t charged. You can try again anytime.</p>
        <Link to="/courses" className="button button-secondary">
          Back to courses
        </Link>
      </div>
    </main>
  );
}
