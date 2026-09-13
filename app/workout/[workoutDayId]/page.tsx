'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Dumbbell, AlertCircle } from 'lucide-react';
import ExerciseLogForm from '@/components/workout/ExerciseLogForm';
import type { IWorkoutDayClient } from '@/types';

export default function WorkoutSessionPage({ params }: { params: { workoutDayId: string } }) {
  const [workoutDay, setWorkoutDay] = useState<IWorkoutDayClient | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [logIds, setLogIds] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const dayRes = await fetch(`/api/workout-days/${params.workoutDayId}`);
        if (!dayRes.ok) throw new Error('Failed to load workout');
        const day = await dayRes.json();
        setWorkoutDay(day);

        if (!day.exercises || day.exercises.length === 0) {
          setLoading(false);
          return;
        }

        // Check for an existing uncompleted session today before creating a new one
        const existingSessionsRes = await fetch('/api/sessions');
        let existingSessionId: string | null = null;
        if (existingSessionsRes.ok) {
          const existingSessions = await existingSessionsRes.json();
          if (Array.isArray(existingSessions)) {
            const today = new Date().toISOString().split('T')[0];
            const found = existingSessions.find(
              (s: any) =>
                s.workoutDayId === day._id &&
                !s.completedAt &&
                s.startedAt?.startsWith(today)
            );
            if (found) existingSessionId = found._id;
          }
        }

        if (existingSessionId) {
          // Reuse existing session
          setSessionId(existingSessionId);
        } else {
          // Create new session
          const sessionRes = await fetch('/api/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              planId: day.planId,
              workoutDayId: day._id,
            }),
          });
          if (sessionRes.ok) {
            const session = await sessionRes.json();
            setSessionId(session._id);
          }
        }

        if (sessionId || existingSessionId) {
          const activeSessionId = existingSessionId || sessionId;
          for (const ex of day.exercises || []) {
            const logRes = await fetch('/api/logs', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sessionId: activeSessionId,
                exerciseId: ex.exerciseId,
                completed: false,
                loggedAt: new Date(),
              }),
            });
            if (logRes.ok) {
              const log = await logRes.json();
              setLogIds((prev) => ({ ...prev, [ex.exerciseId]: log._id }));
            }
          }
        }
      } catch {
        setError('Could not load workout. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [params.workoutDayId]);

  async function handleLog(exerciseId: string, data: any) {
    const logId = logIds[exerciseId];
    if (!logId) return;

    try {
      const res = await fetch(`/api/logs/${logId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update log');
    } catch {
      // error handled silently
    }
  }

  async function finishWorkout() {
    if (!sessionId) return;
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: '' }),
      });
      if (res.ok) setCompleted(true);
    } catch {
      // error handled silently
    }
  }

  if (loading) return <div className="text-slate-500">Preparing workout...</div>;
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
  if (!workoutDay) return <div className="text-slate-500">Workout not found.</div>;

  const exerciseList = workoutDay.exercises || [];

  return (
    <div className="flex flex-col gap-4">
      <Link href="/plans" className="text-sm text-slate-400 underline">← Back to plans</Link>

      <div className="card">
        <h1 className="text-2xl font-bold text-lime">{workoutDay.title}</h1>
        {workoutDay.warmupInstructions && (
          <p className="mt-1 text-sm text-slate-400">Warmup: {workoutDay.warmupInstructions}</p>
        )}
      </div>

      {exerciseList.length === 0 ? (
        <div className="card text-center py-8">
          <Dumbbell className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 mb-2">No exercises added to this workout day yet.</p>
          <Link href={`/plans`} className="text-lime text-sm underline">
            Add exercises in plan editor →
          </Link>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {exerciseList.map((ex) => (
              <ExerciseLogForm
                key={ex.exerciseId}
                exerciseName={ex.exerciseName || ex.name || 'Exercise'}
                targetSets={ex.targetSets}
                targetReps={ex.targetRepetitions}
                restSeconds={ex.restSeconds}
                trackingMode={ex.trackingMode || 'reps'}
                targetDurationValue={ex.targetDurationValue}
                durationUnit={ex.durationUnit}
                onLog={(data) => handleLog(ex.exerciseId, data)}
              />
            ))}
          </div>

          {workoutDay.cardioInstructions && (
            <div className="card">
              <h3 className="font-semibold">Cardio</h3>
              <p className="text-sm text-slate-400">{workoutDay.cardioInstructions}</p>
            </div>
          )}

          {!completed ? (
            <button className="btn-primary" onClick={finishWorkout}>
              Finish Workout
            </button>
          ) : (
            <div className="rounded-lg bg-lime/20 p-3 text-center text-lime font-medium">
              Workout completed ✓
            </div>
          )}
        </>
      )}
    </div>
  );
}
