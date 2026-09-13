'use client';

import { useState, useEffect } from 'react';
import type { ILogEntry, IExerciseSummary } from '@/types';

export default function ProgressPage() {
  const [exercises, setExercises] = useState<IExerciseSummary[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [logs, setLogs] = useState<ILogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchExercises() {
      try {
        const res = await fetch('/api/exercises?sharedOnly=true');
        if (res.ok) {
          const data = await res.json();
          setExercises(data);
        }
      } catch {
        setExercises([]);
      } finally {
        setLoading(false);
      }
    }
    fetchExercises();
  }, []);

  useEffect(() => {
    if (!selectedExercise) {
      setLogs([]);
      return;
    }
    async function fetchLogs() {
      try {
        const res = await fetch(`/api/progress?exerciseId=${selectedExercise}`);
        if (res.ok) {
          const data = await res.json();
          setLogs(data);
        }
      } catch {
        setLogs([]);
      }
    }
    fetchLogs();
  }, [selectedExercise]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-primary-400">Progress</h1>

      <div className="card flex flex-col gap-2">
        <label className="text-sm text-slate-500">Select exercise</label>
        <select
          className="input"
          value={selectedExercise}
          onChange={(e) => setSelectedExercise(e.target.value)}
        >
          <option value="">Choose an exercise</option>
          {exercises.map((ex) => (
            <option key={ex._id} value={ex._id}>
              {ex.name}
            </option>
          ))}
        </select>
      </div>

      {logs.length > 0 ? (
        <div className="card flex flex-col gap-2">
          <h2 className="font-semibold">Recent logs</h2>
          <div className="flex flex-col gap-1 text-sm">
            {logs.map((log, i) => (
              <div key={i} className="flex items-center justify-between border-b border-slate-800 py-2 last:border-b-0">
                <span className="text-slate-400">{new Date(log.loggedAt).toLocaleDateString()}</span>
                <span className="font-medium">
                  {log.sets ?? 0} × {log.repetitions ?? 0} @ {log.weight ?? 0} kg
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : selectedExercise ? (
        <p className="text-slate-500">No logs for this exercise yet.</p>
      ) : null}
    </div>
  );
}
