/**
 * chartData.js
 * Pure utility functions for aggregating financial transaction data
 * for FinScope Dashboard Chart.js visualisations.
 */

/* ─────────────────────────────────────────────────────────────────────────────
 * CATEGORY COLOR PALETTE
 * Curated, harmonious color tokens tailored for FinScope's Deep Space Navy theme.
 * ───────────────────────────────────────────────────────────────────────────── */
export const CATEGORY_COLORS = {
  'Food & Dining': '#f59e0b', // Amber 500
  'Salary & Paycheck': '#10b981', // Emerald 500
  'Housing & Rent': '#3b82f6', // FinScope Blue 500
  'Utilities & Bills': '#06b6d4', // Cyan 500
  Shopping: '#ec4899', // Pink 500
  Entertainment: '#8b5cf6', // Purple 500
  Investments: '#14b8a6', // Teal 500
  Other: '#64748b', // Slate 500
};

/**
 * Fallback palette used when a category doesn't have an explicit entry above.
 */
const FALLBACK_PALETTE = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ec4899',
  '#8b5cf6',
  '#06b6d4',
  '#f43f5e',
  '#64748b',
  '#14b8a6',
  '#f97316',
];

/**
 * Returns an array of background hex colors corresponding to the given category labels.
 * @param {string[]} labels Array of category names
 * @returns {string[]} Array of color codes
 */
export function getCategoryColors(labels) {
  return labels.map((label, index) => {
    return CATEGORY_COLORS[label] || FALLBACK_PALETTE[index % FALLBACK_PALETTE.length];
  });
}

/**
 * Generates an array of the last N calendar months in chronological order
 * ending with the referenceDate (default: current system date).
 *
 * Example output for referenceDate in October 2026 with count = 6:
 * [
 *   { key: '2026-05', label: 'May', fullLabel: 'May 2026' },
 *   { key: '2026-06', label: 'Jun', fullLabel: 'Jun 2026' },
 *   { key: '2026-07', label: 'Jul', fullLabel: 'Jul 2026' },
 *   { key: '2026-08', label: 'Aug', fullLabel: 'Aug 2026' },
 *   { key: '2026-09', label: 'Sep', fullLabel: 'Sep 2026' },
 *   { key: '2026-10', label: 'Oct', fullLabel: 'Oct 2026' }
 * ]
 *
 * @param {number} count Number of months to generate (default: 6)
 * @param {Date} [referenceDate] Anchor date to calculate backwards from
 * @returns {Array<{ key: string, label: string, fullLabel: string }>}
 */
export function getLastNMonths(count = 6, referenceDate = new Date()) {
  const months = [];
  const refYear = referenceDate.getFullYear();
  const refMonth = referenceDate.getMonth(); // 0-indexed (0 = Jan, 11 = Dec)

  for (let i = count - 1; i >= 0; i--) {
    // Setting day = 1 prevents edge cases when subtracting months (e.g., Feb 30)
    const d = new Date(refYear, refMonth - i, 1);
    const year = d.getFullYear();
    const monthNum = String(d.getMonth() + 1).padStart(2, '0');
    const key = `${year}-${monthNum}`;
    const label = d.toLocaleDateString('en-US', { month: 'short' });
    const fullLabel = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    months.push({ key, label, fullLabel });
  }

  return months;
}

/**
 * Aggregates expense transactions for the current month grouped by category.
 *
 * Logic:
 * 1. Determines the current month key ('YYYY-MM') based on referenceDate.
 * 2. Filters transactions for type === 'Expense' matching that month.
 * 3. Sums amounts per category into a hash map.
 * 4. Sorts categories in descending order of spending for aesthetic charts.
 * 5. Returns category labels, raw amounts in INR, total spending, and month display title.
 *
 * @param {Array} transactions Array of transaction objects
 * @param {Date} [referenceDate] Date used to define the "current" month (default: now)
 * @returns {{ labels: string[], data: number[], total: number, currentMonthLabel: string }}
 */
