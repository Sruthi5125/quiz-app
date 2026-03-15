from rest_framework import serializers
from .models import QuizAttempt, AttemptAnswer


class AttemptAnswerSerializer(serializers.ModelSerializer):
    question_text = serializers.CharField(
        source='question.question_text', read_only=True
    )
    correct_option = serializers.CharField(
        source='question.correct_option', read_only=True
    )
    explanation = serializers.CharField(
        source='question.explanation', read_only=True
    )
    option_a = serializers.CharField(source='question.option_a', read_only=True)
    option_b = serializers.CharField(source='question.option_b', read_only=True)
    option_c = serializers.CharField(source='question.option_c', read_only=True)
    option_d = serializers.CharField(source='question.option_d', read_only=True)

    class Meta:
        model = AttemptAnswer
        fields = [
            'id', 'question', 'question_text',
            'option_a', 'option_b', 'option_c', 'option_d',
            'selected_option', 'is_correct',
            'correct_option', 'explanation'
        ]


# Full serializer — used for results detail page
class QuizAttemptSerializer(serializers.ModelSerializer):
    answers = AttemptAnswerSerializer(many=True, read_only=True)
    quiz_topic = serializers.CharField(source='quiz.topic', read_only=True)
    quiz_difficulty = serializers.CharField(source='quiz.difficulty', read_only=True)

    class Meta:
        model = QuizAttempt
        fields = [
            'id', 'quiz', 'quiz_topic', 'quiz_difficulty',
            'score', 'total_questions', 'percentage',
            'started_at', 'submitted_at', 'time_taken_seconds',
            'answers'
        ]


# Summary serializer — used for history list only
# No answers nested — keeps response small
class AttemptSummarySerializer(serializers.ModelSerializer):
    quiz_topic = serializers.CharField(source='quiz.topic', read_only=True)
    quiz_difficulty = serializers.CharField(source='quiz.difficulty', read_only=True)
    quiz_id = serializers.IntegerField(source='quiz.id', read_only=True)

    class Meta:
        model = QuizAttempt
        fields = [
            'id', 'quiz_id', 'quiz_topic', 'quiz_difficulty',
            'score', 'total_questions', 'percentage',
            'submitted_at', 'time_taken_seconds'
        ]


class SubmitAttemptSerializer(serializers.Serializer):
    answers = serializers.DictField(
        child=serializers.ChoiceField(choices=['A', 'B', 'C', 'D'])
    )