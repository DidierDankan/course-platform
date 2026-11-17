import { useEffect, useState } from "react";

// Shown while a page's code downloads (lazy routes). Most loads take a few dozen milliseconds: showing a spinner for
// those would only flash, so it appears after SHOW_AFTER_MS. The empty space keeps the footer from jumping up meanwhile.
const SHOW_AFTER_MS = 300;

export default function PageLoadingFallback() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), SHOW_AFTER_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="page-main page-main-narrow page-loading-fallback">
      {show && (
        <div className="page-inline-loader" role="status" aria-label="Loading page">
          <span className="spinner" aria-hidden="true" />
        </div>
      )}
    </main>
  );
}
