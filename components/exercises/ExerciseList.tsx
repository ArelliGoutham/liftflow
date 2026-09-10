'use client';

import Link from 'next/link';

interface Exercise {
  _id: string;
  name: string;
  category: string;
}

interface ExerciseListProps {
  exercises: Exercise[];
}

const categoryColors: Record<string, string> = {
  'upper-body': 'bg-blue-500/20 text-blue-300',
  'lower-body': 'bg-emerald-500/20 text-emerald-300',
  core: 'bg-amber-500/20 text-amber-300',
};

export default function ExerciseList({ exercises }: ExerciseListProps) {
  if (exercises.length === 0) {
    return <p className="text-slate-500">No exercises found.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {exercises.map((exercise) => (
        <Link
          key={exercise._id}
          href={`/exercises/${exercise._id}`}
          className="card flex items-center justify-between transition-colors hover:border-primary-500/50"
        >
          <span className="font-medium">{exercise.name}</span>
          <span className={`rounded-full px-2 py-0.5 text-xs ${categoryColors[exercise.category] || 'bg-slate-700 text-slate-300'}`}>
            {exercise.category}
          </span>
        </Link>
      ))}
    </div>
  );
}
