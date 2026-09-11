'use client';

import Link from 'next/link';
import { Trash2, AlertCircle } from 'lucide-react';
import { useState } from 'react';

interface PlanCardProps {
  plan: {
    _id: string;
    name: string;
    goal?: string;
    isActive: boolean;
    updatedAt: string;
  };
  onDeleted?: (planId: string) => void;
}

export default function PlanCard({ plan, onDeleted }: PlanCardProps) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/plans/${plan._id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      onDeleted?.(plan._id);
    } catch {
      setError('Could not delete plan. Try again.');
      setDeleting(false);
      setConfirming(false);
    }
  }

  return (
    <Link href={`/plans/${plan._id}`} className="card flex flex-col gap-1 transition-colors hover:border-lime/40">
      <div className="flex items-center justify-between">
        <span className="font-semibold">{plan.name}</span>
        <div className="flex items-center gap-2">
          {plan.isActive && (
            <span className="rounded-full bg-lime/20 px-2 py-0.5 text-xs font-medium text-lime">
              Active
            </span>
          )}
          <span
            role="button"
            tabIndex={0}
            onClick={handleDelete}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleDelete(e as any); } }}
            className={`cursor-pointer rounded-lg p-2 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center ${
              confirming
                ? 'bg-red-500/20 text-red-400'
                : 'text-slate-500 hover:text-red-400 hover:bg-slate-700/50'
            }`}
            title={confirming ? 'Click again to confirm' : 'Delete plan'}
            aria-label={confirming ? `Confirm delete ${plan.name}` : `Delete ${plan.name}`}
          >
            {deleting ? (
              <span className="text-xs">…</span>
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </span>
        </div>
      </div>
      {plan.goal && <span className="text-sm text-slate-400">{plan.goal}</span>}
      {confirming && !error && (
        <p className="text-xs text-red-400 mt-1">Click trash again to confirm deletion</p>
      )}
      {error && (
        <p role="alert" className="flex items-center gap-1 text-xs text-red-400 mt-1">
          <AlertCircle className="w-3 h-3" /> {error}
        </p>
      )}
    </Link>
  );
}
