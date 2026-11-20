import { jsonLdHtml } from "@utils/seo";

// schema.org data for search engines (JSON-LD). jsonLdHtml escapes <, > and &, so text from sellers can't close the
// script element: that is what makes dangerouslySetInnerHTML safe here.
export default function StructuredData({ data }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(data) }} />;
}
