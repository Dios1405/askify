from rest_framework import generics, permissions
from django.db.models import Count
from .models import Article, Category
from .serializers import (
    ArticleListSerializer, ArticleDetailSerializer, CategorySerializer,
)
from accounts.views import IsAdmin


class CategoryListCreateView(generics.ListCreateAPIView):
    serializer_class = CategorySerializer

    def get_queryset(self):
        return Category.objects.annotate(article_count=Count('articles'))

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdmin()]
        return [permissions.IsAuthenticated()]


class CategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdmin]


class ArticleListCreateView(generics.ListCreateAPIView):
    search_fields = ['title', 'content', 'tags']
    filterset_fields = ['category', 'is_published']

    def get_serializer_class(self):
        return ArticleListSerializer

    def get_queryset(self):
        qs = Article.objects.select_related('category', 'author')
        # Non-admin only sees published articles
        if self.request.user.role != 'admin':
            qs = qs.filter(is_published=True)
        return qs

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdmin()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class ArticleDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ArticleDetailSerializer

    def get_queryset(self):
        qs = Article.objects.select_related('category', 'author')
        if self.request.user.role != 'admin':
            qs = qs.filter(is_published=True)
        return qs

    def get_permissions(self):
        if self.request.method in ('PUT', 'PATCH', 'DELETE'):
            return [IsAdmin()]
        return [permissions.IsAuthenticated()]
