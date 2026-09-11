'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trash2, AlertCircle, ChevronDown, ChevronUp, Dumbbell } from 'lucide-react';
import WorkoutDayEditor from '@/components/plans/WorkoutDayEditor';

interface WorkoutDaySummary {
  _id: string;
  weekNumber: number;
  dayOfWeek: number;
  title: string;
  warmupInstructions?: string;
  cardioInstructions?: string;
}

interface Plan {
  _id: string;
  name: string;
  goal?: string;
  isActive: boolean;
}

const DAY_NAMES = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function PlanDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [days, setDays] = useState<WorkoutDaySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDay, setShowAddDay] = useState(false);
  const [newDay, setNewDay] = useState({ weekNumber: 1, dayOfWeek: 1, title: '' });
  const [planDeleteConfirm, setPlanDeleteConfirm] = useState(false);
  const [planDeleting, setPlanDeleting] = useState(false);
  const [planDeleteError, setPlanDeleteError] = useState<string | null>(null);
  const [deletingDayId, setDeletingDayId] = useState<string | null>(null);
  const [confirmDayId, setConfirmDayId] = useState<string | null>(null);
  const [dayDeleteError, setDayDeleteError] = useState<string | null>(null);
  const [expandedDayId, setExpandedDayId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [planRes, daysRes] = await Promise.all([
          fetch(`/api/plans/${params.id}`),
          fetch(`/api/workout-days?planId=${params.id}`),
        ]);
        if (planRes.ok) setPlan(await planRes.json());
        if (daysRes.ok) setDays(await daysRes.json());
      } catch {
        // error handled silently
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [params.id]);

  async function handleAddDay() {
    try {
      const res = await fetch('/api/workout-days', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newDay, planId: params.id }),
      });
      if (res.ok) {
        setShowAddDay(false);
        setNewDay({ weekNumber: 1, dayOfWeek: 1, title: '' });
        const refreshed = await fetch(`/api/workout-days?planId=${params.id}`);
        if (refreshed.ok) setDays(await refreshed.json());
      }
    } catch {
      // error handled silently
    }
  }

  async function handleDeletePlan() {
    if (!planDeleteConfirm) {
      setPlanDeleteConfirm(true);
      return;
    }
    setPlanDeleting(true);
    setPlanDeleteError(null);
    try {
      const res = await fetch(`/api/plans/${params.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      router.push('/plans');
    } catch {
      setPlanDeleteError('Could not delete plan. Try again.');
      setPlanDeleting(false);
      setPlanDeleteConfirm(false);
    }
  }

  async function handleDeleteDay(dayId: string) {
    if (confirmDayId !== dayId) {
      setConfirmDayId(dayId);
      setDayDeleteError(null);
      return;
    }
    setDeletingDayId(dayId);
    setDayDeleteError(null);
    try {
      const res = await fetch(`/api/workout-days/${dayId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      setDays((prev) => prev.filter((d) => d._id !== dayId));
      setConfirmDayId(null);
      if (expandedDayId === dayId) setExpandedDayId(null);
    } catch {
      setDayDeleteError('Could not delete day. Try again.');
      setDeletingDayId(null);
      setConfirmDayId(null);
    }
  }

  if (loading) return <div className="text-slate-500">Loading plan...</div>;
  if (!plan) return <div className="text-slate-500">Plan not found.</div>;

  return (
    <div className="flex flex-col gap-4">
      <Link href="/plans" className="text-sm text-slate-400 underline">← Back to plans</Link>

      <div className="card">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-lime">{plan.name}</h1>
          {plan.isActive && (
            <span className="rounded-full bg-lime/20 px-2 py-0.5 text-xs font-medium text-lime">
              Active
            </span>
          )}
        </div>
        {plan.goal && <p className="mt-1 text-slate-400">{plan.goal}</p>}

        <div className="mt-4 border-t border-slate-700 pt-4">
          <button
            onClick={handleDeletePlan}
            disabled={planDeleting}
            className={`btn text-sm transition-colors ${
              planDeleteConfirm
                ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                : 'text-slate-400 hover:text-red-400'
            }`}
          >
            {planDeleting ? 'Deleting...' : planDeleteConfirm ? 'Click again to confirm' : 'Delete plan'}
          </button>
          {planDeleteConfirm && !planDeleteError && (
            <p className="text-xs text-red-400 mt-2">This will permanently remove the plan and all its workout days.</p>
          )}
          {planDeleteError && (
            <p role="alert" className="flex items-center gap-1 text-xs text-red-400 mt-2">
              <AlertCircle className="w-3 h-3" /> {planDeleteError}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Workout Days</h2>
        <button className="btn-primary text-sm" onClick={() => setShowAddDay(true)}>
          Add Day
        </button>
      </div>

      {showAddDay && (
        <div className="card flex flex-col gap-2">
          <input
            className="input"
            placeholder="Title (e.g., Upper Body A)"
            value={newDay.title}
            onChange={(e) => setNewDay({ ...newDay, title: e.target.value })}
          />
          <div className="flex gap-2">
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-xs text-slate-500">Week</label>
              <input
                className="input"
                type="number"
                min={1}
                value={newDay.weekNumber}
                onChange={(e) => setNewDay({ ...newDay, weekNumber: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-xs text-slate-500">Day of week</label>
              <select
                className="input"
                value={newDay.dayOfWeek}
                onChange={(e) => setNewDay({ ...newDay, dayOfWeek: parseInt(e.target.value) })}
              >
                {DAY_NAMES.map((name, i) => i === 0 ? null : (
                  <option key={i} value={i}>{name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn-primary flex-1" onClick={handleAddDay} disabled={!newDay.title.trim()}>
              Add
            </button>
            <button className="btn-secondary" onClick={() => setShowAddDay(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {dayDeleteError && (
        <p role="alert" className="flex items-center gap-1 text-xs text-red-400">
          <AlertCircle className="w-3 h-3" /> {dayDeleteError}
        </p>
      )}

      <div className="flex flex-col gap-2">
        {days.map((day) => (
          <div key={day._id}>
            <div
              className={`card flex items-center justify-between transition-colors ${
                confirmDayId === day._id ? 'border-red-500/50 bg-red-500/5' : ''
              }`}
            >
              <button
                onClick={() => setExpandedDayId(expandedDayId === day._id ? null : day._id)}
                className="flex items-center gap-3 flex-1 min-w-0 text-left"
              >
                {expandedDayId === day._id ? (
                  <ChevronUp className="w-5 h-5 text-slate-500 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-500 flex-shrink-0" />
                )}
                <Dumbbell className="w-4 h-4 text-lime flex-shrink-0" />
                <div className="min-w-0">
                  <span className="font-medium block truncate">{day.title}</span>
                  <span className="text-xs text-slate-500">
                    {DAY_NAMES[day.dayOfWeek] || `Day ${day.dayOfWeek}`}
                  </span>
                </div>
              </button>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link
                  href={`/workout/${day._id}`}
                  className="text-lime text-sm font-medium hover:underline"
                >
                  Start →
                </Link>
                <button
                  onClick={() => handleDeleteDay(day._id)}
                  disabled={deletingDayId === day._id}
                  className={`rounded-lg p-2 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center ${
                    confirmDayId === day._id
                      ? 'bg-red-500/20 text-red-400'
                      : 'text-slate-500 hover:text-red-400 hover:bg-slate-700/50'
                  }`}
                  title={confirmDayId === day._id ? 'Click again to confirm' : 'Delete day'}
                  aria-label={confirmDayId === day._id ? `Confirm delete ${day.title}` : `Delete ${day.title}`}
                >
                  {deletingDayId === day._id ? (
                    <span className="text-xs">…</span>
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {expandedDayId === day._id && (
              <div className="mt-2 ml-4 mr-1 border-l-2 border-slate-700 pl-4">
                <WorkoutDayEditor workoutDayId={day._id} dayTitle={day.title} />
              </div>
            )}
          </div>
        ))}
        {days.length === 0 && <p className="text-slate-500">No workout days yet. Add one above.</p>}
      </div>
    </div>
  );
}
