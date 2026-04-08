# Learn Django From Scratch — Through the Askify Project

This guide teaches you Django from zero by walking through every single decision, file, and line of code in the Askify helpdesk project. No prior Django knowledge needed — just basic Python.

---

## CHAPTER 1: WHAT IS DJANGO?

Django is a Python framework for building websites and web APIs. A "framework" means it gives you pre-built tools so you don't have to write everything from scratch.

Think of it this way: if you wanted to build a house, you could make your own bricks, cut your own wood, forge your own nails. Or you could buy all those things and focus on designing the house. Django gives you the bricks, wood, and nails — you focus on your app.

What Django gives you for free:
- A way to talk to databases without writing SQL
- User authentication (login, logout, passwords)
- An admin panel to manage your data
- URL routing (when someone visits /tickets, show the tickets page)
- Security protections (against hacking, XSS, CSRF, SQL injection)

What we added on top:
- Django REST Framework (DRF) — turns Django into an API that speaks JSON
- SimpleJWT — adds JWT token-based authentication
- django-cors-headers — lets the React frontend talk to Django
- django-filter — adds filtering to API endpoints

---

## CHAPTER 2: HOW A WEB APP WORKS (THE BIG PICTURE)

Before touching code, understand what happens when you use Askify:

```
YOU (Browser)                    REACT (Frontend)                  DJANGO (Backend)                  DATABASE
     |                                |                                 |                                |
     | Click "Tickets"                |                                 |                                |
     |------------------------------->|                                 |                                |
     |                                | GET /api/tickets/               |                                |
     |                                | Authorization: Bearer eyJ...    |                                |
     |                                |------------------------------->|                                |
     |                                |                                 | Verify JWT token               |
     |                                |                                 | Who is this user?              |
     |                                |                                 | What role do they have?        |
     |                                |                                 |                                |
     |                                |                                 | SELECT * FROM tickets          |
     |                                |                                 | WHERE created_by = user_id     |
     |                                |                                 |------------------------------->|
     |                                |                                 |                                |
     |                                |                                 |   Here are 15 rows             |
     |                                |                                 |<-------------------------------|
     |                                |                                 |                                |
     |                                |  JSON: [{id:1, title:...}, ...] |                                |
     |                                |<-------------------------------|                                |
     |                                |                                 |                                |
     | Render ticket table            |                                 |                                |
     |<-------------------------------|                                 |                                |
```

Three separate things are running:
1. **React** (JavaScript, port 3000) — what you see in the browser
2. **Django** (Python, port 8000) — processes requests, talks to database
3. **Database** (SQLite file) — stores all the data

React and Django communicate through HTTP requests (like GET, POST, PATCH, DELETE) and JSON responses. They're completely separate — you could replace React with a mobile app and Django wouldn't know the difference.

---

## CHAPTER 3: PROJECT CREATION — WHAT HAPPENED WHEN I BUILT THIS

### Step 1: I created the Django project

```bash
django-admin startproject helpdesk_project .
```

This single command created:

```
helpdesk_project/
    __init__.py      ← Makes this a Python package
    settings.py      ← ALL configuration lives here
    urls.py          ← The "table of contents" for URLs
    wsgi.py          ← Entry point for production servers
    asgi.py          ← Entry point for async servers
manage.py            ← Command-line tool to run things
```

The `.` at the end means "create it in the current directory" instead of making a nested folder.

### Step 2: I created four apps

```bash
python manage.py startapp accounts
python manage.py startapp tickets
python manage.py startapp knowledge_base
python manage.py startapp analytics
```

In Django, an "app" is a self-contained module that does one thing. Think of it like departments in a company:
- **accounts** — handles people (users, login, profiles)
- **tickets** — handles support requests and chat
- **knowledge_base** — handles FAQ articles
- **analytics** — handles reporting and charts

Each app got the same set of files:

```
accounts/
    __init__.py      ← Makes it a Python package
    models.py        ← Database tables (what data to store)
    views.py         ← Business logic (what to do with requests)
    admin.py         ← How data looks in the admin panel
    apps.py          ← App configuration
    tests.py         ← Tests (empty for now)
    migrations/      ← Database change history
```

I then added extra files that Django doesn't create but we need:
- `serializers.py` — translates between Python objects and JSON
- `urls.py` — URL patterns for this specific app

### Step 3: I told Django about the apps

In `settings.py`, I added them to `INSTALLED_APPS`:

```python
INSTALLED_APPS = [
    # Django built-in apps
    'django.contrib.admin',        # Admin panel
    'django.contrib.auth',         # User authentication
    'django.contrib.contenttypes', # Content type framework
    'django.contrib.sessions',     # Session management
    'django.contrib.messages',     # Flash messages
    'django.contrib.staticfiles',  # CSS/JS serving

    # Third-party packages we installed
    'rest_framework',              # Django REST Framework
    'rest_framework_simplejwt',    # JWT authentication
    'corsheaders',                 # Cross-origin requests
    'django_filters',              # API filtering

    # Our apps
    'accounts',
    'tickets',
    'knowledge_base',
    'analytics',
]
```

