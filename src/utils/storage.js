const STORAGE_KEY = "finscope_transactions";

/**
 * Reads transactions from localStorage.
 * @returns {Array} Parsed array of transactions, or [] if nothing stored / parse error.
 */
export function loadTransactions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Persists the transactions array to localStorage as JSON.
 * @param {Array} transactions
 */
export function saveTransactions(transactions) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch (err) {
    console.error("FinScope: failed to save transactions", err);
  }
}
