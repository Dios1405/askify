import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const PRIORITIES = [
  { key: 'urgent', label: 'Urgent', color: '#e17055', icon: '🔴' },
  { key: 'high', label: 'High', color: '#fdcb6e', icon: '🟡' },
  { key: 'medium', label: 'Medium', color: '#6c5ce7', icon: '🟣' },
  { key: 'low', label: 'Low', color: '#00cec9', icon: '🟢' },
];

const STATUS_COLORS = {
  open: '#6c5ce7',
  in_progress: '#fdcb6e',
  resolved: '#00cec9',
  closed: '#636882',
};

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  const [allTickets, setAllTickets] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [filterType, setFilterType] = useState(null); // 'priority' or 'status'

  useEffect(() => {
    ticketAPI.list({ page_size: 100 }).then(r => {
      setAllTickets(r.data.results || []);
    }).catch(() => {});
  }, []);

  // Group by priority (admin only)
  const groupedByPriority = useMemo(() => {
    const groups = {};
    PRIORITIES.forEach(p => { groups[p.key] = []; });
    allTickets.forEach(t => {
      if (t.priority && groups[t.priority]) groups[t.priority].push(t);
    });
    return groups;
  }, [allTickets]);

  // Group by status
  const groupedByStatus = useMemo(() => {
    const groups = { open: [], in_progress: [], resolved: [], closed: [] };
    allTickets.forEach(t => {
      if (groups[t.status]) groups[t.status].push(t);
    });
    return groups;
  }, [allTickets]);

  // Filter tickets
  const filteredTickets = useMemo(() => {
    let tickets = allTickets;
    if (filterType === 'priority' && selectedFilter) {
      tickets = groupedByPriority[selectedFilter] || [];
    } else if (filterType === 'status' && selectedFilter) {
      tickets = groupedByStatus[selectedFilter] || [];
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      tickets = tickets.filter(t =>
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q))
      );
    }
    return tickets;
  }, [allTickets, groupedByPriority, groupedByStatus, selectedFilter, filterType, search]);

  const handleCardClick = (key, type) => {
    if (selectedFilter === key && filterType === type) {
      setSelectedFilter(null);
      setFilterType(null);
    } else {
      setSelectedFilter(key);
      setFilterType(type);
    }
    setSearch('');
  };

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Welcome back, {user?.first_name || user?.username} · {allTickets.length} total tickets</p>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 20 }}>
        <input
          type="search"
          className="form-control"
          placeholder={
            selectedFilter
              ? `Search in ${selectedFilter.replace('_', ' ')} tickets...`
              : 'Search all tickets...'
          }
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: '100%', fontSize: 15, padding: '12px 16px' }}
        />
      </div>

      {/* Priority Cards — admin only */}
      {isAdmin && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 16 }}>
          {PRIORITIES.map(p => {
            const count = groupedByPriority[p.key]?.length || 0;
            const isSelected = selectedFilter === p.key && filterType === 'priority';
            return (
              <div
                key={p.key}
                onClick={() => handleCardClick(p.key, 'priority')}
                style={{
                  background: 'var(--bg-card)',
                  border: isSelected ? `2px solid ${p.color}` : '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '18px 22px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                  boxShadow: isSelected ? `0 4px 20px ${p.color}30` : 'none',
                }}
              >
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
                  {p.icon} {p.label}
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--mono)', color: p.color }}>
                  {count}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Status Cards — visible to all */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {Object.entries(groupedByStatus).map(([key, tickets]) => {
          const isSelected = selectedFilter === key && filterType === 'status';
          const color = STATUS_COLORS[key] || 'var(--text-muted)';
          return (
            <div
              key={key}
              onClick={() => handleCardClick(key, 'status')}
              style={{
                background: 'var(--bg-card)',
                border: isSelected ? `2px solid ${color}` : '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '18px 22px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                boxShadow: isSelected ? `0 4px 20px ${color}30` : 'none',
              }}
            >
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
                {key.replace('_', ' ')}
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--mono)', color }}>
                {tickets.length}
              </div>
            </div>
          );
        })}
      </div>

      {/* Ticket List */}
      <div className="card">
        <div className="flex-between mb-4">
          <h3 style={{ fontSize: 15 }}>
            {selectedFilter
              ? `${selectedFilter.charAt(0).toUpperCase() + selectedFilter.slice(1).replace('_', ' ')} Tickets`
              : 'All Tickets'
            }
            <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8 }}>
              ({filteredTickets.length})
            </span>
          </h3>
          {selectedFilter && (
            <button className="btn btn-secondary btn-sm" onClick={() => { setSelectedFilter(null); setFilterType(null); setSearch(''); }}>
              Show all
            </button>
          )}
        </div>

        {filteredTickets.length === 0 ? (
          <div className="empty-state">
            <h3>No tickets found</h3>
            <p>{search ? 'Try different keywords' : 'No tickets in this category'}</p>
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
                {filteredTickets.map(t => (
                  <tr key={t.id} className="clickable" onClick={() => navigate(`/app/tickets/${t.id}`)}>
                    <td style={{ fontFamily: 'var(--mono)', color: 'var(--text-muted)', fontSize: 13 }}>{t.id}</td>
                    <td style={{ fontWeight: 500 }}>{t.title}</td>
                    <td><span className={`badge badge-${t.status}`}>{t.status.replace('_', ' ')}</span></td>
                    {isAdmin && <td><span className={`badge badge-${t.priority}`}>{t.priority}</span></td>}
                    <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t.created_by?.username || '—'}</td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{new Date(t.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