If an app isn't listed here, Django pretends it doesn't exist. Models won't create tables, admin won't show up, nothing.

---

## CHAPTER 4: SETTINGS.PY — THE BRAIN OF THE PROJECT

This file controls everything. Let me explain every section:

### The basics

```python
import os
from pathlib import Path
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent
```

`BASE_DIR` figures out where your project lives on disk. `__file__` is the settings.py file itself. `.parent.parent` goes up two folders (from `helpdesk_project/settings.py` to the root). Everything else uses this as a reference point.

### Security

```python
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'dev-secret-key-change-in-production')
DEBUG = os.environ.get('DJANGO_DEBUG', 'True') == 'True'
ALLOWED_HOSTS = ['*']
```

**SECRET_KEY** — a random string used to sign JWT tokens, hash passwords, and protect forms. If someone gets this key, they can forge tokens and pretend to be any user. That's why it reads from an environment variable — you never put the real key in code.

**DEBUG** — when True, Django shows detailed error pages with your code. Amazing for development, terrible for production (hackers can see your code structure).

**ALLOWED_HOSTS** — which domain names can access your server. `['*']` means "anyone" (fine for dev, tighten for production).

### Middleware

```python
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',           # HTTPS, security headers
    'django.contrib.sessions.middleware.SessionMiddleware',    # Session handling
    'corsheaders.middleware.CorsMiddleware',                   # Allow React to talk to us
    'django.middleware.common.CommonMiddleware',               # URL normalization
    'django.middleware.csrf.CsrfViewMiddleware',              # Cross-site request forgery protection
    'django.contrib.auth.middleware.AuthenticationMiddleware', # Attaches user to request
    'django.contrib.messages.middleware.MessageMiddleware',    # Flash messages
    'django.middleware.clickjacking.XFrameOptionsMiddleware', # Prevents iframe attacks
]
```

Middleware is like a security checkpoint. Every request passes through ALL of these, in order, before reaching your view. And every response passes back through them in reverse order.

Think of it as an airport: you go through security check 1, then 2, then 3, reach your gate (the view), then come back through 3, 2, 1.

The CORS middleware is critical — without it, the browser would block React (port 3000) from talking to Django (port 8000) because they're different "origins."

### Database

```python
DATABASES = {
    'default': {
        'ENGINE': os.environ.get('DB_ENGINE', 'django.db.backends.sqlite3'),
        'NAME': os.environ.get('DB_NAME', BASE_DIR / 'db.sqlite3'),
    }
}
```

This tells Django which database to use. The default is SQLite, which stores everything in a single file (`db.sqlite3`). For production, you'd set environment variables to point to PostgreSQL instead.

### Custom User Model

```python
AUTH_USER_MODEL = 'accounts.User'
```

This single line is extremely important. It tells Django: "Don't use your built-in User model. Use the one I made in the accounts app." You MUST set this before running your first migration — changing it later is very painful.

### REST Framework config

```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}
```

This configures how ALL API endpoints behave by default:

- **Authentication** — every request must include a JWT token (except where we override this)
- **Permission** — you must be logged in (IsAuthenticated)
- **Filters** — every list endpoint automatically supports filtering, searching, and ordering
- **Pagination** — lists return 20 items per page with `?page=2` for the next page

These are defaults. Individual views can override them — like RegisterView which sets `permission_classes = [AllowAny]` so you can register without being logged in (obviously).

### CORS

```python
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
]
```

Browsers have a security feature: JavaScript on one website can't make requests to a different website unless that website explicitly allows it. This is called CORS (Cross-Origin Resource Sharing).

React runs on port 3000, Django on port 8000. To the browser, these are different websites. Without this setting, every API call from React would be blocked by the browser.

---

## CHAPTER 5: MODELS — DESIGNING YOUR DATABASE

Models are the most important concept in Django. A model is a Python class that becomes a database table. Each attribute becomes a column. Each instance becomes a row.

### The User Model (accounts/models.py)

```python
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
```

We extend `AbstractUser` instead of starting from scratch. This gives us for free:
- `id` — auto-incrementing primary key
- `username` — unique username
- `password` — hashed password (never stored as plain text)
- `email` — email address
- `first_name`, `last_name` — name fields
- `is_active` — can this user log in?
- `is_staff` — can they access the admin panel?
- `is_superuser` — do they have all permissions?
- `date_joined` — when they registered
- `last_login` — last login time

Then we add our own fields:

```python
    class Role(models.TextChoices):
        ADMIN = 'admin', 'Admin'
        USER = 'user', 'User'
        # AGENT = 'agent', 'Agent'       ← ready for future
        # CHATBOT = 'chatbot', 'Chatbot'  ← ready for future
```

`TextChoices` creates a dropdown. The database stores `'admin'` (the first value), the admin panel displays `'Admin'` (the second value). This prevents someone from setting their role to `'superking'` — only the listed choices are valid.

```python
    role = models.CharField(
        max_length=20,        # max 20 characters in the database
        choices=Role.choices,  # only allow 'admin' or 'user'
        default=Role.USER,    # new users are 'user' by default
    )
```

