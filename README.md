# AI-Powered Quiz App

A full-stack quiz application that uses AI to generate customized quizzes on any topic. Built with **Django REST Framework** (backend) and **Next.js 16** (frontend), connected via a JWT-authenticated REST API.

---

**Deployed App:** [https://quiz-app-wine-pi.vercel.app/login](https://quiz-app-wine-pi.vercel.app/login)

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
| **Timer on quiz page** | The `time_taken_seconds` is already recorded server-side. A visible countdown was deprioritized to keep the UX low-pressure for this MVP. |
| **Leaderboards / social features** | The data model supports multi-user but the UI focuses on personal performance. |
| **Question shuffling per attempt** | Skipped to keep the review page predictable (same order as the attempt). |
| **Password reset via email** | Requires email SMTP configuration. Deferred as it adds deployment complexity without changing the core experience. |

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
