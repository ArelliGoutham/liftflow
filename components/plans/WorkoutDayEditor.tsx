'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, GripVertical, AlertCircle, Save, Clock, Dumbbell } from 'lucide-react';
import Link from 'next/link';

interface WorkoutExercise {
  exerciseId: string;
  exerciseName?: string;
  order: number;
  trackingMode: 'reps' | 'duration';
  targetSets: number;
  targetRepetitions?: number;
  targetDurationValue?: number;
  durationUnit: 'seconds' | 'minutes';
  restSeconds: number;
  notes?: string;
}

interface ExerciseOption {
  _id: string;
  id?: string;
  name: string;
  category: string;
}

interface WorkoutDayEditorProps {
  workoutDayId: string;
  dayTitle: string;
}

export default function WorkoutDayEditor({ workoutDayId, dayTitle }: WorkoutDayEditorProps) {
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [availableExercises, setAvailableExercises] = useState<ExerciseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showAddPicker, setShowAddPicker] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchDay = useCallback(async () => {
    try {
      const res = await fetch(`/api/workout-days/${workoutDayId}`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();

      const existing: WorkoutExercise[] = (data.exercises || []).map((ex: any, i: number) => ({
        exerciseId: ex.exerciseId?.toString() ?? '',
        exerciseName: ex.exerciseName ?? '',
        order: ex.order ?? i,
        trackingMode: ex.trackingMode ?? 'reps',
        targetSets: ex.targetSets ?? 3,
        targetRepetitions: ex.targetRepetitions,
        targetDurationValue: ex.targetDurationValue,
        durationUnit: ex.durationUnit ?? 'seconds',
        restSeconds: ex.restSeconds ?? 90,
        notes: ex.notes ?? '',
      }));
      setExercises(existing);
    } catch {
      setError('Could not load workout day');
    }
  }, [workoutDayId]);

  useEffect(() => {
    async function init() {
      setLoading(true);
      await Promise.all([
        fetchDay(),
        fetch('/api/exercises?sharedOnly=true&limit=1400')
          .then((r) => r.json())
          .then((data) => {
            if (Array.isArray(data)) {
              setAvailableExercises(
                data.map((e: any) => ({
                  _id: e._id || e.id,
                  id: e.id,
                  name: e.name,
                  category: e.category,
                }))
              );
            }
          })
          .catch(() => setAvailableExercises([])),
      ]);
      setLoading(false);
    }
    init();
  }, [workoutDayId, fetchDay]);

  function addExercise(exerciseId: string, name: string) {
    const nextOrder = exercises.length > 0 ? Math.max(...exercises.map((e) => e.order)) + 1 : 0;
    setExercises((prev) => [
      ...prev,
      {
        exerciseId,
        exerciseName: name,
        order: nextOrder,
        trackingMode: 'reps',
        targetSets: 3,
        targetRepetitions: 10,
        durationUnit: 'seconds',
        restSeconds: 90,
        notes: '',
      },
    ]);
    setShowAddPicker(false);
    setSearchTerm('');
    setSaveSuccess(false);
  }

  function removeExercise(index: number) {
    setExercises((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      return updated.map((ex, i) => ({ ...ex, order: i }));
    });
    setSaveSuccess(false);
  }

  function moveExercise(index: number, direction: 'up' | 'down') {
    setExercises((prev) => {
      const updated = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= updated.length) return prev;
      [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];
      return updated.map((ex, i) => ({ ...ex, order: i }));
    });
    setSaveSuccess(false);
  }

  function updateExercise(index: number, field: keyof WorkoutExercise, value: string | number) {
    setExercises((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
    setSaveSuccess(false);
  }

  function toggleTrackingMode(index: number) {
    setExercises((prev) => {
      const updated = [...prev];
      const current = updated[index];
      updated[index] = {
        ...current,
        trackingMode: current.trackingMode === 'reps' ? 'duration' : 'reps',
        // Clear fields that don't apply to the new mode
        targetRepetitions: current.trackingMode === 'reps' ? undefined : current.targetRepetitions,
        targetDurationValue: current.trackingMode === 'duration' ? undefined : current.targetDurationValue,
        durationUnit: current.trackingMode === 'reps' ? 'seconds' : current.durationUnit,
      };
      return updated;
    });
    setSaveSuccess(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaveSuccess(false);
    try {
      const res = await fetch(`/api/workout-days/${workoutDayId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exercises: exercises.map((ex) => ({
            exerciseId: ex.exerciseId,
            order: ex.order,
            trackingMode: ex.trackingMode,
            targetSets: ex.targetSets,
            targetRepetitions: ex.trackingMode === 'reps' ? (ex.targetRepetitions || undefined) : undefined,
            targetDurationValue: ex.trackingMode === 'duration' ? (ex.targetDurationValue || undefined) : undefined,
            durationUnit: ex.trackingMode === 'duration' ? ex.durationUnit : undefined,
            restSeconds: ex.restSeconds,
            notes: ex.notes || undefined,
          })),
        }),
      });
      if (!res.ok) throw new Error('Failed');
      setSaveSuccess(true);
      await fetchDay();
    } catch {
      setError('Could not save exercises. Try again.');
    } finally {
      setSaving(false);
    }
  }

  const filteredAvailable = availableExercises.filter(
    (e) =>
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !exercises.some((ex) => ex.exerciseId === e._id)
  );

  if (loading) {
    return <div className="text-slate-500">Loading workout day...</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {exercises.length === 0 && !showAddPicker && (
        <div className="card text-center py-8">
          <Dumbbell className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 mb-4">No exercises in this workout day yet.</p>
          <button className="btn-primary" onClick={() => setShowAddPicker(true)}>
            <Plus className="w-4 h-4" /> Add exercise
          </button>
        </div>
      )}

      {exercises.length > 0 && (
        <div className="flex flex-col gap-3">
          {exercises.map((ex, index) => (
            <div key={index} className="card border-slate-700">
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
                    onClick={() => moveExercise(index, 'up')}
                    disabled={index === 0}
                    className="rounded p-1.5 text-slate-500 hover:text-slate-300 disabled:opacity-30 min-h-[36px] min-w-[36px]"
                    aria-label="Move up"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveExercise(index, 'down')}
                    disabled={index === exercises.length - 1}
                    className="rounded p-1.5 text-slate-500 hover:text-slate-300 disabled:opacity-30 min-h-[36px] min-w-[36px]"
                    aria-label="Move down"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => removeExercise(index)}
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
                    onClick={() => ex.trackingMode !== 'reps' && toggleTrackingMode(index)}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      ex.trackingMode === 'reps'
                        ? 'bg-lime text-charcoal'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Dumbbell className="w-3 h-3" /> Reps
                  </button>
                  <button
                    onClick={() => ex.trackingMode !== 'duration' && toggleTrackingMode(index)}
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
                      onChange={(e) => updateExercise(index, 'targetSets', parseInt(e.target.value) || 1)}
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
                        updateExercise(index, 'targetRepetitions', e.target.value ? parseInt(e.target.value) : undefined as any)
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
                      onChange={(e) => updateExercise(index, 'restSeconds', parseInt(e.target.value) || 0)}
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
                      onChange={(e) => updateExercise(index, 'targetSets', parseInt(e.target.value) || 1)}
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
                        updateExercise(index, 'targetDurationValue', e.target.value ? parseInt(e.target.value) : undefined as any)
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-500">Unit</label>
                    <select
                      className="input"
                      value={ex.durationUnit}
                      onChange={(e) => updateExercise(index, 'durationUnit', e.target.value)}
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
                      onChange={(e) => updateExercise(index, 'restSeconds', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
              )}

              <input
                className="input mt-2"
                placeholder="Notes (e.g., slow tempo, 2-3 reps in reserve)"
                value={ex.notes ?? ''}
                onChange={(e) => updateExercise(index, 'notes', e.target.value)}
              />
            </div>
          ))}

          <button
            className="btn-secondary w-full"
            onClick={() => setShowAddPicker(true)}
          >
            <Plus className="w-4 h-4" /> Add another exercise
          </button>

          <div className="flex items-center gap-3">
            <button
              className="btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save exercises'}
            </button>
            {saveSuccess && (
              <span className="text-sm text-lime">Saved ✓</span>
            )}
          </div>
        </div>
      )}

      {showAddPicker && (
        <div className="card flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Pick an exercise</h3>
            <button
              className="text-slate-400 hover:text-slate-200 text-sm"
              onClick={() => { setShowAddPicker(false); setSearchTerm(''); }}
            >
              Close
            </button>
          </div>
          <input
            className="input"
            placeholder="Search exercises..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
          <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
            {filteredAvailable.length === 0 && (
              <p className="text-slate-500 text-sm py-4 text-center">
                {searchTerm ? 'No matching exercises found.' : 'All exercises already added.'}
              </p>
            )}
            {filteredAvailable.map((ex) => (
              <button
                key={ex._id}
                onClick={() => addExercise(ex._id, ex.name)}
                className="flex items-center justify-between rounded-lg p-3 text-left hover:bg-slate-700/50 transition-colors"
              >
                <span className="text-sm font-medium">{ex.name}</span>
                <span className="text-xs text-slate-500">{ex.category}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
