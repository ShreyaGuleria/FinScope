import './SummaryCard.css';

export default function SummaryCard({ title, amount, color, subtitle }) {
  return (
    <div className="summary-card" style={{ borderLeftColor: color }}>
      <p className="summary-card__title">{title}</p>
      <p className="summary-card__amount">{amount}</p>
      {subtitle && (
        <p className="summary-card__subtitle" style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginTop: '4px' }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
