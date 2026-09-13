import ExerciseDetail from '@/components/exercises/ExerciseDetail';
import { getExerciseById } from '@/lib/db/repositories/exerciseRepository';
import { getExternalExerciseById } from '@/lib/exercises/externalExercises';
import { isMongoId } from '@/lib/utils';
import type { IExternalExercise } from '@/types';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function ExerciseDetailPage({ params }: { params: { id: string } }) {
  let exercise: IExternalExercise | null = null;

  if (isMongoId(params.id)) {
    exercise = await getExerciseById(params.id);
  }

  if (!exercise) {
    exercise = await getExternalExerciseById(params.id);
  }

  if (!exercise) {
    return notFound();
  }

  return (
    <div className="flex flex-col gap-4">
      <Link href="/exercises" className="text-sm text-slate-400 underline">
        ← Back to library
      </Link>
      <ExerciseDetail exercise={exercise} />
    </div>
  );
}
