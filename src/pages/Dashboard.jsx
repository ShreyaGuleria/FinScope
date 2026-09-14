import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SummaryCard from '../components/SummaryCard';
import FinanceChart from '../components/FinanceChart';
import TransactionCard from '../components/TransactionCard';
import { loadTransactions, saveTransactions } from '../utils/storage';
import './Dashboard.css';

export default function Dashboard() {
  const [transactions, setTransactions] = useState(() => loadTransactions());

  useEffect(() => {
    saveTransactions(transactions);
  }, [transactions]);

  const totalIncome = transactions
    .filter((t) => t.type === 'Income')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpenses = transactions
    .filter((t) => t.type === 'Expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const netBalance = totalIncome - totalExpenses;

  const fmt = (val) =>
    val.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });

  function handleDelete(id) {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }

  // Recent 3 transactions
  const recentTransactions = transactions.slice(0, 3);

  // Scroll reveal observer
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const targets = document.querySelectorAll('.reveal');
    if (!targets.length) return;

    if (prefersReduced) {
      targets.forEach((el) => el.classList.add('visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="dashboard-page">
      {/* Header Section */}
      <div className="dashboard-header reveal">
        <div className="dashboard-header__info">
          <div className="dashboard-eyebrow">Financial Overview</div>
          <h1 className="dashboard-title">Dashboard Overview</h1>
          <p className="dashboard-subtitle">Monitor your real-time balance and expense metrics.</p>
        </div>
        <Link to="/transactions" className="btn-add-quick" id="dashboard-cta-add">
          Add Transaction
        </Link>
      </div>

      {/* Summary Cards Row */}
      <div className="dashboard-cards reveal" style={{ transitionDelay: '80ms' }}>
        <SummaryCard
          title="Total Income"
          amount={fmt(totalIncome)}
          color="var(--color-secondary)"

          subtitle="All time total"
        />
        <SummaryCard
          title="Total Expenses"
          amount={fmt(totalExpenses)}
          color="var(--color-danger)"

          subtitle="All time total"
        />
        <SummaryCard
          title="Net Balance"
          amount={fmt(netBalance)}
          color="var(--color-primary)"

          subtitle="Net cash balance"
        />
      </div>

      {/* Analytics Section */}
      <div className="dashboard-grid">
        {/* Income vs Expenses Card */}
        <div className="dashboard-card-section reveal" style={{ transitionDelay: '140ms' }}>
          <div className="section-header-block">
            <span className="section-eyebrow">Analytics</span>
            <h2 className="section-title">Income vs Expenses</h2>
          </div>
          {transactions.length === 0 ? (
            <div className="empty-dashboard-chart">
              <p className="empty-chart-text">No transactions to display.</p>
              <Link to="/transactions" className="btn-text-link">
                Add your first income or expense →
              </Link>
            </div>
          ) : (
            <FinanceChart income={totalIncome} expenses={totalExpenses} />
          )}
        </div>

        {/* Recent Activity Card */}
        <div className="dashboard-card-section reveal" style={{ transitionDelay: '200ms' }}>
          <div className="section-header-inline">
            <div className="section-header-block">
              <span className="section-eyebrow">History</span>
              <h2 className="section-title">Recent Activity</h2>
            </div>
            <Link to="/transactions" className="btn-view-all">
              View All →
            </Link>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="empty-recent-container">
              <p className="empty-recent-text">No recent transactions recorded.</p>
            </div>
          ) : (
            <div className="recent-list">
              {recentTransactions.map((t) => (
                <TransactionCard
                  key={t.id}
                  id={t.id}
                  description={t.description}
                  amount={t.amount}
                  type={t.type}
                  category={t.category}
                  date={t.date}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

