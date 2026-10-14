const STORAGE_KEY = 'finscope_transactions';

/**
 * Generic helper: reads and JSON-parses a value from localStorage.
 * Returns `fallback` if the key is missing or parsing fails.
 * @template T
 * @param {string} key
 * @param {T} fallback
 * @returns {T}
 */
export function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Generic helper: JSON-stringifies `value` and writes it to localStorage.
 * Silently swallows quota / serialisation errors.
 * @param {string} key
 * @param {*} value
 */
export function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('FinScope: failed to save to storage', key, err);
  }
}

/**
 * Reads transactions from localStorage.
 * @returns {Array} Parsed array of transactions, or [] if nothing stored / parse error.
 */
export function loadTransactions() {
  return loadFromStorage(STORAGE_KEY, []);
}

/**
 * Persists the transactions array to localStorage as JSON.
 * @param {Array} transactions
 */
export function saveTransactions(transactions) {
  saveToStorage(STORAGE_KEY, transactions);
}
