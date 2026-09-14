'use client';

import { useState, useEffect } from 'react';
import { Dumbbell, Clock } from 'lucide-react';

interface ExerciseLogFormProps {
  exerciseName: string;
  targetSets: number;
  targetReps?: number;
  restSeconds: number;
  trackingMode?: 'reps' | 'duration';
  targetDurationValue?: number;
  durationUnit?: 'seconds' | 'minutes';
  isCompleted?: boolean;
  logData?: {
    sets?: number;
    weight?: number;
    repetitions?: number;
    durationValue?: number;
    durationUnit?: string;
    notes?: string;
  };
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
  isCompleted = false,
  logData,
  onLog,
}: ExerciseLogFormProps) {
  const [completed, setCompleted] = useState(isCompleted);
  const [sets, setSets] = useState(logData?.sets?.toString() || targetSets.toString());
  const [weight, setWeight] = useState(logData?.weight?.toString() || '');
  const [repetitions, setRepetitions] = useState(logData?.repetitions?.toString() || targetReps?.toString() || '');
  const [durationValue, setDurationValue] = useState(logData?.durationValue?.toString() || targetDurationValue?.toString() || '');
  const [loggedDurationUnit, setLoggedDurationUnit] = useState((logData?.durationUnit as 'seconds' | 'minutes') || durationUnit);
  const [notes, setNotes] = useState(logData?.notes || '');
  const [saved, setSaved] = useState(false);

  const isDuration = trackingMode === 'duration';

  const targetText = isDuration
    ? `${targetSets} × ${targetDurationValue ?? '?'} ${durationUnit === 'minutes' ? 'min' : 'sec'}`
    : `${targetSets} sets × ${targetReps || '?'} reps`;

  const handleMarkDone = () => {
    const newCompleted = !completed;
    setCompleted(newCompleted);
    setSaved(false);
    // Immediately save when marking done
    onLog({
      completed: newCompleted,
      trackingMode,
      sets: sets ? parseInt(sets) : undefined,
      weight: !isDuration && weight ? parseFloat(weight) : undefined,
      repetitions: !isDuration && repetitions ? parseInt(repetitions) : undefined,
      durationValue: isDuration && durationValue ? parseInt(durationValue) : undefined,
      durationUnit: isDuration ? loggedDurationUnit : undefined,
      notes: notes,
    });
  };

  const handleSave = () => {
    onLog({
      completed,
      trackingMode,
      sets: sets ? parseInt(sets) : undefined,
      weight: !isDuration && weight ? parseFloat(weight) : undefined,
      repetitions: !isDuration && repetitions ? parseInt(repetitions) : undefined,
      durationValue: isDuration && durationValue ? parseInt(durationValue) : undefined,
      durationUnit: isDuration ? loggedDurationUnit : undefined,
      notes: notes,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className={`card flex flex-col gap-3 ${isCompleted ? 'border-lime/30 bg-lime/5' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isDuration ? (
            <Clock className="w-4 h-4 text-lime flex-shrink-0" />
          ) : (
            <Dumbbell className="w-4 h-4 text-lime flex-shrink-0" />
          )}
          <span className={`font-semibold ${isCompleted ? 'text-lime' : ''}`}>{exerciseName}</span>
          {isCompleted && <span className="text-xs text-lime">✓</span>}
        </div>
        <button
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            completed
              ? 'bg-emerald-600/20 text-emerald-400'
              : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
          }`}
          onClick={handleMarkDone}
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
              onChange={(e) => { setSets(e.target.value); setSaved(false); }}
              disabled={isCompleted}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Duration</label>
            <input
              className="input"
              type="number"
              placeholder="—"
              value={durationValue}
              onChange={(e) => { setDurationValue(e.target.value); setSaved(false); }}
              disabled={isCompleted}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Unit</label>
            <select
              className="input"
              value={loggedDurationUnit}
              onChange={(e) => { setLoggedDurationUnit(e.target.value as 'seconds' | 'minutes'); setSaved(false); }}
              disabled={isCompleted}
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
              onChange={(e) => { setSets(e.target.value); setSaved(false); }}
              disabled={isCompleted}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Reps</label>
            <input
              className="input"
              type="number"
              value={repetitions}
              onChange={(e) => { setRepetitions(e.target.value); setSaved(false); }}
              disabled={isCompleted}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Weight (kg)</label>
            <input
              className="input"
              type="number"
              value={weight}
              onChange={(e) => { setWeight(e.target.value); setSaved(false); }}
              disabled={isCompleted}
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
        onChange={(e) => { setNotes(e.target.value); setSaved(false); }}
        disabled={isCompleted}
      />

      <div className="flex items-center gap-3">
        {!isCompleted && (
          <button className="btn-primary" onClick={handleSave}>
            Save log
          </button>
        )}
        {saved && <span className="text-sm text-lime">Saved ✓</span>}
      </div>
    </div>
  );
}
