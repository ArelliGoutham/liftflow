'use client';

import PlanCard from './PlanCard';

interface Plan {
  _id: string;
  name: string;
  goal?: string;
  isActive: boolean;
  updatedAt: string;
}

interface PlanListProps {
  plans: Plan[];
  onPlanDeleted?: () => void;
}

export default function PlanList({ plans, onPlanDeleted }: PlanListProps) {
  if (plans.length === 0) {
    return (
      <div className="text-center text-slate-500">
        <p>No plans yet.</p>
        <p className="text-sm">Create your first workout plan below.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {plans.map((plan) => (
        <PlanCard key={plan._id} plan={plan} onDeleted={() => onPlanDeleted?.()} />
      ))}
    </div>
  );
}
