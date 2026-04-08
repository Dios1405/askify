from django.urls import path
from . import views

urlpatterns = [
    # Public endpoints
    path('', views.PublicTicketListView.as_view(), name='ticket-list'),
    path('<int:pk>/', views.PublicTicketDetailView.as_view(), name='ticket-detail'),
    path('<int:ticket_id>/messages/', views.MessageListView.as_view(), name='ticket-messages'),

    # Authenticated endpoints
    path('create/', views.TicketCreateView.as_view(), name='ticket-create'),
    path('<int:pk>/manage/', views.TicketUpdateDeleteView.as_view(), name='ticket-manage'),
    path('<int:ticket_id>/reply/', views.MessageCreateView.as_view(), name='ticket-reply'),

    # Votes
    path('messages/<int:message_id>/vote/', views.VoteToggleView.as_view(), name='vote-toggle'),

    # AI
    path('ai/chat/', views.AIChatView.as_view(), name='ai-chat'),
    path('ai/suggest/', views.AISuggestView.as_view(), name='ai-suggest'),
]
