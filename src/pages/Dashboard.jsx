import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import SummaryCard from '../components/SummaryCard';
import FinanceChart from '../components/FinanceChart';
import TransactionCard from '../components/TransactionCard';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, CURRENCIES } from '../utils/currencyApi';
import {
  getCategorySpendingCurrentMonth,
  getMonthlyIncomeVsExpenses,
  getMonthlyNetTrend,
  getCategoryColors,
} from '../utils/chartData';
import { getSmartInsights } from '../utils/insights';
import './Dashboard.css';

export default function Dashboard() {
  const { transactions, budgets, deleteTransaction, currency, exchangeRates, isLoading, error } =
    useFinance();

  /* ── 1. ALL-TIME SUMMARY TOTALS ── */
  const { totalIncome, totalExpenses, netBalance } = useMemo(() => {
    let income = 0;
    let expenses = 0;
    for (const t of transactions) {
      if (t.type === 'Income') income += Number(t.amount);
      else expenses += Number(t.amount);
    }
    return { totalIncome: income, totalExpenses: expenses, netBalance: income - expenses };
  }, [transactions]);

  /* ── 2. CURRENCY FORMATTING & CONVERSION HELPERS ── */
  const fmt = (val) => formatCurrency(val, currency, exchangeRates);

  // Active exchange rate (INR -> active display currency)
  const rate = useMemo(() => {
    if (currency === 'INR' || !exchangeRates) return 1;
    return exchangeRates[currency] ?? 1;
  }, [currency, exchangeRates]);

  const currencySymbol = useMemo(() => {
    return CURRENCIES.find((c) => c.code === currency)?.symbol || '₹';
  }, [currency]);

  // Formats an amount already in the active display currency
  const formatMoney = useMemo(() => {
    return (valInDisplayCurrency) => {
      return formatCurrency(valInDisplayCurrency, currency, { [currency]: 1 });
    };
  }, [currency]);

  // Compact axis tick formatter (e.g. ₹50k, ₹1L, $10k, €1M)
  const formatCompactTick = useMemo(() => {
    return (val) => {
      const abs = Math.abs(val);
      const sign = val < 0 ? '-' : '';

      if (currency === 'INR') {
        if (abs >= 10000000) return `${sign}${currencySymbol}${(abs / 10000000).toFixed(1)}Cr`;
        if (abs >= 100000) return `${sign}${currencySymbol}${(abs / 100000).toFixed(1)}L`;
        if (abs >= 1000) return `${sign}${currencySymbol}${(abs / 1000).toFixed(0)}k`;
        return `${sign}${currencySymbol}${abs}`;
      }

      if (abs >= 1000000) return `${sign}${currencySymbol}${(abs / 1000000).toFixed(1)}M`;
      if (abs >= 1000) return `${sign}${currencySymbol}${(abs / 1000).toFixed(0)}k`;
      return `${sign}${currencySymbol}${abs}`;
    };
  }, [currency, currencySymbol]);

  /* ── 3. DATA AGGREGATION VIA PURE UTILS (Memoised on transactions change) ── */
  // Chart 1: Current month spending by category (expenses only)
  const categorySpendingRaw = useMemo(() => {
    return getCategorySpendingCurrentMonth(transactions);
  }, [transactions]);

  // Chart 2: Last 6 months income vs expenses (0 for empty months, not skipped)
  const monthlyIncomeExpensesRaw = useMemo(() => {
    return getMonthlyIncomeVsExpenses(transactions, 6);
  }, [transactions]);

  // Chart 3: Last 6 months net balance trend (0 for empty months, not skipped)
  const monthlyNetTrendRaw = useMemo(() => {
    return getMonthlyNetTrend(transactions, 6);
  }, [transactions]);

  // Smart Insights (derived from transactions and budgets)
  const smartInsights = useMemo(() => {
    return getSmartInsights(transactions, budgets, {
      formatAmount: (valInINR) => formatCurrency(valInINR, currency, exchangeRates),
    });
  }, [transactions, budgets, currency, exchangeRates]);

  /* ── 4. CHART.JS CONFIGURATIONS ── */

  // Chart 1 (Doughnut) Configuration
  const categoryChartData = useMemo(() => {
    const rawData = categorySpendingRaw.data;
    const convertedData = rawData.map((amt) => Math.round(amt * rate * 100) / 100);

    return {
      labels: categorySpendingRaw.labels,
      datasets: [
        {
          data: convertedData,
          backgroundColor: getCategoryColors(categorySpendingRaw.labels),
          borderColor: '#0a1428',
          borderWidth: 2,
          hoverOffset: 6,
        },
      ],
    };
  }, [categorySpendingRaw, rate]);

  const categoryChartOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#94a3b8',
            font: { family: "'Manrope', sans-serif", size: 12, weight: 500 },
            padding: 14,
            usePointStyle: true,
            pointStyle: 'circle',
          },
        },
        tooltip: {
          backgroundColor: 'rgba(11, 21, 48, 0.95)',
          titleColor: '#ffffff',
          bodyColor: '#cbd5e1',
          borderColor: 'rgba(100, 140, 255, 0.2)',
          borderWidth: 1,
          padding: 12,
          titleFont: { family: "'Manrope', sans-serif", weight: 700 },
          bodyFont: { family: "'Manrope', sans-serif" },
          callbacks: {
            label: (context) => {
              const val = context.parsed;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
              return ` ${context.label}: ${formatMoney(val)} (${pct}%)`;
            },
          },
        },
      },
      cutout: '65%',
    };
  }, [formatMoney]);

  // Chart 2 (Grouped Bar) Configuration
  const barChartData = useMemo(() => {
    const convertedIncome = monthlyIncomeExpensesRaw.income.map(
      (amt) => Math.round(amt * rate * 100) / 100
    );
    const convertedExpenses = monthlyIncomeExpensesRaw.expenses.map(
      (amt) => Math.round(amt * rate * 100) / 100
    );

    return {
      labels: monthlyIncomeExpensesRaw.labels,
      datasets: [
        {
          label: 'Income',
          data: convertedIncome,
          backgroundColor: '#10b981',
          borderRadius: 4,
          borderSkipped: false,
          barPercentage: 0.65,
          categoryPercentage: 0.7,
        },
        {
          label: 'Expenses',
          data: convertedExpenses,
          backgroundColor: '#f43f5e',
          borderRadius: 4,
          borderSkipped: false,
          barPercentage: 0.65,
          categoryPercentage: 0.7,
        },
      ],
    };
  }, [monthlyIncomeExpensesRaw, rate]);

  const barChartOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: {
            color: '#94a3b8',
            font: { family: "'Manrope', sans-serif", size: 12, weight: 600 },
            usePointStyle: true,
            pointStyle: 'circle',
            padding: 12,
          },
        },
        tooltip: {
          backgroundColor: 'rgba(11, 21, 48, 0.95)',
          titleColor: '#ffffff',
          bodyColor: '#cbd5e1',
          borderColor: 'rgba(100, 140, 255, 0.2)',
          borderWidth: 1,
          padding: 12,
          titleFont: { family: "'Manrope', sans-serif", weight: 700 },
          bodyFont: { family: "'Manrope', sans-serif" },
          callbacks: {
            label: (context) => {
              const val = context.parsed.y;
              return ` ${context.dataset.label}: ${formatMoney(val)}`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { color: 'rgba(100, 140, 255, 0.06)' },
          ticks: { color: '#8899b8', font: { family: "'Manrope', sans-serif", size: 11 } },
        },
        y: {
          grid: { color: 'rgba(100, 140, 255, 0.06)' },
          ticks: {
            color: '#8899b8',
            font: { family: "'Manrope', sans-serif", size: 11 },
            callback: (val) => formatCompactTick(val),
          },
        },
      },
    };
  }, [formatMoney, formatCompactTick]);

  // Chart 3 (Line Trend) Configuration
  const lineChartData = useMemo(() => {
    const convertedNet = monthlyNetTrendRaw.netBalances.map(
      (amt) => Math.round(amt * rate * 100) / 100
    );

    return {
      labels: monthlyNetTrendRaw.labels,
      datasets: [
        {
          label: 'Net Balance',
          data: convertedNet,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.12)',
          borderWidth: 3,
          pointBackgroundColor: '#3b82f6',
          pointBorderColor: '#0a1428',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
          tension: 0.3,
          fill: true,
        },
      ],
    };
  }, [monthlyNetTrendRaw, rate]);

  const lineChartOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: 'rgba(11, 21, 48, 0.95)',
          titleColor: '#ffffff',
          bodyColor: '#cbd5e1',
          borderColor: 'rgba(100, 140, 255, 0.2)',
          borderWidth: 1,
          padding: 12,
          titleFont: { family: "'Manrope', sans-serif", weight: 700 },
          bodyFont: { family: "'Manrope', sans-serif" },
          callbacks: {
            label: (context) => {
              const val = context.parsed.y;
              return ` Net Balance: ${formatMoney(val)}`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { color: 'rgba(100, 140, 255, 0.06)' },
          ticks: { color: '#8899b8', font: { family: "'Manrope', sans-serif", size: 11 } },
        },
        y: {
          grid: { color: 'rgba(100, 140, 255, 0.06)' },
          ticks: {
            color: '#8899b8',
            font: { family: "'Manrope', sans-serif", size: 11 },
            callback: (val) => formatCompactTick(val),
          },
        },
      },
    };
  }, [formatMoney, formatCompactTick]);

  // Recent 3 transactions
  const recentTransactions = transactions.slice(0, 3);

  if (isLoading) {
    return (
      <div className="dashboard-page">
        <p style={{ color: 'var(--color-text-muted)', padding: '2rem' }}>Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-page">
        <p style={{ color: 'var(--color-danger)', padding: '2rem' }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* ── Dashboard Header ── */}
      <div className="dashboard-header">
        <div className="dashboard-header__info">
          <span className="dashboard-eyebrow">Overview</span>
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">
            Monitor real-time cash flow, category allocation, and 6-month trends.
          </p>
        </div>

        <Link to="/transactions" className="btn-add-quick">
          + Add Transaction
        </Link>
      </div>

      {/* ── Summary Cards Row ── */}
      <div className="dashboard-cards">
        <SummaryCard
          title="Total Income"
          amount={fmt(totalIncome)}
          color="var(--color-secondary)"
          subtitle="All time total"
        />

        <SummaryCard
          title="Total Expenses"
          amount={fmt(totalExpenses)}
          color="var(--color-danger)"
          subtitle="All time total"
        />

        <SummaryCard
          title="Net Balance"
          amount={fmt(netBalance)}
          color="var(--color-primary)"
          subtitle="Net cash balance"
        />
      </div>

      {/* ── Smart Insights Section (Max 4 items) ── */}
      <section className="dashboard-insights-section" aria-label="Smart Financial Insights">
        <div className="section-header-block">
          <span className="section-eyebrow">Intelligence</span>
          <h2 className="section-title">Smart Insights</h2>
        </div>

        <div className="insights-grid">
          {smartInsights.map((insight, idx) => (
            <div key={idx} className={`insight-card insight-card--${insight.type}`}>
              <div className="insight-card__icon" aria-hidden="true">
                {insight.type === 'success' && '🟢'}
                {(insight.type === 'warning' || insight.type === 'danger') && '⚠️'}
                {insight.type === 'info' && '💡'}
              </div>
              <div className="insight-card__content">
                <span className="insight-card__type-tag">
                  {insight.type === 'danger' ? 'Alert' : insight.type.toUpperCase()}
                </span>
                <p className="insight-card__message">{insight.message}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Visual Analytics Section ── */}
      {transactions.length === 0 ? (
        <div className="empty-dashboard-chart">
          <div className="empty-chart-icon" aria-hidden="true">
            📊
          </div>
          <p className="empty-chart-text">Add a transaction to see charts</p>
          <Link to="/transactions" className="btn-add-quick">
            + Add Transaction
          </Link>
        </div>
      ) : (
        <div className="dashboard-charts-container">
          {/* Top Row: Doughnut and Bar side-by-side on desktop, stacked on mobile */}
          <div className="dashboard-charts-row">
            {/* Chart 1: Spending by Category (Current Month) */}
            <div className="dashboard-chart-card">
              <div className="chart-card-header">
                <div className="chart-card-titles">
                  <h2 className="chart-card-title">Spending by Category</h2>
                  <p className="chart-card-subtitle">
                    Expenses for {categorySpendingRaw.currentMonthLabel}
                  </p>
                </div>
                <span className="chart-badge chart-badge--month">
                  {categorySpendingRaw.currentMonthLabel}
                </span>
              </div>

              <div className="chart-wrapper chart-wrapper--doughnut">
                {categorySpendingRaw.total === 0 ? (
                  <div className="empty-chart-inline">
                    <p>No expenses recorded for this month.</p>
                    <Link to="/transactions" className="btn-text-link">
                      + Record an expense
                    </Link>
                  </div>
                ) : (
                  <FinanceChart
                    type="doughnut"
                    data={categoryChartData}
                    options={categoryChartOptions}
                  />
                )}
              </div>
            </div>

            {/* Chart 2: Income vs Expenses (Last 6 Months) */}
            <div className="dashboard-chart-card">
              <div className="chart-card-header">
                <div className="chart-card-titles">
                  <h2 className="chart-card-title">Income vs Expenses</h2>
                  <p className="chart-card-subtitle">
                    Monthly cash flow comparison
                  </p>
                </div>
                <span className="chart-badge">Last 6 Months</span>
              </div>

              <div className="chart-wrapper">
                <FinanceChart
                  type="bar"
                  data={barChartData}
                  options={barChartOptions}
                />
              </div>
            </div>
          </div>

          {/* Bottom Full-Width: Net Balance Trend (Last 6 Months) */}
          <div className="dashboard-chart-card dashboard-chart-card--full">
            <div className="chart-card-header">
              <div className="chart-card-titles">
                <h2 className="chart-card-title">Net Balance Trend</h2>
                <p className="chart-card-subtitle">
                  Historical net cash flow (Income − Expenses)
                </p>
              </div>
              <span className="chart-badge">Last 6 Months</span>
            </div>

            <div className="chart-wrapper">
              <FinanceChart
                type="line"
                data={lineChartData}
                options={lineChartOptions}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Recent Activity Section ── */}
      <div className="dashboard-card-section">
        <div className="section-header-inline">
          <h2 className="section-title">Recent Activity</h2>

          <Link to="/transactions" className="btn-view-all">
            View All →
          </Link>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="empty-recent-container">
            <p className="empty-recent-text">No recent transactions recorded.</p>
          </div>
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
                onDelete={deleteTransaction}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}