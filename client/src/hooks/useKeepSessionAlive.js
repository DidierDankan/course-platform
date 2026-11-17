import { useCallback, useEffect, useRef } from "react";
import { useRefreshSessionMutation } from "@api/modules/authApi";

// The access cookie lasts 15 minutes (server/helpers/tokens.js). Pages where the BROWSER loads protected files (a
// <video> streaming a lesson) never make the app's own requests that would refresh it, so after 15 minutes the video's
// next request fails: a long lesson stops, or a paused one can't resume. This renews the session every 10 minutes while
// the page is open, and right away when the tab comes back after being hidden longer than that.
// Returns renew(), so a failed media request can renew on demand before retrying.
export const SESSION_RENEW_MS = 10 * 60 * 1000;

export default function useKeepSessionAlive() {
  const [refreshSession] = useRefreshSessionMutation();
  const lastRenew = useRef(Date.now()); // the page just loaded with a valid session

  const renew = useCallback(async () => {
    lastRenew.current = Date.now();
    // A failed renewal needs no handling here: the next API request gets 401 and the app's own retry takes over.
    return refreshSession().unwrap().then(() => true, () => false);
  }, [refreshSession]);

  useEffect(() => {
    const timer = setInterval(renew, SESSION_RENEW_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible" && Date.now() - lastRenew.current >= SESSION_RENEW_MS) renew();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [renew]);

  return renew;
}
