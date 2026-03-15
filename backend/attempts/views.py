from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.utils import timezone
from django.db import transaction
from .models import QuizAttempt, AttemptAnswer
from .serializers import (
    QuizAttemptSerializer,
    AttemptSummarySerializer,
    SubmitAttemptSerializer
)
from quizzes.models import Quiz, Question


class StartAttemptView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, quiz_id):
        try:
            quiz = Quiz.objects.get(id=quiz_id, user=request.user)
        except Quiz.DoesNotExist:
            return Response(
                {"error": "Quiz not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        if quiz.status != 'ready':
            return Response(
                {"error": "Quiz is not ready."},
                status=status.HTTP_400_BAD_REQUEST
            )

        attempt = QuizAttempt.objects.create(
            user=request.user,
            quiz=quiz,
            total_questions=quiz.questions.count(),
        )

        return Response(
            {"attempt_id": attempt.id, "started_at": attempt.started_at},
            status=status.HTTP_201_CREATED
        )


class SubmitAttemptView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, attempt_id):
        try:
            attempt = QuizAttempt.objects.get(
                id=attempt_id, user=request.user
            )
        except QuizAttempt.DoesNotExist:
            return Response(
                {"error": "Attempt not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        if attempt.submitted_at is not None:
            return Response(
                {"error": "Attempt already submitted."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = SubmitAttemptSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        answers_input = serializer.validated_data['answers']
        questions = Question.objects.filter(quiz=attempt.quiz)
        question_map = {str(q.id): q for q in questions}

        score = 0
        answer_rows = []

        for question_id_str, selected_option in answers_input.items():
            question = question_map.get(question_id_str)
            if not question:
                continue
            is_correct = selected_option.upper() == question.correct_option
            if is_correct:
                score += 1
            answer_rows.append(AttemptAnswer(
                attempt=attempt,
                question=question,
                selected_option=selected_option.upper(),
                is_correct=is_correct,
            ))

        time_taken = int(
            (timezone.now() - attempt.started_at).total_seconds()
        )
        total = attempt.total_questions
        percentage = round((score / total * 100), 2) if total > 0 else 0

        with transaction.atomic():
            AttemptAnswer.objects.bulk_create(answer_rows)
            attempt.score = score
            attempt.percentage = percentage
            attempt.submitted_at = timezone.now()
            attempt.time_taken_seconds = time_taken
            attempt.save()

        # Return full result immediately after submit
        result_serializer = QuizAttemptSerializer(attempt)
        return Response(result_serializer.data, status=status.HTTP_200_OK)


class AttemptResultView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, attempt_id):
        try:
            # select_related — fetch quiz in same query (FK traversal)
            # prefetch_related — fetch all answers + their questions efficiently
            attempt = QuizAttempt.objects.select_related(
                'quiz', 'user'
            ).prefetch_related(
                'answers__question'
            ).get(id=attempt_id, user=request.user)
        except QuizAttempt.DoesNotExist:
            return Response(
                {"error": "Attempt not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = QuizAttemptSerializer(attempt)
        return Response(serializer.data)


class AttemptHistoryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # select_related fetches quiz data in the same query
        # Only completed attempts (submitted_at is not null)
        attempts = QuizAttempt.objects.select_related(
            'quiz'
        ).filter(
            user=request.user,
            submitted_at__isnull=False
        ).order_by('-submitted_at')

        # Summary serializer — no nested answers
        serializer = AttemptSummarySerializer(attempts, many=True)
        return Response(serializer.data)