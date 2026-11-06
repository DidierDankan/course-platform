import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { APP_NAME } from "@utils/brand";

// Placeholder so the footer link isn't dead. The full style guide (tokens, components,
// states in both themes) is ported from design/*/src/App.tsx in a later phase.
export default function StyleGuide() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-[1440px] flex-col items-start justify-center gap-6 px-[18px] py-16 sm:px-[42px]">
      <span className="section-index">{APP_NAME} foundations &amp; components</span>
      <h1 className="font-lm-display text-4xl font-bold sm:text-6xl">Style guide</h1>
      <p className="max-w-xl text-lm-muted">
        The full guide is on its way. Until then, the theme toggle in the header switches every migrated
        page between the brutal and cinematic themes.
      </p>
      <Link to="/" className="button button-secondary">
        Back to home <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </main>
  );
}
