import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/transactions', label: 'Transactions', icon: '💳' },
  { to: '/summary', label: 'Summary', icon: '📈' },
  { to: '/', label: 'Landing Page', icon: '🏠' },
];

function Sidebar() {
  const [isOpen, setIsOpen] = useState(window.innerWidth > 768);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) setIsOpen(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar--open' : 'sidebar--closed'}`}>
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <span className="sidebar-brand__mark">F</span>
          <span className="sidebar-brand-text">FinScope</span>
        </div>
        <button
          className="sidebar-toggle"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <span className="sidebar-toggle__bar" />
          <span className="sidebar-toggle__bar" />
          <span className="sidebar-toggle__bar" />
        </button>
      </div>

      <nav>
        <ul>
          {navItems.map(({ to, label, icon }) => (
            <li key={to}>
              <NavLink to={to} className="nav-link">
                <span className="nav-icon">{icon}</span>
                <span className="nav-label">{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;
