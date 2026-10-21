import { useState, useMemo } from 'react';
import 'chart.js/auto';
import { Line } from 'react-chartjs-2';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, CURRENCIES } from '../utils/currencyApi';
import './Simulator.css';

/* ─────────────────────────────────────────────────────────────────────────────
 * HARDCODED FALLBACK EXCHANGE RATES
 * Used only when neither useFinance().exchangeRates nor localStorage cache
 * is available (e.g. initial offline load). Rates are INR-based (1 INR = X).
 * ───────────────────────────────────────────────────────────────────────────── */
const FALLBACK_RATES = {
  INR: 1,
  USD: 0.012,
  EUR: 0.011,
  GBP: 0.0095,
};

/**
 * Formats a monetary amount in a specific currency using the project's standard
 * formatCurrency helper from currencyApi.js.
 * Passing { [code]: 1 } ensures formatCurrency treats the value as already in
 * that currency and applies correct locale symbols, grouping, and 2 decimals.
 */
function formatDisplayAmount(amount, currencyCode) {
  if (isNaN(amount) || amount === null || amount === undefined) return '—';
  return formatCurrency(amount, currencyCode, { [currencyCode]: 1 });
}

export default function Simulator() {
  /* ── 1. GLOBAL STATE CONSUMPTION ──
   * Reads the active currency, exchangeRates, and transactions from FinanceContext.
   * As per requirements, NO new API calls or fetches are introduced here.
   */
  const { currency, exchangeRates, transactions } = useFinance();

  /* ── 2. ACTIVE TAB STATE ('converter' | 'projection') ── */
  const [activeTab, setActiveTab] = useState('converter');

  /* ── 3. RATES & CACHE RECOVERY ──
   * If context exchangeRates is still null, we read the existing localStorage
   * cache saved by CurrencyWidget ('finscope_rates_cache').
   */
  const cachedRatesData = useMemo(() => {
    try {
      const raw = localStorage.getItem('finscope_rates_cache');
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }, []);

  const activeRates = exchangeRates || cachedRatesData?.rates || FALLBACK_RATES;
  const ratesUpdatedAt = cachedRatesData?.updatedAt;

  /* Formatted last updated note for rates */
  const formattedLastUpdated = useMemo(() => {
    if (!ratesUpdatedAt) return 'Standard reference rates';
    try {
      const date = new Date(ratesUpdatedAt);
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Cached rates';
    }
  }, [ratesUpdatedAt]);

  /* ─────────────────────────────────────────────────────────────────────────
   * TAB 1: CURRENCY CONVERTER STATE & LOGIC
   * ───────────────────────────────────────────────────────────────────────── */
  const [amountInput, setAmountInput] = useState('1000');
  const [userFromCurrency, setUserFromCurrency] = useState(null);
  const [userToCurrency, setUserToCurrency] = useState(null);

  // Fallback to active currency or sensible defaults if user hasn't manually selected
  const fromCurrency = userFromCurrency ?? currency ?? 'INR';
  const toCurrency = userToCurrency ?? (fromCurrency === 'USD' ? 'INR' : 'USD');

  // Swap from and to currencies
  function handleSwapCurrencies() {
    setUserFromCurrency(toCurrency);
    setUserToCurrency(fromCurrency);
  }

  // Parse and validate converter amount
  const parsedAmount = parseFloat(amountInput);
  const isAmountValid = !isNaN(parsedAmount) && parsedAmount > 0;
  let converterErrorMessage = '';
  if (amountInput.trim() === '') {
    converterErrorMessage = 'Please enter an amount to convert.';
  } else if (isNaN(parsedAmount)) {
    converterErrorMessage = 'Please enter a valid numeric amount.';
  } else if (parsedAmount <= 0) {
    converterErrorMessage = 'Amount must be greater than zero.';
  }

  // Calculate conversion:
  // Base rates are INR: 1 INR = activeRates[from], 1 INR = activeRates[to]
  // Therefore, 1 [from] = (activeRates[to] / activeRates[from]) [to]
  const fromRate = activeRates[fromCurrency] ?? 1;
  const toRate = activeRates[toCurrency] ?? 1;
  const conversionRate = fromRate > 0 ? toRate / fromRate : 0;
  const convertedAmount = isAmountValid ? parsedAmount * conversionRate : 0;

  /* ─────────────────────────────────────────────────────────────────────────
   * TAB 2: SAVINGS PROJECTION (SIP / COMPOUND INTEREST) STATE & LOGIC
   * ───────────────────────────────────────────────────────────────────────── */
  const currentCurrencySymbol =
    CURRENCIES.find((c) => c.code === currency)?.symbol || '₹';

  /*
   * Compute average monthly net balance from user transactions in useFinance().
   * Groups transactions by 'YYYY-MM', sums net (Income - Expense) per month,
   * then computes the mean monthly net savings.
   */
  const { avgMonthlyNetINR, activeMonthsCount } = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return { avgMonthlyNetINR: 0, activeMonthsCount: 0 };
    }

    const monthlyCashFlow = {};
    for (const tx of transactions) {
      if (!tx.date || isNaN(Number(tx.amount))) continue;
      const monthKey = tx.date.substring(0, 7); // 'YYYY-MM'
      if (!monthlyCashFlow[monthKey]) {
        monthlyCashFlow[monthKey] = 0;
      }
      if (tx.type === 'Income') {
        monthlyCashFlow[monthKey] += Number(tx.amount);
      } else {
        monthlyCashFlow[monthKey] -= Number(tx.amount);
      }
    }

    const monthKeys = Object.keys(monthlyCashFlow);
    if (monthKeys.length === 0) {
      return { avgMonthlyNetINR: 0, activeMonthsCount: 0 };
    }

    const sumNet = Object.values(monthlyCashFlow).reduce((acc, val) => acc + val, 0);
    const avg = sumNet / monthKeys.length;
    return { avgMonthlyNetINR: avg, activeMonthsCount: monthKeys.length };
  }, [transactions]);

  // Convert average monthly net to active display currency
  const avgMonthlyNetDisplay = useMemo(() => {
    if (avgMonthlyNetINR <= 0) return 0;
    const rate = currency !== 'INR' && activeRates?.[currency] ? activeRates[currency] : 1;
    return Math.max(0, Math.round(avgMonthlyNetINR * rate));
  }, [avgMonthlyNetINR, currency, activeRates]);

  // Pre-calculated default monthly saving
  const defaultMonthlySaving = useMemo(() => {
    if (avgMonthlyNetDisplay > 0) return avgMonthlyNetDisplay;
    return currency === 'INR' ? 5000 : 500;
  }, [avgMonthlyNetDisplay, currency]);

  // Projection inputs state
  const [startingAmount, setStartingAmount] = useState('10000');
  const [customMonthlySaving, setCustomMonthlySaving] = useState(null);
  const [annualReturn, setAnnualReturn] = useState('12'); // 12% equity benchmark
  const [years, setYears] = useState('10');

  // Resolved monthly saving: custom user override if set, else auto-filled average
  const monthlySaving =
    customMonthlySaving !== null ? customMonthlySaving : String(defaultMonthlySaving);
  const hasUserOverriddenMonthly = customMonthlySaving !== null;

  /* ─────────────────────────────────────────────────────────────────────────
   * COMPOUND INTEREST & MONTHLY SIP FORMULA EXPLANATION (Viva Reference):
   *
   * The total future value (FV) is computed using monthly compounding where:
   *   P   = Initial starting lump sum (startingAmount)
   *   PMT = Monthly recurring deposit / SIP (monthlySaving)
   *   r   = Annual nominal interest rate (annualReturn / 100)
   *   i   = Periodic monthly rate = r / 12
   *   n   = Total compounding periods (months) = years * 12
   *
   * 1. Future Value of Initial Principal:
   *    FV_lump = P * (1 + i)^n
   *
   * 2. Future Value of Monthly SIP (Annuity Due — payments at start of each month):
   *    FV_sip = PMT * [ ((1 + i)^n - 1) / i ] * (1 + i)
   *    (When return rate is 0%, FV_sip = PMT * n)
   *
   * 3. Combined Total Projected Corpus:
   *    Final Corpus = FV_lump + FV_sip
   *
   * 4. Total Amount Invested:
   *    Total Invested = P + (PMT * n)
   *
   * 5. Total Wealth Gain / Interest Earned:
   *    Total Interest = Final Corpus - Total Invested
   * ───────────────────────────────────────────────────────────────────────── */
  const projectionResults = useMemo(() => {
    const p = parseFloat(startingAmount);
    const pmt = parseFloat(monthlySaving);
    const rAnnual = parseFloat(annualReturn);
    const y = parseInt(years, 10);

    // Input validations
    const errors = {};
    if (isNaN(p) || p < 0) {
      errors.startingAmount = 'Starting amount must be 0 or greater.';
    }
    if (isNaN(pmt) || pmt < 0) {
      errors.monthlySaving = 'Monthly saving must be 0 or greater.';
    }
    if (isNaN(rAnnual) || rAnnual < 0 || rAnnual > 100) {
      errors.annualReturn = 'Annual return must be between 0% and 100%.';
    }
    if (isNaN(y) || y < 1 || y > 50) {
      errors.years = 'Duration must be between 1 and 50 years.';
    }

    const isValid = Object.keys(errors).length === 0;

    if (!isValid) {
      return {
        isValid: false,
        errors,
        finalCorpus: 0,
        totalInvested: 0,
        totalInterest: 0,
        yearlyBreakdown: [],
      };
    }

    const i = rAnnual / 100 / 12; // monthly rate
    const yearlyBreakdown = [];

    // Compute year-by-year progression for the Chart.js line chart
    for (let currentYear = 0; currentYear <= y; currentYear++) {
      const months = currentYear * 12;
      const investedSoFar = p + pmt * months;
      let projectedSoFar = 0;

      if (currentYear === 0) {
        projectedSoFar = p;
      } else if (i === 0) {
        projectedSoFar = investedSoFar;
      } else {
        const fvLump = p * Math.pow(1 + i, months);
        const fvSip = pmt * ((Math.pow(1 + i, months) - 1) / i) * (1 + i);
        projectedSoFar = fvLump + fvSip;
      }

      yearlyBreakdown.push({
        year: currentYear,
        invested: Math.round(investedSoFar),
        projected: Math.round(projectedSoFar),
      });
    }

    const lastEntry = yearlyBreakdown[yearlyBreakdown.length - 1] || {
      invested: 0,
      projected: 0,
    };
    const finalCorpus = lastEntry.projected;
    const totalInvested = lastEntry.invested;
    const totalInterest = Math.max(0, finalCorpus - totalInvested);

    return {
      isValid: true,
      errors: {},
      finalCorpus,
      totalInvested,
      totalInterest,
      yearlyBreakdown,
    };
  }, [startingAmount, monthlySaving, annualReturn, years]);

  /* ─────────────────────────────────────────────────────────────────────────
   * CHART.JS LINE CONFIGURATION
   * Displays two lines: 'Total Invested' vs 'Projected Value' by year.
   * Styled to match FinScope's Deep Space Navy theme.
   * ───────────────────────────────────────────────────────────────────────── */
  const chartData = useMemo(() => {
    const breakdown = projectionResults.yearlyBreakdown;
    return {
      labels: breakdown.map((d) => (d.year === 0 ? 'Start' : `Yr ${d.year}`)),
      datasets: [
        {
          label: 'Total Invested',
          data: breakdown.map((d) => d.invested),
          borderColor: '#3b82f6', // FinScope Blue
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          pointBackgroundColor: '#3b82f6',
          pointBorderColor: '#0b1530',
          pointRadius: breakdown.length > 25 ? 2 : 4,
          pointHoverRadius: 6,
          tension: 0.25,
          fill: true,
        },
        {
          label: 'Projected Value',
          data: breakdown.map((d) => d.projected),
          borderColor: '#10b981', // Emerald Green
          backgroundColor: 'rgba(16, 185, 129, 0.12)',
          borderWidth: 3,
          pointBackgroundColor: '#10b981',
          pointBorderColor: '#0b1530',
          pointRadius: breakdown.length > 25 ? 2 : 4,
          pointHoverRadius: 6,
          tension: 0.25,
          fill: true,
        },
      ],
    };
  }, [projectionResults.yearlyBreakdown]);

  const chartOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: {
            color: '#94a3b8',
            font: {
              family: "'Manrope', sans-serif",
              size: 12,
              weight: 600,
            },
            usePointStyle: true,
            pointStyle: 'circle',
            padding: 16,
          },
        },
        tooltip: {
          backgroundColor: 'rgba(11, 21, 48, 0.95)',
          titleColor: '#ffffff',
          bodyColor: '#cbd5e1',
          borderColor: 'rgba(100, 140, 255, 0.2)',
          borderWidth: 1,
          padding: 12,
          titleFont: { family: "'Manrope', sans-serif", weight: 700, size: 13 },
          bodyFont: { family: "'Manrope', sans-serif", size: 12 },
          callbacks: {
            label: (context) => {
              const val = context.parsed.y;
              return ` ${context.dataset.label}: ${formatDisplayAmount(val, currency)}`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(100, 140, 255, 0.06)',
          },
          ticks: {
            color: '#8899b8',
            font: { family: "'Manrope', sans-serif", size: 11 },
          },
        },
        y: {
          grid: {
            color: 'rgba(100, 140, 255, 0.06)',
          },
          ticks: {
            color: '#8899b8',
            font: { family: "'Manrope', sans-serif", size: 11 },
            callback: (value) => {
              // Concise axis labels e.g. 50k, 100k, 1M, 1Cr
              if (value >= 10000000) return `${(value / 10000000).toFixed(1)}Cr`;
              if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
              if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
              return value;
            },
          },
        },
      },
    };
  }, [currency]);

  return (
    <div className="simulator-page">
      {/* ── Page Header ── */}
      <div className="simulator-header">
        <div>
          <h1 className="simulator-title">Financial Simulator</h1>
          <p className="simulator-subtitle">
            Convert live currencies and model long-term compound wealth growth.
          </p>
        </div>

        {/* ── Tab Selector ── */}
        <div className="simulator-tabs" role="tablist" aria-label="Simulator tools">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'converter'}
            className={`simulator-tab ${
              activeTab === 'converter' ? 'simulator-tab--active' : ''
            }`}
            onClick={() => setActiveTab('converter')}
          >
            <span className="tab-icon" aria-hidden="true">
              💱
            </span>
            <span>Currency Converter</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'projection'}
            className={`simulator-tab ${
              activeTab === 'projection' ? 'simulator-tab--active' : ''
            }`}
            onClick={() => setActiveTab('projection')}
          >
            <span className="tab-icon" aria-hidden="true">
              📈
            </span>
            <span>Savings Projection</span>
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────────
       * TAB 1: CURRENCY CONVERTER
       * ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'converter' && (
        <div className="simulator-card converter-container">
          <div>
            <h2 className="simulator-card-title">Live Currency Converter</h2>
            <p className="simulator-card-desc">
              Convert amounts instantly between supported currencies using current
              exchange rates.
            </p>
          </div>

          <div className="converter-controls">
            {/* Amount Input */}
            <div className="form-group">
              <label htmlFor="convert-amount">Amount to Convert</label>
              <input
                id="convert-amount"
                type="number"
                step="any"
                min="0"
                placeholder="Enter amount..."
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                className={!isAmountValid && amountInput !== '' ? 'input-invalid' : ''}
              />
              {converterErrorMessage ? (
                <span className="input-error-msg">{converterErrorMessage}</span>
              ) : (
                <div className="preset-buttons">
                  {[100, 500, 1000, 5000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      className="btn-preset"
                      onClick={() => setAmountInput(String(preset))}
                    >
                      +{preset}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* From Currency Selector */}
            <div className="form-group">
              <label htmlFor="from-currency-select">From</label>
              <select
                id="from-currency-select"
                value={fromCurrency}
                onChange={(e) => setUserFromCurrency(e.target.value)}
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.symbol} {c.code} — {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Swap Button */}
            <div className="swap-btn-container">
              <button
                type="button"
                className="btn-swap"
                onClick={handleSwapCurrencies}
                title="Swap source and target currencies"
                aria-label="Swap currencies"
              >
                ⇄
              </button>
            </div>

            {/* To Currency Selector */}
            <div className="form-group">
              <label htmlFor="to-currency-select">To</label>
              <select
                id="to-currency-select"
                value={toCurrency}
                onChange={(e) => setUserToCurrency(e.target.value)}
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.symbol} {c.code} — {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Converted Output Display Card */}
          <div className="conversion-result-card">
            <div className="conversion-result-header">
              <span className="conversion-from-preview">
                {isAmountValid
                  ? `${formatDisplayAmount(parsedAmount, fromCurrency)} =`
                  : '—'}
              </span>
              <span className="rate-badge">
                1 {fromCurrency} = {conversionRate.toFixed(4)} {toCurrency}
              </span>
            </div>

            <div className="conversion-result-value">
              {isAmountValid
                ? formatDisplayAmount(convertedAmount, toCurrency)
                : '—'}
            </div>

            <div className="conversion-meta">
              <span>
                Inverse Rate: 1 {toCurrency} ={' '}
                {conversionRate > 0 ? (1 / conversionRate).toFixed(4) : 0}{' '}
                {fromCurrency}
              </span>
              <span className="updated-badge">
                <span className="updated-dot" aria-hidden="true" />
                Rates last updated: {formattedLastUpdated}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────
       * TAB 2: SAVINGS PROJECTION (SIP / COMPOUND INTEREST)
       * ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'projection' && (
        <div className="projection-container">
          {/* Inputs Card */}
          <div className="simulator-card">
            <h2 className="simulator-card-title">
              SIP &amp; Compound Interest Simulator
            </h2>
            <p className="simulator-card-desc">
              Forecast your future wealth based on starting capital, recurring monthly
              contributions, and expected annual returns.
            </p>

            <div className="form-grid">
              {/* 1. Starting Lump Sum */}
              <div className="form-group">
                <label htmlFor="starting-amount">
                  Starting Principal ({currentCurrencySymbol})
                </label>
                <input
                  id="starting-amount"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="e.g. 10000"
                  value={startingAmount}
                  onChange={(e) => setStartingAmount(e.target.value)}
                  className={
                    projectionResults.errors.startingAmount ? 'input-invalid' : ''
                  }
                />
                {projectionResults.errors.startingAmount ? (
                  <span className="input-error-msg">
                    {projectionResults.errors.startingAmount}
                  </span>
                ) : (
                  <span className="input-hint-msg">One-time initial investment</span>
                )}
              </div>

              {/* 2. Monthly Contribution (Pre-filled from transactions) */}
              <div className="form-group">
                <label htmlFor="monthly-saving">
                  <span>Monthly Contribution ({currentCurrencySymbol})</span>
                  {activeMonthsCount > 0 && !hasUserOverriddenMonthly && (
                    <span className="badge-prefilled" title="Calculated from your transaction history">
                      Auto-filled
                    </span>
                  )}
                </label>
                <input
                  id="monthly-saving"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="e.g. 5000"
                  value={monthlySaving}
                  onChange={(e) => setCustomMonthlySaving(e.target.value)}
                  className={
                    projectionResults.errors.monthlySaving ? 'input-invalid' : ''
                  }
                />
                {projectionResults.errors.monthlySaving ? (
                  <span className="input-error-msg">
                    {projectionResults.errors.monthlySaving}
                  </span>
                ) : (
                  <span className="input-hint-msg">
                    {activeMonthsCount > 0
                      ? `Avg monthly net cash flow: ${formatDisplayAmount(
                          avgMonthlyNetDisplay,
                          currency
                        )}/mo (${activeMonthsCount} mo history)`
                      : 'Recurring deposit at start of each month'}
                    {hasUserOverriddenMonthly && (
                      <button
                        type="button"
                        className="btn-preset"
                        style={{ marginLeft: '0.5rem', padding: '0.15rem 0.4rem' }}
                        onClick={() => setCustomMonthlySaving(null)}
                      >
                        Reset
                      </button>
                    )}
                  </span>
                )}
              </div>

              {/* 3. Expected Annual Return */}
              <div className="form-group">
                <label htmlFor="annual-return">Expected Return (% p.a.)</label>
                <input
                  id="annual-return"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="e.g. 12"
                  value={annualReturn}
                  onChange={(e) => setAnnualReturn(e.target.value)}
                  className={
                    projectionResults.errors.annualReturn ? 'input-invalid' : ''
                  }
                />
                {projectionResults.errors.annualReturn ? (
                  <span className="input-error-msg">
                    {projectionResults.errors.annualReturn}
                  </span>
                ) : (
                  <span className="input-hint-msg">
                    Historical equity benchmark: 10% – 14%
                  </span>
                )}
              </div>

              {/* 4. Investment Horizon (Years) */}
              <div className="form-group">
                <label htmlFor="investment-years">Time Horizon (Years)</label>
                <input
                  id="investment-years"
                  type="number"
                  min="1"
                  max="50"
                  step="1"
                  placeholder="e.g. 10"
                  value={years}
                  onChange={(e) => setYears(e.target.value)}
                  className={projectionResults.errors.years ? 'input-invalid' : ''}
                />
                {projectionResults.errors.years ? (
                  <span className="input-error-msg">
                    {projectionResults.errors.years}
                  </span>
                ) : (
                  <div className="quick-years-row">
                    {[5, 10, 15, 20].map((y) => (
                      <button
                        key={y}
                        type="button"
                        className={`btn-year-pill ${
                          parseInt(years, 10) === y ? 'btn-year-pill--active' : ''
                        }`}
                        onClick={() => setYears(String(y))}
                      >
                        {y}y
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Results Summary Metrics Cards */}
          {projectionResults.isValid && (
            <div className="projection-stats-grid">
              <div className="stat-card stat-card--highlight">
                <span className="stat-label">Projected Corpus</span>
                <span className="stat-value">
                  {formatDisplayAmount(projectionResults.finalCorpus, currency)}
                </span>
                <span className="stat-subtext">
                  Expected value after {years} {parseInt(years, 10) === 1 ? 'year' : 'years'}
                </span>
              </div>

              <div className="stat-card">
                <span className="stat-label">Total Invested</span>
                <span className="stat-value">
                  {formatDisplayAmount(projectionResults.totalInvested, currency)}
                </span>
                <span className="stat-subtext">
                  Principal ({formatDisplayAmount(parseFloat(startingAmount) || 0, currency)}) + monthly contributions
                </span>
              </div>

              <div className="stat-card">
                <span className="stat-label">Total Interest Earned</span>
                <span className="stat-value" style={{ color: '#60a5fa' }}>
                  {formatDisplayAmount(projectionResults.totalInterest, currency)}
                </span>
                <span className="stat-subtext">
                  Compound interest returns (
                  {projectionResults.totalInvested > 0
                    ? `${(
                        (projectionResults.totalInterest /
                          projectionResults.totalInvested) *
                        100
                      ).toFixed(1)}% gain`
                    : '0% gain'}
                  )
                </span>
              </div>
            </div>
          )}

          {/* Chart.js Visualization Card */}
          {projectionResults.isValid && (
            <div className="chart-card">
              <div className="chart-header">
                <h3 className="chart-title">Wealth Growth Trajectory</h3>
                <span className="rate-badge">
                  Year-by-Year: Invested vs Projected Value
                </span>
              </div>

              <div className="chart-canvas-container">
                <Line data={chartData} options={chartOptions} />
              </div>

              {/* Viva Explanation Box */}
              <div className="formula-explainer-card">
                <div className="formula-title">
                  💡 Mathematical Foundation (Compounding Formula):
                </div>
                <div className="formula-code">
                  Final Corpus = [P × (1 + i)ⁿ] + [PMT × (((1 + i)ⁿ - 1) / i) × (1 + i)]
                  <br />
                  where P = Principal, PMT = Monthly Deposit, i = Annual Rate / 12, n = Years × 12
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