`CharField` is a text column. `max_length` is required — the database needs to know how much space to reserve.

```python
    phone = models.CharField(max_length=20, blank=True)
    avatar = models.URLField(blank=True)
```

`blank=True` means this field is optional — you can leave it empty. Without `blank=True`, Django would reject any user that doesn't provide a phone number.

```python
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

`auto_now_add=True` — set the time automatically when the object is CREATED. Never changes after that.
`auto_now=True` — set the time automatically every time the object is SAVED. Updates on every edit.

```python
    class Meta:
        ordering = ['-created_at']
```

`Meta` is configuration for the model itself. `ordering = ['-created_at']` means "when you query users, sort by creation date, newest first." The `-` means descending.

```python
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
```

`__str__` controls what you see when you print a user or see it in the admin panel. Without this, you'd see `User object (1)` which is useless. With it, you see `admin (Admin)`.

`get_role_display()` is auto-generated by Django for any field with `choices`. It returns the human-readable label (`'Admin'`) instead of the stored value (`'admin'`).

```python
    @property
    def is_admin_role(self):
        return self.role == self.Role.ADMIN
```

`@property` makes a method work like an attribute. Instead of `user.is_admin_role()` you write `user.is_admin_role`. It's syntactic sugar — just looks cleaner.

### The Ticket Model (tickets/models.py)

```python
class Ticket(models.Model):
```

Unlike User, this extends `models.Model` directly — the base class for all Django models. It gives you `id`, `save()`, `delete()`, and the ORM query methods.

The `Status` and `Priority` inner classes work the same as `Role` in User — restricted choices:

```python
    class Status(models.TextChoices):
        OPEN = 'open', 'Open'
        IN_PROGRESS = 'in_progress', 'In Progress'
        RESOLVED = 'resolved', 'Resolved'
        CLOSED = 'closed', 'Closed'
```

Now the important part — relationships:

```python
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,   # points to our User model
        on_delete=models.CASCADE,    # if user is deleted, delete their tickets too
        related_name='created_tickets',
    )
```

**ForeignKey** = "this ticket belongs to one user." In the database, this creates a column `created_by_id` that holds the user's ID number.

**on_delete=models.CASCADE** — what happens when the referenced user is deleted? CASCADE means "delete the ticket too." Other options:
- `SET_NULL` — set to null (keep the ticket, remove the owner)
- `PROTECT` — prevent deletion of the user
- `SET_DEFAULT` — set to a default value

**related_name='created_tickets'** — this creates a reverse relationship. You can do:
```python
user.created_tickets.all()  # get all tickets this user created
```

Without `related_name`, Django would auto-generate `user.ticket_set.all()` which is less readable.

```python
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,     # if assignee is deleted, just set to null
        null=True, blank=True,          # this field can be empty
        related_name='assigned_tickets',
    )
```

Notice `on_delete=models.SET_NULL` here — if an admin user gets deleted, we don't want to delete the ticket. We just remove the assignment.

`null=True` means the database column can store NULL. `blank=True` means forms/serializers accept empty values. For optional fields, you usually need both.

```python
    resolved_at = models.DateTimeField(null=True, blank=True)
```

This is not auto-set. We manually set it in the view when a ticket's status changes to 'resolved'. This lets us calculate resolution time in analytics.

### The Message Model

```python
class Message(models.Model):
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='messages')
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
```

This creates a chat thread. Each message belongs to one ticket and one sender. `TextField()` has no max length — it can hold as much text as needed (unlike `CharField` which requires `max_length`).

`related_name='messages'` means you can do:
```python
ticket.messages.all()  # get all messages for this ticket
```

### How Models Become Tables

When you write models, nothing happens to the database yet. You need two commands:

```bash
python manage.py makemigrations
```

This looks at your models and generates a migration file (like `0001_initial.py`) that says "create a table called tickets_ticket with these columns." It's a blueprint.

```bash
python manage.py migrate
```

This reads all migration files and executes the actual SQL to create/modify tables.

Why two steps? Because you might want to review the migration before applying it. And migrations serve as a history — you can see exactly how your database evolved over time.

### Relationships Visualized

```
User (accounts_user)
  │
  ├── created_tickets ──> Ticket (tickets_ticket)
  │                          │
  ├── assigned_tickets ──> Ticket (tickets_ticket)
  │                          │
  ├── messages ──────────> Message (tickets_message)
  │                          │
  ├── articles ──────────> Article (knowledge_base_article)
  │                          │
  │                        Message (tickets_message)
  │                          ↑
  │                          │ ticket (ForeignKey)
  │                          │
  │                        Ticket
  │
  Category ──────────────> Article
    (knowledge_base)         (knowledge_base)
