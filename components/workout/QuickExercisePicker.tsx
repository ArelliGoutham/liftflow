'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, X } from 'lucide-react';

interface QuickExercisePickerProps {
  onPick: (exerciseId: string, name: string) => void;
  onClose: () => void;
  excludeIds: string[];
}

interface ExerciseOption {
  _id: string;
  name: string;
  category: string;
}

/**
 * Exercise picker for quick workouts — fetches the exercise library, supports
 * search filtering, and calls onPick when an exercise is clicked.
 */
export default function QuickExercisePicker({
  onPick,
  onClose,
  excludeIds,
}: QuickExercisePickerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [available, setAvailable] = useState<ExerciseOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/exercises?sharedOnly=true&limit=1400', { signal: controller.signal })
      .then((res) => res.ok ? res.json() : [])
      .then((data) => {
        if (Array.isArray(data)) {
          setAvailable(
            data.map((e: { _id?: string; id?: string; name: string; category: string }) => ({
              _id: e._id || e.id || '',
              name: e.name,
              category: e.category,
            }))
          );
        }
      })
      .catch(() => { /* non-critical */ })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return available
      .filter((e) => e.name.toLowerCase().includes(term))
      .filter((e) => !excludeIds.includes(e._id))
      .slice(0, 30);
  }, [available, searchTerm, excludeIds]);

  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Pick an exercise</h3>
        <button className="text-slate-400 hover:text-slate-200 text-sm" onClick={onClose} aria-label="Close picker">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          className="input pl-9"
          placeholder="Search exercises..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          autoFocus
        />
      </div>
      <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
        {loading && <p className="text-slate-500 text-sm py-4 text-center">Loading exercises...</p>}
        {!loading && filtered.length === 0 && (
          <p className="text-slate-500 text-sm py-4 text-center">
            {searchTerm ? 'No matching exercises found.' : 'No exercises available.'}
          </p>
        )}
        {!loading && filtered.map((ex) => (
          <button
            key={ex._id}
            onClick={() => onPick(ex._id, ex.name)}
            className="flex items-center justify-between rounded-lg p-3 text-left hover:bg-slate-700/50 transition-colors"
          >
            <span className="text-sm font-medium">{ex.name}</span>
            <span className="text-xs text-slate-500">{ex.category}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
