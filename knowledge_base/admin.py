from django.contrib import admin
from .models import Category, Article

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_at']

@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'author', 'is_published', 'updated_at']
    list_filter = ['category', 'is_published']
    search_fields = ['title', 'content', 'tags']
