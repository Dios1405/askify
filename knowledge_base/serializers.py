from rest_framework import serializers
from .models import Article, Category


class CategorySerializer(serializers.ModelSerializer):
    article_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'article_count', 'created_at']
        read_only_fields = ['id', 'created_at']


class ArticleListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    author_name = serializers.CharField(source='author.username', read_only=True)

    class Meta:
        model = Article
        fields = ['id', 'title', 'category', 'category_name', 'tags',
                  'author_name', 'is_published', 'created_at', 'updated_at']


class ArticleDetailSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    author_name = serializers.CharField(source='author.username', read_only=True)

    class Meta:
        model = Article
        fields = ['id', 'title', 'content', 'category', 'category_name',
                  'tags', 'is_published', 'author', 'author_name',
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'author', 'created_at', 'updated_at']
