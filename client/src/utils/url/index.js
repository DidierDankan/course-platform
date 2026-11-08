// For links typed by users. Anything without http(s):// gets https:// in front, which also turns
// a "javascript:..." value into a harmless (broken) web address instead of a script link.
export const ensureHttp = (url) => {
  if (!url) return "";
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
};
