import ExerciseDetail from '@/components/exercises/ExerciseDetail';
import { getExerciseForDisplay } from '@/lib/services/exerciseService';
import type { IExternalExercise } from '@/types';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function ExerciseDetailPage({ params }: { params: { id: string } }) {
  const exercise = await getExerciseForDisplay(params.id);

  if (!exercise) {
    return notFound();
  }

  return (
    <div className="flex flex-col gap-4">
      <Link href="/exercises" className="text-sm text-slate-400 underline">
        ← Back to library
      </Link>
      <ExerciseDetail exercise={exercise as IExternalExercise} />
    </div>
  );
}
