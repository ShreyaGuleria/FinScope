import { useState, useEffect, useRef } from 'react';
import TransactionCard from '../components/TransactionCard';
import { useFinance } from '../context/FinanceContext';
import { exportToCsv } from '../utils/exportCsv';
import { suggestCategory } from '../utils/categorize';
import './Transactions.css';

const CATEGORIES = [
  'Food & Dining',
  'Salary & Paycheck',
  'Housing & Rent',
  'Utilities & Bills',
  'Shopping',
  'Entertainment',
  'Investments',
  'Other',
];

const PAGE_SIZE = 10;

const getTodayDate = () => new Date().toISOString().split('T')[0];

/** Returns a blank form object */
const emptyForm = () => ({
  description: '',
  amount: '',
  type: 'Expense',
  category: '',
  date: getTodayDate(),
});

export default function Transactions() {
  const {
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    restoreTransaction,
    seedDemoData,
    clearAllData,
    showToast,
    isLoading,
    error,
  } = useFinance();

  /* ── Form state ── */
  const [editingId, setEditingId]                 = useState(null);
  const [form, setForm]                           = useState(emptyForm);
  const [categoryManuallySet, setCategoryManuallySet] = useState(false); // stops auto-suggest after manual pick
  const [categorySuggestion, setCategorySuggestion]   = useState('');   // current hint text
  const [categoryError, setCategoryError]         = useState('');        // inline validation msg

  /* ── Filter state ── */
  const [searchTerm, setSearchTerm]       = useState('');
  const [typeFilter, setTypeFilter]       = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [dateFrom, setDateFrom]           = useState('');
  const [dateTo, setDateTo]               = useState('');
  const [sortOrder, setSortOrder]         = useState('newest');

  /* ── Pagination ── */
  const [currentPage, setCurrentPage] = useState(1);

  /* ── Undo-delete state ── */
  // Holds { tx, index, timerId } for the 5-second undo window
  const [deletedItem, setDeletedItem] = useState(null);
  // Ref so cleanup effect always has the latest value without re-running
  const deletedItemRef = useRef(null);
  deletedItemRef.current = deletedItem;

  /* Cleanup undo timer on unmount */
  useEffect(() => {
    return () => {
      if (deletedItemRef.current?.timerId) {
        clearTimeout(deletedItemRef.current.timerId);
      }
    };
  }, []);

  /* Reset to page 1 whenever any filter changes */
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, categoryFilter, dateFrom, dateTo, sortOrder]);

  /* ─────────────────────────────────────────────
     Form helpers
  ───────────────────────────────────────────── */
  function resetForm() {
    setForm(emptyForm());
    setCategoryManuallySet(false);
    setCategorySuggestion('');
    setCategoryError('');
    setEditingId(null);
  }

  function handleChange(e) {
    const { name, value } = e.target;

    if (name === 'category') {
      /* User manually picked a category — stop auto-suggesting */
      setCategoryManuallySet(true);
      setCategorySuggestion('');
      setCategoryError('');
      setForm((prev) => ({ ...prev, category: value }));
      return;
    }

    if (name === 'description') {
      /* Auto-suggest only when user hasn't locked the category manually */
      if (!categoryManuallySet) {
        const suggested = suggestCategory(value);
        setCategorySuggestion(suggested);
        setForm((prev) => ({
          ...prev,
          description: value,
          // Update category with suggestion; clear it if description is emptied
          ...(value.trim() === ''
            ? { category: '' }
            : suggested
              ? { category: suggested }
              : {}),
        }));
      } else {
        setForm((prev) => ({ ...prev, description: value }));
      }
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();

    /* Inline category validation */
    if (!form.category) {
      setCategoryError('Please select a category.');
      return;
    }
    setCategoryError('');

    if (editingId) {
      updateTransaction({
        id: editingId,
        description: form.description.trim(),
        amount: parseFloat(form.amount),
        type: form.type,
        category: form.category,
        date: form.date,
      });
      showToast('Transaction updated!', 'success');
    } else {
      addTransaction({
        description: form.description.trim(),
        amount: parseFloat(form.amount),
        type: form.type,
        category: form.category,
        date: form.date,
      });
      showToast('Transaction saved!', 'success');
    }

    resetForm();
  }

  function handleEdit(tx) {
    setEditingId(tx.id);
    setForm({
      description: tx.description,
      amount:      tx.amount,
      type:        tx.type,
      category:    tx.category || '',
      date:        tx.date,
    });
    /* Treat the loaded category as manually set so auto-suggest won't override it */
    setCategoryManuallySet(true);
    setCategorySuggestion('');
    setCategoryError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ─────────────────────────────────────────────
     Delete + Undo
  ───────────────────────────────────────────── */
  function handleDelete(id) {
    /* Find position in raw (unfiltered, unsorted) array before removing */
    const rawIndex = transactions.findIndex((t) => t.id === id);
    const tx = transactions[rawIndex];

    /* Cancel any in-progress undo — the old deletion is now permanent */
    if (deletedItem) {
      clearTimeout(deletedItem.timerId);
      setDeletedItem(null);
    }

    /* If we were editing this transaction, cancel the edit */
    if (editingId === id) resetForm();

    deleteTransaction(id);

    /* Start 5-second undo window */
    const timerId = setTimeout(() => setDeletedItem(null), 5000);
    setDeletedItem({ tx, index: rawIndex, timerId });
  }

  function handleUndo() {
    if (!deletedItem) return;
    clearTimeout(deletedItem.timerId);
    restoreTransaction(deletedItem.tx, deletedItem.index);
    setDeletedItem(null);
    showToast('Transaction restored.', 'success');
  }

  /* ─────────────────────────────────────────────
     Demo / Clear helpers
  ───────────────────────────────────────────── */
  function handleLoadDemo() {
    seedDemoData();
    showToast('25 demo transactions loaded!', 'success');
  }

  function handleClearAll() {
    if (!window.confirm('This will permanently delete ALL transactions and budgets. Are you sure?')) return;
    // Cancel any pending undo too
    if (deletedItem) {
      clearTimeout(deletedItem.timerId);
      setDeletedItem(null);
    }
    clearAllData();
    resetForm();
    showToast('All data cleared.', 'info');
  }

  /* ─────────────────────────────────────────────
     Filter + Sort
  ───────────────────────────────────────────── */
  const filteredTransactions = transactions
    .filter((t) => t.description.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter((t) => typeFilter === 'All' || t.type === typeFilter)
    .filter((t) => categoryFilter === 'All' || (t.category || 'Other') === categoryFilter)
    .filter((t) => !dateFrom || t.date >= dateFrom)
    .filter((t) => !dateTo   || t.date <= dateTo)
    .sort((a, b) =>
      sortOrder === 'newest'
        ? new Date(b.date) - new Date(a.date)
        : new Date(a.date) - new Date(b.date)
    );

  /* Any filter is "active" if it's non-default, used to show Reset button */
  const hasActiveFilters =
    searchTerm || typeFilter !== 'All' || categoryFilter !== 'All' || dateFrom || dateTo;

  function resetFilters() {
    setSearchTerm('');
    setTypeFilter('All');
    setCategoryFilter('All');
    setDateFrom('');
    setDateTo('');
    setSortOrder('newest');
    setCurrentPage(1);
  }

  /* ── Pagination ── */
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / PAGE_SIZE));
  const safePage   = Math.min(currentPage, totalPages);
  const paginatedTransactions = filteredTransactions.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  /* ─────────────────────────────────────────────
     Render
  ───────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="transactions-page">
        <p style={{ color: 'var(--color-text-muted)', padding: '2rem' }}>Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="transactions-page">
        <p style={{ color: 'var(--color-danger)', padding: '2rem' }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="transactions-page">

      {/* ── Page header ── */}
      <div className="transactions-header">
        <div>
          <h1 className="transactions-title">Transactions</h1>
          <p className="transactions-subtitle">Record and manage your daily cash flow.</p>
        </div>

        <div className="transactions-header-actions">
          <button type="button" className="btn-demo" onClick={handleLoadDemo}>
            Load demo data
          </button>
          <button
            type="button"
            className="btn-clear"
            onClick={handleClearAll}
            disabled={transactions.length === 0}
          >
            Clear all data
          </button>
          <button
            className="btn-export"
            onClick={() => exportToCsv(transactions)}
            disabled={transactions.length === 0}
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* ── Add / Edit form ── */}
      <form className="transactions-form" onSubmit={handleSubmit}>
        <h2 className="form-title">
          {editingId ? 'Edit Transaction' : '+ Add New Transaction'}
        </h2>

        <div className="form-grid">
          {/* Description */}
          <div className="form-group form-group--full">
            <label htmlFor="description">Description</label>
            <input
              id="description"
              type="text"
              name="description"
              placeholder="e.g. Grocery Shopping, Monthly Salary…"
              value={form.description}
              onChange={handleChange}
              required
            />
          </div>

          {/* Amount */}
          <div className="form-group">
            <label htmlFor="amount">Amount (₹)</label>
            <input
              id="amount"
              type="number"
              name="amount"
              placeholder="0.00"
              step="0.01"
              min="0.01"
              value={form.amount}
              onChange={handleChange}
              required
            />
          </div>

          {/* Type */}
          <div className="form-group">
            <label htmlFor="type">Type</label>
            <select id="type" name="type" value={form.type} onChange={handleChange}>
              <option value="Income">Income (+)</option>
              <option value="Expense">Expense (-)</option>
            </select>
          </div>

          {/* Category — with auto-suggest hint and inline error */}
          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              name="category"
              value={form.category}
              onChange={handleChange}
              className={categoryError ? 'select--error' : ''}
            >
              <option value="" disabled>Select category</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* Auto-suggest hint shown only when category was NOT manually set */}
            {categorySuggestion && !categoryManuallySet && (
              <small className="category-suggestion">
                ✦ Suggested: {categorySuggestion}
              </small>
            )}

            {/* Inline error when user tries to submit without picking a category */}
            {categoryError && (
              <small className="category-error">{categoryError}</small>
            )}
          </div>

          {/* Date */}
          <div className="form-group">
            <label htmlFor="date">Date</label>
            <input
              id="date"
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-actions">
          <button className="btn-submit" type="submit">
            {editingId ? 'Update Transaction' : 'Save Transaction'}
          </button>
          {editingId && (
            <button type="button" className="btn-cancel" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* ── Filter bar ── */}
      <div className="filter-card">
        <div className="filter-grid">
          {/* Text search */}
          <input
            type="text"
            className="filter-input"
            placeholder="Search description…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {/* Type */}
          <select className="filter-select" value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="All">All Types</option>
            <option value="Income">Income</option>
            <option value="Expense">Expense</option>
          </select>

          {/* Category */}
          <select className="filter-select" value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="All">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Date range — From */}
          <div className="filter-date-group">
            <label className="filter-date-label">From</label>
            <input
              type="date"
              className="filter-input filter-input--date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>

          {/* Date range — To */}
          <div className="filter-date-group">
            <label className="filter-date-label">To</label>
            <input
              type="date"
              className="filter-input filter-input--date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>

          {/* Sort */}
          <select className="filter-select" value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>

        {/* Count + Reset */}
        <div className="filter-footer">
          <span className="filter-count">
            Showing <strong>{filteredTransactions.length}</strong> of {transactions.length} transactions
          </span>
          {hasActiveFilters && (
            <button type="button" className="btn-reset-filters" onClick={resetFilters}>
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* ── Undo bar — appears for 5 s after a delete ── */}
      {deletedItem && (
        <div className="undo-bar" role="status">
          <span>Transaction deleted</span>
          <button type="button" className="undo-bar__btn" onClick={handleUndo}>
            Undo
          </button>
        </div>
      )}

      {/* ── Transaction list ── */}
      <div className="transaction-list-container">
        {transactions.length === 0 ? (
          /* No data at all */
          <div className="empty-state-card">
            <p>No transactions recorded yet.</p>
            <small>
              Use the form above to add your first income or expense,
              or click <strong>Load demo data</strong>.
            </small>
          </div>
        ) : filteredTransactions.length === 0 ? (
          /* Data exists but filters match nothing */
          <div className="empty-state-card">
            <p>No matching transactions found.</p>
            <small>Your filters returned no results.</small>
            <button
              type="button"
              className="btn-reset-filters btn-reset-filters--standalone"
              onClick={resetFilters}
            >
              Reset filters
            </button>
          </div>
        ) : (
          paginatedTransactions.map((t) => (
            <TransactionCard
              key={t.id}
              id={t.id}
              description={t.description}
              amount={t.amount}
              type={t.type}
              category={t.category}
              date={t.date}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {/* ── Pagination controls ── */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            type="button"
            className="pagination__btn"
            disabled={safePage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            ‹ Prev
          </button>

          <span className="pagination__info">
            Page <strong>{safePage}</strong> of {totalPages}
          </span>

          <button
            type="button"
            className="pagination__btn"
            disabled={safePage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            Next ›
          </button>
        </div>
      )}
    </div>
  );
}
