# AI-Powered Quiz App

A full-stack quiz application that uses AI to generate customized quizzes on any topic. Built with **Django REST Framework** (backend) and **Next.js 16** (frontend), connected via a JWT-authenticated REST API.

---

**Live Demo:** [https://quiz-app-wine-pi.vercel.app/login](https://quiz-app-wine-pi.vercel.app/login)

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [How to Run Locally](#how-to-run-locally)
3. [Database Design Decisions](#database-design-decisions)
4. [API Structure](#api-structure)
5. [Challenges & Solutions](#challenges--solutions)
6. [Features: Implemented vs. Skipped](#features-implemented-vs-skipped)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Django 5.1 + DRF | 
| Auth | JWT (SimpleJWT) |
| Database | PostgreSQL |
| AI | Groq API (`llama-3.1-8b-instant`) | 
| Frontend | Next.js 16 (App Router) | 
| Styling | Tailwind CSS 4 | 
| HTTP Client | Axios | 

---

## How to Run Locally

### Prerequisites

- Python 3.12+
- Node.js 18+
- PostgreSQL running locally
- A [Groq API key](https://console.groq.com/) (free tier available)

---

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd quiz-app
```

---

### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

Create a `.env` file inside `backend/`:

```env
SECRET_KEY=your-django-secret-key
DEBUG=True
DATABASE_URL=postgres://quizapp_user:<password>@localhost:5432/quizapp_db
GROQ_API_KEY=your-groq-api-key
```

Set up the database:

```bash
# Create the PostgreSQL database (run in psql)
# CREATE DATABASE quizapp_db;
# CREATE USER quizapp_user WITH PASSWORD 'your-password';
# GRANT ALL PRIVILEGES ON DATABASE quizapp_db TO quizapp_user;

python manage.py migrate
python manage.py createsuperuser   # optional, for admin panel
python manage.py runserver
```

Backend runs at: `http://localhost:8000`

---

### 3. Frontend Setup

```bash
cd frontend

npm install
```

Create a `.env.local` file inside `frontend/`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

```bash
npx next dev
```

Frontend runs at: `http://localhost:3000`

---

### 4. Verify

- Open `http://localhost:3000` — you should see the login page
- Register an account, generate a quiz, take it, and review your results
- Admin panel: `http://localhost:8000/admin/`

---

## Database Design Decisions

### Entity Relationship Overview

```
User
 └── Quiz (one-to-many)
      └── Question (one-to-many)
           └── AttemptAnswer (one-to-many)
 └── QuizAttempt (one-to-many)
      └── AttemptAnswer (one-to-many)
```


### Model Summary

| Model | Key Fields | Relationships |
|---|---|---|
| `Quiz` | `topic`, `difficulty`, `question_count`, `status` | `ForeignKey(User)` |
| `Question` | `question_text`, `option_a–d`, `correct_option`, `explanation`, `order_index` | `ForeignKey(Quiz)` |
| `QuizAttempt` | `score`, `total_questions`, `percentage`, `time_taken_seconds` | `ForeignKey(User)`, `ForeignKey(Quiz)` |
| `AttemptAnswer` | `selected_option`, `is_correct` | `ForeignKey(QuizAttempt)`, `ForeignKey(Question)` |

---

## API Structure

I organized the API into three Django apps — `users`, `quizzes`, and `attempts` — each owning their own models, views, serializers, and URL configs. This mirrors a service-boundary mindset: each app is independently understandable.

### Base URL: `/api/`

### Authentication — `/api/auth/`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register/` | Create account (username, email, password) |
| `POST` | `/api/auth/login/` | Returns `access` + `refresh` JWT tokens |
| `POST` | `/api/auth/refresh/` | Exchange refresh token for new access token |
| `GET` | `/api/auth/me/` | Get current authenticated user info |

### Quizzes — `/api/quizzes/`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/quizzes/` | List all quizzes for the authenticated user |
| `POST` | `/api/quizzes/` | Create quiz — triggers AI generation synchronously |
| `GET` | `/api/quizzes/<id>/` | Retrieve quiz with all nested questions |

### Attempts — `/api/attempts/`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/attempts/quizzes/<quiz_id>/start/` | Start a new attempt (returns attempt ID) |
| `POST` | `/api/attempts/<attempt_id>/submit/` | Submit answers `{question_id: selected_option}` |
| `GET` | `/api/attempts/<attempt_id>/results/` | Full results with per-question review + explanations |
| `GET` | `/api/attempts/history/` | All completed attempts for the user (summary only) |

---

## Challenges & Solutions

### 1. AI Returns Inconsistent JSON

**Problem:** The Groq API (`llama-3.1-8b-instant`) sometimes wraps its response in markdown code fences (` ```json ... ``` `) and occasionally omits fields or returns fewer questions than requested.

**Solution:** Built a multi-layer validation pipeline in `generation_service.py`:
1. Strip markdown fences with a regex before parsing
2. Validate the presence of all required fields (`question_text`, `option_a` through `option_d`, `correct_option`, `explanation`)
3. Validate that `correct_option` is strictly one of `A`, `B`, `C`, `D`
4. Deduplicate questions by normalized question text to prevent near-identical entries
5. Validate final count matches requested `question_count`

If any validation step fails, the quiz is marked `status='failed'` with a clear error rather than silently saving bad data.

### 2. JWT Token Expiry Mid-Session

**Problem:** Access tokens expire after 30 minutes. A user mid-quiz would get 401 errors.

**Solution:** Added an Axios request interceptor in `frontend/src/lib/api.ts` that:
- Attaches the current `accessToken` from localStorage to every request
- On a 401 response, automatically calls `/api/auth/refresh/` with the stored refresh token, updates localStorage, retries the original request once
- If the refresh also fails (expired or revoked), redirects to `/login`

The user never sees an error mid-quiz due to token expiry.

### 3. Transactional Quiz Creation

**Problem:** If AI generation succeeds but saving questions to the database fails (e.g., a validation error on the 8th of 10 questions), the quiz would be left in a partial, inconsistent state.

**Solution:** The entire quiz creation (quiz row + all question rows) is wrapped in a single database transaction using Django's `transaction.atomic()`. If any question fails to save, the whole operation rolls back. The API returns either a complete, ready quiz or an error — never a partial quiz.

### 4. Difficulty Calibration for AI

**Problem:** Asking the AI to "make a hard quiz" without guidance produced questions that were inconsistently difficult.

**Solution:** The prompt engineering in `generation_service.py` includes explicit difficulty descriptors:
- `easy` → factual recall, straightforward wording, obvious distractors
- `medium` → conceptual understanding, requires some reasoning
- `hard` → nuanced distinctions, application-level thinking, plausible distractors

This significantly improved question quality consistency across difficulty levels.

---

## Features: Implemented vs. Skipped

### Implemented

| Feature | Notes |
|---|---|
| JWT Authentication | Register, login, token refresh, protected routes |
| AI Quiz Generation | Topic + difficulty + question count, powered by Groq |
| Quiz Taking Interface | Progress tracking, prevents partial submission |
| Detailed Results Review | Per-question breakdown with correct answer + AI explanation |
| Attempt History | All-time stats (avg score, best score, pass rate) |
| Retake Support | Any quiz can be attempted multiple times |
| Admin Panel | Full CRUD visibility on all models via Django admin |
| Responsive UI | Tailwind CSS, works on desktop and mobile |
| Error States | API errors surface clearly in the UI, not silent failures |

### Skipped (and Why)

| Feature | Reason Skipped |
|---|---|
| **Async quiz generation** | For the scope of this project, synchronous generation (1–3 seconds via Groq) is acceptable. Celery/Redis async would be the right call at scale but adds significant infrastructure complexity. |
| **Timer on quiz page** | The `time_taken_seconds` is already recorded server-side. A visible countdown was deprioritized to keep the UX low-pressure for this MVP. |
| **Leaderboards / social features** | Out of scope — the data model supports multi-user but the UI focuses on personal performance. |
| **Question shuffling per attempt** | `order_index` exists on `Question` to support this. Skipped to keep the review page predictable (same order as the attempt). |
| **Password reset via email** | Requires email SMTP configuration. Deferred as it adds deployment complexity without changing the core experience. |
| **Rate limiting on AI generation** | Should be added before any public deployment. The Groq API has its own rate limits but there's no per-user throttle in the app yet. |

---

## Project Structure

```
quiz-app/
├── backend/
│   ├── config/                # Django project settings and root URLs
│   │   ├── settings.py
│   │   └── urls.py
│   ├── users/                 # Registration, login, user profile
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── quizzes/               # Quiz creation, AI generation, question storage
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── generation_service.py   # Groq API integration & validation
│   │   └── urls.py
│   ├── attempts/              # Quiz sessions, answer submission, scoring
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── manage.py
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── login/page.tsx
    │   │   ├── register/page.tsx
    │   │   ├── dashboard/page.tsx
    │   │   ├── quiz/[id]/page.tsx
    │   │   ├── results/[attemptId]/page.tsx
    │   │   └── history/page.tsx
    │   └── lib/
    │       └── api.ts          # Axios client with JWT interceptor
    └── package.json
```
