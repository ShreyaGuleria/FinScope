import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import SummaryCard from '../components/SummaryCard';
import FinanceChart from '../components/FinanceChart';
import TransactionCard from '../components/TransactionCard';
import { useFinance } from '../context/FinanceContext';
import './Dashboard.css';

export default function Dashboard() {
  const { transactions, deleteTransaction, currency, isLoading, error } = useFinance();

  const { totalIncome, totalExpenses, netBalance } = useMemo(() => {
    let income = 0;
    let expenses = 0;
    for (const t of transactions) {
      if (t.type === 'Income') income += Number(t.amount);
      else expenses += Number(t.amount);
    }
    return { totalIncome: income, totalExpenses: expenses, netBalance: income - expenses };
  }, [transactions]);

  const fmt = (val) =>
    val.toLocaleString('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
    });

  // Recent 3 transactions
  const recentTransactions = transactions.slice(0, 3);

  if (isLoading) {
    return (
      <div className="dashboard-page">
        <p style={{ color: 'var(--color-text-muted)', padding: '2rem' }}>Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-page">
        <p style={{ color: 'var(--color-danger)', padding: '2rem' }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Dashboard Overview</h1>
          <p className="dashboard-subtitle">
            Monitor your real-time balance and expense metrics.
          </p>
        </div>

        <Link to="/transactions" className="btn-add-quick">
          + Add Transaction
        </Link>
      </div>

      {/* Summary Cards Row */}
      <div className="dashboard-cards">
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
        <div className="dashboard-card-section">
          <h2 className="section-title">Income vs Expenses</h2>

          {transactions.length === 0 ? (
            <div className="empty-dashboard-chart">
              <p>No transactions to display.</p>

              <Link to="/transactions" className="btn-text-link">
                Add your first income or expense →
              </Link>
            </div>
          ) : (
            <FinanceChart
              income={totalIncome}
              expenses={totalExpenses}
            />
          )}
        </div>

        <div className="dashboard-card-section">
          <div className="section-header-inline">
            <h2 className="section-title">Recent Activity</h2>

            <Link to="/transactions" className="btn-text-link">
              View All
            </Link>
          </div>

          {recentTransactions.length === 0 ? (
            <p className="empty-recent-text">
              No recent transactions recorded.
            </p>
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
                  onDelete={deleteTransaction}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}