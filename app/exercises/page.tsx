'use client';

import { useState, useEffect } from 'react';
import ExerciseFilter from '@/components/exercises/ExerciseFilter';
import ExerciseList from '@/components/exercises/ExerciseList';

interface ExerciseSummary {
  _id: string;
  name: string;
  category: string;
}

export default function ExercisesPage() {
  const [category, setCategory] = useState('');
  const [exercises, setExercises] = useState<ExerciseSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchExercises() {
      try {
        const params = new URLSearchParams();
        if (category) params.set('category', category);

        const res = await fetch(`/api/exercises?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setExercises(data);
      } catch {
        setExercises([]);
      } finally {
        setLoading(false);
      }
    }

    setLoading(true);
    fetchExercises();
  }, [category]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-primary-400">Exercise Library</h1>
      <ExerciseFilter selectedCategory={category} onCategoryChange={setCategory} />
      {loading ? (
        <div className="text-slate-500">Loading exercises...</div>
      ) : (
        <ExerciseList exercises={exercises} />
      )}
    </div>
  );
}
