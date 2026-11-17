import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

// "Back", like the browser's arrow, when the user got here inside the app: the previous page comes back as it was
// (Browse keeps its filters and its scroll position). When they landed here directly (a shared link, a new tab),
// going back would leave the site or do nothing, so the link goes to a sensible parent page instead.
// React Router marks the first page of a session with location.key "default".
export default function BackLink({ fallback, fallbackLabel }) {
  const navigate = useNavigate();
  const { key } = useLocation();

  if (key === "default") {
    return (
      <Link to={fallback} className="text-link back-link">
        <ArrowLeft size={16} aria-hidden="true" />
        {fallbackLabel}
      </Link>
    );
  }
  return (
    <button type="button" className="text-link back-link" onClick={() => navigate(-1)}>
      <ArrowLeft size={16} aria-hidden="true" />
      Back
    </button>
  );
}
