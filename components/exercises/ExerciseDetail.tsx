'use client';

interface ExerciseDetailProps {
  exercise: {
    name: string;
    category: string;
    description?: string;
    setupCues?: string[];
    executionCues?: string[];
    breathingCues?: string[];
    commonMistakes?: string[];
    safetyNotes?: string[];
    referenceUrls?: string[];
  };
}

export default function ExerciseDetail({ exercise }: ExerciseDetailProps) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-400">{exercise.name}</h1>
        <p className="mt-1 text-sm text-slate-400">{exercise.category}</p>
        {exercise.description && <p className="mt-2 text-slate-300">{exercise.description}</p>}
      </div>

      {exercise.setupCues && exercise.setupCues.length > 0 && (
        <section>
          <h2 className="mb-2 text-lg font-semibold">Setup</h2>
          <ul className="list-inside list-disc space-y-1 text-slate-300">
            {exercise.setupCues.map((cue, i) => (
              <li key={i}>{cue}</li>
            ))}
          </ul>
        </section>
      )}

      {exercise.executionCues && exercise.executionCues.length > 0 && (
        <section>
          <h2 className="mb-2 text-lg font-semibold">Execution</h2>
          <ul className="list-inside list-disc space-y-1 text-slate-300">
            {exercise.executionCues.map((cue, i) => (
              <li key={i}>{cue}</li>
            ))}
          </ul>
        </section>
      )}

      {exercise.breathingCues && exercise.breathingCues.length > 0 && (
        <section>
          <h2 className="mb-2 text-lg font-semibold">Breathing</h2>
          <ul className="list-inside list-disc space-y-1 text-slate-300">
            {exercise.breathingCues.map((cue, i) => (
              <li key={i}>{cue}</li>
            ))}
          </ul>
        </section>
      )}

      {exercise.commonMistakes && exercise.commonMistakes.length > 0 && (
        <section>
          <h2 className="mb-2 text-lg font-semibold text-red-400">Common Mistakes</h2>
          <ul className="list-inside list-disc space-y-1 text-slate-300">
            {exercise.commonMistakes.map((mistake, i) => (
              <li key={i}>{mistake}</li>
            ))}
          </ul>
        </section>
      )}

      {exercise.safetyNotes && exercise.safetyNotes.length > 0 && (
        <section>
          <h2 className="mb-2 text-lg font-semibold text-amber-400">Safety Notes</h2>
          <ul className="list-inside list-disc space-y-1 text-slate-300">
            {exercise.safetyNotes.map((note, i) => (
              <li key={i}>{note}</li>
            ))}
          </ul>
        </section>
      )}

      {exercise.referenceUrls && exercise.referenceUrls.length > 0 && (
        <section>
          <h2 className="mb-2 text-lg font-semibold">References</h2>
          <div className="flex flex-col gap-1">
            {exercise.referenceUrls.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-primary-400 underline">
                {url}
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
