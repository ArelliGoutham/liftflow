'use client';

interface ExerciseFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const categories = [
  { value: '', label: 'All' },
  { value: 'upper-body', label: 'Upper Body' },
  { value: 'lower-body', label: 'Lower Body' },
  { value: 'core', label: 'Core' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'flexibility', label: 'Flexibility' },
  { value: 'plyometrics', label: 'Plyometrics' },
];

export default function ExerciseFilter({ selectedCategory, onCategoryChange }: ExerciseFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((cat) => (
        <button
          key={cat.value}
          onClick={() => onCategoryChange(cat.value)}
          aria-pressed={selectedCategory === cat.value}
          className={`rounded-full px-3 py-1 text-sm font-medium transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
            selectedCategory === cat.value
              ? 'bg-lime text-charcoal'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}
