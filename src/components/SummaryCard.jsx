import './SummaryCard.css';

export default function SummaryCard({ title, amount, color }) {
  return (
    <div className="summary-card" style={{ borderLeftColor: color }}>
      <p className="summary-card__title">{title}</p>
      <p className="summary-card__amount">{amount}</p>
    </div>
  );
}
