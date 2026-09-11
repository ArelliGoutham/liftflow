import type { IExercise } from '@/types';

const FORK_URL =
  'https://raw.githubusercontent.com/ArelliGoutham/free-exercise-db/main/dist/exercises.json';
const FORK_IMG_BASE =
  'https://raw.githubusercontent.com/ArelliGoutham/free-exercise-db/main/exercises/';

interface FreeExerciseDbEntry {
  id: string;
  name: string;
  force: string | null;
  level: string;
  mechanic: string | null;
  equipment: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  category: string;
  images: string[];
}

let cachedExercises: IExercise[] | null = null;
let cacheTime = 0;
const CACHE_TTL_MS = 10 * 60 * 1000;

function mapCategory(category: string): string {
  const cat = category.toLowerCase();
  if (cat === 'cardio') return 'cardio';
  if (cat === 'stretching') return 'flexibility';
  if (cat === 'plyometrics') return 'plyometrics';
  if (cat === 'strength' || cat === 'powerlifting' || cat === 'olympic weightlifting' || cat === 'strongman') {
    return 'upper-body';
  }
  return 'upper-body';
}

function transform(entry: FreeExerciseDbEntry): IExercise {
  const instructions = entry.instructions || [];
  return {
    _id: '' as any,
    name: entry.name,
    category: mapCategory(entry.category),
    description: instructions.slice(0, 2).join(' ') || undefined,
    setupCues: instructions.slice(0, 2),
    executionCues: instructions.slice(2),
    breathingCues: [],
    commonMistakes: [],
    safetyNotes: [],
    referenceUrls: ['https://github.com/ArelliGoutham/free-exercise-db'],
    isShared: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as IExercise;
}

export async function getExternalExercises(): Promise<any[]> {
  if (cachedExercises && Date.now() - cacheTime < CACHE_TTL_MS) {
    return cachedExercises as any[];
  }

  try {
    const res = await fetch(FORK_URL, { next: { revalidate: 600 } });
    if (!res.ok) throw new Error(`Failed: ${res.status}`);
    const data: FreeExerciseDbEntry[] = await res.json();

    const transformed = data.map((entry) => ({
      ...transform(entry),
      sourceIds: { freeExerciseDb: entry.id },
      forceType: entry.force || undefined,
      level: entry.level,
      mechanic: entry.mechanic || undefined,
      equipment: entry.equipment || 'body only',
      primaryMuscles: entry.primaryMuscles || [],
      secondaryMuscles: entry.secondaryMuscles || [],
      imageUrls: (entry.images || []).map((img) => `${FORK_IMG_BASE}${img}`),
    }));

    cachedExercises = transformed as any;
    cacheTime = Date.now();
    return transformed;
  } catch {
    if (cachedExercises) return cachedExercises as any[];
    return [];
  }
}

export async function getExternalExerciseById(id: string): Promise<any | null> {
  const all = await getExternalExercises();
  return all.find((e: any) => e.sourceIds?.freeExerciseDb === id || e.name === id) || null;
}
