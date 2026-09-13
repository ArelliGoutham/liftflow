'use client';

import type { IExerciseOption } from '@/types';

interface ExercisePickerProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filteredAvailable: IExerciseOption[];
  onPick: (exerciseId: string, name: string) => void;
  onClose: () => void;
}

export default function ExercisePicker({
  searchTerm,
  onSearchChange,
  filteredAvailable,
  onPick,
  onClose,
}: ExercisePickerProps) {
  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Pick an exercise</h3>
        <button
          className="text-slate-400 hover:text-slate-200 text-sm"
          onClick={onClose}
        >
          Close
        </button>
      </div>
      <input
        className="input"
        placeholder="Search exercises..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        autoFocus
      />
      <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
        {filteredAvailable.length === 0 && (
          <p className="text-slate-500 text-sm py-4 text-center">
            {searchTerm ? 'No matching exercises found.' : 'All exercises already added.'}
          </p>
        )}
        {filteredAvailable.map((ex) => (
          <button
            key={ex._id}
            onClick={() => onPick(ex._id, ex.name)}
            className="flex items-center justify-between rounded-lg p-3 text-left hover:bg-slate-700/50 transition-colors"
          >
            <span className="text-sm font-medium">{ex.name}</span>
            <span className="text-xs text-slate-500">{ex.category}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
