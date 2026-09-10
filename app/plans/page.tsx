'use client';

import { useState, useEffect } from 'react';
import PlanList from '@/components/plans/PlanList';
import PlanForm from '@/components/plans/PlanForm';

interface Plan {
  _id: string;
  name: string;
  goal?: string;
  isActive: boolean;
  updatedAt: string;
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  async function fetchPlans() {
    try {
      const res = await fetch('/api/plans');
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setPlans(data);
    } catch {
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPlans();
  }, []);

  async function handleCreate(data: {
    name: string;
    goal: string;
    description: string;
    startDate?: string;
    endDate?: string;
    weeklyAnchor?: number;
  }) {
    try {
      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setShowForm(false);
        fetchPlans();
      }
    } catch {
      // error handled silently; in production, surface error to user
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary-400">My Plans</h1>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          New Plan
        </button>
      </div>

      {showForm && <PlanForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />}

      {loading ? (
        <div className="text-slate-500">Loading plans...</div>
      ) : (
        <PlanList plans={plans} />
      )}
    </div>
  );
}
