/* ─────────────────────────────────────────────────────────────
   categorize.js
   Keyword-based category auto-suggestion for the Add Transaction form.
   Matching is case-insensitive and uses String.includes().
   Only categories that exist in the app are used.
───────────────────────────────────────────────────────────── */

/**
 * Ordered list of { keywords, category } rules.
 * First match wins, so put more-specific entries earlier.
 * "Transport" is intentionally absent — the app has no such category,
 * so uber/ola/metro map to 'Other'.
 */
const KEYWORD_MAP = [
  {
    category: 'Salary & Paycheck',
    keywords: ['salary', 'paycheck', 'payroll', 'stipend', 'wages', 'pay credit', 'ctc', 'pay slip'],
  },
  {
    category: 'Housing & Rent',
    keywords: ['rent', 'landlord', 'apartment', 'flat ', 'pg ', 'hostel', 'lease', 'maintenance society'],
  },
  {
    category: 'Food & Dining',
    keywords: [
      'swiggy', 'zomato', 'dominos', 'pizza', 'grocery', 'groceries', 'bigbasket', 'big basket',
      'blinkit', 'dunzo', 'zepto', 'restaurant', 'cafe', 'cafeteria', 'canteen', 'food',
      'dining', 'lunch', 'dinner', 'breakfast', 'biryani', 'burger', 'kfc', 'mcdonalds',
      "mcdonald's", 'starbucks', 'haldiram', 'reliance smart', 'd-mart', 'dmart', 'vegetable',
    ],
  },
  {
    category: 'Utilities & Bills',
    keywords: [
      'electricity', 'bescom', 'tata power', 'msedcl', 'internet', 'broadband',
      'jio', 'airtel', 'bsnl', 'vi bill', 'vodafone', 'recharge', 'mobile bill',
      'phone bill', 'water bill', 'gas bill', 'lpg', 'indane', 'bharat gas',
    ],
  },
  {
    category: 'Shopping',
    keywords: [
      'amazon', 'flipkart', 'myntra', 'ajio', 'meesho', 'nykaa', 'shopping',
      'mall ', 'clothes', 'clothing', 'shoes', 'footwear', 'furniture', 'appliance',
      'decathlon', 'croma', 'reliance digital', 'headphone', 'earphone', 'watch',
      'purse', 'bag ', 'purchase',
    ],
  },
  {
    category: 'Entertainment',
    keywords: [
      'netflix', 'spotify', 'prime video', 'hotstar', 'disney', 'youtube premium',
      'movie', 'cinema', 'pvr', 'inox', 'theatre', 'concert', 'gaming', 'steam',
      'playstation', 'xbox', 'zee5', 'sonyliv', 'jiocinema', 'apple tv',
    ],
  },
  {
    category: 'Investments',
    keywords: [
      'sip', 'mutual fund', 'mf ', 'stock ', 'zerodha', 'upstox', 'investment',
      'shares', 'equity', 'nps', 'ppf', 'elss', 'fixed deposit', 'fd ',
      'groww', 'smallcase', 'ipo', 'demat', 'portfolio',
    ],
  },
  // Fallback for common transport / misc keywords → 'Other'
  // (no Transport category exists in the app)
  {
    category: 'Other',
    keywords: ['uber', 'ola ', 'metro', 'petrol', 'fuel', 'cab ', 'auto ', 'gym', 'fitness', 'doctor', 'hospital', 'pharmacy', 'medical'],
  },
];

/**
 * Suggests a category string from the given description.
 * Returns '' when no keyword matches — the caller should leave
 * the category field unchanged in that case.
 *
 * @param {string} description — raw user input from the description field
 * @returns {string} matched category name, or ''
 */
export function suggestCategory(description) {
  if (!description || !description.trim()) return '';
  const lower = description.toLowerCase();
  for (const { keywords, category } of KEYWORD_MAP) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return category;
    }
  }
  return '';
}
