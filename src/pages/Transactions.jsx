import { useState, useEffect } from 'react';
import TransactionCard from '../components/TransactionCard';
import { loadTransactions, saveTransactions } from '../utils/storage';
import { exportToCsv } from '../utils/exportCsv';
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

const getTodayDate = () => new Date().toISOString().split('T')[0];

export default function Transactions() {
  const [transactions, setTransactions] = useState(() => loadTransactions());
  const [form, setForm] = useState({
    description: '',
    amount: '',
    type: 'Expense',
    category: 'Food & Dining',
    date: getTodayDate(),
  });

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('newest');

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
      category: form.category,
      date: form.date,
    };

    setTransactions((prev) => [newTransaction, ...prev]);
    setForm({
      description: '',
      amount: '',
      type: 'Expense',
      category: 'Food & Dining',
      date: getTodayDate(),
    });
  }

  function handleDelete(id) {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }

  const filteredTransactions = transactions
    .filter((t) =>
      t.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((t) => typeFilter === 'All' || t.type === typeFilter)
    .filter((t) => categoryFilter === 'All' || (t.category || 'Other') === categoryFilter)
    .sort((a, b) =>
      sortOrder === 'newest'
        ? new Date(b.date) - new Date(a.date)
        : new Date(a.date) - new Date(b.date)
    );

  return (
    <div className="transactions-page">
      <div className="transactions-header">
        <div>
          <h1 className="transactions-title">Transactions</h1>
          <p className="transactions-subtitle">Record and manage your daily cash flow.</p>
        </div>
        <button
          className="btn-export"
          onClick={() => exportToCsv(transactions)}
          disabled={transactions.length === 0}
        >
          Export CSV
        </button>
      </div>

      {/* Add Transaction Card Form */}
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

      {/* Filter & Search Bar */}
      <div className="filter-card">
        <div className="filter-grid">
          <input
            type="text"
            className="filter-input"
            placeholder="Search description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select
            className="filter-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="All">All Types</option>
            <option value="Income">Income</option>
            <option value="Expense">Expense</option>
          </select>

          <select
            className="filter-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
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
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>

        <div className="filter-count">
          Showing <strong>{filteredTransactions.length}</strong> of {transactions.length} transactions
        </div>
      </div>

      {/* List */}
      <div className="transaction-list-container">
        {transactions.length === 0 ? (
          <div className="empty-state-card">
            <p>No transactions recorded yet.</p>
            <small>Use the form above to add your first income or expense.</small>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="empty-state-card">
            <p>No matching transactions found.</p>
            <small>Try clearing your search or category filters.</small>
          </div>
        ) : (
          filteredTransactions.map((t) => (
            <TransactionCard
              key={t.id}
              id={t.id}
              description={t.description}
              amount={t.amount}
              type={t.type}
              category={t.category}
              date={t.date}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}
