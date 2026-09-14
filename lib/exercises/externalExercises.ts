import type { IExternalExercise } from '@/types';

// Canonical exercise database — 1,376 exercises merged from:
//   - free-exercise-db (public domain, CC0)
//   - RepDB (attribution: repdb.co)
//   - wrkout/exercises.json (public domain, CC0)
// Repo: https://github.com/ArelliGoutham/exercise-database
const EXERCISE_DB_URL =
  'https://raw.githubusercontent.com/ArelliGoutham/exercise-database/main/dist/exercises.json';

// ImageKit CDN for optimized image delivery (WebP, resizing, caching)
const IMAGEKIT_BASE = 'https://ik.imagekit.io/liftflow/';
const GITHUB_IMG_PREFIX = 'https://raw.githubusercontent.com/ArelliGoutham/exercise-database/main/exercises/';
const REPDB_IMG_PREFIX = 'https://raw.githubusercontent.com/RepDB/exercise-dataset/main/';

/**
 * Rewrites GitHub raw image URLs to ImageKit CDN URLs with WebP optimization.
 * RepDB images stay as-is (license requires serving from their repo).
 * @param urls - Array of image URLs from the exercise database
 * @returns Array of optimized image URLs (400x300 WebP for thumbnails)
 */
function optimizeImageUrls(urls: string[]): string[] {
  return urls.map((url) => {
    if (url.startsWith(GITHUB_IMG_PREFIX)) {
      const path = url.slice(GITHUB_IMG_PREFIX.length);
      return `${IMAGEKIT_BASE}${path}?tr=w-400,h-300,fo-auto,f-webp`;
    }
    return url;
  });
}

/**
 * Generates a higher-resolution ImageKit URL for exercise detail pages.
 * @param url - An already-optimized image URL from optimizeImageUrls
 * @returns URL with 600px width for detail view, or original if not an ImageKit URL
 */
export function getDetailImageUrl(url: string): string {
  if (url.startsWith(IMAGEKIT_BASE)) {
    return url.replace('w-400,h-300,fo-auto,f-webp', 'w-600,fo-auto,f-webp');
  }
  return url;
}

let cachedExercises: IExternalExercise[] | null = null;
let cacheTime = 0;
const CACHE_TTL_MS = 10 * 60 * 1000;

/**
 * Fetches the canonical exercise database from the external CDN with a 10-minute in-memory cache.
 * Rewrites image URLs to use ImageKit CDN for optimized delivery (WebP, resizing).
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

    // Rewrite image URLs to use ImageKit CDN
    const optimized = (data as any[]).map((e) => ({
      ...e,
      imageUrls: e.imageUrls ? optimizeImageUrls(e.imageUrls) : e.imageUrls,
    }));

    cachedExercises = optimized as IExternalExercise[];
    cacheTime = Date.now();
    return cachedExercises;
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
