import React from 'react';
import './SummaryCard.css';

export default function SummaryCard({ title, amount, color, icon, subtitle }) {
  return (
    <div className="summary-card animate-fade-in" style={{ '--accent-color': color }}>
      <div className="summary-card__header">
        <span className="summary-card__title">{title}</span>
        {icon && <span className="summary-card__icon">{icon}</span>}
      </div>
      <div className="summary-card__amount" style={{ color: color }}>
        {amount}
      </div>
      {subtitle && <div className="summary-card__subtitle">{subtitle}</div>}
    </div>
  );
}
