from django.contrib import admin
from .models import Quiz, Question

@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ['topic', 'difficulty', 'status', 'user', 'created_at']
    list_filter = ['status', 'difficulty']

@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ['question_text', 'quiz', 'correct_option', 'order_index']

