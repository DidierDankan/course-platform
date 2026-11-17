import { Star } from "lucide-react";

const oneDecimal = new Intl.NumberFormat("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

// A course's (or instructor's) average rating as one star, the number and the count. The star is decoration: the
// number and the words carry the value, so it reads the same without colour and for screen readers.
// `emptyText` shows when there are no reviews; without it, nothing renders (the course cards stay quiet).
export default function Rating({ average, count, emptyText, compact = false }) {
  if (!count) return emptyText ? <span className="rating rating-empty">{emptyText}</span> : null;

  const value = oneDecimal.format(average);
  const reviews = `${count.toLocaleString("en-US")} ${count === 1 ? "review" : "reviews"}`;
  return (
    <span className="rating" aria-label={`Rated ${value} out of 5 from ${reviews}`}>
      <Star className="rating-star" size={compact ? 13 : 16} aria-hidden="true" />
      <strong aria-hidden="true">{value}</strong>
      <span aria-hidden="true">{compact ? `(${count.toLocaleString("en-US")})` : reviews}</span>
    </span>
  );
}
