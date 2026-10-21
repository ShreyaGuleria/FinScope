import { useMemo } from 'react';
import './ProgressBar.css';

/* ─────────────────────────────────────────────
   Pure helper — exported for Budgets.jsx usage and viva explanation.
   Returns: 'safe' | 'warning' | 'danger'
───────────────────────────────────────────── */
// eslint-disable-next-line react/only-export-components
export function getProgressStatus(percent) {
  if (percent >= 100) return 'danger';
  if (percent >= 80) return 'warning';
  return 'safe';
}

export default function ProgressBar({ value, max, label, showPercent = true }) {
  const { percent, status, clampedWidth } = useMemo(() => {
    const pct = max > 0 ? (value / max) * 100 : 0;
    return {
      percent: pct,
      status: getProgressStatus(pct),
      clampedWidth: Math.min(100, Math.max(0, pct)),
    };
  }, [value, max]);

  return (
    <div className="progress-bar">
      {(label || showPercent) && (
        <div className="progress-bar__meta">
          {label && <span className="progress-bar__label">{label}</span>}
          {showPercent && (
            <span className={`progress-bar__percent progress-bar__percent--${status}`}>
              {Math.round(percent)}%
            </span>
          )}
        </div>
      )}

      <div
        className="progress-bar__track"
        role="progressbar"
        aria-valuenow={Math.round(percent)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className={`progress-bar__fill progress-bar__fill--${status}`}
          style={{ width: `${clampedWidth}%` }}
        />
      </div>
    </div>
  );
}
