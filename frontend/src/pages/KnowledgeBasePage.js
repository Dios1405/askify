import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { kbAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

function CreateArticleModal({ categories, onClose, onCreate }) {
  const [form, setForm] = useState({ title: '', content: '', category: '', tags: '', is_published: true });
  const [loading, setLoading] = useState(false);
  const set = (f) => (e) => setForm({ ...form, [f]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form };
      if (!payload.category) delete payload.category;
      await kbAPI.createArticle(payload);
      onCreate();
    } catch {
      alert('Failed to create article');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>New Article</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title</label>
            <input className="form-control" value={form.title} onChange={set('title')} required />
          </div>
          <div className="form-group">
            <label>Category</label>
            <select className="form-control" value={form.category} onChange={set('category')}>
              <option value="">None</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Content</label>
            <textarea className="form-control" rows={6} value={form.content} onChange={set('content')} required />
          </div>
          <div className="form-group">
            <label>Tags (comma-separated)</label>
            <input className="form-control" value={form.tags} onChange={set('tags')} placeholder="e.g. login, password, security" />
          </div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" id="published" checked={form.is_published} onChange={set('is_published')} />
            <label htmlFor="published" style={{ margin: 0 }}>Publish immediately</label>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Article'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CreateCategoryModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);
  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await kbAPI.createCategory(form);
      onCreate();
    } catch {
      alert('Failed to create category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>New Category</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input className="form-control" value={form.name} onChange={set('name')} required />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea className="form-control" rows={3} value={form.description} onChange={set('description')} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function KnowledgeBasePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ search: '', category: '' });
  const [showCreateArticle, setShowCreateArticle] = useState(false);
  const [showCreateCategory, setShowCreateCategory] = useState(false);

  const fetchCategories = useCallback(() => {
    kbAPI.categories().then(r => setCategories(r.data.results || r.data || [])).catch(() => {});
  }, []);

  const fetchArticles = useCallback(() => {
    const params = {};
    if (filters.search) params.search = filters.search;
    if (filters.category) params.category = filters.category;
    kbAPI.articles(params).then(r => setArticles(r.data.results || [])).catch(() => {});
  }, [filters]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);
  useEffect(() => { fetchArticles(); }, [fetchArticles]);

  return (
    <div>
      <div className="page-header page-header-actions">
        <div>
          <h1>Knowledge Base</h1>
          <p>Find answers to common questions</p>
        </div>
        {isAdmin && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary" onClick={() => setShowCreateCategory(true)}>
              + Category
            </button>
            <button className="btn btn-primary" onClick={() => setShowCreateArticle(true)}>
              + New Article
            </button>
          </div>
        )}
      </div>

      <div className="filters-row">
        <input
          type="search"
          className="form-control"
          placeholder="Search articles..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
        <select
          className="form-control"
          value={filters.category}
          onChange={(e) => setFilters({ ...filters, category: e.target.value })}
        >
          <option value="">All categories</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {articles.length === 0 ? (
        <div className="empty-state">
          <h3>No articles found</h3>
          <p>Try a different search term or category</p>
        </div>
      ) : (
        articles.map(a => (
          <div
            key={a.id}
            className="article-card"
            onClick={() => navigate(`/knowledge-base/${a.id}`)}
          >
            <h3>{a.title}</h3>
            <div className="meta">
              {a.category_name && <span>{a.category_name}</span>}
              {a.category_name && a.tags && <span> · </span>}
              {a.tags && <span>{a.tags}</span>}
              <span> · Updated {new Date(a.updated_at).toLocaleDateString()}</span>
            </div>
          </div>
        ))
      )}

      {showCreateArticle && (
        <CreateArticleModal
          categories={categories}
          onClose={() => setShowCreateArticle(false)}
          onCreate={() => { setShowCreateArticle(false); fetchArticles(); }}
        />
      )}

      {showCreateCategory && (
        <CreateCategoryModal
          onClose={() => setShowCreateCategory(false)}
          onCreate={() => { setShowCreateCategory(false); fetchCategories(); }}
        />
      )}
    </div>
  );
}
