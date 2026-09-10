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

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export default function ExerciseDetail({ exercise }: ExerciseDetailProps) {
  const validReferences = exercise.referenceUrls?.filter(isValidUrl) ?? [];
  const hasInvalidReferences = (exercise.referenceUrls?.length ?? 0) > validReferences.length;

  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      {/* Header */}
      <div>
        <div className="eyebrow mb-2">{exercise.category}</div>
        <h1 className="page-title">{exercise.name}</h1>
        {exercise.description && (
          <p className="mt-4 text-slate-300 text-lg leading-relaxed">{exercise.description}</p>
        )}
      </div>

      {/* Setup */}
      {exercise.setupCues && exercise.setupCues.length > 0 && (
        <section>
          <h2 className="heading-2 mb-4">Setup</h2>
          <ol className="space-y-3">
            {exercise.setupCues.map((cue, i) => (
              <li key={i} className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-lime/20 text-lime font-semibold text-sm">
                  {i + 1}
                </span>
                <span className="text-slate-300 pt-0.5">{cue}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Execution / Movement */}
      {exercise.executionCues && exercise.executionCues.length > 0 && (
        <section>
          <h2 className="heading-2 mb-4">Movement</h2>
          <ol className="space-y-3">
            {exercise.executionCues.map((cue, i) => (
              <li key={i} className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-lime/20 text-lime font-semibold text-sm">
                  {i + 1}
                </span>
                <span className="text-slate-300 pt-0.5">{cue}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Breathing */}
      {exercise.breathingCues && exercise.breathingCues.length > 0 && (
        <section>
          <h2 className="heading-2 mb-4">Breathing</h2>
          <ul className="space-y-2">
            {exercise.breathingCues.map((cue, i) => (
              <li key={i} className="flex gap-3 text-slate-300">
                <span className="text-lime flex-shrink-0">•</span>
                <span>{cue}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Common Mistakes */}
      {exercise.commonMistakes && exercise.commonMistakes.length > 0 && (
        <section>
          <h2 className="heading-2 mb-4 text-red-400">Common Mistakes</h2>
          <ul className="space-y-2">
            {exercise.commonMistakes.map((mistake, i) => (
              <li key={i} className="flex gap-3 text-slate-300">
                <span className="text-red-400 flex-shrink-0">✕</span>
                <span>{mistake}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Safety Notes */}
      {exercise.safetyNotes && exercise.safetyNotes.length > 0 && (
        <section className="border-l-4 border-amber-500/50 bg-amber-500/10 p-4 rounded">
          <h2 className="heading-3 text-amber-400 mb-3">Safety Notes</h2>
          <ul className="space-y-2">
            {exercise.safetyNotes.map((note, i) => (
              <li key={i} className="flex gap-3 text-slate-300">
                <span className="text-amber-400 flex-shrink-0">⚠</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* References */}
      {validReferences.length > 0 && (
        <section>
          <h2 className="heading-2 mb-4">References</h2>
          <ul className="space-y-2">
            {validReferences.map((url, i) => (
              <li key={i}>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lime hover:text-lime/80 break-all text-sm transition-colors flex items-center gap-2"
                >
                  <span>🔗</span>
                  <span className="underline">{new URL(url).hostname}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {hasInvalidReferences && (
        <p className="text-xs text-slate-500">
          {validReferences.length === 0 ? 'References' : 'Some references'} are not available.
        </p>
      )}

      {/* Disclaimer */}
      <section className="border-t border-slate-700 pt-6 mt-4">
        <p className="text-xs text-slate-500 leading-relaxed">
          <strong>Technique varies</strong> by body type, equipment, and individual factors. Always consult
          qualified trainers or medical professionals before starting new exercises. This guide is educational
          only and does not replace professional instruction.
        </p>
      </section>
    </div>
  );
}
