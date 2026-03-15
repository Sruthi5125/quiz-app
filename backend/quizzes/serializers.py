from rest_framework import serializers
from .models import Quiz, Question


class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = [
            'id', 'question_text',
            'option_a', 'option_b', 'option_c', 'option_d',
            'correct_option', 'explanation', 'order_index'
        ]


class QuizSerializer(serializers.ModelSerializer):
    # nested — includes all questions inside the quiz response
    questions = QuestionSerializer(many=True, read_only=True)
    # shows username string instead of just a user ID number
    owner = serializers.SerializerMethodField()

    class Meta:
        model = Quiz
        fields = [
            'id', 'topic', 'difficulty', 'question_count',
            'status', 'created_at', 'owner', 'questions'
        ]

    def get_owner(self, obj):
        return obj.user.username


class QuizCreateSerializer(serializers.Serializer):
    topic = serializers.CharField(max_length=200)
    difficulty = serializers.ChoiceField(choices=['easy', 'medium', 'hard'])
    question_count = serializers.IntegerField(min_value=5, max_value=20)

    def validate_topic(self, value):
        if not value.strip():
            raise serializers.ValidationError("Topic cannot be blank.")
        return value.strip()