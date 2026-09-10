'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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

export default function PlanDetailPage({ params }: { params: { id: string } }) {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [days, setDays] = useState<WorkoutDaySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDay, setShowAddDay] = useState(false);
  const [newDay, setNewDay] = useState({ weekNumber: 1, dayOfWeek: 1, title: '' });

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
        const refreshed = await fetch(`/api/workout-days?planId=${params.id}`);
        if (refreshed.ok) setDays(await refreshed.json());
      }
    } catch {
      // error handled silently
    }
  }

  if (loading) return <div className="text-slate-500">Loading plan...</div>;
  if (!plan) return <div className="text-slate-500">Plan not found.</div>;

  return (
    <div className="flex flex-col gap-4">
      <Link href="/plans" className="text-sm text-slate-400 underline">← Back to plans</Link>

      <div className="card">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary-400">{plan.name}</h1>
          {plan.isActive && (
            <span className="rounded-full bg-primary-600/20 px-2 py-0.5 text-xs font-medium text-primary-400">
              Active
            </span>
          )}
        </div>
        {plan.goal && <p className="mt-1 text-slate-400">{plan.goal}</p>}
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
            <input
              className="input"
              type="number"
              placeholder="Week"
              value={newDay.weekNumber}
              onChange={(e) => setNewDay({ ...newDay, weekNumber: parseInt(e.target.value) || 1 })}
            />
            <input
              className="input"
              type="number"
              placeholder="Day"
              value={newDay.dayOfWeek}
              onChange={(e) => setNewDay({ ...newDay, dayOfWeek: parseInt(e.target.value) || 1 })}
            />
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

      <div className="flex flex-col gap-2">
        {days.map((day) => (
          <Link
            key={day._id}
            href={`/workout/${day._id}`}
            className="card flex items-center justify-between transition-colors hover:border-primary-500/50"
          >
            <div>
              <span className="font-medium">{day.title}</span>
              <span className="ml-2 text-xs text-slate-500">
                Week {day.weekNumber}, Day {day.dayOfWeek}
              </span>
            </div>
            <span className="text-primary-400">Start →</span>
          </Link>
        ))}
        {days.length === 0 && <p className="text-slate-500">No workout days yet. Add one above.</p>}
      </div>
    </div>
  );
}
