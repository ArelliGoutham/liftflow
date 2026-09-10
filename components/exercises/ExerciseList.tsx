'use client';

import Link from 'next/link';
import { Dumbbell } from 'lucide-react';

interface Exercise {
  _id: string;
  name: string;
  category: string;
}

interface ExerciseListProps {
  exercises: Exercise[];
}

const categoryColors: Record<string, { bg: string; text: string; label: string }> = {
  'upper-body': { bg: 'bg-blue-500/20', text: 'text-blue-300', label: 'Upper Body' },
  'lower-body': { bg: 'bg-emerald-500/20', text: 'text-emerald-300', label: 'Lower Body' },
  core: { bg: 'bg-amber-500/20', text: 'text-amber-300', label: 'Core' },
  cardio: { bg: 'bg-red-500/20', text: 'text-red-300', label: 'Cardio' },
  flexibility: { bg: 'bg-purple-500/20', text: 'text-purple-300', label: 'Flexibility' },
};

function getCategoryStyle(category: string) {
  return categoryColors[category] || { bg: 'bg-slate-700/50', text: 'text-slate-300', label: category };
}

export default function ExerciseList({ exercises }: ExerciseListProps) {
  if (exercises.length === 0) {
    return (
      <div className="card text-center py-12">
        <Dumbbell className="w-12 h-12 text-slate-600 mx-auto mb-4 opacity-50" />
        <p className="text-slate-400">No exercises found.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {exercises.map((exercise) => {
        const style = getCategoryStyle(exercise.category);
        return (
          <Link
            key={exercise._id}
            href={`/exercises/${exercise._id}`}
            className="card group hover:border-lime/50 transition-colors flex flex-col gap-3"
          >
            <div className="flex items-start justify-between gap-2">
              <Dumbbell className="w-5 h-5 text-lime flex-shrink-0 group-hover:scale-110 transition-transform" />
              <span className={`rounded-full px-2 py-1 text-xs font-medium ${style.bg} ${style.text} flex-shrink-0`}>
                {style.label}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold group-hover:text-lime transition-colors line-clamp-2">
                {exercise.name}
              </h3>
            </div>
            <div className="text-sm text-lime font-medium group-hover:translate-x-1 transition-transform">
              View form guide →
            </div>
          </Link>
        );
      })}
    </div>
  );
}
