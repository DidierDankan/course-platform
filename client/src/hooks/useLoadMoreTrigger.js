import { useEffect, useState } from "react";

// Starts loading before the visitor reaches the end of the list.
const LOAD_AHEAD = "400px";

// Returns a ref for an element at the end of a list; onLoadMore runs when it comes near the screen.
// While enabled stays true and the element is still in view (short pages), the observer is rebuilt
// after each load and fires again, so the list keeps filling until it passes the bottom of the screen.
export function useLoadMoreTrigger(onLoadMore, enabled) {
  const [node, setNode] = useState(null);

  useEffect(() => {
    if (!node || !enabled) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onLoadMore();
      },
      { rootMargin: LOAD_AHEAD }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [node, enabled, onLoadMore]);

  return setNode;
}
