from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.db.models import Count, Avg, F, Q
from django.db.models.functions import TruncDate, TruncWeek, TruncMonth
from django.utils import timezone
from datetime import timedelta
from tickets.models import Ticket
from accounts.views import IsAdmin


class TicketTrendsView(APIView):
    """Ticket creation trends over time."""
    permission_classes = [IsAdmin]

    def get(self, request):
        period = request.query_params.get('period', 'daily')  # daily, weekly, monthly
        days = int(request.query_params.get('days', 30))
        since = timezone.now() - timedelta(days=days)

        trunc_fn = {
            'daily': TruncDate,
            'weekly': TruncWeek,
            'monthly': TruncMonth,
        }.get(period, TruncDate)

        data = (
            Ticket.objects
            .filter(created_at__gte=since)
            .annotate(period=trunc_fn('created_at'))
            .values('period')
            .annotate(count=Count('id'))
            .order_by('period')
        )
        return Response(list(data))


class TicketStatusBreakdownView(APIView):
    """Current ticket counts by status."""
    permission_classes = [IsAdmin]

    def get(self, request):
        data = (
            Ticket.objects
            .values('status')
            .annotate(count=Count('id'))
            .order_by('status')
        )
        return Response(list(data))


class TicketPriorityBreakdownView(APIView):
    """Current ticket counts by priority."""
    permission_classes = [IsAdmin]

    def get(self, request):
        data = (
            Ticket.objects
            .values('priority')
            .annotate(count=Count('id'))
            .order_by('priority')
        )
        return Response(list(data))


class ResolutionTimeView(APIView):
    """Average resolution time for resolved/closed tickets."""
    permission_classes = [IsAdmin]

    def get(self, request):
        days = int(request.query_params.get('days', 30))
        since = timezone.now() - timedelta(days=days)

        resolved = Ticket.objects.filter(
            resolved_at__isnull=False,
            resolved_at__gte=since,
        )
        total = resolved.count()

        if total == 0:
            return Response({
                'average_hours': None,
                'total_resolved': 0,
                'period_days': days,
            })

        # Compute average resolution time in hours
        avg_data = resolved.aggregate(
            avg_resolution=Avg(F('resolved_at') - F('created_at'))
        )
        avg_duration = avg_data['avg_resolution']
        avg_hours = avg_duration.total_seconds() / 3600 if avg_duration else None

        # Per-priority breakdown
        per_priority = (
            resolved
            .values('priority')
            .annotate(
                count=Count('id'),
                avg_resolution=Avg(F('resolved_at') - F('created_at')),
            )
            .order_by('priority')
        )
        priority_data = []
        for item in per_priority:
            dur = item['avg_resolution']
            priority_data.append({
                'priority': item['priority'],
                'count': item['count'],
                'avg_hours': round(dur.total_seconds() / 3600, 2) if dur else None,
            })

        return Response({
            'average_hours': round(avg_hours, 2) if avg_hours else None,
            'total_resolved': total,
            'period_days': days,
            'by_priority': priority_data,
        })


class DashboardSummaryView(APIView):
    """Quick dashboard summary stats."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role == 'admin':
            tickets = Ticket.objects.all()
        else:
            tickets = Ticket.objects.filter(created_by=user)

        return Response({
            'total_tickets': tickets.count(),
            'open': tickets.filter(status='open').count(),
            'in_progress': tickets.filter(status='in_progress').count(),
            'resolved': tickets.filter(status='resolved').count(),
            'closed': tickets.filter(status='closed').count(),
            'urgent': tickets.filter(priority='urgent', status__in=['open', 'in_progress']).count(),
        })
