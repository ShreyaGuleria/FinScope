import React from 'react';
import './TransactionCard.css';

export default function TransactionCard({ id, description, amount, type, category, date, onDelete }) {
  const isIncome = type === 'Income';
  const formattedAmount = isIncome
    ? `+$${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
    : `-$${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

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

