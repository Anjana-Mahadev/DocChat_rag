
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
        <div style={{width: '100%', marginBottom: '0.7rem', display: 'flex', alignItems: 'center'}}>
          <a href="/" style={{
            color: '#22c55e',
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: '1.25rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.32rem',
            lineHeight: 1,
            height: '2.1rem',
            verticalAlign: 'middle'
          }}>
            <span style={{display:'inline-flex', alignItems:'center', color:'#22c55e', fontSize:'1.25rem', fontWeight:700, height:'2.1rem', verticalAlign:'middle'}}>&larr;</span>
            <span style={{color:'#22c55e', fontWeight:700, fontSize:'1.25rem', display:'inline-flex', alignItems:'center', height:'2.1rem', verticalAlign:'middle'}}>Home</span>
          </a>
        </div>
        <h2 className="auth-title">Sign In</h2>
        <div className="auth-desc">Sign in to access the company chatbot</div>
        {error && <div className="auth-error" style={{animation:'shake 0.3s'}}>{error}</div>}
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
              aria-describedby="userIdHelp"
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
              aria-describedby="passwordHelp"
            />
            <button
              type="button"
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((v) => !v)}
              style={{
                position: 'absolute',
                right: '0.7rem',
                top: '50%',
                transform: 'translateY(-50%)',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                padding: 0,
                color: '#64748b',
                fontSize: '1.25rem',
                lineHeight: 1
              }}
            >
              {showPassword ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.06 10.06 0 0 1 12 20c-5 0-9.27-3.11-11-8 1.21-3.06 3.6-5.5 6.58-6.71"/><path d="M1 1l22 22"/><path d="M9.53 9.53A3.5 3.5 0 0 0 12 15.5c1.93 0 3.5-1.57 3.5-3.5 0-.47-.09-.92-.26-1.33"/></svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="12" rx="10" ry="7"/><circle cx="12" cy="12" r="3.5"/></svg>
              )}
            </button>

          </div>
          <button
            className="auth-btn green"
            type="submit"
            style={{alignSelf: 'center', marginTop: '0.7rem', width: '100%', maxWidth: '240px', fontWeight: 600, position: 'relative', display: 'block', textAlign: 'center', paddingLeft: 0, paddingRight: 0}}
          >
            <span style={{position: 'absolute', left: 'calc(50% - 54px)', top: '50%', transform: 'translateY(-50%)', fontSize: '1.15rem', pointerEvents: 'none', display: 'inline-block'}}>🔑</span>
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
