import { useState, useMemo, useRef, useCallback, useLayoutEffect } from 'react';
import TransactionCard from '../components/TransactionCard';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import { useFinance } from '../context/FinanceContext';
import { exportToCsv } from '../utils/exportCsv';
import { CATEGORIES } from '../utils/categories';
import useDebounce from '../hooks/useDebounce';
import './Transactions.css';

const PAGE_SIZE = 10;

const getTodayDate = () => new Date().toISOString().split('T')[0];

export default function Transactions() {
  const {
    transactions,
    addTransaction,
    deleteTransaction,
    deleteTransactions,
    currency,
    exchangeRates,
    showToast,
    isLoading,
    error,
  } = useFinance();

  // ── Form state ──────────────────────────────────────────────
  const [form, setForm] = useState({
    description: '',
    amount: '',
    type: 'Expense',
    category: 'Food & Dining',
    date: getTodayDate(),
  });

  // ── Filter / search state ────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('newest');

  // Debounced search: input stays responsive; filtering fires once, ~300 ms after typing stops
  const debouncedSearch = useDebounce(searchTerm, 300);

  // ── Pagination state ─────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);

  // ── Selection state ──────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState([]); // array of transaction ids
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Ref for the "select all on page" checkbox — used to set indeterminate state
  const selectAllRef = useRef(null);

  // Ref for the list container — scroll to top on page change
  const listContainerRef = useRef(null);

  // ── Form handlers ────────────────────────────────────────────
  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.description.trim() || !form.amount || !form.date) return;

    addTransaction({
      description: form.description.trim(),
      amount: parseFloat(form.amount),
      type: form.type,
      category: form.category,
      date: form.date,
    });

    setForm({
      description: '',
      amount: '',
      type: 'Expense',
      category: 'Food & Dining',
      date: getTodayDate(),
    });

    showToast('Transaction saved!', 'success');
  }

  function handleDelete(id) {
    deleteTransaction(id);
    // Also deselect if it was selected
    setSelectedIds((prev) => prev.filter((sid) => sid !== id));
    showToast('Transaction deleted.', 'info');
  }

  // ── Filter pipeline (memoised) ───────────────────────────────
  // Recalculates only when transactions, debouncedSearch, or filters change.
  const filteredTransactions = useMemo(() => {
    const term = debouncedSearch.toLowerCase();
    return transactions
      .filter((t) => t.description.toLowerCase().includes(term))
      .filter((t) => typeFilter === 'All' || t.type === typeFilter)
      .filter((t) => categoryFilter === 'All' || (t.category || 'Other') === categoryFilter)
      .sort((a, b) =>
        sortOrder === 'newest'
          ? new Date(b.date) - new Date(a.date)
          : new Date(a.date) - new Date(b.date),
      );
  }, [transactions, debouncedSearch, typeFilter, categoryFilter, sortOrder]);

  // ── Pagination math ──────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / PAGE_SIZE));
  // Clamp: when filters narrow results, safePage automatically moves to the last valid page
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pageEnd = safePage * PAGE_SIZE;
  const pageTransactions = filteredTransactions.slice(pageStart, pageEnd);

  // Visible transaction ids (current page only)
  const pageIds = pageTransactions.map((t) => t.id);
  // Only keep selected ids that still exist in the filtered results
  const validSelectedIds = selectedIds.filter((id) =>
    filteredTransactions.some((t) => t.id === id),
  );

  // Selection helpers (for current page)
  const selectedOnPage = pageIds.filter((id) => validSelectedIds.includes(id));
  const allOnPageSelected = pageIds.length > 0 && selectedOnPage.length === pageIds.length;
  const someOnPageSelected = selectedOnPage.length > 0 && !allOnPageSelected;

  // Set the checkbox indeterminate state AFTER render (DOM mutation — not valid during render).
  // useLayoutEffect fires synchronously after the DOM update but before the browser paints,
  // so the checkbox flicker-free reflects the correct indeterminate visual on every render.
  useLayoutEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someOnPageSelected;
    }
  }, [someOnPageSelected]);

  // ── Filter change handlers (also reset page + selection) ─────
  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
    setSelectedIds([]);
  }, []);

  const handleTypeFilterChange = useCallback((e) => {
    setTypeFilter(e.target.value);
    setCurrentPage(1);
    setSelectedIds([]);
  }, []);

  const handleCategoryFilterChange = useCallback((e) => {
    setCategoryFilter(e.target.value);
    setCurrentPage(1);
    setSelectedIds([]);
  }, []);

  const handleSortOrderChange = useCallback((e) => {
    setSortOrder(e.target.value);
    setCurrentPage(1);
    setSelectedIds([]);
  }, []);

  function clearFilters() {
    setSearchTerm('');
    setTypeFilter('All');
    setCategoryFilter('All');
    setSortOrder('newest');
    setCurrentPage(1);
    setSelectedIds([]);
  }

  // ── Page change handler ──────────────────────────────────────
  function handlePageChange(newPage) {
    setCurrentPage(newPage);
    // Scroll the list into view smoothly
    if (listContainerRef.current) {
      listContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // ── Row checkbox handlers ────────────────────────────────────
  function handleSelectRow(id, checked) {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((sid) => sid !== id),
    );
  }

  function handleSelectAll(e) {
    if (e.target.checked) {
      // Add all page ids (that aren't already selected)
      setSelectedIds((prev) => [...new Set([...prev, ...pageIds])]);
    } else {
      // Deselect everything on this page
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    }
  }

  // ── Batch delete ─────────────────────────────────────────────
  function handleBatchDeleteConfirm() {
    const count = validSelectedIds.length;
    deleteTransactions(validSelectedIds); // single reducer dispatch → single localStorage write
    setSelectedIds([]);
    setDeleteModalOpen(false);
    showToast(`${count} transaction${count !== 1 ? 's' : ''} deleted`, 'success');
  }

  // ── Loading / error guards ───────────────────────────────────
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

  const hasFilters =
    searchTerm !== '' ||
    typeFilter !== 'All' ||
    categoryFilter !== 'All' ||
    sortOrder !== 'newest';

  return (
    <div className="transactions-page">
      {/* ── Header ── */}
      <div className="transactions-header">
        <div>
          <h1 className="transactions-title">Transactions</h1>
          <p className="transactions-subtitle">Record and manage your daily cash flow.</p>
        </div>
        <button
          className="btn-export"
          onClick={() => exportToCsv(filteredTransactions)}
          disabled={filteredTransactions.length === 0}
        >
          Export CSV
        </button>
      </div>

      {/* ── Add Transaction Form ── */}
      <form className="transactions-form" onSubmit={handleSubmit}>
        <h2 className="form-title">+ Add New Transaction</h2>
        <div className="form-grid">
          <div className="form-group form-group--full">
            <label htmlFor="description">Description</label>
            <input
              id="description"
              type="text"
              name="description"
              placeholder="e.g. Grocery Shopping, Monthly Salary..."
              value={form.description}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            {/* Form input stays in INR — conversion is display-only.
                Label clarifies this so users know what currency to enter. */}
            <label htmlFor="amount">Amount (INR)</label>
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

          <div className="form-group">
            <label htmlFor="type">Type</label>
            <select id="type" name="type" value={form.type} onChange={handleChange}>
              <option value="Income">Income (+)</option>
              <option value="Expense">Expense (-)</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select id="category" name="category" value={form.category} onChange={handleChange}>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

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

        <button className="btn-submit" type="submit">
          Save Transaction
        </button>
      </form>

      {/* ── Filter & Search Bar ── */}
      <div className="filter-card">
        <div className="filter-grid">
          <input
            type="text"
            className="filter-input"
            placeholder="Search description..."
            value={searchTerm}
            onChange={handleSearchChange}
          />

          <select
            className="filter-select"
            value={typeFilter}
            onChange={handleTypeFilterChange}
          >
            <option value="All">All Types</option>
            <option value="Income">Income</option>
            <option value="Expense">Expense</option>
          </select>

          <select
            className="filter-select"
            value={categoryFilter}
            onChange={handleCategoryFilterChange}
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            value={sortOrder}
            onChange={handleSortOrderChange}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>

        <div className="filter-count">
          Showing <strong>{filteredTransactions.length}</strong> of {transactions.length} transactions
        </div>
      </div>

      {/* ── Bulk action bar (appears when ≥1 row is selected) ── */}
      {validSelectedIds.length > 0 && (
        <div className="bulk-bar" role="status" aria-live="polite">
          <span className="bulk-bar__count">
            {validSelectedIds.length} selected
          </span>
          <div className="bulk-bar__actions">
            <button
              className="bulk-bar__clear-btn"
              onClick={() => setSelectedIds([])}
            >
              Clear selection
            </button>
            <button
              className="bulk-bar__delete-btn"
              onClick={() => setDeleteModalOpen(true)}
            >
              Delete selected
            </button>
          </div>
        </div>
      )}

      {/* ── Transaction List ── */}
      <div className="transaction-list-container" ref={listContainerRef}>
        {transactions.length === 0 ? (
          <div className="empty-state-card">
            <p>No transactions yet.</p>
            <small>Use the form above to add your first income or expense.</small>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="empty-state-card">
            <p>No results match your filters.</p>
            {hasFilters && (
              <button className="btn-clear-filters" onClick={clearFilters}>
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* List header with select-all checkbox */}
            <div className="list-header">
              <label className="list-header__select-all">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  className="transaction-card__checkbox"
                  checked={allOnPageSelected}
                  onChange={handleSelectAll}
                  aria-label="Select all transactions on this page"
                />
                <span className="list-header__label">
                  {allOnPageSelected ? 'Deselect all' : 'Select all on page'}
                </span>
              </label>

              <span className="list-header__page-info">
                Page {safePage} of {totalPages}
              </span>
            </div>

            {pageTransactions.map((t) => (
              <TransactionCard
                key={t.id}
                id={t.id}
                description={t.description}
                amount={t.amount}
                type={t.type}
                category={t.category}
                date={t.date}
                onDelete={handleDelete}
                selectable
                selected={validSelectedIds.includes(t.id)}
                onSelectChange={handleSelectRow}
                currency={currency}
                exchangeRates={exchangeRates}
              />
            ))}

            <Pagination
              currentPage={safePage}
              totalItems={filteredTransactions.length}
              pageSize={PAGE_SIZE}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>

      {/* ── Batch delete confirmation modal ── */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Transactions"
        footer={
          <div className="modal-footer-actions">
            <button
              className="btn-modal-cancel"
              onClick={() => setDeleteModalOpen(false)}
            >
              Cancel
            </button>
            <button
              className="btn-modal-danger"
              onClick={handleBatchDeleteConfirm}
            >
              Delete
            </button>
          </div>
        }
      >
        <p>
          Delete <strong>{validSelectedIds.length}</strong> transaction
          {validSelectedIds.length !== 1 ? 's' : ''}? This cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
