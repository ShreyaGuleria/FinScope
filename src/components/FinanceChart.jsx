import { Chart } from "chart.js/auto";
import { Doughnut } from "react-chartjs-2";

const FinanceChart = ({ income = 5200, expenses = 3150 }) => {
  const data = {
    labels: ["Income", "Expenses"],
    datasets: [
      {
        data: [income, expenses],
        backgroundColor: ["#34d399", "#f87171"],
        borderColor: ["#059669", "#dc2626"],
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
          color: "#ffffff",
          font: {
            size: 14,
            family: "'Inter', sans-serif",
          },
          padding: 20,
          usePointStyle: true,
          pointStyleWidth: 12,
        },
      },
      title: {
        display: true,
        text: "Income vs Expenses",
        color: "#ffffff",
        font: {
          size: 18,
          weight: "600",
          family: "'Inter', sans-serif",
        },
        padding: {
          bottom: 20,
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed;
            const total = income + expenses;
            const percentage = ((value / total) * 100).toFixed(1);
            return ` $${value.toLocaleString()} (${percentage}%)`;
          },
        },
        backgroundColor: "rgba(17, 24, 39, 0.9)",
        titleColor: "#ffffff",
        bodyColor: "#d1d5db",
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
          background: "rgba(17, 24, 39, 0.8)",
          borderRadius: "16px",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
          textAlign: "center",
        }}
      >
        <h3
          style={{
            color: "#ffffff",
            fontSize: "18px",
            fontWeight: "600",
            fontFamily: "'Inter', sans-serif",
            marginBottom: "24px",
          }}
        >
          Income vs Expenses
        </h3>
        <p style={{ color: "var(--color-text-muted)", margin: 0 }}>
          Add transactions to see your chart 📊
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: "400px",
        margin: "0 auto",
        padding: "24px",
        background: "rgba(17, 24, 39, 0.8)",
        borderRadius: "16px",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
      }}
    >
      <h3
        style={{
          color: "#ffffff",
          fontSize: "18px",
          fontWeight: "600",
          fontFamily: "'Inter', sans-serif",
          marginBottom: "16px",
          textAlign: "center",
        }}
      >
        Income vs Expenses
      </h3>
      <Doughnut data={data} options={options} />
      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          marginTop: "20px",
          paddingTop: "16px",
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "#9ca3af", fontSize: "12px", margin: 0 }}>
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
          <p style={{ color: "#9ca3af", fontSize: "12px", margin: 0 }}>
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
            {(((income - expenses) / income) * 100).toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  );
};

export default FinanceChart;
