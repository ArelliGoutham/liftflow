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
    primaryMuscles?: string[];
    secondaryMuscles?: string[];
    equipment?: string;
    level?: string;
    forceType?: string;
    mechanic?: string;
    goals?: string[];
    tags?: string[];
    imageUrls?: string[];
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
  const validReferences = (exercise.referenceUrls || []).filter(isValidUrl);
  const hasInvalidReferences =
    (exercise.referenceUrls?.length ?? 0) > validReferences.length;

  const levelColor: Record<string, string> = {
    beginner: 'text-emerald-400 bg-emerald-500/10',
    intermediate: 'text-amber-400 bg-amber-500/10',
    advanced: 'text-red-400 bg-red-500/10',
  };

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
                src={url}
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

      {/* Execution */}
      {exercise.executionCues && exercise.executionCues.length > 0 && (
        <section>
          <h2 className="heading-2 mb-4">Movement</h2>
          <ol className="space-y-3" start={(exercise.setupCues?.length ?? 0) + 1}>
            {exercise.executionCues.map((cue, i) => (
              <li key={i} className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-lime/20 text-lime font-semibold text-sm">
                  {(exercise.setupCues?.length ?? 0) + i + 1}
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

      {/* Tips / Safety */}
      {exercise.safetyNotes && exercise.safetyNotes.length > 0 && (
        <section className="border-l-4 border-amber-500/50 bg-amber-500/10 p-4 rounded">
          <h2 className="heading-3 text-amber-400 mb-3">Tips & Safety</h2>
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

      {/* Goals and tags */}
      {exercise.goals && exercise.goals.length > 0 && (
        <section>
          <h2 className="heading-3 mb-2">Training Goals</h2>
          <div className="flex flex-wrap gap-2">
            {exercise.goals.map((goal, i) => (
              <span key={i} className="rounded-lg bg-secondary-600/20 px-3 py-1 text-sm text-secondary-300">
                {goal}
              </span>
            ))}
          </div>
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
                  <span className="underline">{tryGetHostname(url)}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {hasInvalidReferences && (
        <p className="text-xs text-slate-500">
          Some references are not available.
        </p>
      )}

      {/* Attribution */}
      <section className="border-t border-slate-700 pt-6 mt-4">
        <p className="text-xs text-slate-500 leading-relaxed">
          <strong>Technique varies</strong> by body type, equipment, and individual factors. Always consult
          qualified trainers or medical professionals before starting new exercises. This guide is educational
          only and does not replace professional instruction.
        </p>
        <p className="text-xs text-slate-600 mt-2">
          Exercise data provided by{' '}
          <a href="https://github.com/yuhonas/free-exercise-db" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-400">free-exercise-db</a>{' '}
          and{' '}
          <a href="https://repdb.co" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-400">RepDB</a>.
        </p>
      </section>
    </div>
  );
}

function tryGetHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}
