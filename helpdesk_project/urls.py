from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/accounts/', include('accounts.urls')),
    path('api/tickets/', include('tickets.urls')),
    path('api/kb/', include('knowledge_base.urls')),
    path('api/analytics/', include('analytics.urls')),
]
