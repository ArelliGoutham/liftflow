'use client';

import { GripVertical, Trash2, Clock, Dumbbell } from 'lucide-react';
import Link from 'next/link';
import type { IWorkoutExerciseWithName } from '@/types';

interface WorkoutExerciseCardProps {
  exercise: IWorkoutExerciseWithName;
  index: number;
  total: number;
  onMove: (index: number, direction: 'up' | 'down') => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: keyof IWorkoutExerciseWithName, value: string | number) => void;
  onToggleMode: (index: number) => void;
}

export default function WorkoutExerciseCard({
  exercise: ex,
  index,
  total,
  onMove,
  onRemove,
  onUpdate,
  onToggleMode,
}: WorkoutExerciseCardProps) {
  return (
    <div className="card border-slate-700">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <GripVertical className="w-4 h-4 text-slate-600 flex-shrink-0" />
          <Link
            href={`/exercises/${ex.exerciseId}`}
            className="font-medium text-lime hover:underline truncate"
          >
            {ex.exerciseName || `Exercise ${index + 1}`}
          </Link>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onMove(index, 'up')}
            disabled={index === 0}
            className="rounded p-1.5 text-slate-500 hover:text-slate-300 disabled:opacity-30 min-h-[36px] min-w-[36px]"
            aria-label="Move up"
          >
            ↑
          </button>
          <button
            onClick={() => onMove(index, 'down')}
            disabled={index === total - 1}
            className="rounded p-1.5 text-slate-500 hover:text-slate-300 disabled:opacity-30 min-h-[36px] min-w-[36px]"
            aria-label="Move down"
          >
            ↓
          </button>
          <button
            onClick={() => onRemove(index)}
            className="rounded p-1.5 text-slate-500 hover:text-red-400 min-h-[36px] min-w-[36px] flex items-center justify-center"
            aria-label="Remove exercise"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tracking mode toggle */}
      <div className="mb-3">
        <div className="inline-flex rounded-lg border border-slate-700 bg-slate-800/50 p-0.5">
          <button
            onClick={() => ex.trackingMode !== 'reps' && onToggleMode(index)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              ex.trackingMode === 'reps'
                ? 'bg-lime text-charcoal'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Dumbbell className="w-3 h-3" /> Reps
          </button>
          <button
            onClick={() => ex.trackingMode !== 'duration' && onToggleMode(index)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              ex.trackingMode === 'duration'
                ? 'bg-lime text-charcoal'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3 h-3" /> Duration
          </button>
        </div>
      </div>

      {/* Reps mode fields */}
      {ex.trackingMode === 'reps' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Sets</label>
            <input
              className="input"
              type="number"
              min={1}
              value={ex.targetSets}
              onChange={(e) => onUpdate(index, 'targetSets', parseInt(e.target.value) || 1)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Reps</label>
            <input
              className="input"
              type="number"
              min={1}
              placeholder="—"
              value={ex.targetRepetitions ?? ''}
              onChange={(e) =>
                onUpdate(index, 'targetRepetitions', e.target.value ? parseInt(e.target.value) : undefined as any)
              }
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Rest (sec)</label>
            <input
              className="input"
              type="number"
              min={0}
              value={ex.restSeconds}
              onChange={(e) => onUpdate(index, 'restSeconds', parseInt(e.target.value) || 0)}
            />
          </div>
        </div>
      )}

      {/* Duration mode fields */}
      {ex.trackingMode === 'duration' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Sets</label>
            <input
              className="input"
              type="number"
              min={1}
              value={ex.targetSets}
              onChange={(e) => onUpdate(index, 'targetSets', parseInt(e.target.value) || 1)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Duration</label>
            <input
              className="input"
              type="number"
              min={1}
              placeholder="—"
              value={ex.targetDurationValue ?? ''}
              onChange={(e) =>
                onUpdate(index, 'targetDurationValue', e.target.value ? parseInt(e.target.value) : undefined as any)
              }
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Unit</label>
            <select
              className="input"
              value={ex.durationUnit}
              onChange={(e) => onUpdate(index, 'durationUnit', e.target.value)}
            >
              <option value="seconds">Seconds</option>
              <option value="minutes">Minutes</option>
            </select>
          </div>
          <div className="flex flex-col gap-1 col-span-2 sm:col-span-3">
            <label className="text-xs text-slate-500">Rest (sec)</label>
            <input
              className="input"
              type="number"
              min={0}
              value={ex.restSeconds}
              onChange={(e) => onUpdate(index, 'restSeconds', parseInt(e.target.value) || 0)}
            />
          </div>
        </div>
      )}

      <input
        className="input mt-2"
        placeholder="Notes (e.g., slow tempo, 2-3 reps in reserve)"
        value={ex.notes ?? ''}
        onChange={(e) => onUpdate(index, 'notes', e.target.value)}
      />
    </div>
  );
}
