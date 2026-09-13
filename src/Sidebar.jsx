import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Home', end: true },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/transactions', label: 'Transactions' },
  { to: '/summary', label: 'Summary' },
];

function Sidebar() {
  const [isOpen, setIsOpen] = useState(window.innerWidth > 768);

  // Sync on resize so toggling between breakpoints feels natural
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) setIsOpen(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar--open' : 'sidebar--closed'}`}>
      {/* Hamburger button — always visible */}
      <button
        className="sidebar-toggle"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
        aria-expanded={isOpen}
      >
        <span className="sidebar-toggle__bar" />
        <span className="sidebar-toggle__bar" />
        <span className="sidebar-toggle__bar" />
      </button>

      <div
        className="sidebar-brand"
        style={{ fontSize: '1.5rem', color: 'var(--color-primary)' }}
      >
        FinScope
      </div>

      <nav>
        <ul>
          {navItems.map(({ to, label, end }) => (
            <li key={to}>
              <NavLink to={to} end={end} className="nav-link">
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;
