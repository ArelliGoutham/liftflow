'use client';

import { useState, useEffect, useRef } from 'react';
import ExerciseFilter from '@/components/exercises/ExerciseFilter';
import ExerciseList from '@/components/exercises/ExerciseList';
import { AlertCircle, RefreshCw, Search } from 'lucide-react';

interface ExerciseSummary {
  _id: string;
  name: string;
  category: string;
  primaryMuscles?: string[];
  equipment?: string;
  level?: string;
  imageUrls?: string[];
}

const PAGE_SIZE = 60;

export default function ExercisesPage() {
  const [category, setCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [retryCounter, setRetryCounter] = useState(0);
  const [exercises, setExercises] = useState<ExerciseSummary[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const signal = controller.signal;

    async function fetchExercises() {
      setError(null);
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('sharedOnly', 'true');
        if (category) params.set('category', category);
        params.set('limit', '1376');

        const res = await fetch(`/api/exercises?${params.toString()}`, { signal });

        if (signal.aborted) return;
        if (!res.ok) throw new Error('Failed to fetch exercises');

        const data = await res.json();
        if (signal.aborted) return;
        if (!Array.isArray(data)) throw new Error('Invalid response format');

        const validExercises = data
          .filter((ex) => ex && typeof ex._id === 'string' && typeof ex.name === 'string')
          .map((ex) => ({
            _id: ex._id,
            name: ex.name,
            category: ex.category || 'upper-body',
            primaryMuscles: ex.primaryMuscles,
            equipment: ex.equipment,
            level: ex.level,
            imageUrls: ex.imageUrls,
          })) as ExerciseSummary[];

        setExercises(validExercises);
        setVisibleCount(PAGE_SIZE);
      } catch (err) {
        if (signal.aborted) return;
        if (err instanceof Error && err.name === 'AbortError') return;
        setError('Failed to load exercises. Please try again.');
        setExercises([]);
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    }

    fetchExercises();

    return () => controller.abort();
  }, [category, retryCounter]);

  const filteredExercises = exercises.filter((ex) =>
    ex.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const visibleExercises = filteredExercises.slice(0, visibleCount);

  const handleRetry = () => setRetryCounter((prev) => prev + 1);

  const handleClearFilters = () => {
    setCategory('');
    setSearchQuery('');
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <h1 className="page-title">Exercise Library</h1>
        <p className="mt-2 text-slate-400">
          {!error && !loading && filteredExercises.length > 0
            ? `Showing ${visibleExercises.length} of ${filteredExercises.length} exercises`
            : 'Browse over 1,300 exercises with form guides, images, and instructions'}
        </p>
      </div>

      <ExerciseFilter selectedCategory={category} onCategoryChange={setCategory} />

      <div className="flex flex-col gap-2">
        <label htmlFor="search-exercises" className="text-sm text-slate-300">
          Search exercises
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            id="search-exercises"
            type="text"
            placeholder="Filter by name..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setVisibleCount(PAGE_SIZE);
            }}
            className="input pl-10"
          />
        </div>
      </div>

      {loading && (
        <div className="space-y-3 animate-pulse">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-40 rounded-xl bg-slate-700" />
            ))}
          </div>
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
                <RefreshCw className="w-4 h-4" /> Try again
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
                : 'No exercises available. Run the seeding script first.'}
          </p>
          {(category || searchQuery) && (
            <button onClick={handleClearFilters} className="text-lime hover:text-lime/80 text-sm font-medium">
              Clear filters
            </button>
          )}
        </div>
      )}

      {!loading && !error && visibleExercises.length > 0 && (
        <>
          <ExerciseList exercises={visibleExercises} />
          {visibleCount < filteredExercises.length && (
            <button
              onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
              className="btn-secondary w-full mt-2"
            >
              Load more ({filteredExercises.length - visibleCount} remaining)
            </button>
          )}
        </>
      )}
    </div>
  );
}
