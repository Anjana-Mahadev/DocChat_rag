import React, { useState } from 'react';
import axios from 'axios';

function LoginForm({ onLogin }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('http://127.0.0.1:8000/api/token', new URLSearchParams(form));
      onLogin(res.data.access_token);
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{animation:'fadeIn 0.7s'}}>
      <h2 style={{textAlign:'center',marginBottom:8, color:'#c7bfff', fontWeight:800, letterSpacing:'-1px'}}>Login</h2>
      <div>
        <label>Username</label>
        <input name="username" value={form.username} onChange={handleChange} required autoComplete="username" />
      </div>
      <div>
        <label>Password</label>
        <input name="password" type="password" value={form.password} onChange={handleChange} required autoComplete="current-password" />
      </div>
      <button type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
      {error && <div className="error-message">{error}</div>}
    </form>
  );
}

export default LoginForm;
