'use client';

import { useState } from 'react';

interface PlanFormProps {
  onSubmit: (data: {
    name: string;
    goal: string;
    description: string;
    startDate?: string;
    endDate?: string;
    weeklyAnchor?: number;
  }) => void;
  onCancel: () => void;
}

const WEEK_DAYS = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 7, label: 'Sunday' },
];

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function PlanForm({ onSubmit, onCancel }: PlanFormProps) {
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(todayISO());
  const [endDate, setEndDate] = useState('');
  const [weeklyAnchor, setWeeklyAnchor] = useState(1);

  const handleSubmit = () => {
    onSubmit({
      name,
      goal,
      description,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      weeklyAnchor,
    });
  };

  return (
    <div className="card flex flex-col gap-4">
      <h3 className="text-lg font-semibold">Create Plan</h3>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="plan-name" className="text-sm text-slate-300">Plan name</label>
        <input
          id="plan-name"
          className="input"
          placeholder="e.g., 4-Week Foundation"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="plan-goal" className="text-sm text-slate-300">Goal (optional)</label>
        <input
          id="plan-goal"
          className="input"
          placeholder="e.g., strength, endurance"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
        />
      </div>

      <textarea
        className="input min-h-[70px]"
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <div className="border-t border-slate-700 pt-4">
        <p className="eyebrow mb-3">Schedule</p>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="plan-start" className="text-sm text-slate-300">Start date</label>
            <input
              id="plan-start"
              className="input"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="plan-end" className="text-sm text-slate-300">End date (optional)</label>
            <input
              id="plan-end"
              className="input"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5 mt-3">
          <label htmlFor="plan-anchor" className="text-sm text-slate-300">Week starts on</label>
          <select
            id="plan-anchor"
            className="input"
            value={weeklyAnchor}
            onChange={(e) => setWeeklyAnchor(Number(e.target.value))}
          >
            {WEEK_DAYS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>

        {endDate && startDate && endDate < startDate && (
          <p role="alert" className="mt-2 text-xs text-red-400">End date must be after start date.</p>
        )}
      </div>

      <div className="flex gap-2">
        <button
          className="btn-primary flex-1"
          onClick={handleSubmit}
          disabled={!name.trim()}
        >
          Create
        </button>
        <button className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
