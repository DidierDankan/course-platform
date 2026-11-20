import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { APP_NAME } from "@utils/brand";
import { absoluteUrl, summarize } from "@utils/seo";

// Per-page title, description, canonical link and og:url, for crawlers that run JavaScript (Googlebot) and for the
// browser tab. The defaults stay in index.html for everything that doesn't run JavaScript (link previews, most AI
// crawlers); on leaving the page every tag gets its previous value back.
//
// Why not React 19's own <title>/<meta> in the component: React adds them to <head> next to index.html's static tags,
// and the browser and crawlers use the FIRST <title>, so the page title would never change and every page would carry
// two descriptions. Updating the existing tags keeps exactly one of each.
const TITLE_TAGS = [
  ["property", "og:title"],
  ["name", "twitter:title"],
];
const DESCRIPTION_TAGS = [
  ["name", "description"],
  ["property", "og:description"],
  ["name", "twitter:description"],
];

export default function usePageMeta({ title, description } = {}) {
  const { pathname } = useLocation();

  useEffect(() => {
    const undo = [];
    const setContent = ([attribute, key], value) => {
      const tag = document.head.querySelector(`meta[${attribute}="${key}"]`);
      if (!tag) return; // index.html defines them; nothing to update on a page without it
      const previous = tag.getAttribute("content");
      tag.setAttribute("content", value);
      undo.push(() => tag.setAttribute("content", previous));
    };

    if (title) {
      const fullTitle = `${title} · ${APP_NAME}`;
      const previous = document.title;
      document.title = fullTitle;
      undo.push(() => {
        document.title = previous;
      });
      TITLE_TAGS.forEach((tag) => setContent(tag, fullTitle));
    }

    const summary = summarize(description);
    if (summary) DESCRIPTION_TAGS.forEach((tag) => setContent(tag, summary));

    // The page's own address without the query string, so /courses?sort=price and /courses count as one page.
    const canonical = Object.assign(document.createElement("link"), { rel: "canonical", href: absoluteUrl(pathname) });
    const ogUrl = document.createElement("meta");
    ogUrl.setAttribute("property", "og:url");
    ogUrl.setAttribute("content", absoluteUrl(pathname));
    document.head.append(canonical, ogUrl);
    undo.push(() => {
      canonical.remove();
      ogUrl.remove();
    });

    return () => undo.reverse().forEach((restore) => restore());
  }, [title, description, pathname]);
}
