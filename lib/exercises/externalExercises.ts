import type { IExternalExercise } from '@/types';

// Canonical exercise database — 1,376 exercises merged from:
//   - free-exercise-db (public domain, CC0)
//   - RepDB (attribution: repdb.co)
//   - wrkout/exercises.json (public domain, CC0)
// Repo: https://github.com/ArelliGoutham/exercise-database
const EXERCISE_DB_URL =
  'https://raw.githubusercontent.com/ArelliGoutham/exercise-database/main/dist/exercises.json';

let cachedExercises: IExternalExercise[] | null = null;
let cacheTime = 0;
const CACHE_TTL_MS = 10 * 60 * 1000;

/**
 * Fetches the canonical exercise database from the external CDN with a 10-minute in-memory cache.
 * @returns Array of external exercise documents; returns cached data on fetch failure if available, empty array otherwise
 */
export async function getExternalExercises(): Promise<IExternalExercise[]> {
  if (cachedExercises && Date.now() - cacheTime < CACHE_TTL_MS) {
    return cachedExercises;
  }

  try {
    const res = await fetch(EXERCISE_DB_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed: ${res.status}`);
    const data = await res.json();

    if (!Array.isArray(data)) throw new Error('Invalid response format');

    cachedExercises = data as IExternalExercise[];
    cacheTime = Date.now();
    return data as IExternalExercise[];
  } catch (err) {
    console.error('[externalExercises] Fetch failed:', err instanceof Error ? err.message : err);
    if (cachedExercises) return cachedExercises;
    return [];
  }
}

/**
 * Retrieves a single external exercise by ID, matching against multiple identifier fields.
 * @param id - The exercise identifier (id, _id, sourceIds, or name) as a string
 * @returns The matching external exercise, or null if not found
 */
export async function getExternalExerciseById(id: string): Promise<IExternalExercise | null> {
  const all = await getExternalExercises();
  return (
    all.find(
      (e) =>
        e.id === id ||
        e._id === id ||
        e.sourceIds?.freeExerciseDb === id ||
        e.sourceIds?.repdb === id ||
        e.name === id
    ) || null
  );
}
