# Chat-Based Helpdesk System — Complete Setup & Usage Guide

---

## PART 1: PREREQUISITES

Before starting, make sure you have these installed on your machine:

- **Python 3.10 or higher** — check with: `python --version`
- **Node.js 18+ and npm** — check with: `node --version` and `npm --version`
- **Git** (optional, for version control)

For production, you'll also want PostgreSQL, but SQLite works fine for development.

---

## PART 2: PROJECT SETUP

### Step 1 — Download and Extract

Download the `helpdesk-project.zip` file and extract it. You'll see this structure:

```
helpdesk-project/
├── manage.py                  ← Django entry point
├── requirements.txt           ← Python dependencies
├── README.md
├── helpdesk_project/          ← Django project config
│   ├── settings.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
├── accounts/                  ← User & auth app
├── tickets/                   ← Ticket management app
├── knowledge_base/            ← FAQ articles app
├── analytics/                 ← Dashboard & charts app
└── frontend/                  ← React app
    ├── package.json
    ├── public/
    └── src/
```

### Step 2 — Backend Setup

Open a terminal and navigate to the project root:

```bash
cd helpdesk-project
```

Create and activate a virtual environment (recommended):

```bash
python -m venv venv

# On macOS/Linux:
source venv/bin/activate

# On Windows:
venv\Scripts\activate
```

Install Python dependencies:

```bash
pip install -r requirements.txt
```

This installs Django, Django REST Framework, JWT auth, CORS headers, and filters.

### Step 3 — Database Setup

Run migrations to create all the database tables:

```bash
python manage.py migrate
```

This creates an SQLite database file (`db.sqlite3`) with tables for users, tickets, messages, articles, and categories.

### Step 4 — Load Sample Data

Run the seed command to populate the database with test data:

```bash
python manage.py seed_data
```

This creates:
- 1 admin user (`admin` / `admin123`)
- 5 regular users (`user1` through `user5`, password: `pass1234`)
- 4 knowledge base categories
- 6 knowledge base articles
- 15 sample tickets with chat messages

### Step 5 — Start the Backend Server

```bash
python manage.py runserver
```

The API is now running at `http://localhost:8000`. You can verify by opening `http://localhost:8000/admin/` in your browser and logging in with `admin` / `admin123`.

### Step 6 — Frontend Setup

Open a **second terminal** (keep the backend running), navigate to the frontend folder:

```bash
cd helpdesk-project/frontend
npm install
```

This installs React, React Router, Axios, Recharts, and other JS dependencies.

### Step 7 — Start the Frontend

```bash
npm start
```

The React app opens at `http://localhost:3000`. Both servers need to be running simultaneously — the backend on port 8000 and the frontend on port 3000.

---

## PART 3: HOW THE APPLICATION WORKS

### 3.1 — Authentication System

The app uses JWT (JSON Web Tokens) for authentication. Here's the flow:

**Registration:**
1. Go to `http://localhost:3000/register`
2. Fill in: first name, last name, username, email, password, confirm password
3. Click "Create account"
4. You're redirected to the login page
5. New users are created with the role `user` by default

**Login:**
1. Go to `http://localhost:3000/login`
2. Enter username and password
3. Click "Sign in"
4. The server returns two tokens:
   - **Access token** (expires in 30 minutes) — used for API requests
   - **Refresh token** (expires in 7 days) — used to get a new access token
5. Tokens are stored in localStorage
6. You're redirected to the Dashboard

**Auto-refresh:**
When the access token expires, the app automatically uses the refresh token to get a new one. If the refresh token also expires, you're logged out and sent back to the login page.

**Logout:**
Click "Sign out" at the bottom of the sidebar. This clears your tokens.

### 3.2 — User Roles

There are two active roles:

**User (default):**
- Can create tickets
- Can only see their own tickets
- Can send messages on their tickets
- Can read published knowledge base articles
- Can edit their own profile
- Cannot access Analytics or manage other users

**Admin:**
- Can see ALL tickets from all users
- Can assign tickets to themselves (or others)
- Can change ticket status (Open → In Progress → Resolved → Closed)
- Can create/edit/delete knowledge base articles and categories
- Can access the Analytics page with charts and metrics
- Can manage users (list, edit roles, deactivate)

