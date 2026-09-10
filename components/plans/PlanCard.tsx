'use client';

import Link from 'next/link';

interface PlanCardProps {
  plan: {
    _id: string;
    name: string;
    goal?: string;
    isActive: boolean;
    updatedAt: string;
  };
}

export default function PlanCard({ plan }: PlanCardProps) {
  return (
    <Link href={`/plans/${plan._id}`} className="card flex flex-col gap-1 transition-colors hover:border-primary-500/50">
      <div className="flex items-center justify-between">
        <span className="font-semibold">{plan.name}</span>
        {plan.isActive && (
          <span className="rounded-full bg-primary-600/20 px-2 py-0.5 text-xs font-medium text-primary-400">
            Active
          </span>
        )}
      </div>
      {plan.goal && <span className="text-sm text-slate-400">{plan.goal}</span>}
    </Link>
  );
}
