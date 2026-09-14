import React from 'react';
import './SummaryCard.css';

export default function SummaryCard({ title, amount, color, icon, subtitle }) {
  return (
    <article className="summary-card" style={{ '--accent-color': color }}>
      <div className="summary-card__header">
        <div className="summary-card__title-group">
          <span className="summary-card__accent-dot" style={{ backgroundColor: color }} aria-hidden="true" />
          <span className="summary-card__title">{title}</span>
        </div>
      </div>
      <hr className="summary-card__rule" />
      <div className="summary-card__amount">{amount}</div>
      {subtitle && <div className="summary-card__subtitle">{subtitle}</div>}
    </article>
  );
}

