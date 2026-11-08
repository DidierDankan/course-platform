// The Browse filters, kept in the URL so a filtered list can be shared, bookmarked and survives a reload.
// URL -> parseFilters -> what the form shows; filters -> serializeFilters -> URL; filters -> toApiParams -> request.
// URLs can be hand-edited or stale: anything invalid counts as not set.

export const SORT_OPTIONS = [
  { label: "Newest", value: "newest" },
  { label: "Most popular", value: "popular" },
  { label: "Price: low → high", value: "price_asc" },
  { label: "Price: high → low", value: "price_desc" },
  { label: "Duration: longest first", value: "duration_desc" },
];

export const DURATION_OPTIONS = [
  { label: "Any duration", value: "" },
  { label: "Short (< 30m)", value: "short" },
  { label: "Medium (30–120m)", value: "medium" },
  { label: "Long (> 120m)", value: "long" },
];

const MINUTE = 60;
const DURATION_RANGES = {
  short: { maxDuration: 30 * MINUTE },
  medium: { minDuration: 30 * MINUTE, maxDuration: 120 * MINUTE },
  long: { minDuration: 120 * MINUTE },
};

const DEFAULT_SORT = "newest";
export const EMPTY_FILTERS = Object.freeze({
  q: "",
  sort: DEFAULT_SORT,
  minPrice: "",
  maxPrice: "",
  free: false,
  duration: "",
});

// A price is a string the way the form holds it: "" (not set) or a number >= 0. "0" is a real value.
export const isValidPrice = (value) => {
  if (typeof value !== "string" || value.trim() === "") return false;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0;
};

export const isPriceRangeInverted = (minPrice, maxPrice) =>
  isValidPrice(minPrice) && isValidPrice(maxPrice) && Number(minPrice) > Number(maxPrice);

export function parseFilters(searchParams) {
  const sort = searchParams.get("sort");
  const duration = searchParams.get("duration");
  const price = (key) => {
    const value = searchParams.get(key) ?? "";
    return isValidPrice(value) ? value : "";
  };
  const minPrice = price("minPrice");
  const maxPrice = price("maxPrice");

  return {
    q: searchParams.get("q") ?? "",
    sort: SORT_OPTIONS.some((o) => o.value === sort) ? sort : DEFAULT_SORT,
    minPrice,
    maxPrice: isPriceRangeInverted(minPrice, maxPrice) ? "" : maxPrice,
    free: searchParams.get("free") === "1",
    duration: Object.hasOwn(DURATION_RANGES, duration ?? "") ? duration : "",
  };
}

// Only what differs from the defaults, so an unfiltered Browse is plain /courses.
export function serializeFilters({ q, sort, minPrice, maxPrice, free, duration }) {
  const params = new URLSearchParams();
  if (q.trim()) params.set("q", q.trim());
  if (sort !== DEFAULT_SORT) params.set("sort", sort);
  if (minPrice !== "") params.set("minPrice", minPrice);
  if (maxPrice !== "") params.set("maxPrice", maxPrice);
  if (free) params.set("free", "1");
  if (duration) params.set("duration", duration);
  return params;
}

export function toApiParams({ q, sort, minPrice, maxPrice, free, duration }) {
  return {
    sort,
    ...(q.trim() && { q: q.trim() }),
    ...(minPrice !== "" && { minPrice }),
    ...(maxPrice !== "" && { maxPrice }),
    ...(free && { free: 1 }),
    ...DURATION_RANGES[duration],
  };
}
