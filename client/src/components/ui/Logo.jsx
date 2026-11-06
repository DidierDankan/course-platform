import { Link } from "react-router-dom";
import { APP_NAME } from "@utils/brand";

// Wordmark from the reference: "Lumen." with the dot in the theme's second accent.
export default function Logo({ className = "" }) {
  return (
    <Link to="/" className={`logo ${className}`} aria-label={`${APP_NAME} home`}>
      {APP_NAME}
      <span aria-hidden="true">.</span>
    </Link>
  );
}
