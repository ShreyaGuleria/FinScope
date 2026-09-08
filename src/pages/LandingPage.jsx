import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

function LandingPage() {
  return (
    <section className="landing-page">
      <div className="content">
        <h1 className="title">FinScope</h1>
        <p className="tagline">Track. Organize. Analyze. Your finances, simplified.</p>
        <Link to="/dashboard" className="cta-button">
          Get Started
        </Link>
      </div>
    </section>
  );
}

export default LandingPage;
