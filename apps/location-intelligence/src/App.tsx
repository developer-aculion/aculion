import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Providers from "./providers";
import Layout from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import Billboards from "./pages/Billboards";

export default function App() {
  return (
    <Providers>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard/:id" element={<Dashboard />} />
            <Route path="/billboards" element={<Billboards />} />
          </Route>
          
          {/* Fallback Catch-All redirects back to Dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </Providers>
  );
}
