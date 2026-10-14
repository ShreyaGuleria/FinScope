import { useEffect, useId, useRef } from 'react';
import ReactDOM from 'react-dom';
import './Modal.css';

/* Focusable elements selector used for the focus trap */
const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export default function Modal({ isOpen, onClose, title, children, footer }) {
  const titleId = useId();
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);

  /* ── Open / close side-effects ── */
  useEffect(() => {
    if (!isOpen) return;

    /* Save element that had focus before we opened */
    previousFocusRef.current = document.activeElement;

    /* Lock body scroll */
    document.body.style.overflow = 'hidden';

    /* Move focus into the dialog */
    const frame = requestAnimationFrame(() => {
      if (dialogRef.current) {
        const firstFocusable = dialogRef.current.querySelector(FOCUSABLE);
        if (firstFocusable) {
          firstFocusable.focus();
        } else {
          dialogRef.current.focus();
        }
      }
    });

    return () => {
      cancelAnimationFrame(frame);
      /* Restore scroll */
      document.body.style.overflow = '';
      /* Restore focus */
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen]);

  /* ── Keyboard listeners ── */
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e) {
      /* Escape closes */
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      /* Tab focus trap */
      if (e.key === 'Tab') {
        const dialog = dialogRef.current;
        if (!dialog) return;

        const focusable = Array.from(dialog.querySelectorAll(FOCUSABLE)).filter(
          (el) => !el.closest('[hidden]'),
        );
        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="modal-backdrop" onClick={onClose} aria-hidden="true">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="modal-panel"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-panel__header">
          <h2 id={titleId} className="modal-panel__title">
            {title}
          </h2>
          <button
            type="button"
            className="modal-panel__close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            &#x2715;
          </button>
        </div>

        {/* Body */}
        <div className="modal-panel__body">{children}</div>

        {/* Optional footer */}
        {footer && <div className="modal-panel__footer">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
