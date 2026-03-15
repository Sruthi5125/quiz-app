from django.db import models
from django.contrib.auth.models import User
from quizzes.models import Quiz, Question


class QuizAttempt(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='attempts'
    )
    quiz = models.ForeignKey(
        Quiz,
        on_delete=models.CASCADE,
        related_name='attempts'
    )
    score = models.IntegerField(default=0)
    total_questions = models.IntegerField(default=0)
    percentage = models.FloatField(default=0.0)
    started_at = models.DateTimeField(auto_now_add=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    time_taken_seconds = models.IntegerField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.username} — {self.quiz.topic} — {self.score}/{self.total_questions}"


class AttemptAnswer(models.Model):
    attempt = models.ForeignKey(
        QuizAttempt,
        on_delete=models.CASCADE,
        related_name='answers'
    )
    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name='attempt_answers'
    )
    selected_option = models.CharField(max_length=1)
    is_correct = models.BooleanField(default=False)

    def __str__(self):
        return f"Q{self.question.id} → {self.selected_option} ({'✓' if self.is_correct else '✗'})"