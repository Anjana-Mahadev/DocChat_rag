import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Auth.css";

export default function Login() {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId || !password) {
      setError("Please enter both User ID and password.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          username: userId,
          password: password
        })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Login failed");
      }
      const data = await res.json();
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("userId", userId);
      navigate("/chat");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <a href="/" className="auth-back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Back to home
        </a>
        <h2 className="auth-title">Welcome back</h2>
        <p className="auth-desc">Sign in to access the company chatbot</p>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="userId">User ID</label>
            <input
              id="userId"
              type="text"
              className="auth-input"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              autoComplete="username"
              required
              placeholder="Enter your user ID"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password">Password</label>
            <div className="auth-password-wrap">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="auth-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                placeholder="Enter your password"
              />
              <button
                type="button"
                className="auth-eye-btn"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><path d="m1 1 22 22"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          </div>

          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="auth-divider"><span>or</span></div>
        <div className="auth-footer">
          Don't have an account? <a href="/register">Create one</a>
        </div>
      </div>
    </div>
  );
}
