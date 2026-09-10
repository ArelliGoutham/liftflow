'use client';

import { useState, useEffect } from 'react';
import ExerciseFilter from '@/components/exercises/ExerciseFilter';
import ExerciseList from '@/components/exercises/ExerciseList';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ExerciseSummary {
  _id: string;
  name: string;
  category: string;
}

export default function ExercisesPage() {
  const [category, setCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [retryCounter, setRetryCounter] = useState(0);
  const [exercises, setExercises] = useState<ExerciseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filteredExercises = exercises.filter((ex) =>
    ex.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    async function fetchExercises() {
      setError(null);
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('sharedOnly', 'true');
        if (category) {
          params.set('category', category);
        }

        const res = await fetch(`/api/exercises?${params.toString()}`, { signal });

        if (signal.aborted) return;

        if (!res.ok) {
          throw new Error('Failed to fetch exercises');
        }

        const data = await res.json();

        if (signal.aborted) return;

        if (!Array.isArray(data)) {
          throw new Error('Invalid response format');
        }

        const validExercises = data.map((ex, index) => {
          if (ex === null || ex === undefined) {
            throw new Error(`Invalid exercise at index ${index}: null or undefined`);
          }
          if (typeof ex._id !== 'string' || typeof ex.name !== 'string' || typeof ex.category !== 'string') {
            throw new Error(`Invalid exercise at index ${index}: missing or invalid required fields`);
          }
          return ex as ExerciseSummary;
        });

        if (signal.aborted) return;

        setExercises(validExercises);
      } catch (err) {
        if (signal.aborted) return;
        setError('Failed to load exercises. Please try again.');
        setExercises([]);
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchExercises();

    return () => {
      controller.abort();
    };
  }, [category, retryCounter]);

  const handleRetry = () => {
    setRetryCounter((prev) => prev + 1);
  };

  const handleClearFilter = () => {
    setCategory('');
    setSearchQuery('');
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <h1 className="page-title">Exercise Library</h1>
        <p className="mt-2 text-slate-400">
          {!error && !loading && filteredExercises.length > 0
            ? `Showing ${filteredExercises.length} exercise${filteredExercises.length === 1 ? '' : 's'}`
            : category
              ? 'Browse exercises in this category'
              : 'Browse our collection of exercises'}
        </p>
      </div>

      <ExerciseFilter selectedCategory={category} onCategoryChange={setCategory} />

      <div className="flex flex-col gap-2">
        <label htmlFor="search-exercises" className="text-sm text-slate-300">
          Search exercises
        </label>
        <input
          id="search-exercises"
          type="text"
          placeholder="Filter by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input"
        />
      </div>

      {loading && (
        <div className="space-y-3 animate-pulse">
          <div className="h-16 rounded-xl bg-slate-700" />
          <div className="h-16 rounded-xl bg-slate-700" />
          <div className="h-16 rounded-xl bg-slate-700" />
        </div>
      )}

      {error && !loading && (
        <div role="alert" className="card border-red-500/50 bg-red-500/10">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-400 font-medium">{error}</p>
              <button
                onClick={handleRetry}
                className="mt-3 inline-flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {!loading && !error && filteredExercises.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-slate-400 mb-4">
            {searchQuery
              ? 'No exercises match your search.'
              : category
                ? 'No exercises found in this category.'
                : 'No exercises available.'}
          </p>
          {(category || searchQuery) && (
            <button
              onClick={handleClearFilter}
              className="text-lime hover:text-lime/80 text-sm font-medium"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {!loading && !error && filteredExercises.length > 0 && (
        <ExerciseList exercises={filteredExercises} />
      )}
    </div>
  );
}
