'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Dumbbell, AlertCircle } from 'lucide-react';
import ExerciseLogForm from '@/components/workout/ExerciseLogForm';

interface ExerciseInfo {
  exerciseId: string;
  exerciseName?: string;
  name?: string;
  order: number;
  trackingMode?: 'reps' | 'duration';
  targetSets: number;
  targetRepetitions?: number;
  targetDurationValue?: number;
  durationUnit?: 'seconds' | 'minutes';
  restSeconds: number;
  notes?: string;
  isCompleted?: boolean;
  logData?: {
    sets?: number;
    weight?: number;
    repetitions?: number;
    durationValue?: number;
    durationUnit?: string;
    notes?: string;
  };
}

interface WorkoutDay {
  _id: string;
  planId?: string;
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

        // Check for an existing uncompleted session today
        const existingSessionsRes = await fetch('/api/sessions');
        let existingSessionId: string | null = null;
        let existingLogs: any[] = [];

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
            if (found) {
              existingSessionId = found._id;
              // Load existing logs for this session
              const logsRes = await fetch(`/api/logs?sessionId=${found._id}`);
              if (logsRes.ok) {
                existingLogs = await logsRes.json();
              }
            }
          }
        }

        let activeSessionId: string | null = existingSessionId;

        if (!activeSessionId) {
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
            activeSessionId = session._id;
          }
        }

        if (activeSessionId) {
          setSessionId(activeSessionId);

          // For each exercise: check if a log already exists, create if not
          const newLogIds: Record<string, string> = {};
          const updatedExercises = [...day.exercises];

          for (const ex of day.exercises) {
            // Look for existing log with this exercise in this session
            const existingLog = existingLogs.find(
              (l: any) => l.exerciseId === ex.exerciseId
            );

            if (existingLog) {
              newLogIds[ex.exerciseId] = existingLog._id;
              // Mark as completed if the log says so
              const exIndex = updatedExercises.findIndex(e => e.exerciseId === ex.exerciseId);
              if (exIndex >= 0) {
                updatedExercises[exIndex] = {
                  ...updatedExercises[exIndex],
                  isCompleted: existingLog.completed,
                  logData: {
                    sets: existingLog.sets,
                    weight: existingLog.weight,
                    repetitions: existingLog.repetitions,
                    durationValue: existingLog.durationValue,
                    durationUnit: existingLog.durationUnit,
                    notes: existingLog.notes,
                  },
                };
              }
            } else {
              // Create a new log entry
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
                newLogIds[ex.exerciseId] = log._id;
              }
            }
          }

          setLogIds(newLogIds);
          setWorkoutDay({ ...day, exercises: updatedExercises });
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
          <Link href="/plans" className="text-lime text-sm underline">
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
                isCompleted={ex.isCompleted}
                logData={ex.logData}
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
