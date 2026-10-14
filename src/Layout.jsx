import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Toast from './components/Toast';

function Layout() {
  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
      {/* Toast stack — rendered once here so it persists across navigation */}
      <Toast />
    </div>
  );
}

export default Layout;
