import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { FinanceProvider } from './context/FinanceContext';
import Layout from './Layout';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Summary from './pages/Summary';
import Budgets from './pages/Budgets';
import Simulator from './pages/Simulator';
import LandingPage from './pages/LandingPage';
import NotFound from './pages/NotFound';

function App() {
  return (
    <FinanceProvider>
      <BrowserRouter>
        <Routes>
          {/* Landing hero page as the default root route */}
          <Route path="/" element={<LandingPage />} />

          {/* Dashboard and internal app pages inside sidebar Layout */}
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/summary" element={<Summary />} />
            <Route path="/budgets" element={<Budgets />} />
            <Route path="/simulator" element={<Simulator />} />
          </Route>

          {/* Catch-all 404 route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </FinanceProvider>
  );
}

export default App;