```

---

## CHAPTER 6: URL ROUTING — HOW DJANGO FINDS THE RIGHT CODE

When a request comes in (like `GET /api/tickets/`), Django needs to figure out which Python function to run. This happens through URL patterns.

### The main URLs (helpdesk_project/urls.py)

```python
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/accounts/', include('accounts.urls')),
    path('api/tickets/', include('tickets.urls')),
    path('api/kb/', include('knowledge_base.urls')),
    path('api/analytics/', include('analytics.urls')),
]
```

This is the master router. When a request arrives:

1. Django tries each pattern from top to bottom
2. If the URL starts with `api/tickets/`, Django strips that prefix and passes the rest to `tickets/urls.py`
3. If nothing matches, Django returns 404

`include()` means "delegate to that app's urls.py for the rest."

Example: `GET /api/tickets/5/messages/`
- Main urls.py matches `api/tickets/` → passes `5/messages/` to tickets/urls.py
- tickets/urls.py matches `<int:ticket_id>/messages/` → calls MessageListCreateView

### App URLs (tickets/urls.py)

```python
from django.urls import path
from . import views

urlpatterns = [
    path('', views.TicketListCreateView.as_view(), name='ticket-list'),
    path('<int:pk>/', views.TicketDetailView.as_view(), name='ticket-detail'),
    path('<int:ticket_id>/messages/', views.MessageListCreateView.as_view(), name='ticket-messages'),
]
```

- `''` — matches the root (`/api/tickets/`)
- `<int:pk>/` — matches any number (`/api/tickets/5/`). The number is captured as `pk` (primary key)
- `<int:ticket_id>/messages/` — matches `/api/tickets/5/messages/`

`name='ticket-list'` gives the URL pattern a name so you can reference it elsewhere without hardcoding the path.

`.as_view()` converts a class-based view into a function that Django can call. It's required for class-based views.

### How the full request flows through URLs

```
Request: GET /api/tickets/5/messages/

helpdesk_project/urls.py:
  "api/tickets/" matches → strip it → pass "5/messages/" to tickets/urls.py

tickets/urls.py:
  "<int:ticket_id>/messages/" matches → ticket_id = 5
  → call MessageListCreateView.as_view()

MessageListCreateView.get_queryset():
  return Message.objects.filter(ticket_id=5)
  → returns all messages for ticket #5

Serializer converts Python objects to JSON:
  → [{"id": 1, "sender": {...}, "body": "Hello", "created_at": "..."}]

Response: 200 OK with JSON body
```

---

## CHAPTER 7: VIEWS — THE BUSINESS LOGIC

Views receive HTTP requests and return HTTP responses. In our project, we use Django REST Framework's class-based views which do most of the work for us.

### Understanding DRF Generic Views

Instead of writing everything from scratch, DRF gives you pre-built views:

```
generics.ListAPIView          → GET /items/        (list all)
generics.CreateAPIView        → POST /items/       (create one)
generics.ListCreateAPIView    → GET + POST         (list all + create)
generics.RetrieveAPIView      → GET /items/5/      (get one)
generics.UpdateAPIView        → PUT/PATCH /items/5/ (update one)
generics.DestroyAPIView       → DELETE /items/5/    (delete one)
generics.RetrieveUpdateDestroyAPIView → GET + PUT/PATCH + DELETE (all single-item operations)
```

You pick the one that matches your needs and customize it.

### TicketListCreateView — Explained Line by Line

```python
class TicketListCreateView(generics.ListCreateAPIView):
```

Extends `ListCreateAPIView` — handles `GET /api/tickets/` (list) and `POST /api/tickets/` (create).

```python
    filterset_fields = ['status', 'priority', 'assigned_to']
```

This enables URL filtering. Now `GET /api/tickets/?status=open&priority=high` works automatically. DRF reads the query parameters and filters the database query. This comes from the `DjangoFilterBackend` we set in settings.py.

```python
    search_fields = ['title', 'description']
```

Enables `?search=login` which searches across title AND description. Uses the `SearchFilter` backend from settings.

```python
    ordering_fields = ['created_at', 'updated_at', 'priority']
```

Enables `?ordering=-created_at` (newest first) or `?ordering=priority` (sort by priority).

```python
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return TicketCreateSerializer
        return TicketListSerializer
```

Different serializers for different operations. When creating (POST), we use `TicketCreateSerializer` which only accepts title, description, and priority. When listing (GET), we use `TicketListSerializer` which includes the full user info and message count.

Why? Because when creating a ticket, you don't send the created_by field — we set that automatically. And you don't need message_count or user details in the request body.

```python
    def get_queryset(self):
        qs = Ticket.objects.annotate(message_count=Count('messages'))
        user = self.request.user
        if user.role != 'admin':
            qs = qs.filter(created_by=user)
        return qs
```

This is where the role-based access control happens.

`Ticket.objects` is the "manager" — it's how you query the database. Think of it as the gateway to the tickets table.

`.annotate(message_count=Count('messages'))` adds a computed field. It counts how many messages each ticket has WITHOUT loading all the messages. In SQL, this becomes a JOIN with GROUP BY — very efficient.

`self.request.user` is the authenticated user (extracted from the JWT token by the authentication middleware).

If the user is not admin, we filter to only their tickets. An admin sees everything.

```python
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
```

`perform_create` is a hook that DRF calls right before saving. We use it to inject `created_by` — the currently logged-in user. This way, the frontend doesn't need to send the user ID (which could be faked).

### TicketDetailView — Explained

```python
class TicketDetailView(generics.RetrieveUpdateDestroyAPIView):
```

Handles three things for a single ticket:
- `GET /api/tickets/5/` — retrieve ticket details
- `PATCH /api/tickets/5/` — update ticket (status, priority, assignment)
- `DELETE /api/tickets/5/` — delete ticket

```python
    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return TicketUpdateSerializer
        return TicketDetailSerializer
