// server/controllers/SeoController.js
// robots.txt and sitemap.xml for the client's pages. They come from the server because only the server knows the
// courses, and because the site's address is one setting here (CLIENT_URL: the address visitors use, which Vercel
// forwards /robots.txt and /sitemap.xml from, see DEPLOY.txt 2.5).
import config from "../config.js";
import SeoService from "../db/SeoService.js";
import { logError } from "../lib/logError.js";

const CACHE = "public, max-age=3600"; // crawlers fetch these often; an hour old is fine

// Pages a crawler should skip: the API, signed-in areas, checkout returns, the player (needs an enrollment) and the
// internal style guide. Everything else, including AI crawlers, is allowed.
const DISALLOWED = ["/api/", "/auth/", "/profile/", "/user/", "/payment/", "/courses/*/watch", "/styleguide"];
const STATIC_PAGES = ["/", "/courses"];

const siteUrl = (path) => `${config.clientUrl.replace(/\/+$/, "")}${path}`;
const escapeXml = (text) =>
  text.replace(/[<>&'"]/g, (ch) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[ch]);

class SeoController {
  robots(req, res) {
    const lines = ["User-agent: *", "Allow: /", ...DISALLOWED.map((path) => `Disallow: ${path}`), "", `Sitemap: ${siteUrl("/sitemap.xml")}`];
    res.set("Cache-Control", CACHE).type("text/plain").send(`${lines.join("\n")}\n`);
  }

  async sitemap(req, res) {
    try {
      const { courseIds, sellerIds } = await SeoService.sitemapEntries();
      const paths = [
        ...STATIC_PAGES,
        ...courseIds.map((id) => `/courses/${id}`),
        ...sellerIds.map((id) => `/sellers/${id}`),
      ];
      const urls = paths.map((path) => `  <url><loc>${escapeXml(siteUrl(path))}</loc></url>`).join("\n");
      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
      res.set("Cache-Control", CACHE).type("application/xml").send(xml);
    } catch (err) {
      logError("Sitemap", err);
      res.status(500).type("text/plain").send("Server error");
    }
  }
}

export default new SeoController();
