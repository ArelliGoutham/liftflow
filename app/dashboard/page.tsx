'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface DashboardData {
  activePlan: { _id: string; name: string; isActive: boolean } | null;
  workoutDays: { _id: string; title: string; weekNumber: number; dayOfWeek: number }[];
  totalWorkouts: number;
  completedWorkouts: number;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch('/api/dashboard');
        if (res.ok) setData(await res.json());
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) return <div className="text-slate-500">Loading dashboard...</div>;

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold text-primary-400">Dashboard</h1>

      {data?.activePlan ? (
        <div className="card">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-lg font-semibold">{data.activePlan.name}</span>
            <Link href={`/plans/${data.activePlan._id}`} className="text-sm text-primary-400 underline">
              View plan →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="rounded-lg bg-slate-800 p-2">
              <div className="text-xl font-bold">{data.completedWorkouts}</div>
              <div className="text-xs text-slate-500">Completed</div>
            </div>
            <div className="rounded-lg bg-slate-800 p-2">
              <div className="text-xl font-bold">{data.totalWorkouts}</div>
              <div className="text-xs text-slate-500">Total sessions</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card text-center">
          <p className="text-slate-400">No active plan.</p>
          <Link href="/plans" className="mt-2 inline-block text-primary-400 underline">
            Create a plan →
          </Link>
        </div>
      )}

      {data?.workoutDays && data.workoutDays.length > 0 && (
        <div>
          <h2 className="mb-2 text-lg font-semibold">Upcoming workouts</h2>
          <div className="flex flex-col gap-2">
            {data.workoutDays.slice(0, 5).map((day) => (
              <Link
                key={day._id}
                href={`/workout/${day._id}`}
                className="card flex items-center justify-between transition-colors hover:border-primary-500/50"
              >
                <span className="font-medium">{day.title}</span>
                <span className="text-xs text-slate-500">
                  Week {day.weekNumber}, Day {day.dayOfWeek}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
