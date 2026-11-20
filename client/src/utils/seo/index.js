// What search engines and link previews read about a page: absolute URLs, short descriptions and structured data
// (JSON-LD, schema.org). index.html has the static defaults for crawlers that don't run JavaScript; hooks/usePageMeta.js
// sets them per page for the ones that do.
import { APP_NAME } from "@utils/brand";
import { CURRENCY } from "@utils/currency";

// The address visitors use, without a trailing slash (checked by vite.config.js at start-up and build).
export const SITE_URL = import.meta.env.VITE_SITE_URL;
const API_BASE_URL = import.meta.env.VITE_API_URL;

// Search results cut descriptions at about this many characters.
export const DESCRIPTION_MAX_LENGTH = 160;

export const absoluteUrl = (path) => `${SITE_URL}${path}`;

// A stored media path ("/uploads/x.jpg") as an absolute URL. Live, VITE_API_URL is empty and /uploads is on the site's
// own domain; locally it is the API server's address.
export const absoluteMediaUrl = (path) => new URL(`${API_BASE_URL ?? ""}${path}`, SITE_URL).href;

// Whitespace collapsed and cut at a word boundary, so a long course description becomes a usable meta description.
export function summarize(text, max = DESCRIPTION_MAX_LENGTH) {
  const clean = String(text ?? "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max / 2 ? cut.slice(0, lastSpace) : cut).replace(/[\s.,;:!?-]+$/, "")}…`;
}

// JSON for a <script type="application/ld+json">. Course titles and descriptions come from sellers, so a title like
// "</script><script>alert(1)</script>" must not end the script element: every <, > and & is written as a \u escape
// (still the same JSON for the parser), and so are the two line separators JavaScript treats as newlines.
const UNSAFE_IN_SCRIPT = new RegExp(`[<>&${String.fromCharCode(0x2028, 0x2029)}]`, "g");
export function jsonLdHtml(data) {
  return JSON.stringify(data).replace(UNSAFE_IN_SCRIPT, (ch) => `\\u${ch.charCodeAt(0).toString(16).padStart(4, "0")}`);
}

const organization = () => ({
  "@type": "Organization",
  name: APP_NAME,
  url: absoluteUrl("/"),
  logo: absoluteUrl("/apple-touch-icon.png"),
});

export const siteSchema = () => ({
  "@context": "https://schema.org",
  "@graph": [{ "@type": "WebSite", name: APP_NAME, url: absoluteUrl("/") }, organization()],
});

// "PT1H25M": a course's total length as an ISO 8601 duration (schema.org courseWorkload).
function isoDuration(totalSeconds) {
  const minutes = Math.max(1, Math.round(totalSeconds / 60));
  const hours = Math.floor(minutes / 60);
  return `PT${hours ? `${hours}H` : ""}${minutes % 60 ? `${minutes % 60}M` : ""}`;
}

// schema.org Course, with the fields Google's course results use. course = the public course answer.
export function courseSchema(course) {
  const price = Number(course.price) || 0;
  const totalSeconds = (course.lessons ?? []).reduce((sum, lesson) => sum + (Number(lesson.duration) || 0), 0);
  const ratingCount = Number(course.rating_count) || 0;

  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: summarize(course.description) || course.title,
    url: absoluteUrl(`/courses/${course.id}`),
    inLanguage: "en",
    provider: organization(),
    ...(course.thumbnail_url && { image: absoluteMediaUrl(course.thumbnail_url) }),
    offers: [{ "@type": "Offer", category: price > 0 ? "Paid" : "Free", price, priceCurrency: CURRENCY.code }],
    ...(totalSeconds > 0 && {
      hasCourseInstance: [{ "@type": "CourseInstance", courseMode: "Online", courseWorkload: isoDuration(totalSeconds) }],
    }),
    ...(ratingCount > 0 && {
      aggregateRating: { "@type": "AggregateRating", ratingValue: Number(course.rating_avg), ratingCount, bestRating: 5 },
    }),
  };
}
