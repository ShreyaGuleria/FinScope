import { Link } from 'react-router-dom';
import SummaryCard from '../components/SummaryCard';
import FinanceChart from '../components/FinanceChart';
import TransactionCard from '../components/TransactionCard';
import { loadTransactions } from '../utils/storage';
import './Dashboard.css';

export default function Dashboard() {
  const transactions = loadTransactions();

  const totalIncome = transactions
    .filter((t) => t.type === 'Income')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpenses = transactions
    .filter((t) => t.type === 'Expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const netBalance = totalIncome - totalExpenses;

  const fmt = (val) =>
    val.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  // Recent 3 transactions
  const recentTransactions = transactions.slice(0, 3);

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Dashboard Overview</h1>
          <p className="dashboard-subtitle">Monitor your real-time balance and expense metrics.</p>
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
          icon="💵"
          subtitle="All time total"
        />
        <SummaryCard
          title="Total Expenses"
          amount={fmt(totalExpenses)}
          color="var(--color-danger)"
          icon="💸"
          subtitle="All time total"
        />
        <SummaryCard
          title="Net Balance"
          amount={fmt(netBalance)}
          color="var(--color-primary)"
          icon="⚖️"
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
            <FinanceChart income={totalIncome} expenses={totalExpenses} />
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
            <p className="empty-recent-text">No recent transactions recorded.</p>
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
                  onDelete={() => {}}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
