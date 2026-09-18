'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Dumbbell, Zap, Clock, Plus, Check, X, Search, AlertCircle } from 'lucide-react';
import ExerciseLogForm, { type ExerciseLogData } from '@/components/workout/ExerciseLogForm';
import QuickExercisePicker from '@/components/workout/QuickExercisePicker';

interface QuickExercise {
  exerciseId: string;
  exerciseName: string;
  logId: string;
  isCompleted: boolean;
  logData?: ExerciseLogData;
}

/**
 * Quick Workout page — lets users build and track a workout on the fly without a pre-made plan.
 * Creates a quick session on mount, allows adding exercises, logging stats, and finishing.
 */
export default function QuickWorkoutPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [exercises, setExercises] = useState<QuickExercise[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const startTimer = useCallback(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const createQuickSession = useCallback(async () => {
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: null, workoutDayId: null, type: 'quick' }),
      });
      if (!res.ok) throw new Error('Failed to start session');
      const session = await res.json();
      setSessionId(session._id);
    } catch (err) {
      console.error('[quick workout] Session creation failed:', err);
      setError('Could not start workout session. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const cleanup = startTimer();
    createQuickSession();
    return cleanup;
  }, [startTimer, createQuickSession]);

  const handleAddExercise = useCallback(async (exerciseId: string, name: string) => {
    if (!sessionId) return;
    try {
      const res = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          exerciseId,
          completed: false,
          trackingMode: 'reps',
          loggedAt: new Date(),
        }),
      });
      if (!res.ok) throw new Error('Failed to create log');
      const log = await res.json();
      setExercises((prev) => [
        ...prev,
        { exerciseId, exerciseName: name, logId: log._id, isCompleted: false },
      ]);
      setShowPicker(false);
    } catch (err) {
      console.error('[quick workout] Add exercise failed:', err);
    }
  }, [sessionId]);

  const handleLog = useCallback(async (logId: string, data: ExerciseLogData) => {
    try {
      const res = await fetch(`/api/logs/${logId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update log');
      if (data.completed) {
        setExercises((prev) =>
          prev.map((ex) =>
            ex.logId === logId ? { ...ex, isCompleted: true, logData: data } : ex
          )
        );
      }
    } catch (err) {
      console.error('[quick workout] Log update failed:', err);
    }
  }, []);

  const handleFinish = useCallback(async () => {
    if (!sessionId) return;
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: '' }),
      });
      if (res.ok) setCompleted(true);
    } catch (err) {
      console.error('[quick workout] Finish failed:', err);
    }
  }, [sessionId]);

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <div className="text-slate-500">Starting quick workout...</div>;
  }

  if (error) {
    return (
      <div role="alert" className="card border-red-500/50 bg-red-500/10">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="flex flex-col gap-4 max-w-2xl">
        <div className="rounded-lg bg-lime/20 p-6 text-center">
          <Check className="w-12 h-12 text-lime mx-auto mb-3" />
          <h2 className="heading-2 text-lime">Workout Complete!</h2>
          <p className="text-slate-300 mt-2">Time: {formatTime(elapsed)}</p>
          <p className="text-slate-400 text-sm mt-1">{exercises.length} exercises logged</p>
        </div>
        <Link href="/dashboard" className="btn-primary text-center">Back to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <div className="card flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Zap className="w-7 h-7 text-lime" />
          <div>
            <h1 className="page-title">Quick Workout</h1>
            <p className="text-sm text-slate-400">Track exercises on the fly</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-lime">
          <Clock className="w-5 h-5" />
          <span className="text-xl font-bold tabular-nums">{formatTime(elapsed)}</span>
        </div>
      </div>

      {exercises.length === 0 && !showPicker ? (
        <div className="card text-center py-8">
          <Dumbbell className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 mb-4">No exercises yet. Add one to get started.</p>
          <button className="btn-primary inline-flex items-center gap-2" onClick={() => setShowPicker(true)}>
            <Plus className="w-4 h-4" /> Add Exercise
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {exercises.map((ex) => (
              <ExerciseLogForm
                key={ex.logId}
                exerciseName={ex.exerciseName}
                targetSets={3}
                targetReps={10}
                restSeconds={90}
                trackingMode="reps"
                isCompleted={ex.isCompleted}
                logData={ex.logData}
                onLog={(data) => handleLog(ex.logId, data)}
              />
            ))}
          </div>

          <button
            className="btn-secondary flex items-center justify-center gap-2"
            onClick={() => setShowPicker(true)}
          >
            <Plus className="w-4 h-4" /> Add Exercise
          </button>

          <button className="btn-primary" onClick={handleFinish}>
            Finish Workout
          </button>
        </>
      )}

      {showPicker && (
        <QuickExercisePicker
          onPick={handleAddExercise}
          onClose={() => setShowPicker(false)}
          excludeIds={exercises.map((e) => e.exerciseId)}
        />
      )}

      <Link href="/dashboard" className="text-sm text-slate-400 underline text-center">
        ← Back to dashboard
      </Link>
    </div>
  );
}
