import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ForumPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const { data } = await ticketAPI.list(params);
      setTickets(data.results || []);
    } catch {}
    setLoading(false);
  }, [search, statusFilter]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div>
      <div className="forum-hero">
        <h1>Askify Community</h1>
        <p>Ask questions, share solutions, help each other</p>
      </div>

      {/* Search and filters */}
      <div className="forum-controls">
        <input
          type="search"
          className="form-control forum-search"
          placeholder="Search issues..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="forum-filters">
          <select
            className="form-control"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          {user && (
            <button
              className="btn btn-primary"
              onClick={() => navigate('/app/tickets')}
            >
              + New Ticket
            </button>
          )}
        </div>
      </div>

      {/* Stats bar */}
      <div className="forum-stats">
        <span>{tickets.length} discussions</span>
      </div>

      {/* Ticket list */}
      {loading ? (
        <div className="empty-state"><p>Loading...</p></div>
      ) : tickets.length === 0 ? (
        <div className="empty-state">
          <h3>No discussions found</h3>
          <p>{search ? 'Try different keywords' : 'Be the first to start a discussion'}</p>
        </div>
      ) : (
        <div className="forum-list">
          {tickets.map(t => (
            <div
              key={t.id}
              className="forum-card"
              onClick={() => navigate(`/ticket/${t.id}`)}
            >
              <div className="forum-card-votes">
                <span className="forum-votes-count">{t.total_votes || 0}</span>
                <span className="forum-votes-label">votes</span>
              </div>
              <div className="forum-card-replies">
                <span className="forum-replies-count">{t.reply_count || 0}</span>
                <span className="forum-replies-label">replies</span>
              </div>
              <div className="forum-card-content">
                <h3 className="forum-card-title">{t.title}</h3>
                <div className="forum-card-meta">
                  <span className={`badge badge-${t.status}`}>{t.status.replace('_', ' ')}</span>
                  {t.priority && user?.role === 'admin' && (
                    <span className={`badge badge-${t.priority}`}>{t.priority}</span>
                  )}
                  <span>asked by {t.created_by?.username || 'unknown'}</span>
                  <span>{timeAgo(t.created_at)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
