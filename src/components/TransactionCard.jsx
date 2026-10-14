import './TransactionCard.css';
import { formatCurrency } from '../utils/currencyApi';

export default function TransactionCard({
  id,
  description,
  amount,
  type,
  category,
  date,
  onDelete,
  // Optional checkbox props — omitted on Dashboard so no visible change there
  selectable = false,
  selected = false,
  onSelectChange,
  currency,
  exchangeRates,
}) {
  const isIncome = type === 'Income';

  // Use formatCurrency when currency context is passed; fall back to the
  // original INR-only formatting for the Dashboard (which passes no currency).
  const formattedAmount =
    currency && exchangeRates !== undefined
      ? `${isIncome ? '+' : '-'}${formatCurrency(amount, currency, exchangeRates)}`
      : isIncome
        ? `+₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
        : `-₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  return (
    <div className={`transaction-card${selected ? ' transaction-card--selected' : ''}`}>
      {selectable && (
        <label className="transaction-card__checkbox-wrap">
          <input
            type="checkbox"
            className="transaction-card__checkbox"
            checked={selected}
            onChange={(e) => onSelectChange && onSelectChange(id, e.target.checked)}
            aria-label={`Select transaction: ${description}`}
          />
        </label>
      )}

      <div className="transaction-card__main">
        <div className="transaction-card__info">
          <div className="transaction-card__desc">{description}</div>
          <div className="transaction-card__meta">
            <span className="transaction-card__badge">{category || 'General'}</span>
            <span className="transaction-card__dot" aria-hidden="true">•</span>
            <span className="transaction-card__date">{date}</span>
          </div>
        </div>
      </div>

      <div className="transaction-card__actions">
        <span className={`transaction-card__amount ${isIncome ? 'transaction-card__amount--income' : 'transaction-card__amount--expense'}`}>
          {formattedAmount}
        </span>
        {onDelete && (
          <button
            className="transaction-card__delete-btn"
            onClick={() => onDelete(id)}
            title="Delete Transaction"
            aria-label="Delete transaction"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
