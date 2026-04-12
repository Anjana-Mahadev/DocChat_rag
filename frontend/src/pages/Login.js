
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Auth.css";

export default function Login() {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId || !password) {
      setError("Please enter both User ID and password.");
      return;
    }
    setError("");
    try {
      const res = await fetch("http://localhost:8000/token", {
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
    }
  };

  return (
    <div className="auth-main-bg no-scroll">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div style={{width: '100%', marginBottom: '0.7rem', display: 'flex'}}>
          <a href="/" style={{color: '#15803d', textDecoration: 'none', fontWeight: 600, fontSize: '1rem'}}>&larr; Home</a>
        </div>
        <h2 className="auth-title">Sign In</h2>
        <div className="auth-desc">Sign in to access the company chatbot</div>
        {error && <div className="auth-error">{error}</div>}
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
              placeholder="Enter your user ID"
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
              autoComplete="current-password"
              required
              placeholder="Enter your password"
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
          <button
            className="auth-btn green"
            type="submit"
            style={{
              alignSelf: 'center',
              marginTop: '0.7rem',
              width: '100%',
              maxWidth: '220px',
              fontWeight: 600,
              position: 'relative',
              display: 'block',
              textAlign: 'center',
              paddingLeft: 0,
              paddingRight: 0
            }}
          >
            <span style={{
              position: 'absolute',
              left: 'calc(50% - 54px)',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '1.15rem',
              pointerEvents: 'none',
              display: 'inline-block'
            }}>🔑</span>
            <span style={{position: 'relative', zIndex: 1}}>Sign In</span>
          </button>
        </div>
        <div className="auth-or" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', margin: '1.2rem 0 0.5rem 0'}}>
          <hr style={{ flex: 1, border: 0, borderTop: '1.5px solid #cbd5e1', margin: '0 0.5rem' }} />
          <span style={{ color: '#a0aec0', fontWeight: 500, fontSize: '1rem' }}>or</span>
          <hr style={{ flex: 1, border: 0, borderTop: '1.5px solid #cbd5e1', margin: '0 0.5rem' }} />
        </div>
        <div className="auth-footer">
          Don't have an account?{' '}
          <a className="auth-link" href="/register">Register</a>
        </div>
      </form>
    </div>
  );
}