```

When reading: use `TicketDetailSerializer` (includes all messages, full user objects).
When updating: use `TicketUpdateSerializer` (only accepts status, priority, assigned_to, title, description).

```python
    def perform_update(self, serializer):
        instance = serializer.save()
        if instance.status == 'resolved' and not instance.resolved_at:
            instance.resolved_at = timezone.now()
            instance.save()
```

After saving, if the status just changed to 'resolved' and there's no resolved timestamp yet, we record when it was resolved. This is used by the analytics to calculate resolution time.

### Custom Permissions

```python
class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'
```

This is a custom permission class. DRF calls `has_permission()` before running the view. If it returns False, the user gets a 403 Forbidden response.

Used like this:
```python
class UserListView(generics.ListAPIView):
    permission_classes = [IsAdmin]  # only admins can list all users
```

---

## CHAPTER 8: SERIALIZERS — THE TRANSLATOR

Serializers do two things:
1. **Serialization**: Python object → JSON (for responses)
2. **Deserialization**: JSON → validated Python data (for requests)

### TicketListSerializer — For the List View

```python
class TicketListSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    assigned_to = UserSerializer(read_only=True)
    message_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Ticket
        fields = ['id', 'title', 'status', 'priority', 'created_by',
                  'assigned_to', 'message_count', 'created_at', 'updated_at']
```

`ModelSerializer` auto-generates fields from the model. `class Meta` tells it which model and which fields to include.

`created_by = UserSerializer(read_only=True)` — instead of just showing the user ID (like `"created_by": 3`), it nests the full user object:

```json
"created_by": {
    "id": 3,
    "username": "user1",
    "email": "user1@example.com",
    "first_name": "User",
    "last_name": "1"
}
```

`message_count = serializers.IntegerField(read_only=True)` — this doesn't exist on the model. It comes from the `.annotate()` we did in the view. We declare it here so the serializer knows about it.

### TicketCreateSerializer — For Creating Tickets

```python
class TicketCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ticket
        fields = ['id', 'title', 'description', 'priority']
        read_only_fields = ['id']
```

This only accepts `title`, `description`, and `priority`. No status (defaults to 'open'), no created_by (set in the view), no assigned_to (starts unassigned). This is intentional — it keeps the API clean and secure.

### RegisterSerializer — Custom Validation

```python
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'password_confirm',
                  'first_name', 'last_name', 'phone']

    def validate(self, attrs):
        if attrs['password'] != attrs.pop('password_confirm'):
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user
```

**write_only=True** — these fields are accepted in the request but never shown in the response. You don't want the API returning passwords.

**validators=[validate_password]** — Django's built-in password validator checks: minimum 8 characters, not too similar to your username, not a common password, not entirely numeric.

**validate()** — a custom validation method. Runs after individual field validation. Here it checks that both passwords match. `.pop('password_confirm')` removes it from the data since we don't want to save it to the database.

**create()** — overrides the default create method. `create_user()` is special — it hashes the password before saving. If you used `User.objects.create()` instead, the password would be saved as plain text and login would never work.

### The Serialization Flow

```
INCOMING REQUEST (React → Django):

React sends:  { "title": "Can't login", "description": "...", "priority": "high" }
    ↓
TicketCreateSerializer receives JSON
    ↓
Validates: is title a string? Is priority one of the choices? All fields present?
    ↓
If valid → returns cleaned Python dict
If invalid → returns error response like {"title": ["This field is required."]}
    ↓
View calls serializer.save(created_by=request.user)
    ↓
Serializer creates Ticket object and saves to database


OUTGOING RESPONSE (Django → React):

View queries: Ticket.objects.filter(created_by=user)
    ↓
Returns QuerySet of Ticket objects (Python)
    ↓
TicketListSerializer converts each Ticket to a dict
    ↓
Nests UserSerializer for created_by and assigned_to
    ↓
DRF converts to JSON: [{"id": 1, "title": "Can't login", ...}]
    ↓
Returns HTTP response with JSON body
```

---

## CHAPTER 9: THE ADMIN PANEL

Django gives you a free admin interface at `/admin/`. You configure how each model appears there in `admin.py`.

### accounts/admin.py

```python
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'role', 'is_active', 'created_at']
    list_filter = ['role', 'is_active']
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Helpdesk', {'fields': ('role', 'phone', 'avatar')}),
    )
```

`@admin.register(User)` — registers the model with the admin site. Without this, User won't show up.

`list_display` — columns shown in the list view.

`list_filter` — sidebar filters for quick filtering.

`fieldsets` — what fields appear when editing a user. We take Django's default fieldsets (username, password, permissions) and add a new "Helpdesk" section with our custom fields.

### tickets/admin.py

```python
class MessageInline(admin.TabularInline):
    model = Message
    extra = 0
    readonly_fields = ['sender', 'created_at']

