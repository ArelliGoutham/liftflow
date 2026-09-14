'use client';

import ExerciseSections from './ExerciseSections';
import { getDetailImageUrl } from '@/lib/exercises/externalExercises';

export interface ExerciseDetailData {
  name: string;
  category: string;
  description?: string;
  setupCues?: string[];
  executionCues?: string[];
  breathingCues?: string[];
  commonMistakes?: string[];
  safetyNotes?: string[];
  instructions?: string[];
  tips?: string[];
  referenceUrls?: string[];
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  equipment?: string;
  level?: string;
  forceType?: string;
  mechanic?: string;
  goals?: string[];
  tags?: string[];
  imageUrls?: string[];
}

interface ExerciseDetailProps {
  exercise: ExerciseDetailData;
}

const levelColor: Record<string, string> = {
  beginner: 'text-emerald-400 bg-emerald-500/10',
  intermediate: 'text-amber-400 bg-amber-500/10',
  advanced: 'text-red-400 bg-red-500/10',
};

export default function ExerciseDetail({ exercise }: ExerciseDetailProps) {
  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      {/* Images */}
      {exercise.imageUrls && exercise.imageUrls.length > 0 && (
        <div className={`grid gap-3 ${exercise.imageUrls.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {exercise.imageUrls.slice(0, 4).map((url, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-xl border border-slate-700 bg-slate-800 flex items-center justify-center"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getDetailImageUrl(url)}
                alt={`${exercise.name} - pose ${i + 1}`}
                className="w-full h-auto max-h-72 object-contain"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      )}

      {/* Title and metadata */}
      <div>
        <div className="eyebrow mb-2">{exercise.category}</div>
        <h1 className="page-title">{exercise.name}</h1>
        {exercise.description && (
          <p className="mt-4 text-slate-300 text-lg leading-relaxed">{exercise.description}</p>
        )}

        {/* Metadata badges */}
        <div className="mt-4 flex flex-wrap gap-2">
          {exercise.level && (
            <span className={`rounded-lg px-3 py-1 text-xs font-medium ${levelColor[exercise.level] || 'bg-slate-700 text-slate-300'}`}>
              {exercise.level}
            </span>
          )}
          {exercise.equipment && (
            <span className="rounded-lg bg-slate-700/50 px-3 py-1 text-xs font-medium text-slate-300">
              {exercise.equipment}
            </span>
          )}
          {exercise.forceType && (
            <span className="rounded-lg bg-slate-700/50 px-3 py-1 text-xs font-medium text-slate-300">
              {exercise.forceType}
            </span>
          )}
          {exercise.mechanic && (
            <span className="rounded-lg bg-slate-700/50 px-3 py-1 text-xs font-medium text-slate-300">
              {exercise.mechanic}
            </span>
          )}
        </div>
      </div>

      {/* Muscle groups */}
      {(exercise.primaryMuscles?.length ?? 0) > 0 && (
        <section>
          <h2 className="heading-2 mb-4">Muscles Worked</h2>
          <div className="flex flex-col gap-3">
            {exercise.primaryMuscles && exercise.primaryMuscles.length > 0 && (
              <div>
                <p className="text-xs text-lime font-semibold uppercase mb-1.5">Primary</p>
                <div className="flex flex-wrap gap-2">
                  {exercise.primaryMuscles.map((muscle, i) => (
                    <span key={i} className="rounded-lg bg-lime/10 px-3 py-1 text-sm text-lime">
                      {muscle}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase mb-1.5">Secondary</p>
                <div className="flex flex-wrap gap-2">
                  {exercise.secondaryMuscles.map((muscle, i) => (
                    <span key={i} className="rounded-lg bg-slate-700/50 px-3 py-1 text-sm text-slate-400">
                      {muscle}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      <ExerciseSections exercise={exercise} />
    </div>
  );
}
