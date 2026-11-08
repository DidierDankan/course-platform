import { Children, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const OPTIONS = { loop: true, align: "start" };
const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Endless horizontal list with arrows, and swipe on touch screens. Embla moves the real slides around
// to make the loop, so there are no duplicate cards for keyboards or screen readers to trip over.
export default function CourseCarousel({ label, children }) {
  const [viewportRef, api] = useEmblaCarousel(OPTIONS);
  const [canMove, setCanMove] = useState(false);

  // Nothing to move when every slide already fits: the arrows disappear.
  useEffect(() => {
    if (!api) return undefined;
    const update = () => setCanMove(api.canScrollPrev() || api.canScrollNext());
    update();
    api.on("reInit", update).on("select", update);
    return () => api.off("reInit", update).off("select", update);
  }, [api]);

  return (
    <div className="course-carousel" role="group" aria-roledescription="carousel" aria-label={label}>
      <div className="carousel-viewport" ref={viewportRef}>
        <div className="carousel-track">
          {Children.map(children, (child) => (
            <div className="carousel-slide" role="group" aria-roledescription="slide">
              {child}
            </div>
          ))}
        </div>
      </div>
      {canMove && (
        <>
          <button
            type="button"
            className="carousel-arrow carousel-arrow-prev"
            aria-label="Previous courses"
            onClick={() => api.scrollPrev(prefersReducedMotion())}
          >
            <ChevronLeft size={22} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="carousel-arrow carousel-arrow-next"
            aria-label="Next courses"
            onClick={() => api.scrollNext(prefersReducedMotion())}
          >
            <ChevronRight size={22} aria-hidden="true" />
          </button>
        </>
      )}
    </div>
  );
}
