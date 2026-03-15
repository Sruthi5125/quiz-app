from django.db import models
from django.contrib.auth.models import User

class Quiz(models.Model):

    STATUS_CHOICES = [
        ('generating', 'Generating'),
        ('ready', 'Ready'),
        ('failed', 'Failed'),
    ]

    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='quizzes'
    )
    topic = models.CharField(max_length=200)
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES)
    question_count = models.IntegerField(default=5)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='generating')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.topic} ({self.difficulty}) by {self.user.username}"


class Question(models.Model):

    OPTION_CHOICES = [
        ('A', 'A'), ('B', 'B'), ('C', 'C'), ('D', 'D'),
    ]

    quiz = models.ForeignKey(
        Quiz,
        on_delete=models.CASCADE,
        related_name='questions'
    )
    question_text = models.TextField()
    option_a = models.CharField(max_length=500)
    option_b = models.CharField(max_length=500)
    option_c = models.CharField(max_length=500)
    option_d = models.CharField(max_length=500)
    correct_option = models.CharField(max_length=1, choices=OPTION_CHOICES)
    explanation = models.TextField(blank=True)
    order_index = models.IntegerField(default=0)

    def __str__(self):
        return f"Q{self.order_index}: {self.question_text[:50]}"