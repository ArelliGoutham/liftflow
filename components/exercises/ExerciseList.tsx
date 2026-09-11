'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Dumbbell, Activity, Zap } from 'lucide-react';

interface Exercise {
  _id: string;
  name: string;
  category: string;
  primaryMuscles?: string[];
  equipment?: string;
  level?: string;
  imageUrls?: string[];
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
  plyometrics: { bg: 'bg-orange-500/20', text: 'text-orange-300', label: 'Plyometrics' },
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
        const muscleText = exercise.primaryMuscles?.slice(0, 2).join(', ') || '';
        return (
          <Link
            key={exercise._id}
            href={`/exercises/${exercise._id}`}
            className="card group hover:border-lime/50 transition-colors flex flex-col gap-3 overflow-hidden"
          >
            {exercise.imageUrls && exercise.imageUrls.length > 0 ? (
              <div className="relative h-28 -mx-4 -mt-4 mb-1 overflow-hidden bg-slate-800 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={exercise.imageUrls[0]}
                  alt={exercise.name}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
            ) : (
              <div className="relative h-28 -mx-4 -mt-4 mb-1 flex items-center justify-center bg-slate-800">
                <Dumbbell className="w-10 h-10 text-slate-600" />
              </div>
            )}

            <div className="flex items-start justify-between gap-2">
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${style.bg} ${style.text} flex-shrink-0`}>
                {style.label}
              </span>
              {exercise.level && (
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <Activity className="w-3 h-3" />
                  {exercise.level}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold group-hover:text-lime transition-colors line-clamp-2 text-sm">
                {exercise.name}
              </h3>
              {muscleText && (
                <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                  {muscleText}
                </p>
              )}
              {exercise.equipment && exercise.equipment !== 'body only' && (
                <p className="text-xs text-slate-600 mt-0.5">
                  {exercise.equipment}
                </p>
              )}
            </div>

            <div className="text-xs text-lime font-medium group-hover:translate-x-1 transition-transform">
              View guide →
            </div>
          </Link>
        );
      })}
    </div>
  );
}
