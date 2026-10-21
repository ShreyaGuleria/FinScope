import React from 'react';
import './TransactionCard.css';

/* ── Inline SVG icons — no library needed ── */
const IconEdit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
       aria-hidden="true">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
       aria-hidden="true">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

export default function TransactionCard({
  id,
  description,
  amount,
  type,
  category,
  date,
  onEdit,
  onDelete,
}) {
  const isIncome = type === 'Income';
  const formattedAmount = isIncome
    ? `+₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
    : `-₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  return (
    <div className="transaction-card">
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

        {/* Edit — pencil icon; loads transaction into the form */}
        {onEdit && (
          <button
            type="button"
            className="transaction-card__edit-btn"
            onClick={() => onEdit({ id, description, amount, type, category, date })}
            title="Edit transaction"
            aria-label="Edit transaction"
          >
            <IconEdit />
          </button>
        )}

        {/* Delete — trash icon; no confirm here, undo toast is shown instead */}
        {onDelete && (
          <button
            type="button"
            className="transaction-card__delete-btn"
            onClick={() => onDelete(id)}
            title="Delete transaction"
            aria-label="Delete transaction"
          >
            <IconTrash />
          </button>
        )}
      </div>
    </div>
  );
}
