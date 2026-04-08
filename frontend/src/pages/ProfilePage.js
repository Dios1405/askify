import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

export default function ProfilePage() {
  const { user, fetchProfile } = useAuth();
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const set = (f) => (e) => { setForm({ ...form, [f]: e.target.value }); setSaved(false); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await authAPI.updateProfile(form);
      await fetchProfile();
      setSaved(true);
    } catch {
      alert('Failed to update profile');
    }
    setSaving(false);
  };

  return (
    <div>
      <div className="page-header">
        <h1>Profile</h1>
        <p>Manage your account settings</p>
      </div>

      <div className="card" style={{ maxWidth: 520 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%', background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 700, color: 'white',
          }}>
            {(user?.first_name?.[0] || user?.username?.[0] || '?').toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>
              {user?.first_name} {user?.last_name}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
              {user?.role} · @{user?.username}
            </div>
          </div>
        </div>

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
            <label>Email</label>
            <input className="form-control" type="email" value={form.email} onChange={set('email')} />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input className="form-control" value={form.phone} onChange={set('phone')} />
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save changes'}
            </button>
            {saved && <span style={{ color: 'var(--success)', fontSize: 13 }}>Saved successfully!</span>}
          </div>
        </form>
      </div>
    </div>
  );
}
