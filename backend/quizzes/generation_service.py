import json
from groq import Groq
from django.conf import settings

# Configure Groq client
_client = Groq(api_key=settings.GROQ_API_KEY)


def build_prompt(topic: str, difficulty: str, count: int) -> str:
    """
    Builds a precise prompt based on difficulty.
    Difficulty-aware prompt = innovation point 1.
    """

    difficulty_instructions = {
        'easy': (
            "Focus on basic definitions, simple concepts, and foundational knowledge. "
            "Questions should be straightforward for beginners."
        ),
        'medium': (
            "Focus on practical application, how things work, and common use cases. "
            "Questions should require some working knowledge."
        ),
        'hard': (
            "Focus on edge cases, deep reasoning, tricky comparisons, and expert-level details. "
            "Questions should challenge experienced practitioners."
        ),
    }

    instruction = difficulty_instructions.get(difficulty, difficulty_instructions['medium'])

    return f"""You are a quiz generator. Generate exactly {count} multiple choice questions about "{topic}".

Difficulty level: {difficulty.upper()}
{instruction}

STRICT RULES:
- Return ONLY a valid JSON object. No markdown. No explanation. No extra text.
- Exactly {count} questions. No more, no less.
- Each question must have exactly 4 options: A, B, C, D.
- correct_option must be exactly one of: "A", "B", "C", or "D"
- All questions must be unique. No duplicates.
- explanation must clearly explain why the correct answer is right.

Return this exact JSON structure:
{{
  "questions": [
    {{
      "question_text": "Your question here?",
      "option_a": "First option",
      "option_b": "Second option",
      "option_c": "Third option",
      "option_d": "Fourth option",
      "correct_option": "A",
      "explanation": "Why A is correct."
    }}
  ]
}}"""


def validate_ai_response(data: dict, expected_count: int) -> list:
    """
    Validates the parsed JSON from AI.
    This is your defence against bad AI output.
    Returns cleaned list of questions or raises ValueError.
    """

    # Check top-level structure exists
    if 'questions' not in data:
        raise ValueError("AI response missing 'questions' key.")

    questions = data['questions']

    # Check count matches what was requested
    if len(questions) != expected_count:
        raise ValueError(
            f"Expected {expected_count} questions, got {len(questions)}."
        )

    required_fields = [
        'question_text', 'option_a', 'option_b',
        'option_c', 'option_d', 'correct_option', 'explanation'
    ]
    valid_options = {'A', 'B', 'C', 'D'}

    # Innovation point 2: duplicate detection
    seen_questions = set()

    cleaned = []
    for i, q in enumerate(questions):

        # Check all required fields are present and non-empty
        for field in required_fields:
            if field not in q or not str(q[field]).strip():
                raise ValueError(
                    f"Question {i+1} missing or empty field: '{field}'"
                )

        # Check correct_option is exactly A, B, C, or D
        correct = str(q['correct_option']).strip().upper()
        if correct not in valid_options:
            raise ValueError(
                f"Question {i+1} has invalid correct_option: '{q['correct_option']}'"
            )

        # Innovation point 3: reject duplicate questions
        question_lower = q['question_text'].strip().lower()
        if question_lower in seen_questions:
            raise ValueError(
                f"Duplicate question detected at position {i+1}."
            )
        seen_questions.add(question_lower)

        # Build cleaned question with normalised correct_option
        cleaned.append({
            'question_text': q['question_text'].strip(),
            'option_a': q['option_a'].strip(),
            'option_b': q['option_b'].strip(),
            'option_c': q['option_c'].strip(),
            'option_d': q['option_d'].strip(),
            'correct_option': correct,  # normalised to uppercase
            'explanation': q['explanation'].strip(),
        })

    return cleaned


def generate_questions(topic: str, difficulty: str, count: int) -> list:
    """
    Main function called from views.
    Calls AI, parses response, validates, returns clean list.
    Raises exception if anything goes wrong — view handles that.
    """
    prompt = build_prompt(topic, difficulty, count)

    # Call the AI API
    response = _client.chat.completions.create(
        model='llama-3.1-8b-instant',
        messages=[{'role': 'user', 'content': prompt}],
    )
    raw_text = response.choices[0].message.content

    # Strip markdown code fences if AI adds them despite instructions
    # (AI sometimes wraps JSON in ```json ... ``` anyway)
    cleaned_text = raw_text.strip()
    if cleaned_text.startswith('```'):
        lines = cleaned_text.split('\n')
        # Remove first line (```json) and last line (```)
        cleaned_text = '\n'.join(lines[1:-1])

    # Parse JSON — if AI returned garbage, this raises an exception
    try:
        parsed = json.loads(cleaned_text)
    except json.JSONDecodeError as e:
        raise ValueError(f"AI returned invalid JSON: {e}")

    # Validate the parsed structure
    validated_questions = validate_ai_response(parsed, count)

    return validated_questions