# How to Host Askify for Free — College Project Guide

This guide will give you a public link (like `https://yourusername.pythonanywhere.com`) that anyone can open from anywhere — your professor, classmates, phone, etc.

We'll use **PythonAnywhere** (free, no credit card needed).

The trick: instead of hosting React and Django separately, we'll build React into static files and let Django serve everything from one URL.

---

## STEP 1: Prepare React for Production

On your local machine, go to the frontend folder and build it:

```bash
cd frontend
```

First, create a file called `.env.production` in the frontend folder:

```
REACT_APP_API_URL=https://YOURUSERNAME.pythonanywhere.com/api
```

Replace `YOURUSERNAME` with the PythonAnywhere username you'll create in Step 2.

Now build:

```bash
npm run build
```

This creates a `frontend/build/` folder with optimized HTML, CSS, and JS files. This is your entire React app compressed into static files.

---

## STEP 2: Create a PythonAnywhere Account

1. Go to https://www.pythonanywhere.com
2. Click "Pricing & signup"
3. Choose "Create a Beginner account" (free)
4. Pick a username (this becomes your URL: `yourusername.pythonanywhere.com`)
5. Verify your email

---

## STEP 3: Upload Your Project

**Option A — Using Git (recommended):**

If your project is on GitHub:

1. Go to PythonAnywhere Dashboard → "Consoles" → Start a "Bash" console
2. Run:

```bash
git clone https://github.com/YOURUSERNAME/askify.git
```

**Option B — Upload ZIP manually:**

1. Go to PythonAnywhere Dashboard → "Files"
2. Click "Upload a file"
3. Upload your `helpdesk-project.zip`
4. Open a Bash console and run:

```bash
cd ~
unzip helpdesk-project.zip -d askify
```

---

## STEP 4: Set Up Python Environment

In the PythonAnywhere Bash console:

```bash
# Create a virtual environment
mkvirtualenv --python=/usr/bin/python3.10 askifyenv

# Go to your project
cd ~/askify

# Install dependencies
pip install -r requirements.txt
```

---

## STEP 5: Modify Settings for Production

In the PythonAnywhere Bash console, edit settings.py:

```bash
nano helpdesk_project/settings.py
```

Make these changes:

### 1. Change ALLOWED_HOSTS:
```python
ALLOWED_HOSTS = ['YOURUSERNAME.pythonanywhere.com']
```

### 2. Add CORS origin for your domain:
```python
CORS_ALLOWED_ORIGINS = [
    'https://YOURUSERNAME.pythonanywhere.com',
    'http://localhost:3000',
]
```

### 3. Add these lines at the bottom for serving React:
```python
# Serve React build files
STATICFILES_DIRS = [BASE_DIR / 'frontend' / 'build' / 'static']
STATIC_ROOT = BASE_DIR / 'staticfiles'
```

### 4. Add template directory for React's index.html:
Change the TEMPLATES setting:
```python
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'frontend' / 'build'],   # ← add this
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]
```

Save and exit (Ctrl+X, then Y, then Enter).

---

## STEP 6: Add a View to Serve React

Edit the main urls.py:

```bash
nano helpdesk_project/urls.py
```

Change it to:

```python
from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/accounts/', include('accounts.urls')),
    path('api/tickets/', include('tickets.urls')),
    path('api/kb/', include('knowledge_base.urls')),
    path('api/analytics/', include('analytics.urls')),
    # Serve React for all other routes
    re_path(r'^(?!api/|admin/).*$', TemplateView.as_view(template_name='index.html')),
]
```

The last line says: "For any URL that doesn't start with `api/` or `admin/`, serve React's index.html." This lets React Router handle frontend routing.

---

## STEP 7: Copy React Build Files

If you built React locally, upload the `frontend/build/` folder to PythonAnywhere.

Or if you have Node.js available (PythonAnywhere free doesn't include it), you can build on another machine and upload just the `build/` folder.

Make sure this path exists on PythonAnywhere:
```
~/askify/frontend/build/index.html
~/askify/frontend/build/static/css/...
~/askify/frontend/build/static/js/...
```

---

## STEP 8: Run Database Setup

In the Bash console:

```bash
cd ~/askify
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py seed_data
```

`collectstatic` gathers all CSS/JS files into the `staticfiles/` folder so PythonAnywhere can serve them efficiently.

---

## STEP 9: Configure the Web App

1. Go to PythonAnywhere Dashboard → "Web" tab
2. Click "Add a new web app"
3. Choose "Manual configuration" (NOT Django)
4. Select Python 3.10

### Set the virtualenv:
In the "Virtualenv" section, enter:
```
/home/YOURUSERNAME/.virtualenvs/askifyenv
```

### Edit the WSGI file:
Click the link to your WSGI configuration file (something like `/var/www/YOURUSERNAME_pythonanywhere_com_wsgi.py`).

Delete everything in it and replace with:

```python
import os
import sys

# Add your project to the path
path = '/home/YOURUSERNAME/askify'
if path not in sys.path:
    sys.path.append(path)

os.environ['DJANGO_SETTINGS_MODULE'] = 'helpdesk_project.settings'

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
```

Replace `YOURUSERNAME` with your actual PythonAnywhere username.

### Set up static files:
In the "Static files" section on the Web tab, add these two entries:

| URL | Directory |
|-----|-----------|
| `/static/` | `/home/YOURUSERNAME/askify/staticfiles` |

---

## STEP 10: Reload and Test

1. Click the green "Reload" button on the Web tab
2. Open `https://YOURUSERNAME.pythonanywhere.com`
3. You should see the Askify login page
4. Login with `admin` / `admin123`

---

## STEP 11: Share Your Link

Your project is now live at:

```
https://YOURUSERNAME.pythonanywhere.com
```

Share this link with your professor or classmates. It works from any device, any network, anywhere in the world.

---

## Quick Troubleshooting

**Page shows "Something went wrong":**
→ Check the error log: Web tab → "Error log" link

**Static files not loading (page looks unstyled):**
→ Run `python manage.py collectstatic --noinput` again
→ Check the static file path in Web tab matches your actual folder

**API returns 500 errors:**
→ Check the server log: Web tab → "Server log" link
→ Usually a missing package: `pip install <package_name>`

**"DisallowedHost" error:**
→ Make sure ALLOWED_HOSTS in settings.py has your PythonAnywhere domain

**Changes not showing up:**
→ Always click "Reload" on the Web tab after making changes

---

## Free Tier Limitations

PythonAnywhere free tier gives you:
- One web app
- 512MB disk space
- SQLite database (which we're using)
- Your app "sleeps" after 3 months of inactivity (just log in and reload to wake it up)
- Custom domain not available (you get yourusername.pythonanywhere.com)

For a college project, this is more than enough.
