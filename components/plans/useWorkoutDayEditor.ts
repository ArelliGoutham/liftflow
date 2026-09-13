'use client';

import { useState, useEffect, useCallback } from 'react';
import type { IWorkoutExerciseWithName, IExerciseOption } from '@/types';

export function useWorkoutDayEditor(workoutDayId: string) {
  const [exercises, setExercises] = useState<IWorkoutExerciseWithName[]>([]);
  const [availableExercises, setAvailableExercises] = useState<IExerciseOption[]>([]);
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

      const existing: IWorkoutExerciseWithName[] = (data.exercises || []).map((ex: any, i: number) => ({
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

  function updateExercise(index: number, field: keyof IWorkoutExerciseWithName, value: string | number) {
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

  return {
    exercises,
    loading,
    saving,
    error,
    saveSuccess,
    showAddPicker,
    setShowAddPicker,
    searchTerm,
    setSearchTerm,
    filteredAvailable,
    addExercise,
    removeExercise,
    moveExercise,
    updateExercise,
    toggleTrackingMode,
    handleSave,
  };
}
