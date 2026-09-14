import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';
import ParticleBackground from '../components/ParticleBackground';

const FEATURES = [
  {
    num: '01',
    title: 'Financial Overview',
    sub: 'See your money clearly.',
    body: 'Track income, expenses, savings, and your overall financial position from one centralized dashboard.',
  },
  {
    num: '02',
    title: 'Spending Intelligence',
    sub: 'Understand where your money goes.',
    body: 'Break down your spending by category and identify the areas influencing your financial habits.',
  },
  {
    num: '03',
    title: 'Transaction Management',
    sub: 'Keep every transaction organized.',
    body: 'Record, review, and manage your financial activity through a structured transaction history.',
  },
  {
    num: '04',
    title: 'Private by Design',
    sub: 'Your financial data stays with you.',
    body: 'FinScope stores your records locally in the browser, keeping the experience simple without requiring a complicated setup.',
  },
  {
    num: '05',
    title: 'Visual Insights',
    sub: 'Turn numbers into useful insights.',
    body: 'Use visual summaries and charts to understand financial patterns faster than reading through raw numbers.',
  },
  {
    num: '06',
    title: 'Data Portability',
    sub: 'Take your financial history with you.',
    body: 'Export your transaction data as CSV whenever you need a portable copy of your records.',
  },
];

