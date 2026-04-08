import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem('refresh_token');
      if (refresh) {
        try {
          const { data } = await axios.post(`${API_BASE}/accounts/token/refresh/`, { refresh });
          localStorage.setItem('access_token', data.access);
          if (data.refresh) localStorage.setItem('refresh_token', data.refresh);
          original.headers.Authorization = `Bearer ${data.access}`;
          return api(original);
        } catch {
          localStorage.clear();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  login: (data) => api.post('/accounts/login/', data),
  register: (data) => api.post('/accounts/register/', data),
  profile: () => api.get('/accounts/profile/'),
  updateProfile: (data) => api.patch('/accounts/profile/', data),
  listUsers: (params) => api.get('/accounts/users/', { params }),
};

// Tickets — public
export const ticketAPI = {
  list: (params) => api.get('/tickets/', { params }),
  get: (id) => api.get(`/tickets/${id}/`),
  create: (data) => api.post('/tickets/create/', data),
  update: (id, data) => api.patch(`/tickets/${id}/manage/`, data),
  delete: (id) => api.delete(`/tickets/${id}/manage/`),
  messages: (ticketId) => api.get(`/tickets/${ticketId}/messages/`),
  reply: (ticketId, data) => api.post(`/tickets/${ticketId}/reply/`, data),
  vote: (messageId) => api.post(`/tickets/messages/${messageId}/vote/`),
};

// AI
export const aiAPI = {
  chat: (message) => api.post('/tickets/ai/chat/', { message }),
  suggest: (message) => api.post('/tickets/ai/suggest/', { message }),
};

// Knowledge Base
export const kbAPI = {
  categories: (params) => api.get('/kb/categories/', { params }),
  articles: (params) => api.get('/kb/articles/', { params }),
  article: (id) => api.get(`/kb/articles/${id}/`),
  createArticle: (data) => api.post('/kb/articles/', data),
  createCategory: (data) => api.post('/kb/categories/', data),
};

// Analytics
export const analyticsAPI = {
  dashboard: () => api.get('/analytics/dashboard/'),
  trends: (params) => api.get('/analytics/ticket-trends/', { params }),
  statusBreakdown: () => api.get('/analytics/status-breakdown/'),
  priorityBreakdown: () => api.get('/analytics/priority-breakdown/'),
  resolutionTime: (params) => api.get('/analytics/resolution-time/', { params }),
};

export default api;
