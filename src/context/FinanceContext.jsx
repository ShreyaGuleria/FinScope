import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';
import {
  loadFromStorage,
  saveToStorage,
  loadTransactions,
  saveTransactions,
} from '../utils/storage';

/* ─────────────────────────────────────────────
   Storage keys
───────────────────────────────────────────── */
const KEY_CURRENCY = 'finscope_currency';
const KEY_BUDGETS = 'finscope_budgets';

/* ─────────────────────────────────────────────
   Initial state hydrated from localStorage
───────────────────────────────────────────── */
function buildInitialState() {
  try {
    return {
      transactions: loadTransactions(),
      currency: loadFromStorage(KEY_CURRENCY, 'INR'),
      exchangeRates: null,
      budgets: loadFromStorage(KEY_BUDGETS, {}),
      toasts: [],
      isLoading: false,
      error: null,
    };
  } catch (err) {
    return {
      transactions: [],
      currency: 'INR',
      exchangeRates: null,
      budgets: {},
      toasts: [],
      isLoading: false,
      error: `Failed to load saved data: ${err.message}`,
    };
  }
}

/* ─────────────────────────────────────────────
   Reducer
───────────────────────────────────────────── */
function financeReducer(state, action) {
  switch (action.type) {
    case 'ADD_TRANSACTION': {
      const updated = [action.payload, ...state.transactions];
      return { ...state, transactions: updated };
    }
    case 'DELETE_TRANSACTION': {
      const updated = state.transactions.filter((t) => t.id !== action.payload);
      return { ...state, transactions: updated };
    }
    case 'SET_CURRENCY':
      return { ...state, currency: action.payload };
    case 'SET_EXCHANGE_RATES':
      return { ...state, exchangeRates: action.payload };
    case 'SET_BUDGET': {
      const budgets = {
        ...state.budgets,
        [action.payload.category]: action.payload.limit,
      };
      return { ...state, budgets };
    }
    case 'REMOVE_BUDGET': {
      const budgets = { ...state.budgets };
      delete budgets[action.payload];
      return { ...state, budgets };
    }
    case 'SHOW_TOAST': {
      const toasts = [...state.toasts, action.payload];
      return { ...state, toasts };
    }
    case 'DISMISS_TOAST': {
      const toasts = state.toasts.filter((t) => t.id !== action.payload);
      return { ...state, toasts };
    }
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

/* ─────────────────────────────────────────────
   Context
───────────────────────────────────────────── */
const FinanceContext = createContext(null);

/* ─────────────────────────────────────────────
   Provider
───────────────────────────────────────────── */
export function FinanceProvider({ children }) {
  const [state, dispatch] = useReducer(financeReducer, undefined, buildInitialState);

  /* ── Persist side-effects ── */
  useEffect(() => {
    saveTransactions(state.transactions);
  }, [state.transactions]);

  useEffect(() => {
    saveToStorage(KEY_CURRENCY, state.currency);
  }, [state.currency]);

  useEffect(() => {
    saveToStorage(KEY_BUDGETS, state.budgets);
  }, [state.budgets]);

  /* ── Actions ── */
  const dismissToast = useCallback((id) => {
    dispatch({ type: 'DISMISS_TOAST', payload: id });
  }, []);

  const showToast = useCallback(
    (message, type = 'info') => {
      const id = Date.now();
      dispatch({ type: 'SHOW_TOAST', payload: { id, message, type } });
      // Auto-dismiss after 3 s
      setTimeout(() => dispatch({ type: 'DISMISS_TOAST', payload: id }), 3000);
    },
    [],
  );

  const addTransaction = useCallback((tx) => {
    if (!tx || !tx.description || !tx.amount || !tx.date) return;
    const newTx = {
      id: Date.now(),
      type: tx.type ?? 'Expense',
      amount: parseFloat(tx.amount),
      category: tx.category ?? 'Other',
      description: String(tx.description).trim(),
      date: tx.date,
    };
    dispatch({ type: 'ADD_TRANSACTION', payload: newTx });

    /* ── Over-budget detection (expenses only, fires only on first crossing) ── */
    if (newTx.type === 'Expense') {
      const budget = state.budgets[newTx.category];
      if (budget != null && budget > 0) {
        const monthPrefix = newTx.date.slice(0, 7); // 'YYYY-MM'
        let spentBefore = 0;
        for (const t of state.transactions) {
          if (
            t.type === 'Expense' &&
            t.category === newTx.category &&
            t.date.slice(0, 7) === monthPrefix
          ) {
            spentBefore += Number(t.amount);
          }
        }
        const spentAfter = spentBefore + newTx.amount;
        /* Toast only when crossing from under to over — not every subsequent expense */
        if (spentBefore < budget && spentAfter >= budget) {
          showToast(`${newTx.category} budget exceeded!`, 'error');
        }
      }
    }
  }, [state.budgets, state.transactions, showToast]);

  const deleteTransaction = useCallback((id) => {
    dispatch({ type: 'DELETE_TRANSACTION', payload: id });
  }, []);

  const setCurrency = useCallback((code) => {
    dispatch({ type: 'SET_CURRENCY', payload: code });
  }, []);

  const setExchangeRates = useCallback((rates) => {
    dispatch({ type: 'SET_EXCHANGE_RATES', payload: rates });
  }, []);

  const setBudget = useCallback((category, limit) => {
    dispatch({ type: 'SET_BUDGET', payload: { category, limit } });
  }, []);

  const removeBudget = useCallback((category) => {
    dispatch({ type: 'REMOVE_BUDGET', payload: category });
  }, []);

  /* ── Memoised context value (prevents needless re-renders in consumers) ── */
  const value = useMemo(
    () => ({
      transactions: state.transactions,
      addTransaction,
      deleteTransaction,
      currency: state.currency,
      setCurrency,
      exchangeRates: state.exchangeRates,
      setExchangeRates,
      budgets: state.budgets,
      setBudget,
      removeBudget,
      toasts: state.toasts,
      showToast,
      dismissToast,
      isLoading: state.isLoading,
      error: state.error,
    }),
    [
      state.transactions,
      state.currency,
      state.exchangeRates,
      state.budgets,
      state.toasts,
      state.isLoading,
      state.error,
      addTransaction,
      deleteTransaction,
      setCurrency,
      setExchangeRates,
      setBudget,
      removeBudget,
      showToast,
      dismissToast,
    ],
  );

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

/* ─────────────────────────────────────────────
   Hook
───────────────────────────────────────────── */
// eslint-disable-next-line react/only-export-components
export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (ctx === null) {
    throw new Error('useFinance() must be used inside a <FinanceProvider>. Wrap your app in <FinanceProvider>.');
  }
  return ctx;
}
