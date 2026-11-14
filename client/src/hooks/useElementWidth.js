import { useEffect, useRef, useState } from "react";

// Width of an element in CSS pixels, kept up to date with one ResizeObserver. Charts draw at this real width
// instead of scaling a fixed viewBox, so their text never stretches. Starts at 0 until the first measurement.
export default function useElementWidth() {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, width];
}
