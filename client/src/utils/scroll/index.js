// Scrolling helpers shared by the back-to-top button and scroll restoration.

export const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Scrolls the page to the top and resolves when the scroll has finished, so focus can move afterwards without a second
// jump. Newer browsers return a Promise from window.scrollTo(); older ones return undefined, so the fallback waits for
// `scrollend` with a short idle timer (scrollend never fires when the page is already at the top).
export function scrollToTop() {
  const result = window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "instant" : "smooth" });
  if (result instanceof Promise) return result;

  return new Promise((resolve) => {
    let timer;
    const finish = () => {
      clearTimeout(timer);
      window.removeEventListener("scrollend", finish);
      window.removeEventListener("scroll", onScroll);
      resolve();
    };
    const onScroll = () => {
      clearTimeout(timer);
      timer = setTimeout(finish, 100);
    };
    window.addEventListener("scrollend", finish, { once: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    timer = setTimeout(finish, 100);
  });
}
