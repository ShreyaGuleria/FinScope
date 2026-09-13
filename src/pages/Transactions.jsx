import { useState, useEffect } from 'react';
import TransactionCard from '../components/TransactionCard';
import { loadTransactions, saveTransactions } from '../utils/storage';
import { exportToCsv } from '../utils/exportCsv';
import './Transactions.css';

const EMPTY_FORM = { description: '', amount: '', type: 'Income', date: '' };

function Transactions() {
  const [transactions, setTransactions] = useState(() => loadTransactions());
  const [form, setForm] = useState(EMPTY_FORM);

  // Filter / sort state
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('newest');

  // Persist to localStorage whenever the list changes
  useEffect(() => {
    saveTransactions(transactions);
  }, [transactions]);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.description.trim() || !form.amount || !form.date) return;

    const newTransaction = {
      id: Date.now(),
      description: form.description.trim(),
      amount: parseFloat(form.amount),
      type: form.type,
      date: form.date,
    };

    setTransactions((prev) => [newTransaction, ...prev]);
    setForm(EMPTY_FORM);
  }

  function handleDelete(id) {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }

  // Derived: apply search + type filter + sort
  const filteredTransactions = transactions
    .filter((t) =>
      t.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((t) => typeFilter === 'All' || t.type === typeFilter)
    .sort((a, b) =>
      sortOrder === 'newest'
        ? new Date(b.date) - new Date(a.date)
        : new Date(a.date) - new Date(b.date)
    );

  return (
    <div>
      <h1 className="transactions-page__title">Transactions</h1>

      {/* ── Add-Transaction Form ── */}
      <form className="transactions-form" onSubmit={handleSubmit} noValidate>
        <p className="transactions-form__title">Add a Transaction</p>

        <div className="transactions-form__grid">
          {/* Description – spans full width */}
          <div className="transactions-form__group transactions-form__group--full">
            <label className="transactions-form__label" htmlFor="description">
              Description
            </label>
            <input
              id="description"
              className="transactions-form__input"
              type="text"
              name="description"
              placeholder="e.g. Grocery shopping"
              value={form.description}
              onChange={handleChange}
              required
            />
          </div>

          {/* Amount */}
          <div className="transactions-form__group">
            <label className="transactions-form__label" htmlFor="amount">
              Amount ($)
            </label>
            <input
              id="amount"
              className="transactions-form__input"
              type="number"
              name="amount"
              placeholder="0.00"
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={handleChange}
              required
            />
          </div>

          {/* Type */}
          <div className="transactions-form__group">
            <label className="transactions-form__label" htmlFor="type">
              Type
            </label>
            <select
              id="type"
              className="transactions-form__select"
              name="type"
              value={form.type}
              onChange={handleChange}
            >
              <option value="Income">Income</option>
              <option value="Expense">Expense</option>
            </select>
          </div>

          {/* Date */}
          <div className="transactions-form__group">
            <label className="transactions-form__label" htmlFor="date">
              Date
            </label>
            <input
              id="date"
              className="transactions-form__input"
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <button className="transactions-form__submit" type="submit">
          + Add Transaction
        </button>
      </form>

      {/* ── History heading + Export ── */}
      <div className="transactions-list__header">
        <h2 className="transactions-list__heading">History</h2>
        <button
          id="export-csv-btn"
          className="transactions-export-btn"
          onClick={() => exportToCsv(transactions)}
          disabled={transactions.length === 0}
        >
          ↓ Export CSV
        </button>
      </div>

      {/* ── Filter / Search bar ── */}
      <div className="transactions-filter-bar">
        <input
          id="filter-search"
          className="transactions-filter-bar__input"
          type="text"
          placeholder="Search description…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          aria-label="Search transactions"
        />

        <select
          id="filter-type"
          className="transactions-filter-bar__select"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          aria-label="Filter by type"
        >
          <option value="All">All Types</option>
          <option value="Income">Income</option>
          <option value="Expense">Expense</option>
        </select>

        <select
          id="filter-sort"
          className="transactions-filter-bar__select"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          aria-label="Sort order"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
      </div>

      {/* ── Result count ── */}
      <p className="transactions-filter-count">
        🔍 {filteredTransactions.length}{' '}
        {filteredTransactions.length === 1 ? 'transaction' : 'transactions'} found
      </p>

      {/* ── Transaction List ── */}
      {transactions.length === 0 ? (
        <p className="transactions-list__empty">
          No transactions yet — add one above!
        </p>
      ) : filteredTransactions.length === 0 ? (
        <p className="transactions-list__empty">
          No transactions match your filters.
        </p>
      ) : (
        <ul className="transactions-list">
          {filteredTransactions.map((t) => (
            <li key={t.id}>
              <TransactionCard
                id={t.id}
                description={t.description}
                amount={t.amount}
                type={t.type}
                date={t.date}
                onDelete={handleDelete}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Transactions;
