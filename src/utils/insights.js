/**
 * insights.js
 * Pure utility function that analyzes transactions and category budgets to produce
 * intelligent, actionable financial insights and alerts for the FinScope Dashboard.
 */

/**
 * Generates an array of up to 4 financial insights based on the user's transactions and budgets.
 *
 * Checks performed:
 * 1. Month-over-month spending velocity for the top expense category.
 * 2. Current month savings rate: (income - expenses) / income.
 * 3. Budget utilization alerts (warning for 80%+, danger/exceeded for 100%+).
 * 4. Largest single expense incurred in the current month.
 *
 * Edge cases handled gracefully:
 * - Zero income (avoids NaN / Infinity).
 * - No previous month transactions (provides informative baseline without division by zero).
 * - Zero or unconfigured budgets.
 * - Empty transaction lists.
 *
 * @param {Array} transactions Array of transaction objects ({ amount, type, category, date, description })
 * @param {Object} budgets Category budget map ({ [category]: limitInINR })
 * @param {Object} [options]
 * @param {Date} [options.referenceDate=new Date()] Anchor date (defaults to current system date)
 * @param {Function} [options.formatAmount] Optional currency formatting callback
 * @returns {Array<{ type: 'info' | 'warning' | 'success' | 'danger', message: string }>}
 */
