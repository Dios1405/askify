# Chat-Based Helpdesk System

A full-stack helpdesk application built with **Django** + **Django REST Framework** (backend) and **React** (frontend).

---

## Architecture

```
helpdesk_project/       Django project settings & root URLs
accounts/               User management, JWT auth, profiles
tickets/                Ticket CRUD, status workflow, chat messages
knowledge_base/         FAQ articles, categories, search
analytics/              Dashboard stats, trends, resolution metrics
frontend/               React SPA (separate dev server)
```

## Features

### A. User Management
- Custom User model with role field (`admin`, `user` — extensible for `agent`, `chatbot`)
- JWT authentication (login, register, token refresh)
- Profile management
- Admin: list/edit/deactivate users

### B. Ticket Management
- Create, update, assign tickets
- Status workflow: Open → In Progress → Resolved → Closed
- Priority levels: Low, Medium, High, Urgent
- Chat thread per ticket (Message model)
- Admin sees all tickets; users see their own
- Auto-tracks `resolved_at` timestamp

### C. Knowledge Base
- Articles with categories and tags
- Full-text search across title, content, tags
- Category filtering
- Admin-only create/edit; all users can read published articles

### D. Analytics & Visualization
- Dashboard summary (ticket counts by status, urgent count)
- Ticket creation trends (daily/weekly/monthly)
- Status & priority breakdowns
- Average resolution time (overall + per-priority)
- Admin-only access

---

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+ & npm

### 1. Backend Setup

```bash
# Clone and enter project
cd helpdesk-project

# Create virtual environment
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Seed sample data (creates admin user: admin/admin123)
python manage.py seed_data

# Start the server
python manage.py runserver
```

The API will be available at `http://localhost:8000/api/`.

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm start
```

The React app will open at `http://localhost:3000`.

### 3. Login

Use the seeded admin account:
- **Username:** `admin`
- **Password:** `admin123`

Or register a new user account through the UI.

---

## API Endpoints

### Auth & Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/accounts/register/` | Register new user |
| POST | `/api/accounts/login/` | Get JWT tokens |
| POST | `/api/accounts/token/refresh/` | Refresh access token |
| GET/PATCH | `/api/accounts/profile/` | View/update own profile |
| GET | `/api/accounts/users/` | List users (admin) |
| GET/PATCH/DELETE | `/api/accounts/users/:id/` | Manage user (admin) |

### Tickets
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tickets/` | List tickets (filterable) |
| POST | `/api/tickets/` | Create ticket |
| GET/PATCH/DELETE | `/api/tickets/:id/` | Ticket detail/update/delete |
| GET | `/api/tickets/:id/messages/` | List messages |
| POST | `/api/tickets/:id/messages/` | Send message |

**Filters:** `?status=open&priority=high&search=login&ordering=-created_at`

### Knowledge Base
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/kb/categories/` | List/create categories |
| GET/POST | `/api/kb/articles/` | List/create articles |
| GET/PATCH/DELETE | `/api/kb/articles/:id/` | Article detail |

**Filters:** `?search=password&category=1`

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/dashboard/` | Summary stats |
| GET | `/api/analytics/ticket-trends/` | Creation trends |
| GET | `/api/analytics/status-breakdown/` | Count by status |
| GET | `/api/analytics/priority-breakdown/` | Count by priority |
| GET | `/api/analytics/resolution-time/` | Avg resolution time |

**Params:** `?period=daily&days=30`

---

## Production Notes

### Switch to PostgreSQL
Set these environment variables:
```
DB_ENGINE=django.db.backends.postgresql
DB_NAME=helpdesk
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_HOST=localhost
DB_PORT=5432
```

### Environment Variables
| Variable | Default | Description |
|----------|---------|-------------|
| `DJANGO_SECRET_KEY` | dev key | Change in production! |
| `DJANGO_DEBUG` | `True` | Set `False` in production |
| `DB_ENGINE` | sqlite3 | Database engine |
| `REACT_APP_API_URL` | `http://localhost:8000/api` | Backend URL for frontend |

---

## Future: Chatbot/Agent Support

The codebase is designed for easy extension:
- **User.role** field accepts new choices — uncomment `AGENT` and `CHATBOT` in `accounts/models.py`
- **Ticket.assigned_to** can be a bot user
- **Message.sender** can be a bot — add a `message_type` field to distinguish
- **Analytics** endpoints accept filters — add `?assigned_to_role=chatbot` for agent performance
