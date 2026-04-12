

import React, { useState } from "react";
import "../styles/Auth.css";

const ROLES = [
  "finance",
  "hr",
  "c_level",
  "engineer",
  "sales",
  "general"
];

export default function Register() {

  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState(ROLES[0]);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = typeof window !== "undefined" ? require("react-router-dom").useNavigate() : () => {};

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: userId, password, role })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Registration failed");
      }
      setSuccess("Account created successfully! Redirecting to chat...");
      // Optionally, auto-login after registration
      // Login to get token
      const loginRes = await fetch("http://localhost:8000/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ username: userId, password })
      });
      if (!loginRes.ok) {
        throw new Error("Account created, but login failed.");
      }
      const loginData = await loginRes.json();
      localStorage.setItem("token", loginData.access_token);
      localStorage.setItem("userId", userId);
      setTimeout(() => navigate("/chat"), 1200);
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-main-bg no-scroll">

      <form className="auth-card" onSubmit={handleSubmit}>
        <div style={{width: '100%', marginBottom: '0.7rem', display: 'flex'}}>
          <a href="/" style={{color: '#15803d', textDecoration: 'none', fontWeight: 600, fontSize: '1rem'}}>&larr; Home</a>
        </div>

        <h2 className="auth-title">Create Account</h2>
        <div className="auth-desc">Register to access the company chatbot</div>
        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success" style={{color:'#22c55e',marginBottom:'0.7rem',fontWeight:500}}>{success}</div>}
        <div className="auth-form left-align-fields">
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
              placeholder="Choose a user ID"
            />
          </div>
          <div className="auth-field" style={{ position: 'relative', width: '100%' }}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              className="auth-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
              placeholder="Create a password"
              style={{ paddingRight: '2.2rem' }}
            />
            <button
              type="button"
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((v) => !v)}
              style={{
                position: 'absolute',
                right: '0.5rem',
                top: '2.1rem',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                color: '#64748b',
                fontSize: '1.1rem',
                lineHeight: 1
              }}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
          <div className="auth-field" style={{ position: 'relative', width: '100%' }}>
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              className="auth-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
              placeholder="Confirm your password"
              style={{ paddingRight: '2.2rem' }}
            />
            <button
              type="button"
              tabIndex={-1}
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              onClick={() => setShowConfirmPassword((v) => !v)}
              style={{
                position: 'absolute',
                right: '0.5rem',
                top: '2.1rem',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                color: '#64748b',
                fontSize: '1.1rem',
                lineHeight: 1
              }}
            >
              {showConfirmPassword ? '🙈' : '👁️'}
            </button>
          </div>
          <div className="auth-field">
            <label htmlFor="role">Role</label>
            <select
              id="role"
              className="auth-input custom-select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
            >
              <option value="" disabled hidden>Select a role</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
              ))}
            </select>
          </div>
          <button className="auth-btn green" type="submit" disabled={loading}>
            {loading ? "Creating..." : (<><span role="img" aria-label="key">🔑</span> Create Account</>)}
          </button>
        </div>
        <div className="auth-or" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', margin: '1.2rem 0 0.5rem 0'}}>
          <hr style={{ flex: 1, border: 0, borderTop: '1.5px solid #cbd5e1', margin: '0 0.5rem' }} />
          <span style={{ color: '#a0aec0', fontWeight: 500, fontSize: '1rem' }}>or</span>
          <hr style={{ flex: 1, border: 0, borderTop: '1.5px solid #cbd5e1', margin: '0 0.5rem' }} />
        </div>
        <div className="auth-footer">
          Already have an account?{' '}
          <a className="auth-link" href="/login">Sign in</a>
        </div>
      </form>
    </div>
  );
}
