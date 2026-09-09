import './Summary.css';

const mockData = [
  { month: 'July',      income: '$5,400', expenses: '$3,200', net: '$2,200' },
  { month: 'August',    income: '$4,800', expenses: '$3,050', net: '$1,750' },
  { month: 'September', income: '$5,200', expenses: '$3,150', net: '$2,050' },
];

export default function Summary() {
  return (
    <div className="summary">
      <h1 className="summary__heading">Monthly Summary</h1>

      <div className="summary__table-wrapper">
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
            {mockData.map((row) => (
              <tr key={row.month}>
                <td className="summary__month">{row.month}</td>
                <td className="summary__income">{row.income}</td>
                <td className="summary__expenses">{row.expenses}</td>
                <td className="summary__net">{row.net}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
