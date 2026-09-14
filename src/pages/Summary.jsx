import { loadTransactions } from '../utils/storage';
import './Summary.css';

export default function Summary() {
  const transactions = loadTransactions();

  // Group by Month (YYYY-MM)
  const monthlyMap = transactions.reduce((acc, t) => {
    const month = t.date ? t.date.substring(0, 7) : 'Unknown';
    if (!acc[month]) {
      acc[month] = { month, income: 0, expenses: 0 };
    }
    if (t.type === 'Income') {
      acc[month].income += Number(t.amount);
    } else {
      acc[month].expenses += Number(t.amount);
    }
    return acc;
  }, {});

  const monthlyData = Object.values(monthlyMap).sort((a, b) => (b.month > a.month ? 1 : -1));

  // Group by Category
  const categoryMap = transactions.reduce((acc, t) => {
    const cat = t.category || 'Other';
    if (!acc[cat]) acc[cat] = 0;
    acc[cat] += Number(t.amount);
    return acc;
  }, {});

  const categoryData = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);

  const fmt = (val) =>
    val.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });

  return (
    <div className="summary-page">
      <div className="summary-header">
        <h1 className="summary-title">Monthly & Category Summary</h1>
        <p className="summary-subtitle">Overview of monthly cash flow and category allocation.</p>
      </div>

      {transactions.length === 0 ? (
        <div className="summary-empty">
          <p>No transactions available to generate summary analytics.</p>
        </div>
      ) : (
        <>
          {/* Monthly Breakdown Table */}
          <div className="summary-card-table">
            <h2 className="summary-section-title">Monthly Breakdown</h2>
            <div className="table-responsive">
              <table className="summary-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Total Income</th>
                    <th>Total Expenses</th>
                    <th>Net Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.map((row) => {
                    const net = row.income - row.expenses;
                    return (
                      <tr key={row.month}>
                        <td className="font-semibold">{row.month}</td>
                        <td className="text-income">+{fmt(row.income)}</td>
                        <td className="text-expense">-{fmt(row.expenses)}</td>
                        <td className={net >= 0 ? 'text-income font-bold' : 'text-expense font-bold'}>
                          {fmt(net)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="summary-card-categories">
            <h2 className="summary-section-title">Category Volume</h2>
            <div className="category-grid">
              {categoryData.map(([cat, total]) => (
                <div key={cat} className="category-card">
                  <span className="category-card__name">{cat}</span>
                  <span className="category-card__total">{fmt(total)}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
