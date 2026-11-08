import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

// Built on the native <dialog>: showModal() traps focus, makes the page behind inert, returns focus
// on close, and stacks popups so Esc only closes the top one. The portal keeps it out of any
// surrounding <form>, so a button inside can never submit the form behind it.
const Modal = ({ open, onClose, title, children, footer, size = "md" }) => {
  const dialogRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return undefined;

    dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <dialog
      ref={dialogRef}
      className={`modal modal-${size}`}
      aria-labelledby={titleId}
      onCancel={(e) => {
        // Esc: the parent owns "open", so let it close this rather than the browser.
        e.preventDefault();
        onClose?.();
      }}
      onClick={(e) => {
        // Only the backdrop has the dialog itself as the target; the content is inside .modal-inner.
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="modal-inner">
        <header className="modal-header">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        <div className="modal-body">{children}</div>

        {footer && <footer className="modal-footer">{footer}</footer>}
      </div>
    </dialog>,
    document.body
  );
};

export default Modal;
