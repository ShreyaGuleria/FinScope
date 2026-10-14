import { useFinance } from '../context/FinanceContext';
import './Toast.css';

/* Maps toast type → icon character */
const TYPE_ICON = {
  success: '✓',
  warning: '⚠',
  error: '✕',
  info: 'ℹ',
};

/* Normalise unknown types to 'info' */
function normaliseType(type) {
  return ['success', 'warning', 'error', 'info'].includes(type) ? type : 'info';
}

export default function Toast() {
  const { toasts, dismissToast } = useFinance();

  if (toasts.length === 0) return null;

  return (
    <div
      className="toast-container"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast) => {
        const type = normaliseType(toast.type);
        const isError = type === 'error';
        return (
          <div
            key={toast.id}
            role={isError ? 'alert' : 'status'}
            className={`toast toast--${type}`}
          >
            <span className="toast__icon" aria-hidden="true">
              {TYPE_ICON[type]}
            </span>
            <span className="toast__message">{toast.message}</span>
            <button
              type="button"
              className="toast__close"
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss notification"
            >
              &#x2715;
            </button>
          </div>
        );
      })}
    </div>
  );
}