@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'status', 'priority', 'created_by', 'assigned_to', 'created_at']
    list_filter = ['status', 'priority']
    search_fields = ['title', 'description']
    inlines = [MessageInline]
```

`TabularInline` — shows Messages directly inside the Ticket edit page. You don't have to go to a separate page to see messages. `extra = 0` means don't show empty forms for new messages.

`inlines = [MessageInline]` — attaches the inline to the Ticket admin page.

---

## CHAPTER 10: THE ORM — TALKING TO THE DATABASE WITHOUT SQL

Django's ORM (Object-Relational Mapper) lets you work with the database using Python instead of SQL.

### Basic Operations

```python
# Create
ticket = Ticket.objects.create(
    title="Can't login",
    description="Getting 403 error",
    priority="high",
    created_by=user,
)

# Read one
ticket = Ticket.objects.get(id=5)       # exact match, raises error if not found
ticket = Ticket.objects.get(pk=5)       # pk = primary key, same as id

# Read many
all_tickets = Ticket.objects.all()                          # everything
open_tickets = Ticket.objects.filter(status='open')         # WHERE status = 'open'
user_tickets = Ticket.objects.filter(created_by=user)       # WHERE created_by_id = user.id
urgent_open = Ticket.objects.filter(status='open', priority='urgent')  # AND

# Update
ticket.status = 'resolved'
ticket.save()

# Or update many at once:
Ticket.objects.filter(status='open').update(status='closed')

# Delete
ticket.delete()

# Count
Ticket.objects.filter(status='open').count()

# Exists
Ticket.objects.filter(status='open').exists()  # True/False, faster than count
```

### Chaining

Queries are lazy — they don't hit the database until you need the data:

```python
# This doesn't hit the database yet
qs = Ticket.objects.filter(status='open')

# Still no database hit
qs = qs.filter(priority='urgent')

# Still no database hit
qs = qs.order_by('-created_at')

# NOW it hits the database (when you iterate)
for ticket in qs:
    print(ticket.title)
```

This is powerful because Django combines all the filters into a single SQL query.

### Lookups (Advanced Filtering)

```python
# Contains (LIKE %...%)
Ticket.objects.filter(title__contains='login')

# Case-insensitive contains
Ticket.objects.filter(title__icontains='login')

# Greater than, less than
Ticket.objects.filter(created_at__gte=some_date)  # >= (gte = greater than or equal)
Ticket.objects.filter(created_at__lt=some_date)    # <  (lt = less than)

# In a list
Ticket.objects.filter(status__in=['open', 'in_progress'])

# Is null
Ticket.objects.filter(assigned_to__isnull=True)  # unassigned tickets

# Spanning relationships (double underscore)
Ticket.objects.filter(created_by__username='admin')  # user's username
Ticket.objects.filter(created_by__role='admin')       # user's role
```

### Aggregation (Used in Analytics)

```python
from django.db.models import Count, Avg, F
from django.db.models.functions import TruncDate

# Count tickets per status
Ticket.objects.values('status').annotate(count=Count('id'))
# Result: [{'status': 'open', 'count': 5}, {'status': 'resolved', 'count': 8}]

# Average resolution time
Ticket.objects.filter(resolved_at__isnull=False).aggregate(
    avg_resolution=Avg(F('resolved_at') - F('created_at'))
)

# Tickets per day
Ticket.objects.annotate(
    day=TruncDate('created_at')
).values('day').annotate(
    count=Count('id')
).order_by('day')
```

`values('status')` = GROUP BY status
`annotate(count=Count('id'))` = add a count column
`F('resolved_at')` = reference a database column (allows math between columns)
`TruncDate('created_at')` = extract just the date part (ignoring time)

These are exactly the queries used in `analytics/views.py`.

### Reverse Relationships

When you define a ForeignKey, Django creates a reverse accessor:

```python
# Forward: ticket → user
ticket.created_by          # returns the User object
ticket.created_by.username # "user1"

# Reverse: user → tickets (using related_name)
user.created_tickets.all()   # all tickets created by this user
user.created_tickets.count() # how many

# Reverse: ticket → messages
ticket.messages.all()        # all messages in this ticket
ticket.messages.count()      # how many messages
```

---

## CHAPTER 11: MIGRATIONS — DATABASE VERSION CONTROL

Migrations track every change to your database structure.

### What Happens

```
You write/change a model
    ↓
python manage.py makemigrations
    ↓
Django compares your models to the last migration
    ↓
Generates a new migration file (e.g., 0002_add_phone_field.py)
    ↓
python manage.py migrate
    ↓
Django executes the SQL: ALTER TABLE accounts_user ADD COLUMN phone VARCHAR(20)
```

### Migration Files

Look at `accounts/migrations/0001_initial.py`. It's auto-generated and looks something like:

```python
class Migration(migrations.Migration):
    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.CreateModel(
            name='User',
            fields=[
                ('id', models.BigAutoField(primary_key=True)),
                ('username', models.CharField(max_length=150, unique=True)),
                ('password', models.CharField(max_length=128)),
                ('role', models.CharField(choices=[...], default='user', max_length=20)),
                ('phone', models.CharField(blank=True, max_length=20)),
                # ... all fields
            ],
        ),
    ]
