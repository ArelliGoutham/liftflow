/**
 * Exercise Database Import Script
 *
 * Downloads and merges exercises from:
 * 1. free-exercise-db (yuhonas) — 876 exercises, JSON + GitHub-hosted images
 * 2. RepDB exercise-dataset — 601 exercises, JSON + WebP illustrations
 *
 * Unified schema maps both sources into LiftFlow's combined format.
 * Duplicates are merged by normalized name, preferring RepDB for richer metadata.
 *
 * Usage:
 *   npx tsx scripts/import-exercises.ts
 */

const FREE_EXERCISE_DB_URL =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const FREE_EXERCISE_DB_IMG_BASE =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';
const REPDB_URL = 'https://exercise-dataset.com/exercises.json';
const REPDB_IMG_BASE = 'https://raw.githubusercontent.com/RepDB/exercise-dataset/main/';

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

interface RepDbEntry {
  id: string;
  name_en: string;
  description_en: string;
  category: string;
  force_type: string;
  mechanic: string | null;
  difficulty: string;
  equipment: string | null;
  body_part: string;
  primary_muscles: string[];
  secondary_muscles: string[];
  goals: string[];
  tags: string[];
  met: number | null;
  is_unilateral: boolean;
  is_bodyweight: boolean;
  instructions_en: string[];
  tips_en: string[];
  images: { flat: { start?: string; peak?: string; main?: string } };
}

