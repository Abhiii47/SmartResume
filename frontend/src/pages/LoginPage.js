import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE, setAuthToken, updateMetaTags } from "../utils";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    updateMetaTags({
      title: "Login - SmartResume",
      description: "Login to SmartResume to access your resume analysis history.",
      url: window.location.href
    });
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const params = new URLSearchParams();
      params.append("username", email);
      params.append("password", password);

      const { data } = await axios.post(`${API_BASE}/login`, params, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
      });

      setAuthToken(data.access_token);
      navigate("/dashboard");
    } catch (err) {
      const apiDetail = err?.response?.data?.detail;
      setError(typeof apiDetail === "string" ? apiDetail : "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 -ml-20 -mt-20 w-96 h-96 rounded-full bg-violet-200/50 mix-blend-multiply filter blur-3xl animate-float"></div>
      <div className="absolute bottom-0 right-0 -mr-20 -mb-20 w-80 h-80 rounded-full bg-indigo-200/50 mix-blend-multiply filter blur-3xl animate-float-delayed"></div>

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        <div className="glass-card rounded-3xl p-8 lg:p-10">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-xl mb-6 shadow-lg shadow-violet-500/30 text-white">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
            </div>
            <h2 className="text-3xl font-display font-bold text-gray-900 mb-2">
              Welcome Back
            </h2>
            <p className="text-gray-500">Enter your credentials to access your account</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-5 py-3.5 rounded-xl border border-gray-200 bg-white/50 focus:bg-white focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all outline-none"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-5 py-3.5 rounded-xl border border-gray-200 bg-white/50 focus:bg-white focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all outline-none"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center animate-pulse-fast">
                <svg className="w-5 h-5 mr-2 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-black transition-all transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:transform-none shadow-lg hover:shadow-xl"
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-500">
            Don't have an account?{" "}
            <button
              onClick={() => navigate("/signup")}
              className="text-violet-600 font-bold hover:text-violet-700 hover:underline transition"
            >
              Create free account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