function LandingPage() {
  const orb1Ref = useRef(null);
  const orb2Ref = useRef(null);
  const rafRef = useRef(null);

  // Parallax on scroll
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const onScroll = () => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        const y = window.scrollY;
        if (orb1Ref.current) {
          orb1Ref.current.style.transform = `translateY(${y * 0.18}px)`;
        }
        if (orb2Ref.current) {
          orb2Ref.current.style.transform = `translateY(${y * 0.10}px)`;
        }
        rafRef.current = null;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Scroll reveal via IntersectionObserver
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const targets = document.querySelectorAll('.reveal');
    if (!targets.length) return;

    if (prefersReduced) {
      targets.forEach((el) => el.classList.add('visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing-page">
      {/* Decorative Background */}
      <div className="lp-bg-layer" aria-hidden="true">
        <div className="lp-bg-orb lp-bg-orb--1" ref={orb1Ref} />
        <div className="lp-bg-orb lp-bg-orb--2" ref={orb2Ref} />
        <div className="lp-bg-noise" />
        <ParticleBackground />
      </div>

      {/* Navigation */}
      <nav className="landing-nav">
        <div className="landing-logo">
          <span className="landing-logo__mark">F</span>
          <span className="landing-logo__text">FinScope</span>
        </div>
        <div className="landing-nav-links">
          <Link to="/dashboard" className="btn-secondary">Open Dashboard</Link>
          <Link to="/transactions" className="btn-primary">Add Transaction</Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="hero-section">
        <div className="hero-eyebrow">Personal Finance Tracker</div>
        <h1 className="hero-title">
          Track. Organize.<br />
          <span className="hero-title--accent">Understand.</span>
        </h1>
        <p className="hero-subtitle">
          Take complete control of your income, expenses, and savings.
          FinScope gives you the clarity to make better financial decisions, every day.
        </p>
        <div className="hero-actions">
          <Link to="/dashboard" className="btn-hero-primary" id="hero-cta-dashboard">
            Open Dashboard
          </Link>
          <Link to="/transactions" className="btn-hero-secondary" id="hero-cta-transactions">
            Add Transaction
          </Link>
        </div>
      </main>

      {/* Feature Cards */}
      <section className="features-section" aria-label="Product features">
        <div className="features-grid">
          {FEATURES.map((f, i) => (
            <article
              key={f.num}
              className="feature-card reveal"
              style={{ transitionDelay: `${i * 60}ms` }}
            >
              <span className="feature-num" aria-hidden="true">{f.num}</span>
              <h3 className="feature-card__title">{f.title}</h3>
              <p className="feature-card__sub">{f.sub}</p>
              <p className="feature-card__body">{f.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Section A: Philosophy */}
      <section className="editorial-section editorial-section--philosophy" aria-label="FinScope philosophy">
        <hr className="editorial-rule editorial-rule--top" />
        <div className="editorial-label reveal">The FinScope Philosophy</div>
        <div className="editorial-split">
          <h2 className="editorial-heading reveal">
            Your finances should<br />make sense at a glance.
          </h2>
          <div className="editorial-body reveal" style={{ transitionDelay: '120ms' }}>
            <p>
              FinScope is built around a single principle: financial clarity should not require
              a financial background. Most people have money moving in and out of their lives
              daily, yet very few have a clear picture of where it goes.
            </p>
            <p>
              This application turns scattered transactions into structured, understandable
              financial information Â presented without noise, without unnecessary complexity,
              and without subscriptions or setup friction.
            </p>
          </div>
        </div>
        <hr className="editorial-rule" />
      </section>

      {/* Section B: Why It Matters */}
      <section className="editorial-section editorial-section--why" aria-label="Why tracking matters">
        <div className="editorial-label editorial-label--right reveal">Why It Matters</div>
        <h2 className="editorial-heading editorial-heading--right reveal">
          Awareness changes<br />the way we spend.
        </h2>
        <div className="editorial-paragraphs">
          <p className="reveal" style={{ transitionDelay: '80ms' }}>
            Most financial decisions are made without a clear picture of existing habits.
            Tracking your spending, even informally, can reveal patterns that are otherwise
            invisible Â recurring subscriptions, seasonal expenses, or categories that
            consistently exceed your expectations.
          </p>
          <p className="reveal" style={{ transitionDelay: '160ms' }}>
            Understanding where money goes is the first step toward understanding where it
            could go instead. Savings patterns become visible only once expenses are organized.
            Priorities become clearer when the numbers are structured.
          </p>
          <p className="reveal" style={{ transitionDelay: '240ms' }}>
            FinScope does not tell you how to manage your money. It gives you the information
            to make those decisions yourself Â with confidence and without guesswork.
          </p>
        </div>
        <hr className="editorial-rule" />
      </section>

      {/* Section C: How It Works */}
      <section className="editorial-section editorial-section--process" aria-label="How FinScope works">
        <div className="editorial-label reveal">How It Works</div>
        <h2 className="editorial-heading reveal">
          A simpler way to<br />understand your money.
        </h2>
        <div className="process-columns">
          {[
            { step: '01', name: 'Record', desc: 'Add your income and expenses as they occur. Assign categories, notes, and amounts in a few seconds.' },
            { step: '02', name: 'Understand', desc: 'Review categorized breakdowns and visual summaries to see the shape of your financial activity.' },
            { step: '03', name: 'Reflect', desc: 'Use the information to identify patterns and make more deliberate financial decisions over time.' },
          ].map((p, i) => (
            <div className="process-step reveal" key={p.step} style={{ transitionDelay: `${i * 100}ms` }}>
              <span className="process-step__num" aria-hidden="true">{p.step}</span>
              <h3 className="process-step__name">{p.name}</h3>
              <p className="process-step__desc">{p.desc}</p>
            </div>
          ))}
        </div>
        <hr className="editorial-rule" />
      </section>

      {/* Section D: Closing CTA */}
      <section className="editorial-section editorial-section--closing" aria-label="Call to action">
        <div className="closing-headline reveal">
          Finance,<br />Without the Friction.
        </div>
        <p className="closing-sub reveal" style={{ transitionDelay: '100ms' }}>
          Everything you need to understand your financial life Â organized, visual, and
          entirely private. No accounts, no servers, no complexity.
        </p>
        <div className="reveal" style={{ transitionDelay: '200ms' }}>
          <Link to="/dashboard" className="btn-hero-primary" id="closing-cta-dashboard">
            Open Dashboard
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p>FinScope Â Group 10 (PID 7) | Front End Engineering II</p>
      </footer>
    </div>
  );
}

export default LandingPage;
