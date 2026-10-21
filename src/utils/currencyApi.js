/* ─────────────────────────────────────────────────────────────
   currencyApi.js
   Fetches live INR-based exchange rates from open.er-api.com.
   Conversion is DISPLAY-ONLY — stored values are always in INR.
───────────────────────────────────────────────────────────── */

const API_URL = 'https://open.er-api.com/v6/latest/INR';
const CACHE_KEY = 'finscope_rates_cache';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const FETCH_TIMEOUT_MS = 6000;

/** Supported currencies in display order */
export const CURRENCIES = [
  { code: 'INR', symbol: '₹', label: 'Indian Rupee' },
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
];

const SUPPORTED_CODES = CURRENCIES.map((c) => c.code);

/**
 * Approximate fallback rates (INR → other currencies).
 * These are rough values used ONLY when the API and cache are both unavailable.
 * Do NOT use for financial decisions.
 */
const FALLBACK_RATES = {
  INR: 1,
  USD: 0.012,   // ~approximate as of 2024
  EUR: 0.011,   // ~approximate as of 2024
  GBP: 0.0095,  // ~approximate as of 2024
};

/* ── localStorage helpers (wrapped in try/catch) ── */
function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.rates || !parsed.updatedAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(rates, updatedAt) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ rates, updatedAt }));
  } catch {
    /* quota or private-mode error — ignore */
  }
}

function pickSupportedRates(allRates) {
  const result = {};
  for (const code of SUPPORTED_CODES) {
    result[code] = typeof allRates[code] === 'number' ? allRates[code] : FALLBACK_RATES[code] ?? 1;
  }
  return result;
}

/**
 * Fetch live INR exchange rates from open.er-api.com.
 * Returns { rates, source, updatedAt } — NEVER throws to caller.
 *
 * source values:
 *   'live'     — freshly fetched from the API
 *   'cached'   — served from localStorage (fresh cache or any-age fallback)
 *   'fallback' — hardcoded approximate rates (no network, no cache)
 */
export async function getExchangeRates(force = false) {
  /* ── 1. Return fresh cache if under 1 hour old ── */
  const cached = readCache();
  if (!force && cached) {
    const age = Date.now() - new Date(cached.updatedAt).getTime();
    if (age < CACHE_TTL_MS) {
      return { rates: cached.rates, source: 'cached', updatedAt: cached.updatedAt, failed: false };
    }
  }

  /* ── 2. Attempt live fetch with timeout ── */
  const controller = new AbortController();
  const timerId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(API_URL, { signal: controller.signal });
    clearTimeout(timerId);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const json = await res.json();

    if (json.result !== 'success' || !json.rates || typeof json.rates !== 'object') {
      throw new Error('Unexpected API response shape');
    }

    const rates = pickSupportedRates(json.rates);
    const updatedAt = new Date().toISOString();
    writeCache(rates, updatedAt);

    return { rates, source: 'live', updatedAt, failed: false };
  } catch {
    clearTimeout(timerId);

    /* ── 3. Stale cache (any age) as fallback ── */
    if (cached) {
      return { rates: cached.rates, source: 'cached', updatedAt: cached.updatedAt, failed: true };
    }

    /* ── 4. Hardcoded fallback ── */
    return {
      rates: { ...FALLBACK_RATES },
      source: 'fallback',
      updatedAt: null,
      failed: true,
    };
  }
}

/* ─────────────────────────────────────────────────────────────
   Display-time currency helpers
   IMPORTANT: amounts are ALWAYS stored in INR. Conversion is
   performed here at render time only and is never written back.
───────────────────────────────────────────────────────────── */

/**
 * Convert an INR amount to the target currency and format for display.
 * @param {number} amountInINR
 * @param {string} currencyCode  e.g. 'USD'
 * @param {object|null} rates    exchangeRates from context (INR-based)
 * @returns {string}             formatted string e.g. "$12.50"
 */
export function formatCurrency(amountInINR, currencyCode, rates) {
  const code = SUPPORTED_CODES.includes(currencyCode) ? currencyCode : 'INR';
  const rate = rates && typeof rates[code] === 'number' ? rates[code] : (code === 'INR' ? 1 : null);
  const converted = rate !== null ? amountInINR * rate : amountInINR;

  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: code,
      maximumFractionDigits: 2,
    }).format(converted);
  } catch {
    /* Intl might not know this currency on some environments */
    const currency = CURRENCIES.find((c) => c.code === code);
    const sym = currency ? currency.symbol : code;
    return `${sym}${converted.toFixed(2)}`;
  }
}

/**
 * Convert a user-entered amount (in the active currency) back to INR for storage.
 * @param {number} amount         amount in the active currency
 * @param {string} currencyCode   e.g. 'USD'
 * @param {object|null} rates     exchangeRates from context
 * @returns {number}              amount in INR
 */
export function toINR(amount, currencyCode, rates) {
  if (!currencyCode || currencyCode === 'INR') return amount;
  const rate = rates && typeof rates[currencyCode] === 'number' ? rates[currencyCode] : null;
  if (!rate || rate === 0) return amount; // can't convert — keep as-is
  return amount / rate;
}
