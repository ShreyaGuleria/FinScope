import SummaryCard from '../components/SummaryCard';
import FinanceChart from '../components/FinanceChart';
import './Dashboard.css';

export default function Dashboard() {
  const stored = localStorage.getItem("finscope_transactions");
  const transactions = stored ? JSON.parse(stored) : [];

  const totalIncome = transactions
    .filter(t => t.type === "Income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpenses = transactions
    .filter(t => t.type === "Expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const netBalance = totalIncome - totalExpenses;

  const fmt = (val) =>
    val.toLocaleString("en-US", { style: "currency", currency: "USD" });

  return (
    <div className="dashboard">
      <h1 className="dashboard__heading">Dashboard</h1>

      <div className="dashboard__cards">
        <SummaryCard
          title="Total Income"
          amount={fmt(totalIncome)}
          color="var(--color-secondary)"
          subtitle="all time"
        />
        <SummaryCard
          title="Total Expenses"
          amount={fmt(totalExpenses)}
          color="var(--color-danger)"
          subtitle="all time"
        />
        <SummaryCard
          title="Net Balance"
          amount={fmt(netBalance)}
          color="var(--color-primary)"
          subtitle="all time"
        />
      </div>

      {transactions.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginTop: '2rem' }}>
          No transactions yet — go add some in the Transactions page!
        </p>
      ) : (
        <FinanceChart income={totalIncome} expenses={totalExpenses} />
      )}
    </div>
  );
}
