import ExerciseDetail from '@/components/exercises/ExerciseDetail';
import { getExerciseById } from '@/lib/db/repositories/exerciseRepository';
import { getExternalExerciseById } from '@/lib/exercises/externalExercises';
import Link from 'next/link';
import { notFound } from 'next/navigation';

function isMongoId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

export default async function ExerciseDetailPage({ params }: { params: { id: string } }) {
  let exercise: any = null;

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
