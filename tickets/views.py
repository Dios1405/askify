import json
import re
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Count, Sum, Q
from django.utils import timezone
from django.conf import settings
from .models import Ticket, Message, Vote
from .serializers import (
    PublicTicketListSerializer, AdminTicketListSerializer,
    PublicTicketDetailSerializer, AdminTicketDetailSerializer,
    TicketCreateSerializer, TicketUpdateSerializer,
    MessageSerializer,
)


# --- Permissions ---

class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'


class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated and request.user.role == 'admin'


# --- AI Helper Functions ---

def ai_assign_priority(title, description):
    """Use simple keyword analysis to assign priority."""
    text = f"{title} {description}".lower()

    urgent_keywords = ['crash', 'down', 'outage', 'emergency', 'critical',
                       'data loss', 'security breach', 'cannot access',
                       'production down', 'server down', 'not working at all',
                       'completely broken', 'urgent']
    high_keywords = ['error', 'bug', 'broken', 'fail', 'slow', 'timeout',
                     'cannot login', 'payment issue', 'data incorrect',
                     'important', 'blocking', 'stuck']
    low_keywords = ['feature request', 'suggestion', 'improvement', 'nice to have',
                    'cosmetic', 'minor', 'typo', 'documentation', 'question',
                    'how to', 'wondering']

    for kw in urgent_keywords:
        if kw in text:
            return 'urgent'
    for kw in high_keywords:
        if kw in text:
            return 'high'
    for kw in low_keywords:
        if kw in text:
            return 'low'
    return 'medium'


def find_similar_tickets(query, limit=5):
    """Find tickets with similar titles/descriptions."""
    words = [w for w in query.lower().split() if len(w) > 2]
    if not words:
        return Ticket.objects.none()

    q = Q()
    for word in words[:10]:
        q |= Q(title__icontains=word) | Q(description__icontains=word)

    return (
        Ticket.objects
        .filter(q)
        .annotate(
            reply_count=Count('messages'),
            total_votes=Count('messages__votes'),
        )
        .order_by('-total_votes', '-created_at')[:limit]
    )


# --- Public Endpoints (no auth required) ---

class PublicTicketListView(generics.ListAPIView):
    """Public forum view — anyone can browse tickets."""
    permission_classes = [permissions.AllowAny]
    search_fields = ['title', 'description']
    filterset_fields = ['status']
    ordering_fields = ['created_at', 'updated_at']

    def get_serializer_class(self):
        if self.request.user.is_authenticated and self.request.user.role == 'admin':
            return AdminTicketListSerializer
        return PublicTicketListSerializer

    def get_queryset(self):
        return Ticket.objects.annotate(
            reply_count=Count('messages'),
            total_votes=Count('messages__votes'),
        )


class PublicTicketDetailView(generics.RetrieveAPIView):
    """Public ticket detail — anyone can read."""
    permission_classes = [permissions.AllowAny]

    def get_serializer_class(self):
        if self.request.user.is_authenticated and self.request.user.role == 'admin':
            return AdminTicketDetailSerializer
        return PublicTicketDetailSerializer

    def get_queryset(self):
        return Ticket.objects.all()


# --- Authenticated Endpoints ---

class TicketCreateView(generics.CreateAPIView):
    """Create ticket — AI assigns priority."""
    serializer_class = TicketCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        title = serializer.validated_data.get('title', '')
        description = serializer.validated_data.get('description', '')
        priority = ai_assign_priority(title, description)
        serializer.save(created_by=self.request.user, priority=priority)


class TicketUpdateDeleteView(generics.UpdateAPIView, generics.DestroyAPIView):
    """Admin can update/delete tickets."""
    serializer_class = TicketUpdateSerializer
    permission_classes = [IsAdmin]
    queryset = Ticket.objects.all()

    def perform_update(self, serializer):
        instance = serializer.save()
        if instance.status == 'resolved' and not instance.resolved_at:
            instance.resolved_at = timezone.now()
            instance.save()


class MessageCreateView(generics.CreateAPIView):
    """Post a reply — must be logged in."""
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(
            sender=self.request.user,
            ticket_id=self.kwargs['ticket_id'],
        )


class MessageListView(generics.ListAPIView):
    """List messages — public."""
    serializer_class = MessageSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return Message.objects.filter(ticket_id=self.kwargs['ticket_id'])


# --- Vote Endpoint ---

class VoteToggleView(APIView):
    """Toggle upvote on a message."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, message_id):
        try:
            message = Message.objects.get(id=message_id)
        except Message.DoesNotExist:
            return Response({'error': 'Message not found'}, status=404)

        vote, created = Vote.objects.get_or_create(
            user=request.user, message=message,
        )
        if not created:
            vote.delete()
            return Response({'voted': False, 'upvote_count': message.votes.count()})
        return Response({'voted': True, 'upvote_count': message.votes.count()})


# --- AI Chatbot Endpoint ---

class AIChatView(APIView):
    """AI assistant — searches similar tickets and provides help."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        user_message = request.data.get('message', '').strip()
        if not user_message:
            return Response({'error': 'Message is required'}, status=400)

        # Step 1: Search for similar tickets
        similar = find_similar_tickets(user_message)
        similar_data = []
        for t in similar:
            similar_data.append({
                'id': t.id,
                'title': t.title,
                'status': t.status,
                'reply_count': t.reply_count,
                'total_votes': t.total_votes,
            })

        # Step 2: Generate AI response
        if similar_data:
            ticket_list = "\n".join(
                [f"- \"{t['title']}\" ({t['reply_count']} replies, {t['total_votes']} votes)"
                 for t in similar_data[:3]]
            )
            ai_response = (
                f"I found some similar issues that might help:\n\n{ticket_list}\n\n"
                f"Would you like to check these existing discussions, "
                f"or would you prefer to create a new ticket?"
            )
        else:
            # Try to provide basic help
            ai_response = (
                f"I couldn't find any similar issues. Here are some things you can try:\n\n"
                f"1. Check our Knowledge Base for common solutions\n"
                f"2. Make sure you've tried basic troubleshooting (clear cache, restart, etc.)\n"
                f"3. If the issue persists, I can help you create a new ticket\n\n"
                f"Would you like to create a ticket?"
            )

        return Response({
            'response': ai_response,
            'similar_tickets': similar_data,
            'has_similar': len(similar_data) > 0,
        })


class AISuggestView(APIView):
    """AI quick help — tries to answer based on KB and tickets."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        query = request.data.get('message', '').strip()
        if not query:
            return Response({'error': 'Message required'}, status=400)

        # Search KB articles
        from knowledge_base.models import Article
        words = [w for w in query.lower().split() if len(w) > 2]
        q = Q()
        for word in words[:10]:
            q |= Q(title__icontains=word) | Q(content__icontains=word)

        articles = Article.objects.filter(q, is_published=True)[:3]

        if articles.exists():
            article_list = []
            for a in articles:
                snippet = a.content[:150] + '...' if len(a.content) > 150 else a.content
                article_list.append({
                    'id': a.id,
                    'title': a.title,
                    'snippet': snippet,
                })
            return Response({
                'response': 'I found some helpful articles from our Knowledge Base:',
                'articles': article_list,
                'resolved': False,
            })

        return Response({
            'response': "I don't have a specific solution for this. Let me search for similar tickets from other users.",
            'articles': [],
            'resolved': False,
        })
