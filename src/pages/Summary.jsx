import { useFinance } from '../context/FinanceContext';
import './Summary.css';

export default function Summary() {
  const { transactions } = useFinance();

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

  // Group by Category (Income vs Expense)
  const incomeCategoryMap = transactions
    .filter((t) => t.type === 'Income')
    .reduce((acc, t) => {
      const cat = t.category || 'Other';
      if (!acc[cat]) acc[cat] = 0;
      acc[cat] += Number(t.amount);
      return acc;
    }, {});
  const incomeCategoryData = Object.entries(incomeCategoryMap).sort((a, b) => b[1] - a[1]);

  const expenseCategoryMap = transactions
    .filter((t) => t.type === 'Expense')
    .reduce((acc, t) => {
      const cat = t.category || 'Other';
      if (!acc[cat]) acc[cat] = 0;
      acc[cat] += Number(t.amount);
      return acc;
    }, {});
  const expenseCategoryData = Object.entries(expenseCategoryMap).sort((a, b) => b[1] - a[1]);

  const fmt = (val) =>
    val.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });

  return (
    <div className="summary-page">
      <div className="summary-header">
        <h1 className="summary-title">Monthly &amp; Category Summary</h1>
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
            <div className="category-sections">
              <div className="category-section">
                <h3 className="category-section__heading text-income">Income</h3>
                {incomeCategoryData.length === 0 ? (
                  <p className="category-empty-text">No income transactions.</p>
                ) : (
                  <div className="category-grid">
                    {incomeCategoryData.map(([cat, total]) => (
                      <div key={cat} className="category-card">
                        <span className="category-card__name">{cat}</span>
                        <span className="category-card__total text-income">+{fmt(total)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="category-section">
                <h3 className="category-section__heading text-expense">Expense</h3>
                {expenseCategoryData.length === 0 ? (
                  <p className="category-empty-text">No expense transactions.</p>
                ) : (
                  <div className="category-grid">
                    {expenseCategoryData.map(([cat, total]) => (
                      <div key={cat} className="category-card">
                        <span className="category-card__name">{cat}</span>
                        <span className="category-card__total text-expense">-{fmt(total)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
