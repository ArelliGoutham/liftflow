'use client';

import { useState } from 'react';

interface PlanFormProps {
  onSubmit: (data: { name: string; goal: string; description: string }) => void;
  onCancel: () => void;
}

export default function PlanForm({ onSubmit, onCancel }: PlanFormProps) {
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [description, setDescription] = useState('');

  return (
    <div className="card flex flex-col gap-3">
      <h3 className="text-lg font-semibold">Create Plan</h3>
      <input
        className="input"
        placeholder="Plan name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        className="input"
        placeholder="Goal (e.g., strength, endurance)"
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
      />
      <textarea
        className="input min-h-[80px]"
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <div className="flex gap-2">
        <button
          className="btn-primary flex-1"
          onClick={() => onSubmit({ name, goal, description })}
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