```

`dependencies` — this migration depends on Django's auth migration running first.
`operations` — the actual changes: create table, add column, remove column, etc.

### Example: Adding a Field Later

Say you want to add a `department` field to tickets:

```python
# 1. Edit tickets/models.py:
class Ticket(models.Model):
    department = models.CharField(max_length=100, blank=True)  # new field

# 2. Generate migration:
python manage.py makemigrations
# Creates: tickets/migrations/0002_ticket_department.py

# 3. Apply it:
python manage.py migrate
# Executes: ALTER TABLE tickets_ticket ADD COLUMN department VARCHAR(100)
```

Your existing data is untouched — the new column just has empty values for old tickets.

---

## CHAPTER 12: HOW THE FRONTEND CONNECTS

### api.js — The Connection Layer

```python
const API_BASE = 'http://localhost:8000/api';

const api = axios.create({
    baseURL: API_BASE,
    headers: { 'Content-Type': 'application/json' },
});
```

`axios.create()` creates a reusable HTTP client with default settings. Every request goes to `http://localhost:8000/api/...` with JSON content type.

### Request Interceptor — Auto-attaching JWT

```javascript
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
```

An interceptor runs before EVERY request. It grabs the token from localStorage and adds it to the header. This way, you don't have to manually add the token to every API call.

### Response Interceptor — Auto-refresh

```javascript
api.interceptors.response.use(
    (res) => res,  // success: just return as-is
    async (error) => {
        if (error.response?.status === 401 && !original._retry) {
            // Token expired, try refreshing
            const { data } = await axios.post('/accounts/token/refresh/', { refresh });
            localStorage.setItem('access_token', data.access);
            // Retry the original request with new token
            return api(original);
        }
        return Promise.reject(error);
    }
);
```

If any request fails with 401 (unauthorized), the interceptor automatically tries to refresh the token before giving up.

### API Functions — Clean Interface

```javascript
export const ticketAPI = {
    list: (params) => api.get('/tickets/', { params }),
    get: (id) => api.get(`/tickets/${id}/`),
    create: (data) => api.post('/tickets/', data),
    update: (id, data) => api.patch(`/tickets/${id}/`, data),
    delete: (id) => api.delete(`/tickets/${id}/`),
    messages: (ticketId) => api.get(`/tickets/${ticketId}/messages/`),
    sendMessage: (ticketId, data) => api.post(`/tickets/${ticketId}/messages/`, data),
};
```

Each function maps to one API endpoint. The rest of the React app just calls `ticketAPI.list()` without knowing about URLs or tokens.

---

## CHAPTER 13: PUTTING IT ALL TOGETHER — A COMPLETE REQUEST

Let's trace what happens when a user creates a ticket, from mouse click to database and back:

```
1. USER CLICKS "Create Ticket" AND FILLS THE FORM
   Title: "Can't login to my account"
   Description: "Getting 403 error when I try to login"
   Priority: High

2. REACT (TicketsPage.js)
   handleSubmit fires:
   await ticketAPI.create({
       title: "Can't login to my account",
       description: "Getting 403 error when I try to login",
       priority: "high"
   });

3. API SERVICE (api.js)
   ticketAPI.create calls: api.post('/tickets/', data)
   
   Request interceptor adds the JWT token:
   POST http://localhost:8000/api/tickets/
   Headers: {
       Content-Type: application/json
       Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   }
   Body: {
       "title": "Can't login to my account",
       "description": "Getting 403 error when I try to login",
       "priority": "high"
   }

4. DJANGO MIDDLEWARE (settings.py MIDDLEWARE list)
   SecurityMiddleware → OK
   SessionMiddleware → OK
   CorsMiddleware → Origin is localhost:3000, that's allowed → OK
   CommonMiddleware → OK
   CsrfViewMiddleware → JWT auth, no CSRF needed → OK
   AuthenticationMiddleware → OK (no session needed for JWT)

5. JWT AUTHENTICATION (rest_framework_simplejwt)
   Reads "Bearer eyJ..." from the Authorization header
   Decodes the token:
       Header: {"alg": "HS256", "typ": "JWT"}
       Payload: {"user_id": 3, "exp": 1712345678, "token_type": "access"}
   Verifies signature using SECRET_KEY
   Checks expiration: 1712345678 > now? Yes, still valid
   Loads User with id=3 from database
   Sets request.user = <User: user1>

6. URL ROUTING
   /api/tickets/ → helpdesk_project/urls.py matches "api/tickets/"
   → delegates to tickets/urls.py
   → '' matches → TicketListCreateView
   → HTTP method is POST → calls .create() handler

7. PERMISSION CHECK
   DEFAULT_PERMISSION_CLASSES = IsAuthenticated
   request.user.is_authenticated? Yes → allowed

8. SERIALIZER VALIDATION (TicketCreateSerializer)
   Receives: {"title": "Can't login...", "description": "Getting...", "priority": "high"}
   
   Validates:
   - title: is a string? Yes. Under 255 chars? Yes. ✓
   - description: is a string? Yes. ✓
   - priority: is "high" in ['low','medium','high','urgent']? Yes. ✓
   
   All valid → returns cleaned data

9. VIEW SAVES TO DATABASE (perform_create)
   serializer.save(created_by=request.user)
   
   This runs:
   Ticket.objects.create(
       title="Can't login to my account",
       description="Getting 403 error when I try to login",
       priority="high",
       status="open",        ← default from model
       created_by=user1,     ← injected by the view
       assigned_to=None,     ← default null
   )
   
   Django generates SQL:
   INSERT INTO tickets_ticket (title, description, priority, status, created_by_id, created_at, updated_at)
   VALUES ("Can't login to my account", "Getting 403 error...", "high", "open", 3, "2026-04-03 10:30:00", "2026-04-03 10:30:00");
   
   SQLite executes it → ticket saved with id=16

10. RESPONSE
    Django returns: HTTP 201 Created
    Body: {"id": 16, "title": "Can't login to my account", "description": "...", "priority": "high"}

11. BACK THROUGH MIDDLEWARE (reverse order)
    XFrameOptions → adds header
    CorsMiddleware → adds Access-Control-Allow-Origin: http://localhost:3000
    → Response sent to browser

12. REACT RECEIVES RESPONSE
    ticketAPI.create() resolves successfully
    TicketsPage calls fetchTickets() to refresh the list
    New ticket appears in the table
    Modal closes
```