export function getCategorySpendingCurrentMonth(transactions, referenceDate = new Date()) {
  const currentYear = referenceDate.getFullYear();
  const currentMonthNum = String(referenceDate.getMonth() + 1).padStart(2, '0');
  const currentMonthKey = `${currentYear}-${currentMonthNum}`;
  const currentMonthLabel = referenceDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  if (!Array.isArray(transactions) || transactions.length === 0) {
    return { labels: [], data: [], total: 0, currentMonthLabel };
  }

  const categoryTotals = {};
  let totalSpending = 0;

  for (const t of transactions) {
    if (!t || !t.date || isNaN(Number(t.amount))) continue;
    if (t.type !== 'Expense') continue;

    // Matches 'YYYY-MM' prefix
    const txMonthKey = String(t.date).substring(0, 7);
    if (txMonthKey === currentMonthKey) {
      const cat = t.category || 'Other';
      const amt = Number(t.amount);
      categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;
      totalSpending += amt;
    }
  }

  // Sort categories by highest spend first
  const sortedCategories = Object.entries(categoryTotals).sort(
    ([, valA], [, valB]) => valB - valA
  );

  return {
    labels: sortedCategories.map(([cat]) => cat),
    data: sortedCategories.map(([, amt]) => Math.round(amt * 100) / 100),
    total: Math.round(totalSpending * 100) / 100,
    currentMonthLabel,
  };
}

/**
 * Aggregates monthly income and expense totals for the last N months (default: 6).
 *
 * Logic:
 * 1. Generates fixed chronological keys for the last N months.
 * 2. Pre-populates all months with income: 0, expenses: 0.
 *    -> Crucial: Months with no data will have 0 and are never skipped.
 * 3. Iterates through transactions, adding positive values to the corresponding month bucket.
 * 4. Returns synchronous arrays for labels, income series, and expense series.
 *
 * @param {Array} transactions Array of transaction objects
 * @param {number} [monthCount=6] Number of months to inspect
 * @param {Date} [referenceDate] Anchor date
 * @returns {{ labels: string[], income: number[], expenses: number[] }}
 */
export function getMonthlyIncomeVsExpenses(transactions, monthCount = 6, referenceDate = new Date()) {
  const months = getLastNMonths(monthCount, referenceDate);
  const monthlyMap = {};

  // Pre-seed all months to 0 so missing months are never omitted
  for (const m of months) {
    monthlyMap[m.key] = { income: 0, expenses: 0 };
  }

  if (Array.isArray(transactions)) {
    for (const t of transactions) {
      if (!t || !t.date || isNaN(Number(t.amount))) continue;
      const monthKey = String(t.date).substring(0, 7);

      if (monthlyMap[monthKey]) {
        const amt = Number(t.amount);
        if (t.type === 'Income') {
          monthlyMap[monthKey].income += amt;
        } else if (t.type === 'Expense') {
          monthlyMap[monthKey].expenses += amt;
        }
      }
    }
  }

  return {
    labels: months.map((m) => m.label),
    income: months.map((m) => Math.round(monthlyMap[m.key].income * 100) / 100),
    expenses: months.map((m) => Math.round(monthlyMap[m.key].expenses * 100) / 100),
  };
}

/**
 * Computes monthly net cash balance (Income - Expense) for the last N months (default: 6).
 *
 * Logic:
 * 1. Generates the continuous last N months array.
 * 2. Pre-seeds each month with income = 0 and expenses = 0.
 * 3. Sums transactions per month.
 * 4. Calculates Net = Income - Expenses for each month.
 *    -> If a month had no transactions, Net evaluates to (0 - 0) = 0.
 *
 * @param {Array} transactions Array of transaction objects
 * @param {number} [monthCount=6] Number of months to inspect
 * @param {Date} [referenceDate] Anchor date
 * @returns {{ labels: string[], netBalances: number[] }}
 */
export function getMonthlyNetTrend(transactions, monthCount = 6, referenceDate = new Date()) {
  const { labels, income, expenses } = getMonthlyIncomeVsExpenses(
    transactions,
    monthCount,
    referenceDate
  );

  const netBalances = income.map((inc, index) => {
    const exp = expenses[index];
    return Math.round((inc - exp) * 100) / 100;
  });

  return {
    labels,
    netBalances,
  };
}
