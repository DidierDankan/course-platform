import { Link } from "react-router-dom";
import { Info } from "lucide-react";
import { useIsDemoAccount } from "@hooks/useIsDemoAccount";

// On the demo accounts (public password, see the login page) the server refuses the changes that would break the demo
// for the next visitor (middleware/demoAccount.js). This tells the visitor before they fill in a form; the server is
// the real check. `what` names what's switched off on this page.
export default function DemoNotice({ what }) {
  const isDemo = useIsDemoAccount();
  if (!isDemo) return null;

  return (
    <p className="demo-notice" role="note">
      <Info size={18} aria-hidden="true" />
      <span>
        You&apos;re on a demo account, so {what} is switched off and the demo stays the same for everyone.{" "}
        <Link to="/auth/register">Register your own account</Link> to try it.
      </span>
    </p>
  );
}