---

## CHAPTER 14: THE THEME SYSTEM — HOW DARK/LIGHT MODE WORKS

### CSS Variables

The entire color scheme uses CSS variables:

```css
:root,
[data-theme="dark"] {
    --bg-primary: #0f1117;
    --text-primary: #e8eaf0;
    /* ... dark colors */
}

[data-theme="light"] {
    --bg-primary: #f5f6fa;
    --text-primary: #1a1d2e;
    /* ... light colors */
}
```

Every element in the CSS uses these variables:
```css
body {
    background: var(--bg-primary);
    color: var(--text-primary);
}
```

When the theme changes, ALL elements update instantly because they all reference the same variables.

### ThemeContext.js

```javascript
const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
});

useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
}, [theme]);
```

`useState` initializes from localStorage (or defaults to 'dark').
`useEffect` runs whenever `theme` changes — it sets the `data-theme` attribute on the HTML element and saves to localStorage.

The CSS selector `[data-theme="light"]` then matches and all colors swap.

### The Toggle Button

```javascript
<button className="theme-toggle" onClick={toggleTheme}>
    {theme === 'dark' ? '☀ Light mode' : '🌙 Dark mode'}
</button>
```

`toggleTheme` just flips: `setTheme(prev => prev === 'dark' ? 'light' : 'dark')`.

---

## CHAPTER 15: GLOSSARY

| Term | Meaning |
|------|---------|
| **Model** | Python class = database table |
| **View** | Function/class that handles a request |
| **Serializer** | Translates between Python objects and JSON |
| **Migration** | Database change instruction file |
| **ORM** | Object-Relational Mapper — Python instead of SQL |
| **Queryset** | A database query (lazy — doesn't execute until needed) |
| **Middleware** | Code that runs on every request/response |
| **ForeignKey** | "This belongs to that" relationship |
| **JWT** | JSON Web Token — a signed string proving who you are |
| **CORS** | Browser security that blocks cross-origin requests |
| **DRF** | Django REST Framework — makes Django speak JSON |
| **CharField** | Short text (requires max_length) |
| **TextField** | Long text (no length limit) |
| **BooleanField** | True/False |
| **DateTimeField** | Date and time |
| **IntegerField** | Whole number |
| **URLField** | URL (CharField with URL validation) |
| **blank=True** | Field is optional in forms/API |
| **null=True** | Database column can be NULL |
| **auto_now_add** | Set datetime on creation only |
| **auto_now** | Set datetime on every save |
| **related_name** | Name for reverse relationship |
| **on_delete** | What happens when referenced object is deleted |
| **annotate** | Add computed column to query |
| **aggregate** | Compute summary value (sum, avg, count) |
| **@property** | Method that acts like an attribute |
| **write_only** | Accepted in input, hidden in output |
| **read_only** | Shown in output, ignored in input |

---

## CHAPTER 16: WHAT TO LEARN NEXT

Now that you understand the Askify codebase, here's where to go deeper:

1. **Django Channels + WebSockets** — make the chat real-time (messages appear without refreshing)
2. **Celery + Redis** — background tasks (auto-close stale tickets, send email notifications)
3. **Django Signals** — run code automatically when something happens (e.g., send notification when ticket is created)
4. **Testing** — write tests for your views and models using Django's test framework
5. **Docker** — package the entire app (Django + React + PostgreSQL) into containers
6. **Deployment** — put it on a real server using Gunicorn + Nginx + PostgreSQL
