import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE, updateMetaTags } from "../utils";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    updateMetaTags({
      title: "Sign Up - SmartResume",
      description: "Join SmartResume today.",
      url: window.location.href
    });
  }, []);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("username", username);
      formData.append("password", password);

      await axios.post(`${API_BASE}/signup`, formData);
      navigate("/login", { state: { message: "Account created successfully! Please log in." } });
    } catch (err) {
      const apiDetail = err?.response?.data?.detail;
      setError(Array.isArray(apiDetail) ? (apiDetail[0]?.msg || "Signup failed") : (typeof apiDetail === "string" ? apiDetail : "Signup failed."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-violet-200/50 mix-blend-multiply filter blur-3xl animate-float"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-indigo-200/50 mix-blend-multiply filter blur-3xl animate-float-delayed"></div>

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        <div className="glass-card rounded-3xl p-8 lg:p-10">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-xl mb-6 shadow-lg shadow-violet-500/30 text-white">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h2 className="text-3xl font-display font-bold text-gray-900 mb-2">
              Create Account
            </h2>
            <p className="text-gray-500">Join SmartResume and boost your career</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Username</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-5 py-3.5 rounded-xl border border-gray-200 bg-white/50 focus:bg-white focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all outline-none"
                placeholder="johndoe"
              />
            </div>

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
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-violet-500/30 transition-all transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:transform-none mt-2"
            >
              {loading ? "Creating..." : "Create Account"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-violet-600 font-bold hover:text-violet-700 hover:underline transition"
            >
              Log in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
