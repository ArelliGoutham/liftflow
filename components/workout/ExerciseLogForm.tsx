'use client';

import { useState } from 'react';
import { Dumbbell, Clock } from 'lucide-react';

interface ExerciseLogFormProps {
  exerciseName: string;
  targetSets: number;
  targetReps?: number;
  restSeconds: number;
  trackingMode?: 'reps' | 'duration';
  targetDurationValue?: number;
  durationUnit?: 'seconds' | 'minutes';
  onLog: (data: {
    completed: boolean;
    trackingMode: 'reps' | 'duration';
    sets?: number;
    weight?: number;
    repetitions?: number;
    durationValue?: number;
    durationUnit?: 'seconds' | 'minutes';
    notes?: string;
  }) => void;
}

export default function ExerciseLogForm({
  exerciseName,
  targetSets,
  targetReps,
  restSeconds,
  trackingMode = 'reps',
  targetDurationValue,
  durationUnit = 'seconds',
  onLog,
}: ExerciseLogFormProps) {
  const [completed, setCompleted] = useState(false);
  const [sets, setSets] = useState(targetSets.toString());
  const [weight, setWeight] = useState('');
  const [repetitions, setRepetitions] = useState(targetReps?.toString() || '');
  const [durationValue, setDurationValue] = useState(targetDurationValue?.toString() || '');
  const [loggedDurationUnit, setLoggedDurationUnit] = useState(durationUnit);
  const [notes, setNotes] = useState('');

  const isDuration = trackingMode === 'duration';

  const targetText = isDuration
    ? `${targetSets} × ${targetDurationValue ?? '?'} ${durationUnit === 'minutes' ? 'min' : 'sec'}`
    : `${targetSets} sets × ${targetReps || '?'} reps`;

  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isDuration ? (
            <Clock className="w-4 h-4 text-lime flex-shrink-0" />
          ) : (
            <Dumbbell className="w-4 h-4 text-lime flex-shrink-0" />
          )}
          <span className="font-semibold">{exerciseName}</span>
        </div>
        <button
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            completed ? 'bg-emerald-600/20 text-emerald-400' : 'bg-slate-700 text-slate-400'
          }`}
          onClick={() => setCompleted(!completed)}
        >
          {completed ? '✓ Completed' : 'Mark done'}
        </button>
      </div>

      {isDuration ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Sets done</label>
            <input
              className="input"
              type="number"
              value={sets}
              onChange={(e) => setSets(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Duration</label>
            <input
              className="input"
              type="number"
              placeholder="—"
              value={durationValue}
              onChange={(e) => setDurationValue(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Unit</label>
            <select
              className="input"
              value={loggedDurationUnit}
              onChange={(e) => setLoggedDurationUnit(e.target.value as 'seconds' | 'minutes')}
            >
              <option value="seconds">Seconds</option>
              <option value="minutes">Minutes</option>
            </select>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Sets</label>
            <input
              className="input"
              type="number"
              value={sets}
              onChange={(e) => setSets(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Reps</label>
            <input
              className="input"
              type="number"
              value={repetitions}
              onChange={(e) => setRepetitions(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Weight (kg)</label>
            <input
              className="input"
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>Target: {targetText}</span>
        <span>Rest: {restSeconds}s</span>
      </div>

      <input
        className="input"
        placeholder="Notes (e.g., felt easy, form issue)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <button
        className="btn-primary"
        onClick={() =>
          onLog({
            completed,
            trackingMode,
            sets: sets ? parseInt(sets) : undefined,
            weight: !isDuration && weight ? parseFloat(weight) : undefined,
            repetitions: !isDuration && repetitions ? parseInt(repetitions) : undefined,
            durationValue: isDuration && durationValue ? parseInt(durationValue) : undefined,
            durationUnit: isDuration ? loggedDurationUnit : undefined,
            notes: notes,
          })
        }
      >
        Save log
      </button>
    </div>
  );
}
