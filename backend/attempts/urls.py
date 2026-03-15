from django.urls import path
from .views import StartAttemptView, SubmitAttemptView, AttemptResultView, AttemptHistoryView

urlpatterns = [
    path('quizzes/<int:quiz_id>/start/', StartAttemptView.as_view()),
    path('<int:attempt_id>/submit/', SubmitAttemptView.as_view()),
    path('<int:attempt_id>/results/', AttemptResultView.as_view()),
    path('history/', AttemptHistoryView.as_view()),
]