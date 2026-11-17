import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

// Saves the page's scroll position when the user leaves it and restores it when they come back with Back (BrowserRouter
// doesn't do this). Positions are kept per history entry (location.key) in sessionStorage, so a new visit starts at the
// top and only "Back" restores. Call it with ready = true once the content is long enough to scroll into (for Browse:
// the cached courses are rendered).
export default function useRestoreScroll(ready) {
  const { key } = useLocation();
  const storageKey = `lumen-scroll:${key}`;
  const restored = useRef(false);

  useLayoutEffect(() => {
    if (!ready || restored.current) return;
    restored.current = true;
    const y = Number(sessionStorage.getItem(storageKey));
    // "instant": the site sets scroll-behavior: smooth, and coming back should not animate through the whole list
    if (y > 0) window.scrollTo({ top: y, behavior: "instant" });
  }, [ready, storageKey]);

  // Runs when the user leaves this history entry (another page, or a filter change that creates a new entry).
  useEffect(
    () => () => {
      sessionStorage.setItem(storageKey, String(Math.round(window.scrollY)));
    },
    [storageKey]
  );
}
