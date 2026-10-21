import { useState, useEffect, useCallback, useRef } from 'react';
import { useFinance } from '../context/FinanceContext';
import { getExchangeRates, CURRENCIES } from '../utils/currencyApi';
import './CurrencyWidget.css';

/**
 * CurrencyWidget
 * Lets the user switch display currency (INR / USD / EUR / GBP).
 * Fetches live rates on mount and when the browser comes back online.
 * Toasts only on meaningful events (fallback warning, manual retry success).
 */
export default function CurrencyWidget() {
  const { currency, setCurrency, setExchangeRates, showToast } = useFinance();

  const [status, setStatus] = useState('loading'); // 'loading' | 'ready'
  const [source, setSource] = useState(null);       // 'live' | 'cached' | 'fallback'
  const [updatedAt, setUpdatedAt] = useState(null);
  const [hasFailed, setHasFailed] = useState(false);

  /* Guard against state updates after unmount */
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchRates = useCallback(async (isManualRetry = false) => {
    if (!isMounted.current) return;
    setStatus('loading');

    const result = await getExchangeRates(isManualRetry);

    if (!isMounted.current) return;

    setExchangeRates(result.rates);
    setSource(result.source);
    setUpdatedAt(result.updatedAt);
    setHasFailed(Boolean(result.failed));
    setStatus('ready');

    if (result.failed) {
      showToast('Failed to update exchange rates', 'warning');
    } else if (isManualRetry) {
      showToast('Live rates updated', 'success');
    }
  }, [setExchangeRates, showToast]);

  /* Initial fetch */
  useEffect(() => {
    fetchRates(false);
  }, [fetchRates]);

  /* Refetch when browser goes online */
  useEffect(() => {
    function handleOnline() {
      fetchRates(false);
    }
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [fetchRates]);

  /* Format the cached time for display */
  function formatCachedTime(iso) {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }

  function renderSourceBadge() {
    if (status === 'loading') {
      return (
        <span className="currency-badge currency-badge--loading" aria-live="polite">
          <span className="currency-badge__dot currency-badge__dot--pulse" aria-hidden="true" />
          Updating rates…
        </span>
      );
    }
    if (hasFailed) {
      return (
        <span className="currency-badge currency-badge--offline">
          <span className="currency-badge__dot" aria-hidden="true" />
          Update failed
        </span>
      );
    }
    const displayTime = formatCachedTime(updatedAt) || formatCachedTime(new Date().toISOString());
    return (
      <span className="currency-badge currency-badge--live">
        <span className="currency-badge__dot" aria-hidden="true" />
        Rates updated {displayTime}
      </span>
    );
  }

  return (
    <div className="currency-widget" aria-label="Currency settings">
      <label htmlFor="currency-select" className="currency-widget__label">
        Display Currency
      </label>

      <select
        id="currency-select"
        className="currency-widget__select"
        value={currency}
        onChange={(e) => setCurrency(e.target.value)}
        aria-label="Select display currency"
      >
        {CURRENCIES.map(({ code, symbol, label }) => (
          <option key={code} value={code}>
            {symbol} {code} — {label}
          </option>
        ))}
      </select>

      <div className="currency-widget__status">
        {renderSourceBadge()}
        {status === 'ready' && hasFailed && (
          <button
            type="button"
            className="currency-widget__retry"
            onClick={() => fetchRates(true)}
            aria-label="Retry fetching live exchange rates"
          >
            ↺ Retry
          </button>
        )}
      </div>
    </div>
  );
}