To make a user an admin, either:
- Use Django admin panel at `http://localhost:8000/admin/`
- Or directly via the API: `PATCH /api/accounts/users/{id}/` with `{"role": "admin"}`

### 3.3 — Dashboard

After logging in, you land on the Dashboard. It shows:

**Stat Cards (top row):**
- Total Tickets — all tickets you can see
- Open — tickets waiting for attention
- In Progress — tickets being worked on
- Resolved — tickets that have been answered
- Closed — tickets that are done
- Urgent — open/in-progress tickets with urgent priority

**Recent Tickets (table below):**
- Shows the 5 most recent tickets
- Click any row to go to the ticket detail page
- Click "View all" to go to the full tickets list

For admin users, these stats cover ALL tickets. For regular users, only their own.

### 3.4 — Ticket Management

**Viewing Tickets:**
1. Click "Tickets" in the sidebar
2. You see a table with all your tickets (or all tickets if admin)
3. Each row shows: ID, title, status badge, priority badge, created by, assigned to, date

**Filtering Tickets:**
- Use the search box to search by title or description
- Use the "Status" dropdown to filter: Open, In Progress, Resolved, Closed
- Use the "Priority" dropdown to filter: Low, Medium, High, Urgent
- Filters combine — e.g., show only "Open" + "Urgent" tickets

**Creating a Ticket:**
1. Click the "+ New Ticket" button (top right)
2. A modal appears with three fields:
   - **Title** — short summary of the issue
   - **Description** — detailed explanation
   - **Priority** — Low, Medium, High, or Urgent
3. Click "Create Ticket"
4. The ticket is created with status "Open" and no one assigned

**Viewing Ticket Details:**
1. Click any ticket row in the list
2. You see the full ticket detail page with:
   - Title, status badge, priority badge
   - Info grid: created by, assigned to, creation date
   - Full description
   - Conversation thread (chat)

**Chat / Conversation:**
- Each ticket has a chat thread at the bottom
- Type a message and click "Send"
- Your messages appear on the right (purple), others on the left (gray)
- Messages show the sender's username and timestamp
- If the ticket is closed, the chat input is hidden

**Managing Ticket Status (admin only):**
On the ticket detail page, admin sees buttons in the top right:
- **"Mark In Progress"** — when you start working on it
- **"Resolve"** — when the issue is fixed (auto-records the resolution timestamp)
- **"Close"** — when the ticket is fully done

The status workflow is: Open → In Progress → Resolved → Closed

**Assigning Tickets:**
Currently handled via the API: `PATCH /api/tickets/{id}/` with `{"assigned_to": user_id}`. You can also assign tickets through Django admin at `http://localhost:8000/admin/`.

### 3.5 — Knowledge Base

**Browsing Articles (all users):**
1. Click "Knowledge Base" in the sidebar
2. You see a list of all published articles as cards
3. Each card shows: title, category, tags, last updated date
4. Click a card to read the full article

**Searching:**
- Type in the search box to search across titles, content, and tags
- Use the category dropdown to filter by category
- Search and category filters combine

**Reading an Article:**
- Click any article card
- You see the full article with: title, category, author, last updated date, content, tags

**Creating an Article (admin only):**
1. As admin, you'll see two buttons on the Knowledge Base page:
   - **"+ Category"** — creates a new category
   - **"+ New Article"** — creates a new article
2. Click "+ New Article", a modal appears with:
   - **Title** — article title
   - **Category** — dropdown to pick a category (optional)
   - **Content** — the article body text
   - **Tags** — comma-separated keywords (e.g., "login, password, security")
   - **Publish immediately** — checkbox, checked by default
3. Click "Create Article" — it appears in the list immediately

**Creating a Category (admin only):**
1. Click "+ Category"
2. Enter a name (e.g., "Billing Questions") and optional description
3. Click "Create Category" — it appears in the category dropdown

### 3.6 — Analytics (Admin Only)

Click "Analytics" in the sidebar. This page is only visible to admin users.

