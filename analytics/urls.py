from django.urls import path
from . import views

urlpatterns = [
    path('dashboard/', views.DashboardSummaryView.as_view(), name='dashboard'),
    path('ticket-trends/', views.TicketTrendsView.as_view(), name='ticket-trends'),
    path('status-breakdown/', views.TicketStatusBreakdownView.as_view(), name='status-breakdown'),
    path('priority-breakdown/', views.TicketPriorityBreakdownView.as_view(), name='priority-breakdown'),
    path('resolution-time/', views.ResolutionTimeView.as_view(), name='resolution-time'),
]
