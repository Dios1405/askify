import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { aiAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ChatWidget() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: 'bot', text: "Hi! I'm the Askify assistant. Describe your issue and I'll help you find a solution or create a ticket." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [similarTickets, setSimilarTickets] = useState([]);
  const chatEnd = useRef(null);

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { from: 'user', text: userMsg }]);
    setLoading(true);

    try {
      // First try KB suggest
      const suggestRes = await aiAPI.suggest(userMsg);
      const suggestData = suggestRes.data;

      if (suggestData.articles && suggestData.articles.length > 0) {
        setMessages(prev => [...prev, {
          from: 'bot',
          text: 'I found some helpful articles from our Knowledge Base:',
          articles: suggestData.articles,
        }]);
      }

      // Then search similar tickets
      const chatRes = await aiAPI.chat(userMsg);
      const chatData = chatRes.data;

      setSimilarTickets(chatData.similar_tickets || []);
      setMessages(prev => [...prev, {
        from: 'bot',
        text: chatData.response,
        tickets: chatData.similar_tickets || [],
        showCreate: true,
      }]);
    } catch {
      setMessages(prev => [...prev, {
        from: 'bot',
        text: "Sorry, I'm having trouble right now. You can browse existing tickets or create a new one.",
        showCreate: true,
      }]);
    }
    setLoading(false);
  };

  const handleCreateTicket = () => {
    if (!user) {
      setMessages(prev => [...prev, {
        from: 'bot',
        text: 'You need to sign in first to create a ticket.',
      }]);
      return;
    }
    navigate('/app/tickets');
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        className="chat-fab"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-widget">
          <div className="chat-widget-header">
            <div>
              <strong>Askify Assistant</strong>
              <span style={{ fontSize: 11, opacity: 0.7, display: 'block' }}>
                AI-powered support
              </span>
            </div>
            <button className="chat-widget-close" onClick={() => setIsOpen(false)}>✕</button>
          </div>

          <div className="chat-widget-body">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-widget-msg ${msg.from}`}>
                <div className="chat-widget-msg-text">{msg.text}</div>

                {/* KB Articles */}
                {msg.articles && msg.articles.map(a => (
                  <div
                    key={a.id}
                    className="chat-widget-link"
                    onClick={() => { navigate(`/kb/${a.id}`); setIsOpen(false); }}
                  >
                    📄 {a.title}
                    <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>{a.snippet}</div>
                  </div>
                ))}

                {/* Similar Tickets */}
                {msg.tickets && msg.tickets.map(t => (
                  <div
                    key={t.id}
                    className="chat-widget-link"
                    onClick={() => { navigate(`/ticket/${t.id}`); setIsOpen(false); }}
                  >
                    🎫 {t.title}
                    <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>
                      {t.reply_count} replies · {t.total_votes} votes
                    </div>
                  </div>
                ))}

                {/* Create ticket button */}
                {msg.showCreate && (
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ marginTop: 8 }}
                    onClick={handleCreateTicket}
                  >
                    + Create new ticket
                  </button>
                )}
              </div>
            ))}
            {loading && (
              <div className="chat-widget-msg bot">
                <div className="chat-widget-msg-text" style={{ opacity: 0.6 }}>
                  Searching...
                </div>
              </div>
            )}
            <div ref={chatEnd} />
          </div>

          <form className="chat-widget-input" onSubmit={sendMessage}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe your issue..."
              disabled={loading}
            />
            <button type="submit" disabled={loading || !input.trim()}>→</button>
          </form>
        </div>
      )}
    </>
  );
}
