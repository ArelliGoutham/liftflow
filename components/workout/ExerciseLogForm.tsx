'use client';

import { useState } from 'react';

interface ExerciseLogFormProps {
  exerciseName: string;
  targetSets: number;
  targetReps?: number;
  restSeconds: number;
  onLog: (data: {
    completed: boolean;
    sets?: number;
    weight?: number;
    repetitions?: number;
    durationSeconds?: number;
    notes?: string;
  }) => void;
}

export default function ExerciseLogForm({ exerciseName, targetSets, targetReps, restSeconds, onLog }: ExerciseLogFormProps) {
  const [completed, setCompleted] = useState(false);
  const [sets, setSets] = useState(targetSets.toString());
  const [weight, setWeight] = useState('');
  const [repetitions, setRepetitions] = useState(targetReps?.toString() || '');
  const [notes, setNotes] = useState('');

  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="font-semibold">{exerciseName}</span>
        <button
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            completed ? 'bg-emerald-600/20 text-emerald-400' : 'bg-slate-700 text-slate-400'
          }`}
          onClick={() => setCompleted(!completed)}
        >
          {completed ? 'Completed' : 'Mark done'}
        </button>
      </div>

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

      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>Target: {targetSets} sets × {targetReps || '?'} reps</span>
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
            sets: sets ? parseInt(sets) : undefined,
            weight: weight ? parseFloat(weight) : undefined,
            repetitions: repetitions ? parseInt(repetitions) : undefined,
            notes: notes,
          })
        }
      >
        Save log
      </button>
    </div>
  );
}
