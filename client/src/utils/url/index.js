// For links typed by users. Anything without http(s):// gets https:// in front, which also turns
// a "javascript:..." value into a harmless (broken) web address instead of a script link.
export const ensureHttp = (url) => {
  if (!url) return "";
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
};

// Full address of a stored upload ("abc.jpg", "uploads/abc.jpg", or already absolute).
export const uploadUrl = (stored) => {
  if (!stored) return null;
  if (/^https?:\/\//i.test(stored)) return stored;
  const path = stored.includes("uploads/") ? stored.replace(/^\//, "") : `uploads/${stored}`;
  return `${import.meta.env.VITE_API_URL}/${path}`;
};
