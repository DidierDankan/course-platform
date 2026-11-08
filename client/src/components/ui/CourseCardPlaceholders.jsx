const DEFAULT_COUNT = 4; // one row on a wide screen

// Empty cards in the real card's frame, so a list doesn't jump when its data arrives.
export default function CourseCardPlaceholders({ count = DEFAULT_COUNT }) {
  return Array.from({ length: count }, (_, i) => (
    <div key={i} className="course-card course-card-placeholder" aria-hidden="true">
      <div className="card-visual" />
      <div className="card-body">
        <span />
        <span />
        <span />
      </div>
    </div>
  ));
}
