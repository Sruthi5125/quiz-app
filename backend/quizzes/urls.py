from django.urls import path
from .views import QuizListCreateView, QuizDetailView

urlpatterns = [
    path('', QuizListCreateView.as_view()),
    path('<int:pk>/', QuizDetailView.as_view()),
]