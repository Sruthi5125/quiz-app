import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
});

// Automatically attach access token to every request (skip auth endpoints)
api.interceptors.request.use((config) => {
  const publicPaths = ['/auth/login/', '/auth/register/'];
  const isPublic = publicPaths.some(p => config.url?.includes(p));
  if (!isPublic) {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export const createQuiz = async (data: {
  topic: string;
  difficulty: string;
  question_count: number;
}) => {
  const res = await api.post('/quizzes/', data);
  return res.data;
};

export const getQuizzes = async () => {
  const res = await api.get('/quizzes/');
  return res.data;
};

export const getQuiz = async (id: number) => {
  const res = await api.get(`/quizzes/${id}/`);
  return res.data;
};

export default api;