import { HashRouter, Routes, Route } from "react-router-dom";
import { Dashboard } from "./components/Dashboard";
import { Overlay } from "./components/Overlay";
import { Onboarding } from "./components/Onboarding";
import { useAppStore } from "./stores/app";

export default function App() {
  const hasProfile = useAppStore((s) => s.hasProfile);

  return (
    <HashRouter>
      <Routes>
        <Route path="/overlay" element={<Overlay />} />
        <Route
          path="/*"
          element={hasProfile ? <Dashboard /> : <Onboarding />}
        />
      </Routes>
    </HashRouter>
  );
}
