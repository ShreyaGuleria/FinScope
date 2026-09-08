import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Home', end: true },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/transactions', label: 'Transactions' },
  { to: '/summary', label: 'Summary' },
];

function Sidebar() {
  return (
    <aside className="sidebar">
        <div className="brand" style={{ fontSize: '1.5rem', color: 'var(--color-primary)' }}>FinScope</div>
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
