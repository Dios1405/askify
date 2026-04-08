import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { kbAPI } from '../services/api';

export default function ArticleDetailPage() {
  const { id } = useParams();
  const [article, setArticle] = useState(null);

  useEffect(() => {
    kbAPI.article(id).then(r => setArticle(r.data)).catch(() => {});
  }, [id]);

  if (!article) return <div style={{ padding: 20, color: 'var(--text-muted)' }}>Loading...</div>;

  return (
    <div>
      <Link to="/knowledge-base" className="back-link">← Back to Knowledge Base</Link>

      <div className="card" style={{ maxWidth: 760 }}>
        <h1 style={{ fontSize: 22, marginBottom: 8 }}>{article.title}</h1>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
          {article.category_name && <span>{article.category_name}</span>}
          {article.author_name && <span> · By {article.author_name}</span>}
          <span> · Updated {new Date(article.updated_at).toLocaleDateString()}</span>
        </div>
        <div className="article-content">
          {article.content.split('\n').map((p, i) => (
            <p key={i} style={{ marginBottom: 12 }}>{p}</p>
          ))}
        </div>
        {article.tags && (
          <div style={{ marginTop: 24, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {article.tags.split(',').map((tag, i) => (
              <span key={i} className="badge badge-medium" style={{ fontSize: 11 }}>
                {tag.trim()}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