interface CombinedExercise {
  name: string;
  category: string;
  description?: string;
  setupCues: string[];
  executionCues: string[];
  breathingCues: string[];
  commonMistakes: string[];
  safetyNotes: string[];
  referenceUrls: string[];
  isShared: boolean;
  sourceIds: { freeExerciseDb?: string; repdb?: string };
  forceType?: string;
  level?: string;
  mechanic?: string;
  equipment?: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  goals?: string[];
  tags?: string[];
  metValue?: number;
  isUnilateral?: boolean;
  isBodyweight?: boolean;
  imageUrls?: string[];
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function mapCategory(category: string, bodyPart?: string): string {
  const cat = category.toLowerCase();
  if (cat === 'cardio') return 'cardio';
  if (cat === 'stretching') return 'flexibility';
  if (cat === 'plyometrics') return 'plyometrics';
  if (['strength', 'powerlifting', 'olympic weightlifting', 'strongman'].includes(cat)) {
    if (bodyPart) {
      const bp = bodyPart.toLowerCase();
      if (bp.includes('core') || bp.includes('ab')) return 'core';
      if (bp.includes('upper') || bp.includes('arm') || bp.includes('shoulder') || bp.includes('chest') || bp.includes('back')) return 'upper-body';
      if (bp.includes('leg') || bp.includes('glute') || bp.includes('hip') || bp.includes('calf') || bp.includes('thigh')) return 'lower-body';
    }
    return 'upper-body';
  }
  return 'upper-body';
}

function fromFreeExerciseDb(entry: FreeExerciseDbEntry): CombinedExercise {
  return {
    name: entry.name,
    category: mapCategory(entry.category),
    description: entry.instructions?.slice(0, 2).join(' ') || undefined,
    setupCues: entry.instructions?.slice(0, 2) || [],
    executionCues: entry.instructions?.slice(2) || [],
    breathingCues: [],
    commonMistakes: [],
    safetyNotes: [],
    referenceUrls: ['https://github.com/yuhonas/free-exercise-db'],
    isShared: true,
    sourceIds: { freeExerciseDb: entry.id },
    forceType: entry.force || undefined,
    level: entry.level,
    mechanic: entry.mechanic || undefined,
    equipment: entry.equipment || 'body only',
    primaryMuscles: (entry.primaryMuscles || []).map((m) => m),
    secondaryMuscles: (entry.secondaryMuscles || []).map((m) => m),
    imageUrls: (entry.images || []).map((img) => `${FREE_EXERCISE_DB_IMG_BASE}${img}`),
  };
}

function fromRepDb(entry: RepDbEntry): CombinedExercise {
  const imgs: string[] = [];
  if (entry.images?.flat) {
    if (entry.images.flat.start) imgs.push(`${REPDB_IMG_BASE}${entry.images.flat.start}`);
    if (entry.images.flat.peak) imgs.push(`${REPDB_IMG_BASE}${entry.images.flat.peak}`);
    if (entry.images.flat.main) imgs.push(`${REPDB_IMG_BASE}${entry.images.flat.main}`);
  }

  return {
    name: entry.name_en,
    category: mapCategory(entry.category, entry.body_part),
    description: entry.description_en || undefined,
    setupCues: entry.instructions_en?.slice(0, 2) || [],
    executionCues: entry.instructions_en?.slice(2) || [],
    breathingCues: [],
    commonMistakes: [],
    safetyNotes: entry.tips_en || [],
    referenceUrls: ['https://repdb.co'],
    isShared: true,
    sourceIds: { repdb: entry.id },
    forceType: entry.force_type,
    level: entry.difficulty,
    mechanic: entry.mechanic || undefined,
    equipment: entry.equipment || 'body only',
    primaryMuscles: (entry.primary_muscles || []).map((m) => m),
    secondaryMuscles: (entry.secondary_muscles || []).map((m) => m),
    goals: entry.goals || [],
    tags: entry.tags || [],
    metValue: entry.met || undefined,
    isUnilateral: entry.is_unilateral,
    isBodyweight: entry.is_bodyweight,
    imageUrls: imgs,
  };
}

function mergeExercises(freeDb: CombinedExercise[], repDb: CombinedExercise[]): CombinedExercise[] {
  const merged = new Map<string, CombinedExercise>();

  for (const ex of freeDb) {
    merged.set(normalizeName(ex.name), ex);
  }

  for (const ex of repDb) {
    const key = normalizeName(ex.name);
    const existing = merged.get(key);
    if (existing) {
      merged.set(key, {
        ...existing,
        ...ex,
        imageUrls: [...(existing.imageUrls || []), ...(ex.imageUrls || [])],
        referenceUrls: [...(existing.referenceUrls || []), ...(ex.referenceUrls || [])],
        setupCues: ex.setupCues.length > 0 ? ex.setupCues : existing.setupCues,
        executionCues: ex.executionCues.length > 0 ? ex.executionCues : existing.executionCues,
        safetyNotes: ex.safetyNotes.length > 0 ? ex.safetyNotes : existing.safetyNotes,
        sourceIds: { ...existing.sourceIds, ...ex.sourceIds },
      });
    } else {
      merged.set(key, ex);
    }
  }

  return Array.from(merged.values()).sort((a, b) => a.name.localeCompare(b.name));
}

async function main(): Promise<void> {
  console.error('Fetching free-exercise-db...');
  const freeRaw: FreeExerciseDbEntry[] = await (await fetch(FREE_EXERCISE_DB_URL)).json();
  console.error(`  ${freeRaw.length} exercises`);

  console.error('Fetching RepDB...');
  const repRaw = await (await fetch(REPDB_URL)).json();
  const repExercises: RepDbEntry[] = repRaw.exercises || [];
  console.error(`  ${repExercises.length} exercises`);

  console.error('Transforming and merging...');
  const combined = mergeExercises(freeRaw.map(fromFreeExerciseDb), repExercises.map(fromRepDb));

  const byCat: Record<string, number> = {};
  combined.forEach((e) => { byCat[e.category] = (byCat[e.category] || 0) + 1; });
  console.error(`  ${combined.length} unique exercises`);
  console.error('  Categories:', JSON.stringify(byCat));

  const withImages = combined.filter((e) => e.imageUrls && e.imageUrls.length > 0).length;
  console.error(`  ${withImages} exercises have images`);

  const fs = await import('fs');
  const output = `import type { IExercise } from '@/types';

interface CombinedExercise extends Omit<IExercise, '_id' | 'createdAt' | 'updatedAt'> {
  sourceIds: { freeExerciseDb?: string; repdb?: string };
  forceType?: string;
  level?: string;
  mechanic?: string;
  equipment?: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  goals?: string[];
  tags?: string[];
  metValue?: number;
  isUnilateral?: boolean;
  isBodyweight?: boolean;
  imageUrls?: string[];
}

const combinedExercises: CombinedExercise[] = ${JSON.stringify(combined, null, 0)};

export default combinedExercises;
`;

  fs.writeFileSync('lib/exercises/combinedExercises.ts', output);
  console.error('Written to lib/exercises/combinedExercises.ts');
}

main().catch((err) => {
  console.error('Import failed:', err);
  process.exit(1);
});
