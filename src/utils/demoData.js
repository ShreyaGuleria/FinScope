/* ─────────────────────────────────────────────────────────────
   demoData.js
   Generates realistic Indian personal-finance demo transactions
   and sample budgets for seeding FinScope.

   Dates are computed relative to today at call-time so the data
   never becomes stale, and every entry covers a different category.
───────────────────────────────────────────────────────────── */

/** Returns 'YYYY-MM-DD' string offset n days before today */
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

/**
 * Builds 25 realistic Indian transactions spread across the last ~3 months.
 * IDs are generated as Date.now() + index — same pattern as addTransaction —
 * so they are unique integers and won't collide with each other.
 *
 * @returns {Array} array of transaction objects ready for the reducer
 */
export function buildDemoTransactions() {
  const base = Date.now(); // base timestamp; +index guarantees uniqueness

  /* Raw seed data: fields used to build the final transaction objects.
     daysAgo is the number of days before today for the transaction date. */
  const raw = [
    // ── Current month ──────────────────────────────────────────────
    { description: 'Monthly Salary',             amount: 65000, type: 'Income',  category: 'Salary & Paycheck', ago: 2  },
    { description: 'Swiggy – dinner order',       amount: 480,   type: 'Expense', category: 'Food & Dining',     ago: 3  },
    { description: 'Zomato – office lunch',       amount: 320,   type: 'Expense', category: 'Food & Dining',     ago: 5  },
    { description: 'Uber ride to office',         amount: 210,   type: 'Expense', category: 'Other',             ago: 6  },
    { description: 'Netflix subscription',        amount: 649,   type: 'Expense', category: 'Entertainment',     ago: 8  },
    { description: 'SIP – Nifty 50 index fund',   amount: 5000,  type: 'Expense', category: 'Investments',       ago: 9  },
    { description: 'BESCOM electricity bill',     amount: 1350,  type: 'Expense', category: 'Utilities & Bills', ago: 10 },
    { description: 'Big Basket grocery haul',     amount: 2800,  type: 'Expense', category: 'Food & Dining',     ago: 12 },

    // ── Last month ─────────────────────────────────────────────────
    { description: 'Monthly Salary',             amount: 65000, type: 'Income',  category: 'Salary & Paycheck', ago: 32 },
    { description: 'House rent – last month',    amount: 14500, type: 'Expense', category: 'Housing & Rent',    ago: 33 },
    { description: 'Zomato – pizza night',       amount: 560,   type: 'Expense', category: 'Food & Dining',     ago: 35 },
    { description: 'Amazon – noise cancelling headphones', amount: 2199, type: 'Expense', category: 'Shopping', ago: 37 },
    { description: 'Jio mobile recharge',        amount: 299,   type: 'Expense', category: 'Utilities & Bills', ago: 39 },
    { description: 'Cult.fit gym membership',    amount: 1800,  type: 'Expense', category: 'Other',             ago: 41 },
    { description: 'Swiggy – weekend breakfast', amount: 390,   type: 'Expense', category: 'Food & Dining',     ago: 43 },
    { description: 'SIP – mid-cap mutual fund',  amount: 3000,  type: 'Expense', category: 'Investments',       ago: 45 },
    { description: 'Freelance design project',   amount: 12000, type: 'Income',  category: 'Other',             ago: 47 },
    { description: 'Uber – airport drop',        amount: 750,   type: 'Expense', category: 'Other',             ago: 50 },

    // ── Two months ago ─────────────────────────────────────────────
    { description: 'Monthly Salary',             amount: 65000, type: 'Income',  category: 'Salary & Paycheck', ago: 62 },
    { description: 'House rent – two months ago',amount: 14500, type: 'Expense', category: 'Housing & Rent',    ago: 63 },
    { description: 'Reliance Smart grocery',     amount: 3200,  type: 'Expense', category: 'Food & Dining',     ago: 65 },
    { description: 'Myntra – festive sale clothes', amount: 3499, type: 'Expense', category: 'Shopping',         ago: 68 },
    { description: 'Amazon Prime subscription',  amount: 299,   type: 'Expense', category: 'Entertainment',     ago: 70 },
    { description: 'BBNL broadband bill',        amount: 899,   type: 'Expense', category: 'Utilities & Bills', ago: 72 },
    { description: 'Zerodha – stock purchase',   amount: 10000, type: 'Expense', category: 'Investments',       ago: 75 },
  ];

  /* Map raw entries to full transaction objects */
  return raw.map((t, i) => ({
    id: base + i,            // unique int id, same approach as addTransaction
    description: t.description,
    amount: t.amount,
    type: t.type,
    category: t.category,
    date: daysAgo(t.ago),   // relative date string, always fresh
  }));
}

/**
 * Sample budget limits (stored in INR, same as setBudget / finscope_budgets).
 * Seeded alongside the demo transactions so charts and budget tracking work.
 */
export const DEMO_BUDGETS = {
  'Food & Dining':   8000,
  'Housing & Rent': 15000,
  'Shopping':        5000,
};
