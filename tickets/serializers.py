from rest_framework import serializers
from .models import Ticket, Message, Vote
from accounts.serializers import UserSerializer


class VoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vote
        fields = ['id', 'user', 'message', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']


class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    upvote_count = serializers.IntegerField(read_only=True)
    user_has_voted = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ['id', 'ticket', 'sender', 'body', 'is_ai',
                  'upvote_count', 'user_has_voted', 'created_at']
        read_only_fields = ['id', 'ticket', 'sender', 'is_ai', 'created_at']

    def get_user_has_voted(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.votes.filter(user=request.user).exists()
        return False


class PublicTicketListSerializer(serializers.ModelSerializer):
    """Public view — no priority field."""
    created_by = UserSerializer(read_only=True)
    reply_count = serializers.IntegerField(read_only=True)
    total_votes = serializers.IntegerField(read_only=True)

    class Meta:
        model = Ticket
        fields = ['id', 'title', 'status', 'created_by',
                  'reply_count', 'total_votes', 'created_at', 'updated_at']


class AdminTicketListSerializer(serializers.ModelSerializer):
    """Admin view — includes priority."""
    created_by = UserSerializer(read_only=True)
    assigned_to = UserSerializer(read_only=True)
    reply_count = serializers.IntegerField(read_only=True)
    total_votes = serializers.IntegerField(read_only=True)

    class Meta:
        model = Ticket
        fields = ['id', 'title', 'status', 'priority', 'created_by',
                  'assigned_to', 'reply_count', 'total_votes',
                  'created_at', 'updated_at']


class PublicTicketDetailSerializer(serializers.ModelSerializer):
    """Public detail — no priority."""
    created_by = UserSerializer(read_only=True)
    messages = serializers.SerializerMethodField()

    class Meta:
        model = Ticket
        fields = ['id', 'title', 'description', 'status',
                  'created_by', 'messages', 'created_at', 'updated_at']

    def get_messages(self, obj):
        messages = obj.messages.all()
        return MessageSerializer(messages, many=True, context=self.context).data


class AdminTicketDetailSerializer(serializers.ModelSerializer):
    """Admin detail — includes priority."""
    created_by = UserSerializer(read_only=True)
    assigned_to = UserSerializer(read_only=True)
    messages = serializers.SerializerMethodField()

    class Meta:
        model = Ticket
        fields = ['id', 'title', 'description', 'status', 'priority',
                  'created_by', 'assigned_to', 'messages',
                  'created_at', 'updated_at', 'resolved_at']
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

    def get_messages(self, obj):
        messages = obj.messages.all()
        return MessageSerializer(messages, many=True, context=self.context).data


class TicketCreateSerializer(serializers.ModelSerializer):
    """User creates ticket — no priority (AI decides)."""
    class Meta:
        model = Ticket
        fields = ['id', 'title', 'description']
        read_only_fields = ['id']


class TicketUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ticket
        fields = ['title', 'description', 'status', 'priority', 'assigned_to']
