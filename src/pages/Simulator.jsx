// TODO(Leg 3: Savleen) — Hook up the currency simulator logic using:
// useFinance() exposes: currency, setCurrency(code), exchangeRates, setExchangeRates(rates)
import './Budgets.css'; /* reuse same placeholder styles */

export default function Simulator() {
  return (
    <div className="placeholder-page">
      <div className="placeholder-page__inner">
        <h1 className="placeholder-page__title">Simulator</h1>
        <p className="placeholder-page__desc">
          Simulate currency conversion and net-worth scenarios with live exchange rates — coming soon.
        </p>
      </div>
    </div>
  );
}
