import { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import Modal from '../components/Modal';
import ProgressBar, { getProgressStatus } from '../components/ProgressBar';
import { formatCurrency, toINR } from '../utils/currencyApi';
import { EXPENSE_CATEGORIES } from '../utils/categories';
import './Budgets.css';

/* ── Current month prefix helper ── */
function currentMonthPrefix() {
  return new Date().toISOString().slice(0, 7); // 'YYYY-MM'
}

/* ── Per-category spending for current month ── */
function useCategorySpending(transactions) {
  return useMemo(() => {
    const prefix = currentMonthPrefix();
    const map = {};
    for (const cat of EXPENSE_CATEGORIES) {
      map[cat] = 0;
    }
    for (const t of transactions) {
      if (t.type === 'Expense' && t.date.slice(0, 7) === prefix && map[t.category] !== undefined) {
        map[t.category] += Number(t.amount);
      }
    }
    return map;
  }, [transactions]);
}

export default function Budgets() {
  const {
    transactions,
    budgets,
    setBudget,
    removeBudget,
    currency,
    exchangeRates,
    showToast,
    isLoading,
    error,
  } = useFinance();

  const spending = useCategorySpending(transactions);

  /* ── Modal state ── */
  const [modalOpen, setModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');

  /* ── Derived totals (INR) ── */
  const { totalBudget, totalSpent } = useMemo(() => {
    let tb = 0;
    let ts = 0;
    for (const cat of EXPENSE_CATEGORIES) {
      const limit = budgets[cat];
      if (limit != null && limit > 0) {
        tb += limit;
        ts += Math.min(spending[cat] ?? 0, limit * 2); // include overspend up to 2× for the sum
      }
    }
    return { totalBudget: tb, totalSpent: ts };
  }, [budgets, spending]);

  /* ── Count how many categories have a budget set ── */
  const setBudgetsCount = EXPENSE_CATEGORIES.filter((c) => budgets[c] != null && budgets[c] > 0).length;

  /* ── Helpers ── */
  function fmt(amountINR) {
    return formatCurrency(amountINR, currency, exchangeRates);
  }

  function openModal(category) {
    setActiveCategory(category);
    const existingINR = budgets[category];
    if (existingINR != null && existingINR > 0 && currency !== 'INR' && exchangeRates) {
      const rate = exchangeRates[currency] ?? 1;
      setInputValue(String((existingINR * rate).toFixed(2)));
    } else if (existingINR != null && existingINR > 0) {
      setInputValue(String(existingINR));
    } else {
      setInputValue('');
    }
    setInputError('');
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setActiveCategory(null);
    setInputValue('');
    setInputError('');
  }

  function validate(val) {
    const trimmed = val.trim();
    if (trimmed === '') return 'Amount is required.';
    const num = Number(trimmed);
    if (Number.isNaN(num) || !Number.isFinite(num)) return 'Must be a valid number.';
    if (num <= 0) return 'Amount must be greater than 0.';
    if (num > 10_000_000) return 'Amount seems too large. Check your input.';
    return '';
  }

  function handleSave(e) {
    e.preventDefault();
    const err = validate(inputValue);
    if (err) {
      setInputError(err);
      return;
    }
    const amountInActiveCurrency = parseFloat(inputValue.trim());
    const limitInINR = toINR(amountInActiveCurrency, currency, exchangeRates);
    setBudget(activeCategory, limitInINR);
    showToast(`Budget for ${activeCategory} saved`, 'success');
    closeModal();
  }

  function handleRemove() {
    removeBudget(activeCategory);
    showToast('Budget removed', 'info');
    closeModal();
  }

  function handleInputChange(e) {
    setInputValue(e.target.value);
    if (inputError) setInputError(validate(e.target.value));
  }

  /* ── Currency symbol hint for the input ── */
  const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '₹';

  /* ── Loading / error states (match Dashboard pattern) ── */
  if (isLoading) {
    return (
      <div className="budgets-page">
        <p style={{ color: 'var(--color-text-muted)', padding: '2rem' }}>Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="budgets-page">
        <p style={{ color: 'var(--color-danger)', padding: '2rem' }}>{error}</p>
      </div>
    );
  }

  const isFormInvalid = validate(inputValue) !== '';
  const hasExistingBudget = activeCategory != null && budgets[activeCategory] != null && budgets[activeCategory] > 0;

  return (
    <div className="budgets-page">
      {/* ── Page header ── */}
      <div className="budgets-header">
        <div>
          <h1 className="budgets-title">Monthly Budgets</h1>
          <p className="budgets-subtitle">
            Set spending limits and track your progress for {new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' })}.
          </p>
        </div>
      </div>

      {/* ── Overall summary ── */}
      {setBudgetsCount > 0 && (
        <div className="budgets-summary-card">
          <div className="budgets-summary-card__totals">
            <div className="budgets-summary-stat">
              <span className="budgets-summary-stat__label">Total Budget</span>
              <span className="budgets-summary-stat__value budgets-summary-stat__value--budget">{fmt(totalBudget)}</span>
            </div>
            <div className="budgets-summary-stat">
              <span className="budgets-summary-stat__label">Total Spent</span>
              <span className={`budgets-summary-stat__value ${totalSpent >= totalBudget ? 'budgets-summary-stat__value--over' : 'budgets-summary-stat__value--spent'}`}>
                {fmt(totalSpent)}
              </span>
            </div>
            <div className="budgets-summary-stat">
              <span className="budgets-summary-stat__label">Remaining</span>
              <span className={`budgets-summary-stat__value ${totalSpent >= totalBudget ? 'budgets-summary-stat__value--over' : 'budgets-summary-stat__value--remaining'}`}>
                {fmt(Math.max(0, totalBudget - totalSpent))}
              </span>
            </div>
          </div>
          <ProgressBar value={totalSpent} max={totalBudget} label="Overall spending" showPercent />
        </div>
      )}

      {/* ── Empty state ── */}
      {setBudgetsCount === 0 && (
        <div className="budgets-empty-state">
          <div className="budgets-empty-state__icon" aria-hidden="true">💳</div>
          <h2 className="budgets-empty-state__heading">No budgets set yet</h2>
          <p className="budgets-empty-state__text">
            Click <strong>Set budget</strong> on any category below to start tracking your spending.
          </p>
        </div>
      )}

      {/* ── Category grid ── */}
      <div className="budgets-grid">
        {EXPENSE_CATEGORIES.map((cat) => {
          const spentINR = spending[cat] ?? 0;
          const limitINR = budgets[cat] ?? 0;
          const hasLimit = limitINR > 0;
          const remainingINR = limitINR - spentINR;
          const pct = hasLimit ? (spentINR / limitINR) * 100 : 0;
          const status = getProgressStatus(pct); // 'safe' (<80%) | 'warning' (80-99%) | 'danger' (100%+)

          return (
            <article key={cat} className={`budget-card budget-card--${status}`}>
              <div className="budget-card__header">
                <div className="budget-card__title-row">
                  <h2 className="budget-card__category">{cat}</h2>
                  {hasLimit && (
                    <span className={`budget-alert-pill budget-alert-pill--${status}`}>
                      {status === 'danger' && 'Exceeded'}
                      {status === 'warning' && 'Near Limit'}
                      {status === 'safe' && 'On Track'}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className="budget-card__edit-btn"
                  onClick={() => openModal(cat)}
                  aria-label={hasLimit ? `Edit budget for ${cat}` : `Set budget for ${cat}`}
                >
                  {hasLimit ? 'Edit' : 'Set budget'}
                </button>
              </div>

              {hasLimit ? (
                <>
                  <div className="budget-card__amounts">
                    <span className="budget-card__spent">{fmt(spentINR)}</span>
                    <span className="budget-card__divider"> / </span>
                    <span className="budget-card__limit">{fmt(limitINR)}</span>
                  </div>

                  <div className="budget-card__remaining">
                    {status === 'danger' && (
                      <span className="budget-card__remaining--over">
                        Over by {fmt(Math.abs(remainingINR))}
                      </span>
                    )}
                    {status === 'warning' && (
                      <span className="budget-card__remaining--warning">
                        {fmt(remainingINR)} remaining (near limit)
                      </span>
                    )}
                    {status === 'safe' && (
                      <span className="budget-card__remaining--ok">
                        {fmt(remainingINR)} remaining
                      </span>
                    )}
                  </div>

                  <ProgressBar value={spentINR} max={limitINR} showPercent />
                </>
              ) : (
                <p className="budget-card__no-limit">No budget set for this category.</p>
              )}
            </article>
          );
        })}
      </div>

      {/* ── Set / Edit Modal ── */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={hasExistingBudget ? `Edit budget — ${activeCategory}` : `Set budget — ${activeCategory}`}
        footer={
          <div className="budget-modal-footer">
            {hasExistingBudget && (
              <button type="button" className="btn-budget-remove" onClick={handleRemove}>
                Remove budget
              </button>
            )}
            <button type="button" className="btn-budget-cancel" onClick={closeModal}>
              Cancel
            </button>
            <button
              type="submit"
              form="budget-form"
              className="btn-budget-save"
              disabled={isFormInvalid}
            >
              Save
            </button>
          </div>
        }
      >
        <form id="budget-form" className="budget-form" onSubmit={handleSave} noValidate>
          <div className="budget-form__group">
            <label htmlFor="budget-amount" className="budget-form__label">
              Monthly limit in {currency} ({currencySymbol})
            </label>
            <div className="budget-form__input-wrap">
              <span className="budget-form__symbol" aria-hidden="true">{currencySymbol}</span>
              <input
                id="budget-amount"
                type="number"
                name="budget-amount"
                className={`budget-form__input ${inputError ? 'budget-form__input--invalid' : ''}`}
                value={inputValue}
                onChange={handleInputChange}
                placeholder="0.00"
                step="0.01"
                min="0.01"
                aria-invalid={inputError ? 'true' : 'false'}
                aria-describedby={inputError ? 'budget-amount-error' : undefined}
                required
                autoComplete="off"
              />
            </div>
            {inputError && (
              <span id="budget-amount-error" className="budget-form__error" role="alert">
                {inputError}
              </span>
            )}
            {currency !== 'INR' && (
              <p className="budget-form__hint">
                Entered in {currency} — will be stored as INR automatically.
              </p>
            )}
          </div>
        </form>
      </Modal>
    </div>
  );
}
