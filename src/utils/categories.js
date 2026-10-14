// TODO: Transactions.jsx should import CATEGORIES from here instead of defining them inline.

/**
 * All transaction categories used across the app.
 * Transactions.jsx defines the same list inline — keep in sync until Leg 4 migrates it.
 */
export const CATEGORIES = [
  'Food & Dining',
  'Salary & Paycheck',
  'Housing & Rent',
  'Utilities & Bills',
  'Shopping',
  'Entertainment',
  'Investments',
  'Other',
];

/**
 * Categories that make sense as expense budgets.
 * Excludes income-only categories like "Salary & Paycheck".
 */
export const EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Housing & Rent',
  'Utilities & Bills',
  'Shopping',
  'Entertainment',
  'Investments',
  'Other',
];
