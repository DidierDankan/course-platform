import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { CircleAlert } from "lucide-react";
import { ROLES_NEEDING_SELLER_PROFILE, listInWords, missingSellerProfileParts } from "@utils/profile";

// On the edit page: tells a seller what their SAVED profile still needs before the dashboard and portfolio open
// (the same rule RequireProfileCompletion checks). Without it, clicking Dashboard or Portfolio in the header only
// re-renders this page and the seller can't tell why.
// When the visit is that redirect, the notice is scrolled into view and focused, every time (location.key changes on
// each redirect, even to the same path), so a repeated click still gives visible feedback.
export default function ProfileCompletionNotice({ profile }) {
  const role = useSelector((s) => s.auth.user?.role);
  const location = useLocation();
  const noticeRef = useRef(null);
  const missing = ROLES_NEEDING_SELLER_PROFILE.includes(role) ? missingSellerProfileParts(profile) : [];
  const redirected = location.state?.profileIncomplete === true;

  useEffect(() => {
    if (!redirected || !noticeRef.current) return;
    noticeRef.current.scrollIntoView({ block: "center" });
    noticeRef.current.focus({ preventScroll: true });
  }, [redirected, location.key]);

  if (!missing.length) return null;

  return (
    <div ref={noticeRef} className="profile-notice" role="note" tabIndex={-1}>
      <CircleAlert size={18} aria-hidden="true" />
      <span>
        <strong>Finish your profile to start selling.</strong> Your dashboard and portfolio open once your profile has{" "}
        {listInWords(missing)}. Add {missing.length === 1 ? "it" : "them"} below and save.
      </span>
    </div>
  );
}
