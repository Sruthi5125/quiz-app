from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .models import Quiz, Question
from .serializers import QuizSerializer, QuizCreateSerializer
from .generation_service import generate_questions  # new import


def create_placeholder_questions(quiz):
    """
    Hardcoded questions for now.
    In Milestone 5 we replace this with an AI call.
    """
    samples = [
        {
            "question_text": f"Sample question 1 about {quiz.topic}?",
            "option_a": "Option A", "option_b": "Option B",
            "option_c": "Option C", "option_d": "Option D",
            "correct_option": "A",
            "explanation": "This is a placeholder explanation.",
            "order_index": 1,
        },
        {
            "question_text": f"Sample question 2 about {quiz.topic}?",
            "option_a": "Option A", "option_b": "Option B",
            "option_c": "Option C", "option_d": "Option D",
            "correct_option": "B",
            "explanation": "This is a placeholder explanation.",
            "order_index": 2,
        },
        {
            "question_text": f"Sample question 3 about {quiz.topic}?",
            "option_a": "Option A", "option_b": "Option B",
            "option_c": "Option C", "option_d": "Option D",
            "correct_option": "C",
            "explanation": "This is a placeholder explanation.",
            "order_index": 3,
        },
    ]
    for q in samples:
        Question.objects.create(quiz=quiz, **q)


class QuizListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        quizzes = Quiz.objects.filter(
            user=request.user
        ).order_by('-created_at')
        serializer = QuizSerializer(quizzes, many=True)
        return Response(serializer.data)

    def post(self, request):
        # Step 1: validate incoming request
        create_serializer = QuizCreateSerializer(data=request.data)
        if not create_serializer.is_valid():
            return Response(
                create_serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        validated = create_serializer.validated_data

        # Step 2: create quiz row with status=generating
        quiz = Quiz.objects.create(
            user=request.user,
            topic=validated['topic'],
            difficulty=validated['difficulty'],
            question_count=validated['question_count'],
            status='generating',
        )

        # Step 3: call AI service — validate — save inside transaction
        try:
            questions = generate_questions(
                topic=validated['topic'],
                difficulty=validated['difficulty'],
                count=validated['question_count'],
            )

            # Save all questions in one transaction
            # If any Question.create fails, none are saved — data stays clean
            from django.db import transaction
            with transaction.atomic():
                for i, q in enumerate(questions):
                    Question.objects.create(
                        quiz=quiz,
                        order_index=i + 1,
                        **q
                    )

            quiz.status = 'ready'
            quiz.save()

        except Exception as e:
            import traceback
            traceback.print_exc()
            quiz.status = 'failed'
            quiz.save()
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # Step 4: return full quiz with questions
        response_serializer = QuizSerializer(quiz)
        return Response(
            response_serializer.data,
            status=status.HTTP_201_CREATED
        )


class QuizDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            quiz = Quiz.objects.get(id=pk, user=request.user)
        except Quiz.DoesNotExist:
            return Response(
                {"error": "Quiz not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = QuizSerializer(quiz)
        return Response(serializer.data)