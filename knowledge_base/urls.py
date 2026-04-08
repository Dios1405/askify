from django.urls import path
from . import views

urlpatterns = [
    path('categories/', views.CategoryListCreateView.as_view(), name='category-list'),
    path('categories/<int:pk>/', views.CategoryDetailView.as_view(), name='category-detail'),
    path('articles/', views.ArticleListCreateView.as_view(), name='article-list'),
    path('articles/<int:pk>/', views.ArticleDetailView.as_view(), name='article-detail'),
]
