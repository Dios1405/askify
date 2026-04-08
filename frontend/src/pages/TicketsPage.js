import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

function CreateTicketModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ title: '', description: '' });
  const [loading, setLoading] = useState(false);
  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await ticketAPI.create(form);
      onCreate();
    } catch {
      alert('Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>New Ticket</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
          Priority will be automatically assigned by AI based on your description.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title</label>
            <input className="form-control" value={form.title} onChange={set('title')} required placeholder="Brief summary of your issue" />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea className="form-control" rows={5} value={form.description} onChange={set('description')} required placeholder="Describe the issue in detail..." />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TicketsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [tickets, setTickets] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [filters, setFilters] = useState({ status: '', priority: '', search: '' });

  const fetchTickets = useCallback(async () => {
    const params = {};
    if (filters.status) params.status = filters.status;
    if (filters.search) params.search = filters.search;
    try {
      const { data } = await ticketAPI.list(params);
      setTickets(data.results || []);
    } catch {}
  }, [filters]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const setFilter = (f) => (e) => setFilters({ ...filters, [f]: e.target.value });

  return (
    <div>
      <div className="page-header page-header-actions">
        <div>
          <h1>Tickets</h1>
          <p>Manage support requests</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          + New Ticket
        </button>
      </div>

      <div className="filters-row">
        <input
          type="search"
          className="form-control"
          placeholder="Search tickets..."
          value={filters.search}
          onChange={setFilter('search')}
        />
        <select className="form-control" value={filters.status} onChange={setFilter('status')}>
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      <div className="card">
        {tickets.length === 0 ? (
          <div className="empty-state">
            <h3>No tickets found</h3>
            <p>Try adjusting your filters or create a new ticket</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Title</th>
                  <th>Status</th>
                  {isAdmin && <th>Priority</th>}
                  <th>Created by</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id} className="clickable" onClick={() => navigate(`/app/tickets/${t.id}`)}>
                    <td style={{ fontFamily: 'var(--mono)', color: 'var(--text-muted)', fontSize: 13 }}>{t.id}</td>
                    <td style={{ fontWeight: 500 }}>{t.title}</td>
                    <td><span className={`badge badge-${t.status}`}>{t.status.replace('_', ' ')}</span></td>
                    {isAdmin && <td><span className={`badge badge-${t.priority}`}>{t.priority}</span></td>}
                    <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t.created_by?.username || '—'}</td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreate && (
        <CreateTicketModal
          onClose={() => setShowCreate(false)}
          onCreate={() => { setShowCreate(false); fetchTickets(); }}
        />
      )}
    </div>
  );
}
