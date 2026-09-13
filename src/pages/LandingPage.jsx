import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

function LandingPage() {
  return (
    <div className="landing-page">
      <nav className="landing-nav">
        <div className="landing-logo">
          <span>⚡</span> FinScope
        </div>
        <div className="landing-nav-links">
          <Link to="/dashboard" className="btn-secondary">
            Go to App
          </Link>
          <Link to="/transactions" className="btn-primary">
            Get Started
          </Link>
        </div>
      </nav>

      <main className="hero-section">
        <div className="badge-pill">✨ Modern Personal Finance Tracker</div>
        <h1 className="hero-title">
          Track. Organize. Analyze. <br />
          <span className="gradient-text">Your Finances, Simplified.</span>
        </h1>
        <p className="hero-subtitle">
          Take full control of your income, expenses, and savings with real-time visual insights,
          category analytics, and zero configuration.
        </p>

        <div className="hero-actions">
          <Link to="/dashboard" className="btn-hero-primary">
            Open Dashboard 🚀
          </Link>
          <Link to="/transactions" className="btn-hero-secondary">
            + Add Transaction
          </Link>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Real-time Analytics</h3>
            <p>Interactive Doughnut chart visualizing income vs expenses instantly.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🏷️</div>
            <h3>Category Breakdown</h3>
            <p>Organize spending into Food, Rent, Salary, Bills, Shopping, and more.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💾</div>
            <h3>Local Persistence</h3>
            <p>Your financial records stay safely stored directly in your browser.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📥</div>
            <h3>CSV Export</h3>
            <p>Export your full transaction history into spreadsheet CSV formats with one click.</p>
          </div>
        </div>
      </main>

      <footer className="landing-footer">
        <p>FinScope — Group 10 (PID 7) | Front End Engineering II</p>
      </footer>
    </div>
  );
}

export default LandingPage;