export function getSmartInsights(transactions = [], budgets = {}, options = {}) {
  const referenceDate = options.referenceDate || new Date();
  const formatAmount = options.formatAmount || ((val) => `₹${Math.round(val).toLocaleString('en-IN')}`);

  const insights = [];

  // Determine current and previous month prefixes ('YYYY-MM')
  const curYear = referenceDate.getFullYear();
  const curMonthIndex = referenceDate.getMonth(); // 0-indexed
  const currentMonthKey = `${curYear}-${String(curMonthIndex + 1).padStart(2, '0')}`;

  const prevMonthDate = new Date(curYear, curMonthIndex - 1, 1);
  const prevMonthKey = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;

  /* ─────────────────────────────────────────────────────────────────────────
   * 1. MONTH-OVER-MONTH CHANGE FOR TOP SPENDING CATEGORY
   * ───────────────────────────────────────────────────────────────────────── */
  const currentMonthCategoryExpenses = {};
  const prevMonthCategoryExpenses = {};

  if (Array.isArray(transactions)) {
    for (const t of transactions) {
      if (!t || !t.date || isNaN(Number(t.amount))) continue;
      if (t.type !== 'Expense') continue;

      const txMonth = String(t.date).substring(0, 7);
      const cat = t.category || 'Other';
      const amt = Number(t.amount);

      if (txMonth === currentMonthKey) {
        currentMonthCategoryExpenses[cat] = (currentMonthCategoryExpenses[cat] || 0) + amt;
      } else if (txMonth === prevMonthKey) {
        prevMonthCategoryExpenses[cat] = (prevMonthCategoryExpenses[cat] || 0) + amt;
      }
    }
  }

  // Identify top category in current month
  const currentCategoryEntries = Object.entries(currentMonthCategoryExpenses);
  currentCategoryEntries.sort(([, a], [, b]) => b - a);

  if (currentCategoryEntries.length > 0) {
    const [topCat, currentAmount] = currentCategoryEntries[0];
    const prevAmount = prevMonthCategoryExpenses[topCat] || 0;

    if (prevAmount > 0) {
      // Month-over-month percentage change formula: ((Current - Previous) / Previous) * 100
      const diff = currentAmount - prevAmount;
      const pctChange = Math.round(Math.abs((diff / prevAmount) * 100));

      if (diff > 0) {
        insights.push({
          type: pctChange >= 20 ? 'warning' : 'info',
          message: `${topCat} is up ${pctChange}% vs last month (${formatAmount(currentAmount)} vs ${formatAmount(prevAmount)}).`,
        });
      } else if (diff < 0) {
        insights.push({
          type: 'success',
          message: `${topCat} spending is down ${pctChange}% vs last month (${formatAmount(currentAmount)} vs ${formatAmount(prevAmount)}).`,
        });
      } else {
        insights.push({
          type: 'info',
          message: `${topCat} spending is identical to last month at ${formatAmount(currentAmount)}.`,
        });
      }
    } else {
      // Previous month had 0 spending or no data — avoid division by zero
      insights.push({
        type: 'info',
        message: `${topCat} is your top spending category this month (${formatAmount(currentAmount)}).`,
      });
    }
  } else {
    // No expenses this month
    insights.push({
      type: 'info',
      message: 'No expenses recorded this month yet.',
    });
  }

  /* ─────────────────────────────────────────────────────────────────────────
   * 2. SAVINGS RATE THIS MONTH = (Income - Expenses) / Income
   * ───────────────────────────────────────────────────────────────────────── */
  let currentMonthIncome = 0;
  let currentMonthExpenses = 0;

  if (Array.isArray(transactions)) {
    for (const t of transactions) {
      if (!t || !t.date || isNaN(Number(t.amount))) continue;
      const txMonth = String(t.date).substring(0, 7);

      if (txMonth === currentMonthKey) {
        if (t.type === 'Income') currentMonthIncome += Number(t.amount);
        else if (t.type === 'Expense') currentMonthExpenses += Number(t.amount);
      }
    }
  }

  if (currentMonthIncome > 0) {
    const netSavings = currentMonthIncome - currentMonthExpenses;
    const savingsRate = Math.round((netSavings / currentMonthIncome) * 100);

    if (savingsRate >= 30) {
      insights.push({
        type: 'success',
        message: `Outstanding savings rate of ${savingsRate}% this month (${formatAmount(netSavings)} saved).`,
      });
    } else if (savingsRate >= 10) {
      insights.push({
        type: 'success',
        message: `Healthy savings rate of ${savingsRate}% this month (${formatAmount(netSavings)} saved).`,
      });
    } else if (savingsRate >= 0) {
      insights.push({
        type: 'info',
        message: `Current savings rate is ${savingsRate}%. Aim for 20%+ to build a cash cushion.`,
      });
    } else {
      insights.push({
        type: 'warning',
        message: `Expenses exceed income this month (net savings rate is ${savingsRate}%).`,
      });
    }
  } else {
    // Edge case: No income recorded for this month
    if (currentMonthExpenses > 0) {
      insights.push({
        type: 'info',
        message: `No income logged this month yet. Expenses recorded: ${formatAmount(currentMonthExpenses)}.`,
      });
    } else {
      insights.push({
        type: 'info',
        message: 'Add income and expenses to calculate your monthly savings rate.',
      });
    }
  }

  /* ─────────────────────────────────────────────────────────────────────────
   * 3. CATEGORIES USING 80%+ OR EXCEEDING BUDGET
   * ───────────────────────────────────────────────────────────────────────── */
  const budgetEntries = Object.entries(budgets || {}).filter(
    ([, limit]) => typeof limit === 'number' && limit > 0
  );

  let budgetAlert = null;
  const exceededCategories = [];
  const nearLimitCategories = [];

  for (const [cat, limit] of budgetEntries) {
    const spent = currentMonthCategoryExpenses[cat] || 0;
    const usagePct = (spent / limit) * 100;

    if (usagePct >= 100) {
      exceededCategories.push({ cat, usagePct: Math.round(usagePct) });
    } else if (usagePct >= 80) {
      nearLimitCategories.push({ cat, usagePct: Math.round(usagePct) });
    }
  }

  if (exceededCategories.length > 0) {
    // Highest severity: Exceeded budgets
    const primary = exceededCategories[0];
    const moreCount = exceededCategories.length - 1;
    budgetAlert = {
      type: 'warning', // supports warning/danger styling in UI
      message: `${primary.cat} has exceeded its monthly budget (${primary.usagePct}% used)${
        moreCount > 0 ? ` (+${moreCount} other category)` : ''
      }!`,
    };
  } else if (nearLimitCategories.length > 0) {
    // Warning: Near 80%+ limit
    const primary = nearLimitCategories[0];
    budgetAlert = {
      type: 'warning',
      message: `${primary.cat} is near its limit (${primary.usagePct}% of budget used).`,
    };
  } else if (budgetEntries.length > 0) {
    // All budgets in safe zone
    budgetAlert = {
      type: 'success',
      message: 'All categories are currently within their planned budgets.',
    };
  } else {
    // Zero budgets set
    budgetAlert = {
      type: 'info',
      message: 'No category budgets set yet. Configure limits on the Budgets page.',
    };
  }

  insights.push(budgetAlert);

  /* ─────────────────────────────────────────────────────────────────────────
   * 4. LARGEST SINGLE EXPENSE THIS MONTH
   * ───────────────────────────────────────────────────────────────────────── */
  let largestExpense = null;

  if (Array.isArray(transactions)) {
    for (const t of transactions) {
      if (!t || !t.date || isNaN(Number(t.amount))) continue;
      if (t.type !== 'Expense') continue;

      const txMonth = String(t.date).substring(0, 7);
      if (txMonth === currentMonthKey) {
        const amt = Number(t.amount);
        if (!largestExpense || amt > largestExpense.amount) {
          largestExpense = {
            description: t.description || t.category || 'Expense',
            amount: amt,
            category: t.category,
          };
        }
      }
    }
  }

  if (largestExpense) {
    insights.push({
      type: 'info',
      message: `Largest expense this month: "${largestExpense.description}" at ${formatAmount(
        largestExpense.amount
      )}.`,
    });
  } else {
    insights.push({
      type: 'info',
      message: 'No individual expenses recorded this month.',
    });
  }

  // Ensure maximum of 4 insights returned as per specification
  return insights.slice(0, 4);
}
