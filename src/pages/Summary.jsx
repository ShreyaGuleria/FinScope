import './Summary.css';

const fmt = (val) =>
  val.toLocaleString("en-US", { style: "currency", currency: "USD" });

// "2025-09" → "September 2025"
function formatMonthLabel(key) {
  const [year, month] = key.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

export default function Summary() {
  const stored = localStorage.getItem("finscope_transactions");
  const transactions = stored ? JSON.parse(stored) : [];

  // Group by "YYYY-MM"
  const monthMap = {};
  transactions.forEach(t => {
    const key = t.date.slice(0, 7); // "2025-09"
    if (!monthMap[key]) {
      monthMap[key] = { income: 0, expenses: 0 };
    }
    if (t.type === "Income") {
      monthMap[key].income += Number(t.amount);
    } else {
      monthMap[key].expenses += Number(t.amount);
    }
  });

  // Sort chronologically
  const sortedMonths = Object.keys(monthMap).sort();

  return (
    <div className="summary">
      <h1 className="summary__heading">Monthly Summary</h1>

      <div className="summary__table-wrapper">
        {sortedMonths.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem 0' }}>
            No data to display yet.
          </p>
        ) : (
          <table className="summary__table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Income</th>
                <th>Expenses</th>
                <th>Net</th>
              </tr>
            </thead>
            <tbody>
              {sortedMonths.map((key) => {
                const { income, expenses } = monthMap[key];
                const net = income - expenses;
                return (
                  <tr key={key}>
                    <td className="summary__month">{formatMonthLabel(key)}</td>
                    <td className="summary__income">{fmt(income)}</td>
                    <td className="summary__expenses">{fmt(expenses)}</td>
                    <td className="summary__net">{fmt(net)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
