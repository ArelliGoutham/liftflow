'use client';

import type { ExerciseDetailData } from './ExerciseDetail';

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function tryGetHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

interface ExerciseSectionsProps {
  exercise: ExerciseDetailData;
}

export default function ExerciseSections({ exercise }: ExerciseSectionsProps) {
  const validReferences = (exercise.referenceUrls || []).filter(isValidUrl);
  const hasInvalidReferences =
    (exercise.referenceUrls?.length ?? 0) > validReferences.length;

  // Map external data format: instructions → setup + execution, tips → safety
  const setupCues = exercise.setupCues?.length ? exercise.setupCues : (exercise.instructions?.slice(0, 2) || []);
  const executionCues = exercise.executionCues?.length ? exercise.executionCues : (exercise.instructions?.slice(2) || []);
  const safetyNotes = exercise.safetyNotes?.length ? exercise.safetyNotes : (exercise.tips || []);

  return (
    <>
      {/* Setup */}
      {setupCues.length > 0 && (
        <section>
          <h2 className="heading-2 mb-4">Setup</h2>
          <ol className="space-y-3">
            {setupCues.map((cue, i) => (
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
      {executionCues.length > 0 && (
        <section>
          <h2 className="heading-2 mb-4">Movement</h2>
          <ol className="space-y-3" start={setupCues.length + 1}>
            {executionCues.map((cue, i) => (
              <li key={i} className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-lime/20 text-lime font-semibold text-sm">
                  {setupCues.length + i + 1}
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
      {safetyNotes.length > 0 && (
        <section className="border-l-4 border-amber-500/50 bg-amber-500/10 p-4 rounded">
          <h2 className="heading-3 text-amber-400 mb-3">Tips & Safety</h2>
          <ul className="space-y-2">
            {safetyNotes.map((note, i) => (
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
    </>
  );
}