**Summary Stats (top row):**
- Average Resolution Time — how long tickets take to resolve (in hours)
- Resolved (30d) — number of tickets resolved in the last 30 days
- Per-priority averages — resolution time broken down by Low, Medium, High, Urgent

**Charts:**

1. **Ticket Trends (line chart):**
   - Shows how many tickets were created each day over the last 30 days
   - Helps spot spikes in support volume

2. **By Status (pie chart):**
   - Shows current distribution: how many tickets are Open vs In Progress vs Resolved vs Closed
   - Helps understand backlog

3. **By Priority (bar chart):**
   - Shows how many tickets exist at each priority level
   - Helps identify if too many urgent tickets are piling up

### 3.7 — Profile

Click "Profile" in the sidebar.

- See your avatar (first letter of your name), full name, role, and username
- Edit: first name, last name, email, phone
- Click "Save changes" — a green "Saved successfully!" message confirms

---

## PART 4: API REFERENCE

The backend exposes a REST API at `http://localhost:8000/api/`. All endpoints except register and login require a JWT token in the header:

```
Authorization: Bearer <your_access_token>
```

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/accounts/register/ | No | Create new user |
| POST | /api/accounts/login/ | No | Get access + refresh tokens |
| POST | /api/accounts/token/refresh/ | No | Get new access token |

**Login request:**
```json
POST /api/accounts/login/
{ "username": "admin", "password": "admin123" }
```
**Response:**
```json
{ "access": "eyJ...", "refresh": "eyJ..." }
```

### Profile
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/accounts/profile/ | Yes | Get your profile |
| PATCH | /api/accounts/profile/ | Yes | Update your profile |

### Users (Admin only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/accounts/users/ | List all users |
| GET | /api/accounts/users/{id}/ | Get user detail |
| PATCH | /api/accounts/users/{id}/ | Update user (role, active) |
| DELETE | /api/accounts/users/{id}/ | Delete user |

### Tickets
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/tickets/ | List tickets |
| POST | /api/tickets/ | Create ticket |
| GET | /api/tickets/{id}/ | Ticket detail with messages |
| PATCH | /api/tickets/{id}/ | Update ticket |
| DELETE | /api/tickets/{id}/ | Delete ticket |
| GET | /api/tickets/{id}/messages/ | List messages |
| POST | /api/tickets/{id}/messages/ | Send message |

**Filters:** `?status=open&priority=high&search=login&ordering=-created_at`

**Create ticket:**
```json
POST /api/tickets/
{ "title": "Can't login", "description": "Getting 403 error", "priority": "high" }
```

**Send message:**
```json
POST /api/tickets/5/messages/
{ "body": "Have you tried clearing your cache?" }
```

### Knowledge Base
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/kb/categories/ | Yes | List categories |
| POST | /api/kb/categories/ | Admin | Create category |
| GET | /api/kb/articles/ | Yes | List articles |
| POST | /api/kb/articles/ | Admin | Create article |
| GET | /api/kb/articles/{id}/ | Yes | Article detail |
| PATCH | /api/kb/articles/{id}/ | Admin | Update article |
| DELETE | /api/kb/articles/{id}/ | Admin | Delete article |

**Filters:** `?search=password&category=1`

### Analytics (Admin only)
| Method | Endpoint | Params | Description |
|--------|----------|--------|-------------|
| GET | /api/analytics/dashboard/ | — | Summary stats |
| GET | /api/analytics/ticket-trends/ | period, days | Creation trends |
| GET | /api/analytics/status-breakdown/ | — | Count by status |
| GET | /api/analytics/priority-breakdown/ | — | Count by priority |
| GET | /api/analytics/resolution-time/ | days | Avg resolution time |

---

## PART 5: DJANGO ADMIN PANEL

Django comes with a built-in admin panel at `http://localhost:8000/admin/`.

Login with `admin` / `admin123`.

From here you can:
- View/edit/delete any user and change their role
- View/edit/delete any ticket and assign it
- View messages within tickets
- Manage knowledge base categories and articles
- See all data in a table-based interface

This is useful for quick data fixes or tasks not yet in the React frontend (like assigning tickets or bulk editing).

---

