import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ticketAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function TicketDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const chatEnd = useRef(null);

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

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    try {
      await ticketAPI.reply(id, { body: message });
      setMessage('');
      fetchTicket();
    } catch {}
    setSending(false);
  };

  const updateStatus = async (status) => {
    try {
      await ticketAPI.update(id, { status });
      fetchTicket();
    } catch {}
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this ticket permanently?')) return;
    try {
      await ticketAPI.delete(id);
      navigate('/app/tickets');
    } catch { alert('Failed to delete'); }
  };

  if (!ticket) return <div style={{ padding: 20, color: 'var(--text-muted)' }}>Loading...</div>;

  return (
    <div>
      <Link to="/app/tickets" className="back-link">← Back to tickets</Link>

      <div className="flex-between" style={{ marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22 }}>{ticket.title}</h1>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <span className={`badge badge-${ticket.status}`}>{ticket.status.replace('_', ' ')}</span>
            {isAdmin && ticket.priority && (
              <span className={`badge badge-${ticket.priority}`}>{ticket.priority}</span>
            )}
          </div>
        </div>
        {isAdmin && (
          <div style={{ display: 'flex', gap: 8 }}>
            {ticket.status !== 'in_progress' && (
              <button className="btn btn-secondary btn-sm" onClick={() => updateStatus('in_progress')}>
                Mark In Progress
              </button>
            )}
            {ticket.status !== 'resolved' && (
              <button className="btn btn-primary btn-sm" onClick={() => updateStatus('resolved')}>
                Resolve
              </button>
            )}
            {ticket.status !== 'closed' && (
              <button className="btn btn-secondary btn-sm" onClick={() => updateStatus('closed')}>
                Close
              </button>
            )}
            <button className="btn btn-danger btn-sm" onClick={handleDelete}>
              Delete
            </button>
          </div>
        )}
      </div>

      <div className="card mb-4">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, fontSize: 14 }}>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Created by</span>
            <div style={{ marginTop: 4 }}>{ticket.created_by?.username}</div>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Assigned to</span>
            <div style={{ marginTop: 4 }}>{ticket.assigned_to?.username || 'Unassigned'}</div>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Created</span>
            <div style={{ marginTop: 4 }}>{new Date(ticket.created_at).toLocaleString()}</div>
          </div>
        </div>
        <div style={{ marginTop: 16, color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.8 }}>
          {ticket.description}
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 15, marginBottom: 12 }}>Conversation</h3>
        <div className="chat-container">
          {ticket.messages?.length === 0 ? (
            <div className="empty-state" style={{ padding: 24 }}>
              <p>No messages yet.</p>
            </div>
          ) : (
            ticket.messages?.map((m) => (
              <div key={m.id} className={`chat-message ${m.sender?.id === user?.id ? 'own' : 'other'}`}>
                <div>{m.body}</div>
                <div className="meta">
                  {m.is_ai && '🤖 '}
                  {m.sender?.username} · {new Date(m.created_at).toLocaleTimeString()}
                </div>
              </div>
            ))
          )}
          <div ref={chatEnd} />
        </div>

        {ticket.status !== 'closed' && (
          <form className="chat-input" onSubmit={sendMessage}>
            <input
              className="form-control"
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button className="btn btn-primary" disabled={sending || !message.trim()}>
              Send
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
