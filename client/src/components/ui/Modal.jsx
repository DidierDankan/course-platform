// Modal.jsx
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

const Modal = ({ open, onClose, title, children, footer }) => {
  const portalElRef = useRef(null);
  if (!portalElRef.current) {
    portalElRef.current = document.createElement("div");
    portalElRef.current.setAttribute("data-portal", "modal");
  }

  useEffect(() => {
    const el = portalElRef.current;
    document.body.appendChild(el);
    return () => el.parentNode && el.parentNode.removeChild(el);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 pointer-events-none flex items-center justify-center"
      style={{ zIndex: 2147483647 }}   // <- inline to avoid class parsing issues
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/60 pointer-events-auto"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 pointer-events-auto w-full max-w-lg mx-4 rounded-2xl bg-white dark:bg-neutral-900 shadow-xl">
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
