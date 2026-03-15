'use client';
import { useEffect, useState } from 'react';

export default function Home() {
  const [status, setStatus] = useState('checking...');

  useEffect(() => {
    fetch('http://localhost:8000/api/check/')
      .then(r => r.json())
      .then(data => setStatus(data.message));
  }, []);

  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold mb-4">Quiz App</h1>
      <p>Backend: <span className="text-green-600">{status}</span></p>
    </main>
  );
}