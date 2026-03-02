import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

const SIZE_MAP = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-3xl",
  xl: "max-w-5xl",
  "2xl": "max-w-7xl",
  full: "w-full h-full",
};

const Modal = ({ open, onClose, title, children, footer, size = "md" }) => {
  const portalElRef = useRef(null);
  if (!portalElRef.current) {
    portalElRef.current = document.createElement("div");
    portalElRef.current.setAttribute("data-portal", "modal");
  }

  // Mount/unmount portal node
  useEffect(() => {
    const el = portalElRef.current;
    if (!open) return;

    Object.assign(el.style, {
      position: "fixed",
      inset: "0",
      zIndex: 2147483647,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(0,0,0,0.55)", // the dim backdrop around the modal
    });

    document.body.appendChild(el);

    return () => {
      el.removeAttribute("style");
      el.remove();
    };
  }, [open]);

  // ESC close + scroll lock
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
      className={`fixed inset-0 flex items-center justify-center px-4 w-[50%]`}
      style={{ zIndex: 2147483647 }}
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[var(--color-text)]/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={`relative z-10 w-full ${SIZE_MAP[size]} rounded-[var(--radius)] shadow-[var(--shadow-strong)] bg-[var(--color-bg)] text-[var(--color-text)] overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-muted)]/20 px-5 py-3 bg-[var(--color-primary)] text-white">
          <h3 className="text-lg font-semibold ml-[5px] text-[var(--color-text-white)]">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md hover:bg-[var(--color-primary-light)] transition mr-[5px]"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="p-5 p-[10px]">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-5 py-3 border-t border-[var(--color-muted)]/20 flex justify-end gap-3 bg-[var(--color-bg)] p-[5px]">
            {footer}
          </div>
        )}
      </div>
    </div>,
    portalElRef.current
  );
};

export default Modal;