## PART 6: SWITCHING TO POSTGRESQL (Production)

By default the project uses SQLite. To switch to PostgreSQL:

1. Install PostgreSQL and create a database:
```sql
CREATE DATABASE helpdesk;
CREATE USER helpdesk_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE helpdesk TO helpdesk_user;
```

2. Set environment variables before running Django:
```bash
export DB_ENGINE=django.db.backends.postgresql
export DB_NAME=helpdesk
export DB_USER=helpdesk_user
export DB_PASSWORD=your_password
export DB_HOST=localhost
export DB_PORT=5432
export DJANGO_SECRET_KEY=your-random-secret-key-here
export DJANGO_DEBUG=False
```

3. Run migrations and seed again:
```bash
python manage.py migrate
python manage.py seed_data
```

---

## PART 7: ENVIRONMENT VARIABLES REFERENCE

| Variable | Default | Description |
|----------|---------|-------------|
| DJANGO_SECRET_KEY | dev key | **Change this in production!** Use a random 50+ character string |
| DJANGO_DEBUG | True | Set to False in production |
| DB_ENGINE | sqlite3 | `django.db.backends.postgresql` for Postgres |
| DB_NAME | db.sqlite3 | Database name |
| DB_USER | (empty) | Database username |
| DB_PASSWORD | (empty) | Database password |
| DB_HOST | (empty) | Database host |
| DB_PORT | (empty) | Database port |
| REACT_APP_API_URL | http://localhost:8000/api | Backend URL (set in frontend) |

---

## PART 8: COMMON ISSUES

**"CORS error" in browser console:**
Make sure the backend is running on port 8000. The settings allow CORS from `localhost:3000`.

**"401 Unauthorized" on API calls:**
Your token has expired. The app should auto-refresh, but if it doesn't, log out and log back in.

**"No module named 'rest_framework'":**
You forgot to activate the virtual environment or install dependencies. Run:
```bash
source venv/bin/activate
pip install -r requirements.txt
```

**Frontend shows blank page:**
Check the browser console for errors. Make sure the backend is running and the API URL is correct.

**Seed command fails with "user already exists":**
The seed data has already been loaded. If you want to start fresh:
```bash
python manage.py flush
python manage.py migrate
python manage.py seed_data
```

---

## PART 9: PROJECT STRUCTURE EXPLAINED

### Backend Apps

**accounts/** — Handles everything user-related:
- `models.py` — Custom User model extending Django's AbstractUser, adds `role`, `phone`, `avatar` fields
- `serializers.py` — Converts User objects to/from JSON (register, profile, admin views)
- `views.py` — API endpoints for register, profile, user list/detail
- `urls.py` — URL routing for auth and user endpoints

**tickets/** — The core ticketing system:
- `models.py` — Ticket model (title, description, status, priority, timestamps) and Message model (chat thread)
- `serializers.py` — List, detail, create, update serializers for tickets and messages
- `views.py` — CRUD endpoints with role-based filtering (admin sees all, users see own)
- `management/commands/seed_data.py` — The database seeder

**knowledge_base/** — FAQ and documentation:
- `models.py` — Category and Article models
- `serializers.py` — List and detail serializers
- `views.py` — CRUD with admin-only write, public read

**analytics/** — Reporting and metrics:
- `views.py` — Aggregation queries (no models, reads from tickets)
- Dashboard summary, ticket trends, status/priority breakdowns, resolution time

### Frontend Structure

```
frontend/src/
├── App.js              ← Routes and protected route logic
├── index.js            ← React entry point
├── index.css           ← All CSS (dark theme)
├── context/
│   └── AuthContext.js  ← Login/logout state, JWT management
├── services/
│   └── api.js          ← Axios instance, all API calls, auto-refresh
├── components/
│   └── Layout.js       ← Sidebar + main content shell
└── pages/
    ├── LoginPage.js
    ├── RegisterPage.js
    ├── DashboardPage.js
    ├── TicketsPage.js
    ├── TicketDetailPage.js
    ├── KnowledgeBasePage.js
    ├── ArticleDetailPage.js
    ├── AnalyticsPage.js
    └── ProfilePage.js
```
