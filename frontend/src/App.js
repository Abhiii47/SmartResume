import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage.js";
import SignupPage from "./pages/SignupPage.js";
import DashboardPage from "./pages/DashboardPage.js";
import LandingPage from "./pages/LandingPage.js";
import { isAuthenticated } from "./utils";

const ProtectedRoute = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/login" />;
};

// Simple component for when the app is mistakenly loaded in an iframe
const IframeFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-slate-900 text-slate-400 font-mono text-xs">
    [BLOCKED_IFRAME_CONTEXT]
  </div>
);

export default function App() {
  // Prevent the app from initializing redirects if inside an iframe
  // This solves the "Unsafe attempt to load URL" error
  const isIframe = window !== window.top;

  if (isIframe) {
    return <IframeFallback />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
