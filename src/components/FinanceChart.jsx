import "chart.js/auto";
import { Doughnut } from "react-chartjs-2";

const FinanceChart = ({ income = 0, expenses = 0 }) => {
  const data = {
    labels: ["Income", "Expenses"],
    datasets: [
      {
        data: [income, expenses],
        backgroundColor: ["#10b981", "#f43f5e"],
        borderColor: ["#047857", "#be123c"],
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: "#f8fafc",
          font: {
            size: 14,
            family: "'Plus Jakarta Sans', sans-serif",
          },
          padding: 20,
          usePointStyle: true,
          pointStyleWidth: 12,
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed;
            const total = income + expenses;
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return ` $${value.toLocaleString()} (${percentage}%)`;
          },
        },
        backgroundColor: "rgba(15, 23, 42, 0.95)",
        titleColor: "#ffffff",
        bodyColor: "#cbd5e1",
        borderColor: "rgba(255,255,255,0.1)",
        borderWidth: 1,
        padding: 12,
      },
    },
    cutout: "65%",
  };

  if (income === 0 && expenses === 0) {
    return (
      <div
        style={{
          maxWidth: "400px",
          margin: "0 auto",
          padding: "24px",
          background: "var(--color-surface)",
          borderRadius: "16px",
          border: "1px solid var(--color-surface-border)",
          textAlign: "center",
        }}
      >
        <h3
          style={{
            color: "#ffffff",
            fontSize: "18px",
            fontWeight: "600",
            marginBottom: "16px",
          }}
        >
          Income vs Expenses
        </h3>
        <p style={{ color: "var(--color-text-muted)", margin: 0 }}>
          Add transactions to view chart breakdown 📊
        </p>
      </div>
    );
  }

  const savingsRate = income > 0 ? (((income - expenses) / income) * 100).toFixed(1) : 0;

  return (
    <div
      style={{
        maxWidth: "400px",
        margin: "0 auto",
        padding: "24px",
        background: "var(--color-surface)",
        borderRadius: "16px",
        border: "1px solid var(--color-surface-border)",
        boxShadow: "var(--shadow-md)",
      }}
    >
      <Doughnut data={data} options={options} />
      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          marginTop: "20px",
          paddingTop: "16px",
          borderTop: "1px solid var(--color-surface-border)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "#94a3b8", fontSize: "12px", margin: 0 }}>
            Net Savings
          </p>
          <p
            style={{
              color: income >= expenses ? "#34d399" : "#f87171",
              fontSize: "18px",
              fontWeight: "700",
              margin: "4px 0 0",
            }}
          >
            ${(income - expenses).toLocaleString()}
          </p>
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "#94a3b8", fontSize: "12px", margin: 0 }}>
            Savings Rate
          </p>
          <p
            style={{
              color: "#a78bfa",
              fontSize: "18px",
              fontWeight: "700",
              margin: "4px 0 0",
            }}
          >
            {savingsRate}%
          </p>
        </div>
      </div>
    </div>
  );
};

export default FinanceChart;
