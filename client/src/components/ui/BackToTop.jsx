import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowUp } from "lucide-react";
import { scrollToTop } from "@utils/scroll";

// How far the heading must be above the screen before the button appears (in screen heights).
const SHOW_AFTER = "150%";

// Shows once the page has been scrolled well past its top, scrolls back up, then moves keyboard focus to the element
// with `focusId` (give it tabIndex={-1}), so a keyboard user continues from the top instead of the bottom.
// No scroll listener: an IntersectionObserver watches that same heading, with the viewport extended upward by
// SHOW_AFTER, so it reports "not intersecting" only when the heading is that far above the screen. (A marker element
// placed further down would make short pages taller.) Rendered into <body> so no transformed ancestor (the brutal theme
// uses transforms) can break `position: fixed`.
export default function BackToTop({ focusId }) {
  const buttonRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const target = document.getElementById(focusId);
    if (!target) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { rootMargin: `${SHOW_AFTER} 0px 0px 0px` }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [focusId]);

  // If the button hides while it has focus (Home / Page Up), focus would fall back to <body>: move it to the target.
  useEffect(() => {
    if (!visible && document.activeElement === buttonRef.current) {
      document.getElementById(focusId)?.focus({ preventScroll: true });
    }
  }, [visible, focusId]);

  const onClick = async () => {
    await scrollToTop();
    document.getElementById(focusId)?.focus({ preventScroll: true });
  };

  return createPortal(
    <button
      ref={buttonRef}
      type="button"
      className={`back-to-top ${visible ? "is-visible" : ""}`}
      onClick={onClick}
      aria-label="Back to top"
    >
      <ArrowUp size={20} aria-hidden="true" />
    </button>,
    document.body
  );
}
