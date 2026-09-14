'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trash2, AlertCircle, X } from 'lucide-react';
import CalendarView from '@/components/plans/CalendarView';
import WorkoutDayEditor from '@/components/plans/WorkoutDayEditor';

interface WorkoutDayInfo {
  _id: string;
  date: string;
  title: string;
  exercises?: any[];
}

interface Plan {
  _id: string;
  name: string;
  goal?: string;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
}

export default function PlanDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [days, setDays] = useState<WorkoutDayInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDay, setShowAddDay] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [newDayTitle, setNewDayTitle] = useState('');
  const [editingDayId, setEditingDayId] = useState<string | null>(null);
  const [planDeleteConfirm, setPlanDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [planRes, daysRes] = await Promise.all([
          fetch(`/api/plans/${params.id}`),
          fetch(`/api/workout-days?planId=${params.id}`),
        ]);
        if (planRes.ok) setPlan(await planRes.json());
        if (daysRes.ok) {
          const data = await daysRes.json();
          setDays(data.map((d: any) => ({
            _id: d._id?.toString() ?? '',
            date: d.date,
            title: d.title,
            exercises: d.exercises,
          })));
        }
      } catch {
        setError('Could not load plan');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [params.id]);

  async function handleAddDay() {
    if (!newDayTitle.trim() || !selectedDate) return;
    try {
      const res = await fetch('/api/workout-days', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: params.id, date: selectedDate, title: newDayTitle }),
      });
      if (res.ok) {
        setShowAddDay(false);
        setSelectedDate('');
        setNewDayTitle('');
        const refreshed = await fetch(`/api/workout-days?planId=${params.id}`);
        if (refreshed.ok) {
          const data = await refreshed.json();
          setDays(data.map((d: any) => ({ _id: d._id?.toString(), date: d.date, title: d.title, exercises: d.exercises })));
        }
      } else {
        const err = await res.json();
        setError(err.error || 'Failed to add day');
      }
    } catch { setError('Failed to add day'); }
  }

  async function handleDeletePlan() {
    if (!planDeleteConfirm) { setPlanDeleteConfirm(true); return; }
    try {
      const res = await fetch(`/api/plans/${params.id}`, { method: 'DELETE' });
      if (res.ok) router.push('/plans');
    } catch { setError('Failed to delete plan'); }
  }

  if (loading) return <div className="text-slate-500">Loading plan...</div>;
  if (!plan) return <div className="text-slate-500">Plan not found.</div>;

  return (
    <div className="flex flex-col gap-4">
      <Link href="/plans" className="text-sm text-slate-400 underline">← Back to plans</Link>

      <div className="card">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-lime">{plan.name}</h1>
          {plan.isActive && <span className="rounded-full bg-lime/20 px-2 py-0.5 text-xs font-medium text-lime">Active</span>}
        </div>
        {plan.goal && <p className="mt-1 text-slate-400">{plan.goal}</p>}
        {plan.startDate && <p className="text-xs text-slate-500 mt-1">{plan.startDate}{plan.endDate ? ` → ${plan.endDate}` : ' → open-ended'}</p>}

        <div className="mt-4 border-t border-slate-700 pt-4">
          <button onClick={handleDeletePlan} disabled={false}
            className={`btn text-sm ${planDeleteConfirm ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'text-slate-400 hover:text-red-400'}`}>
            {planDeleteConfirm ? 'Click again to confirm' : 'Delete plan'}
          </button>
          {planDeleteConfirm && <p className="text-xs text-red-400 mt-2">This will permanently remove the plan and all workout days.</p>}
        </div>
      </div>

      {error && (
        <div role="alert" className="flex items-center gap-2 rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /><span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      <h2 className="text-lg font-semibold">Calendar</h2>

      <CalendarView
        workoutDays={days}
        planStartDate={plan.startDate}
        planEndDate={plan.endDate}
        onSelectDate={(date) => { setSelectedDate(date); setShowAddDay(true); }}
        onOpenWorkout={(id) => setEditingDayId(id)}
      />

      {/* Add workout day modal */}
      {showAddDay && (
        <div className="card flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Add workout for {selectedDate}</h3>
            <button onClick={() => { setShowAddDay(false); setSelectedDate(''); setNewDayTitle(''); }} className="text-slate-400 hover:text-slate-200"><X className="w-4 h-4" /></button>
          </div>
          <input className="input" placeholder="Title (e.g., Upper Body A, Leg Day, Rest)" value={newDayTitle} onChange={(e) => setNewDayTitle(e.target.value)} autoFocus />
          <div className="flex gap-2">
            <button className="btn-primary flex-1" onClick={handleAddDay} disabled={!newDayTitle.trim()}>Add workout</button>
            <button className="btn-secondary" onClick={() => { setShowAddDay(false); setSelectedDate(''); setNewDayTitle(''); }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Workout day editor */}
      {editingDayId && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-lime">Edit Workout Day</h3>
            <button onClick={() => setEditingDayId(null)} className="text-slate-400 hover:text-slate-200"><X className="w-5 h-5" /></button>
          </div>
          <div className="border-l-2 border-slate-700 pl-4">
            <WorkoutDayEditor workoutDayId={editingDayId} dayTitle={days.find(d => d._id === editingDayId)?.title || ''} />
          </div>
          <Link href={`/workout/${editingDayId}`} className="btn-primary text-sm w-fit">Start Workout →</Link>
        </div>
      )}
    </div>
  );
}
