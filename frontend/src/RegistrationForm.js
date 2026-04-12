import React, { useState } from 'react';
import axios from 'axios';

const roles = [
  'finance',
  'hr',
  'c_level',
  'engineer',
  'sales',
  'general'
];

function RegistrationForm({ onSuccess }) {
  const [form, setForm] = useState({ username: '', password: '', role: roles[0] });
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
      await axios.post('http://127.0.0.1:8000/register', form);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{animation:'fadeIn 0.7s'}}>
      <h2 style={{textAlign:'center',marginBottom:8, color:'#c7bfff', fontWeight:800, letterSpacing:'-1px'}}>Register</h2>
      <div>
        <label>Username</label>
        <input name="username" value={form.username} onChange={handleChange} required autoComplete="username" />
      </div>
      <div>
        <label>Password</label>
        <input name="password" type="password" value={form.password} onChange={handleChange} required autoComplete="new-password" />
      </div>
      <div>
        <label>Role</label>
        <select name="role" value={form.role} onChange={handleChange}>
          {roles.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <button type="submit" disabled={loading}>{loading ? 'Registering...' : 'Register'}</button>
      {error && <div className="error-message">{error}</div>}
    </form>
  );
}

export default RegistrationForm;
