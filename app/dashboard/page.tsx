'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Dumbbell, Plus, AlertCircle, RefreshCw } from 'lucide-react';

interface DashboardData {
  activePlan: { _id: string; name: string; isActive: boolean } | null;
  workoutDays: { _id: string; title: string; weekNumber: number; dayOfWeek: number }[];
  totalWorkouts: number;
  completedWorkouts: number;
}

export default function DashboardPage() {
  const { status } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard');
      
      if (res.status === 401) {
        setError('Please sign in to access your dashboard');
        setData(null);
        return;
      }
      
      if (!res.ok) {
        throw new Error('Failed to fetch dashboard');
      }
      
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError('Failed to load dashboard. Please try again.');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchDashboard();
    }
  }, [status]);

  if (status === 'unauthenticated') {
    return (
      <div className="flex flex-col gap-6 max-w-2xl">
        <h1 className="page-title">Welcome to LiftFlow</h1>
        <div className="card flex flex-col gap-4 text-center">
          <p className="text-slate-300">Sign in to access your personalized dashboard</p>
          <Link href="/" className="btn btn-primary w-fit mx-auto">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4 max-w-2xl animate-pulse">
        <div className="h-8 w-48 rounded bg-slate-700" />
        <div className="h-32 rounded-xl bg-slate-700" />
        <div className="h-48 rounded-xl bg-slate-700" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      <div>
        <h1 className="page-title">Dashboard</h1>
      </div>

      {/* Always visible action buttons */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
        <Link href="/plans" className="card group hover:border-lime/50 transition-colors p-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">Browse or create</p>
            <p className="heading-3">Workout Plans</p>
          </div>
          <Plus className="w-6 h-6 text-lime group-hover:scale-110 transition-transform" />
        </Link>
        <Link href="/exercises" className="card group hover:border-lime/50 transition-colors p-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">Explore techniques</p>
            <p className="heading-3">Exercise Library</p>
          </div>
          <Dumbbell className="w-6 h-6 text-lime group-hover:scale-110 transition-transform" />
        </Link>
      </div>

      {/* Error state with retry */}
      {error && (
        <div role="alert" className="card border-red-500/50 bg-red-500/10">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-400 font-medium">{error}</p>
              <button
                onClick={fetchDashboard}
                className="mt-3 inline-flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active plan section */}
      {!error && (
        <>
          {data?.activePlan ? (
            <div className="card">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="eyebrow">Current Plan</p>
                  <h2 className="heading-2">{data.activePlan.name}</h2>
                </div>
                <Link
                  href={`/plans/${data.activePlan._id}`}
                  className="text-sm text-lime hover:text-lime/80 font-medium underline flex-shrink-0"
                >
                  View →
                </Link>
              </div>
              
              {/* Session stats - last 5 sessions */}
              <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4">
                <div className="rounded-lg bg-slate-700/50 p-4 text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-lime">{data.completedWorkouts}</div>
                  <div className="text-xs text-slate-400 mt-1">Completed in recent sessions</div>
                </div>
                <div className="rounded-lg bg-slate-700/50 p-4 text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-lime">{data.totalWorkouts}</div>
                  <div className="text-xs text-slate-400 mt-1">Recent sessions</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card text-center py-8">
              <p className="text-slate-400 mb-4">No active plan yet. Start by creating one.</p>
              <Link href="/plans" className="btn btn-primary inline-flex">
                Create a plan
              </Link>
            </div>
          )}

          {/* Upcoming workouts */}
          {data?.workoutDays && data.workoutDays.length > 0 && (
            <div>
              <h2 className="heading-2 mb-4">Plan workouts</h2>
              <div className="grid gap-3">
                {data.workoutDays.slice(0, 5).map((day) => (
                  <Link
                    key={day._id}
                    href={`/workout/${day._id}`}
                    className="card group hover:border-lime/50 transition-colors flex items-center justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium group-hover:text-lime transition-colors">{day.title}</p>
                      <p className="text-xs text-slate-400">
                        Week {day.weekNumber} • Day {day.dayOfWeek}
                      </p>
                    </div>
                    <span className="text-lime text-sm font-medium flex-shrink-0">→</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
