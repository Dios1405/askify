import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '', email: '', password: '', password_confirm: '',
    first_name: '', last_name: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/login');
    } catch (err) {
      const data = err.response?.data;
      if (data) {
        const msg = Object.values(data).flat().join(' ');
        setError(msg);
      } else {
        setError('Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Create account</h1>
        <p>Get started with Askify</p>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label>First name</label>
              <input className="form-control" value={form.first_name} onChange={set('first_name')} />
            </div>
            <div className="form-group">
              <label>Last name</label>
              <input className="form-control" value={form.last_name} onChange={set('last_name')} />
            </div>
          </div>
          <div className="form-group">
            <label>Username</label>
            <input className="form-control" value={form.username} onChange={set('username')} required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input className="form-control" type="email" value={form.email} onChange={set('email')} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input className="form-control" type="password" value={form.password} onChange={set('password')} required />
          </div>
          <div className="form-group">
            <label>Confirm password</label>
            <input className="form-control" type="password" value={form.password_confirm} onChange={set('password_confirm')} required />
          </div>
          {error && <div className="error-text">{error}</div>}
          <button className="btn btn-primary mt-2" disabled={loading}>
            {loading ? 'Creating...' : 'Create account'}
          </button>
        </form>
        <div className="auth-toggle">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
