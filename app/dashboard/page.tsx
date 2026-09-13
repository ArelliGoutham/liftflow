'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Dumbbell, Plus, AlertCircle, RefreshCw, CalendarClock, Moon, ArrowRight } from 'lucide-react';
import WeekStrip from '@/components/dashboard/WeekStrip';
import type { IDaySchedule, IWeekSchedule } from '@/types';

interface DashboardData {
  activePlan: { _id: string; name: string; isActive: boolean; startDate?: string; endDate?: string } | null;
  workoutDays: { _id: string; title: string; weekNumber: number; dayOfWeek: number }[];
  totalWorkouts: number;
  completedWorkouts: number;
  weekSchedule: IWeekSchedule | null;
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
      if (!res.ok) throw new Error('Failed to fetch dashboard');
      setData(await res.json());
    } catch {
      setError('Failed to load dashboard. Please try again.');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') fetchDashboard();
  }, [status]);

  if (status === 'unauthenticated') {
    return (
      <div className="flex flex-col gap-6 max-w-2xl">
        <h1 className="page-title">Welcome to LiftFlow</h1>
        <div className="card flex flex-col gap-4 text-center">
          <p className="text-slate-300">Sign in to access your personalized dashboard</p>
          <Link href="/login" className="btn btn-primary w-fit mx-auto">Sign in</Link>
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

  const todayWorkout = data?.weekSchedule?.days.find((d) => d.isToday);
  const missedDays = data?.weekSchedule?.missedDays ?? [];

  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      <div>
        <h1 className="page-title">Dashboard</h1>
      </div>

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

      {error && (
        <div role="alert" className="card border-red-500/50 bg-red-500/10">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-400 font-medium">{error}</p>
              <button onClick={fetchDashboard} className="mt-3 inline-flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors">
                <RefreshCw className="w-4 h-4" /> Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {data?.weekSchedule?.planExpired && (
        <div role="alert" className="card border-amber-500/50 bg-amber-500/10">
          <div className="flex items-start gap-3">
            <CalendarClock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-amber-400 font-medium">{data.weekSchedule.planExpiryMessage}</p>
              <div className="mt-3">
                <Link href="/plans" className="btn-secondary text-xs">Extend or switch plan</Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {data?.weekSchedule && !data.weekSchedule.planExpired && data.weekSchedule.planExpiryMessage && (
        <div className="card border-lime/30 bg-lime/5">
          <p className="text-sm text-lime">{data.weekSchedule.planExpiryMessage}</p>
        </div>
      )}

      {!error && todayWorkout && (
        <div>
          <h2 className="heading-2 mb-4">Today</h2>
          {todayWorkout.isRest ? (
            <div className="card border-lime/30 bg-slate-800/50 p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-slate-700/50 flex items-center justify-center">
                  <Moon className="w-7 h-7 text-lime" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Rest day</p>
                  <p className="heading-3">Recovery</p>
                  <p className="text-xs text-slate-500 mt-1">Take a walk, stretch, or do light mobility work.</p>
                </div>
              </div>
            </div>
          ) : todayWorkout.isCompleted ? (
            <div className="card border-lime/30 bg-lime/5 p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-lime/20 flex items-center justify-center">
                  <Dumbbell className="w-7 h-7 text-lime" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Completed today</p>
                  <p className="heading-3">{todayWorkout.workoutTitle}</p>
                  {todayWorkout.isInGracePeriod && (
                    <p className="text-xs text-lime/70 mt-1">Logged within 24-hour grace period</p>
                  )}
                </div>
              </div>
            </div>
          ) : todayWorkout.workoutDayId ? (
            <Link href={`/workout/${todayWorkout.workoutDayId}`} className="card group hover:border-lime/50 transition-colors p-6 block">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-lime/20 flex items-center justify-center">
                    <Dumbbell className="w-7 h-7 text-lime" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Today's workout</p>
                    <p className="heading-3">{todayWorkout.workoutTitle}</p>
                  </div>
                </div>
                <ArrowRight className="w-6 h-6 text-lime group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ) : (
            <div className="card border-slate-700 bg-slate-800/30 p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-slate-700/50 flex items-center justify-center">
                  <Dumbbell className="w-7 h-7 text-slate-500" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">No workout scheduled for today</p>
                  <Link href="/plans" className="text-lime text-sm underline mt-1 inline-block">
                    Add a workout day for this weekday →
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {!error && missedDays.length > 0 && !todayWorkout?.isCompleted && (
        <div>
          <h2 className="heading-2 mb-3 text-amber-400">Catch up</h2>
          <div className="flex flex-col gap-2">
            {missedDays.map((day) => (
              <Link
                key={day.date}
                href={`/workout/${day.workoutDayId}`}
                className="card flex items-center justify-between border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50 transition-colors"
              >
                <div>
                  <p className="font-medium text-amber-300">{day.workoutTitle}</p>
                  <p className="text-xs text-slate-500">Missed on {day.dayLabel} - Still within grace period</p>
                </div>
                <span className="text-amber-400 text-sm font-medium flex-shrink-0">Do now {'\u2192'}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {!error && data?.weekSchedule && (
        <div>
          <h2 className="heading-2 mb-4">This week</h2>
          <WeekStrip days={data.weekSchedule.days} todayIndex={data.weekSchedule.todayIndex} />
        </div>
      )}

      {!error && data?.activePlan && (
        <div className="card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow">Current Plan</p>
              <h2 className="heading-2">{data.activePlan.name}</h2>
              {data.activePlan.startDate && (
                <p className="text-xs text-slate-500 mt-1">
                  {data.activePlan.startDate}
                  {data.activePlan.endDate ? ' \u2192 ' + data.activePlan.endDate : ' \u2192 open-ended'}
                </p>
              )}
            </div>
            <Link href={`/plans/${data.activePlan._id}`} className="text-sm text-lime hover:text-lime/80 font-medium underline flex-shrink-0">
              View {'\u2192'}
            </Link>
          </div>
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
      )}

      {!error && !data?.activePlan && (
        <div className="card text-center py-8">
          <p className="text-slate-400 mb-4">No active plan yet. Start by creating one with a schedule.</p>
          <Link href="/plans" className="btn btn-primary inline-flex">Create a plan</Link>
        </div>
      )}
    </div>
  );
}
