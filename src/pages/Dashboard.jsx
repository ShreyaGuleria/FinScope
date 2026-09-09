import SummaryCard from '../components/SummaryCard';
import './Dashboard.css';

export default function Dashboard() {
  return (
    <div className="dashboard">
      <h1 className="dashboard__heading">Dashboard</h1>

      <div className="dashboard__cards">
        <SummaryCard
          title="Total Income"
          amount="$5,200"
          color="var(--color-secondary)"
        />
        <SummaryCard
          title="Total Expenses"
          amount="$3,150"
          color="var(--color-danger)"
        />
        <SummaryCard
          title="Net Balance"
          amount="$2,050"
          color="var(--color-primary)"
        />
      </div>

      <div className="dashboard__chart-placeholder">
        Chart will go here
      </div>
    </div>
  );
}
