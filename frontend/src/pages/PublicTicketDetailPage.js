import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ticketAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function PublicTicketDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const replyRef = useRef(null);

  const isAdmin = user?.role === 'admin';

  const fetchTicket = async () => {
    try {
      const { data } = await ticketAPI.get(id);
      setTicket(data);
    } catch {}
  };

  useEffect(() => {
    fetchTicket();
    // eslint-disable-next-line
  }, [id]);

  const handleReply = async (e) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    try {
      await ticketAPI.reply(id, { body: reply });
      setReply('');
      fetchTicket();
    } catch {}
    setSending(false);
  };

  const handleVote = async (messageId) => {
    if (!user) return;
    try {
      await ticketAPI.vote(messageId);
      fetchTicket();
    } catch {}
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this ticket? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await ticketAPI.delete(id);
      navigate('/');
    } catch {
      alert('Failed to delete ticket');
    }
    setDeleting(false);
  };

  const handleStatusChange = async (status) => {
    try {
      await ticketAPI.update(id, { status });
      fetchTicket();
    } catch {}
  };

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

  if (!ticket) return <div style={{ padding: 40, color: 'var(--text-muted)' }}>Loading...</div>;

  // Sort messages: highest votes first
  const sortedMessages = [...(ticket.messages || [])].sort(
    (a, b) => (b.upvote_count || 0) - (a.upvote_count || 0)
  );

  return (
    <div className="public-ticket-detail">
      <Link to="/" className="back-link">← Back to Community</Link>

      {/* Ticket header */}
      <div className="ticket-header-card">
        <div className="flex-between">
          <div>
            <h1 className="ticket-title">{ticket.title}</h1>
            <div className="ticket-meta">
              <span className={`badge badge-${ticket.status}`}>{ticket.status.replace('_', ' ')}</span>
              {isAdmin && ticket.priority && (
                <span className={`badge badge-${ticket.priority}`}>{ticket.priority}</span>
              )}
              <span>Asked by <strong>{ticket.created_by?.username}</strong></span>
              <span>{timeAgo(ticket.created_at)}</span>
            </div>
          </div>
          {isAdmin && (
            <div style={{ display: 'flex', gap: 8 }}>
              {ticket.status !== 'resolved' && (
                <button className="btn btn-primary btn-sm" onClick={() => handleStatusChange('resolved')}>
                  Resolve
                </button>
              )}
              {ticket.status !== 'closed' && (
                <button className="btn btn-secondary btn-sm" onClick={() => handleStatusChange('closed')}>
                  Close
                </button>
              )}
              <button
                className="btn btn-danger btn-sm"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          )}
        </div>

        <div className="ticket-description">{ticket.description}</div>
      </div>

      {/* Replies section */}
      <div className="replies-section">
        <h3 className="replies-header">
          {sortedMessages.length} {sortedMessages.length === 1 ? 'Reply' : 'Replies'}
        </h3>

        {sortedMessages.length === 0 ? (
          <div className="empty-state" style={{ padding: 32 }}>
            <p>No replies yet. Be the first to help!</p>
          </div>
        ) : (
          sortedMessages.map(msg => (
            <div key={msg.id} className="reply-card">
              <div className="reply-vote">
                <button
                  className={`vote-btn ${msg.user_has_voted ? 'voted' : ''}`}
                  onClick={() => handleVote(msg.id)}
                  disabled={!user}
                  title={user ? 'Toggle upvote' : 'Sign in to vote'}
                >
                  ▲
                </button>
                <span className="vote-count">{msg.upvote_count || 0}</span>
              </div>
              <div className="reply-content">
                <div className="reply-body">{msg.body}</div>
                <div className="reply-meta">
                  {msg.is_ai && <span className="badge" style={{ background: 'var(--accent-muted)', color: 'var(--accent)', marginRight: 6 }}>AI</span>}
                  <span>{msg.sender?.username}</span>
                  <span> · {timeAgo(msg.created_at)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Reply form */}
      {user ? (
        <div className="reply-form-card">
          <h3 style={{ fontSize: 15, marginBottom: 12 }}>Your Answer</h3>
          <form onSubmit={handleReply}>
            <textarea
              ref={replyRef}
              className="form-control"
              rows={4}
              placeholder="Share your solution or help..."
              value={reply}
              onChange={(e) => setReply(e.target.value)}
            />
            <button
              className="btn btn-primary"
              style={{ marginTop: 10 }}
              disabled={sending || !reply.trim()}
            >
              {sending ? 'Posting...' : 'Post Reply'}
            </button>
          </form>
        </div>
      ) : (
        <div className="reply-form-card" style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>
            <Link to="/login" style={{ color: 'var(--accent)' }}>Sign in</Link> to post a reply
          </p>
        </div>
      )}
    </div>
  );
}
