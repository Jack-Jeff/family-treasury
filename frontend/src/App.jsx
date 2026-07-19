import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import TreasuryPage from "./pages/TreasuryPage";
import { FACTORY_ADDRESS } from "./lib/wagmi";

export default function App() {
  if (!FACTORY_ADDRESS) {
    return <MissingConfig />;
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/treasury/:address" element={<TreasuryPage />} />
    </Routes>
  );
}

function MissingConfig() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md rounded-2xl border border-[var(--paper-line)] bg-[var(--paper-dim)] p-8 text-center">
        <h1 className="font-display text-2xl font-semibold mb-3">Not configured yet</h1>
        <p className="text-sm text-[var(--ink-soft)]">
          Set <code className="font-mono">VITE_FACTORY_ADDRESS</code> in <code className="font-mono">frontend/.env</code>{" "}
          after deploying the factory contract, then restart the dev server.
        </p>
      </div>
    </div>
  );
}
