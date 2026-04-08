from django.contrib import admin
from .models import Ticket, Message, Vote

class MessageInline(admin.TabularInline):
    model = Message
    extra = 0
    readonly_fields = ['sender', 'created_at', 'is_ai']

@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'status', 'priority', 'created_by', 'assigned_to', 'created_at']
    list_filter = ['status', 'priority']
    search_fields = ['title', 'description']
    inlines = [MessageInline]

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'ticket', 'sender', 'is_ai', 'created_at']

@admin.register(Vote)
class VoteAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'message', 'created_at']
