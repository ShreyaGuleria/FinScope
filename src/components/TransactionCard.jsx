import './TransactionCard.css';

function TransactionCard({ id, description, amount, type, date, onDelete }) {
  const isIncome = type === 'Income';
  const formattedAmount = isIncome
    ? `+$${parseFloat(amount).toFixed(2)}`
    : `-$${parseFloat(amount).toFixed(2)}`;

  return (
    <div className="transaction-card">
      <div className="transaction-card__left">
        <span className={`transaction-card__badge ${isIncome ? 'badge--income' : 'badge--expense'}`}>
          {isIncome ? '↑' : '↓'}
        </span>
        <div className="transaction-card__info">
          <p className="transaction-card__description">{description}</p>
          <p className="transaction-card__date">{date}</p>
        </div>
      </div>

      <div className="transaction-card__right">
        <span
          className="transaction-card__amount"
          style={{ color: isIncome ? 'var(--color-secondary)' : 'var(--color-danger)' }}
        >
          {formattedAmount}
        </span>
        <button
          className="transaction-card__delete"
          onClick={() => onDelete(id)}
          aria-label={`Delete transaction: ${description}`}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export default TransactionCard;
