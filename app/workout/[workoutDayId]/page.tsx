'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ExerciseLogForm from '@/components/workout/ExerciseLogForm';

interface ExerciseInfo {
  exerciseId: string;
  name: string;
  order: number;
  targetSets: number;
  targetRepetitions?: number;
  restSeconds: number;
  notes?: string;
}

interface WorkoutDay {
  _id: string;
  title: string;
  warmupInstructions?: string;
  cardioInstructions?: string;
  exercises: ExerciseInfo[];
}

export default function WorkoutSessionPage({ params }: { params: { workoutDayId: string } }) {
  const [workoutDay, setWorkoutDay] = useState<WorkoutDay | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [logIds, setLogIds] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const dayRes = await fetch(`/api/workout-days/${params.workoutDayId}`);
        if (dayRes.ok) {
          const day = await dayRes.json();
          setWorkoutDay(day);

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

            for (const ex of day.exercises || []) {
              const logRes = await fetch('/api/logs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: session._id, exerciseId: ex.exerciseId, completed: false, loggedAt: new Date() }),
              });
              if (logRes.ok) {
                const log = await logRes.json();
                setLogIds((prev) => ({ ...prev, [ex.exerciseId]: log._id }));
              }
            }
          }
        }
      } catch {
        // error handled silently
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
  if (!workoutDay) return <div className="text-slate-500">Workout not found.</div>;

  return (
    <div className="flex flex-col gap-4">
      <Link href={`/plans/${workoutDay._id}`} className="text-sm text-slate-400 underline">← Back to plan</Link>

      <div className="card">
        <h1 className="text-2xl font-bold text-primary-400">{workoutDay.title}</h1>
        {workoutDay.warmupInstructions && (
          <p className="mt-1 text-sm text-slate-400">Warmup: {workoutDay.warmupInstructions}</p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {(workoutDay.exercises || []).map((ex) => (
          <ExerciseLogForm
            key={ex.exerciseId}
            exerciseName={ex.name}
            targetSets={ex.targetSets}
            targetReps={ex.targetRepetitions}
            restSeconds={ex.restSeconds}
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
        <div className="rounded-lg bg-emerald-600/20 p-3 text-center text-emerald-400">
          Workout completed ✓
        </div>
      )}
    </div>
  );
}
