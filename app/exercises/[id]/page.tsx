import ExerciseDetail from '@/components/exercises/ExerciseDetail';
import { getExerciseById } from '@/lib/db/repositories/exerciseRepository';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function ExerciseDetailPage({ params }: { params: { id: string } }) {
  const exercise = await getExerciseById(params.id);

  if (!exercise) {
    return notFound();
  }

  const detail = {
    name: exercise.name,
    category: exercise.category,
    description: exercise.description,
    setupCues: exercise.setupCues ?? [],
    executionCues: exercise.executionCues ?? [],
    breathingCues: exercise.breathingCues ?? [],
    commonMistakes: exercise.commonMistakes ?? [],
    safetyNotes: exercise.safetyNotes ?? [],
    referenceUrls: exercise.referenceUrls ?? [],
  };

  return (
    <div className="flex flex-col gap-4">
      <Link href="/exercises" className="text-sm text-slate-400 underline">
        ← Back to library
      </Link>
      <ExerciseDetail exercise={detail} />
    </div>
  );
}
