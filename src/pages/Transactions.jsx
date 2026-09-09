import { useState, useEffect } from 'react';
import TransactionCard from '../components/TransactionCard';
import { loadTransactions, saveTransactions } from '../utils/storage';
import './Transactions.css';

const EMPTY_FORM = { description: '', amount: '', type: 'Income', date: '' };

function Transactions() {
  const [transactions, setTransactions] = useState(() => loadTransactions());
  const [form, setForm] = useState(EMPTY_FORM);

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

      {/* ── Transaction List ── */}
      <h2 className="transactions-list__heading">History</h2>

      {transactions.length === 0 ? (
        <p className="transactions-list__empty">
          No transactions yet — add one above!
        </p>
      ) : (
        <ul className="transactions-list">
          {transactions.map((t) => (
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
