import "chart.js/auto";
import { Doughnut } from "react-chartjs-2";

const FinanceChart = ({ income = 0, expenses = 0 }) => {
  const data = {
    labels: ["Income", "Expenses"],
    datasets: [
      {
        data: [income, expenses],
        backgroundColor: ["#10b981", "#f43f5e"],
        borderColor: ["#111111", "#111111"],
        borderWidth: 3,
        hoverOffset: 6,
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
          color: "#94a3b8",
          font: {
            size: 13,
            family: "'Manrope', sans-serif",
            weight: 500,
          },
          padding: 20,
          usePointStyle: true,
          pointStyleWidth: 10,
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
        backgroundColor: "rgba(17, 17, 17, 0.95)",
        titleColor: "#ffffff",
        bodyColor: "#cbd5e1",
        borderColor: "rgba(255,255,255,0.1)",
        borderWidth: 1,
        padding: 12,
        titleFont: { family: "'Manrope', sans-serif" },
        bodyFont: { family: "'Manrope', sans-serif" },
      },
    },
    cutout: "70%",
  };

  if (income === 0 && expenses === 0) {
    return (
      <div
        style={{
          width: "100%",
          padding: "32px 16px",
          textAlign: "center",
        }}
      >
        <p style={{ color: "var(--color-text-muted)", margin: 0, fontSize: "14px" }}>
          No transactions to display.
        </p>
      </div>
    );
  }

  const savingsRate = income > 0 ? (((income - expenses) / income) * 100).toFixed(1) : 0;

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "360px",
        margin: "0 auto",
        padding: "12px 0 0",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div style={{ width: "100%", position: "relative" }}>
        <Doughnut data={data} options={options} />
      </div>

      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-around",
          marginTop: "24px",
          paddingTop: "16px",
          borderTop: "1px solid rgba(255, 255, 255, 0.07)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <p
            style={{
              color: "var(--color-text-dim)",
              fontSize: "11px",
              fontWeight: "700",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              margin: 0,
            }}
          >
            Net Savings
          </p>
          <p
            style={{
              color: income >= expenses ? "#34d399" : "#f87171",
              fontFamily: "var(--font-display)",
              fontSize: "1.25rem",
              fontWeight: "500",
              margin: "6px 0 0",
            }}
          >
            ${(income - expenses).toLocaleString()}
          </p>
        </div>
        <div style={{ textAlign: "center" }}>
          <p
            style={{
              color: "var(--color-text-dim)",
              fontSize: "11px",
              fontWeight: "700",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              margin: 0,
            }}
          >
            Savings Rate
          </p>
          <p
            style={{
              color: "#a78bfa",
              fontFamily: "var(--font-display)",
              fontSize: "1.25rem",
              fontWeight: "500",
              margin: "6px 0 0",
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

