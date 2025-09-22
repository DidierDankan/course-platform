import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

const Modal = ({ open, onClose, title, children, footer }) => {
  const portalElRef = useRef(null);
  if (!portalElRef.current) {
    portalElRef.current = document.createElement("div");
    portalElRef.current.setAttribute("data-portal", "modal");
  }

  // Mount the portal node only while open + apply inline styles
  useEffect(() => {
    const el = portalElRef.current;
    if (!open) return;

    // Apply your inline styles while open
    Object.assign(el.style, {
        position: "absolute",
        top: "0",
        right: "0",
        bottom: "0",
        left: "0",
        background: "#00000059",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      // optional: make the container inert; the modal content itself handles z-index
      // pointerEvents: "none",
    });

    document.body.appendChild(el);

    // Cleanup: remove styles and node when closing/unmounting
    return () => {
      el.removeAttribute("style");
      if (el.parentNode) el.parentNode.removeChild(el);
    };
  }, [open]);

  // ESC + body scroll lock only while open
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 pointer-events-none flex items-center justify-center"
      style={{ zIndex: 2147483647 }} // huge z-index on the wrapper that actually renders
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 pointer-events-auto"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel */}
      <div
        className="relative z-10 pointer-events-auto w-full max-w-lg mx-4 rounded-2xl bg-white dark:bg-neutral-900 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 px-4 py-3">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="p-4">{children}</div>

        {footer && (
          <div className="px-4 py-3 border-t border-black/10 dark:border-white/10 flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>,
    portalElRef.current
  );
};

export default Modal;
