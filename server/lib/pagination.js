// server/lib/pagination.js
// Turns untrusted ?limit= / ?page= query values into safe integers.
// Without a cap, ?limit=1000000 would make one request load the whole table.
export const DEFAULT_PAGE_SIZE = 6;
export const MAX_PAGE_SIZE = 50;
// ?page=99999999999999999999 would make an OFFSET MySQL can't parse (a 500). A million pages is far past any real
// list, and keeps page * limit a safe integer, so a huge page just answers an empty list.
const MAX_PAGE = 1_000_000;

const toInt = (value, fallback) => {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
};

export function parsePagination(query, { defaultLimit = DEFAULT_PAGE_SIZE, maxLimit = MAX_PAGE_SIZE } = {}) {
  const limit = Math.min(Math.max(toInt(query.limit, defaultLimit), 1), maxLimit);
  const page = Math.min(Math.max(toInt(query.page, 1), 1), MAX_PAGE);
  return { limit, page, offset: (page - 1) * limit };
}
