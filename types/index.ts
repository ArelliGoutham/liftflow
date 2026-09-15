import type { ObjectId } from 'mongoose';

export interface IUser {
  _id: ObjectId;
  authProviderId: string;
  name: string;
  email: string;
  image?: string;
  gender?: string;
  dateOfBirth?: string;
  heightCm?: number;
  weightKg?: number;
  fitnessGoal?: string;
  experienceLevel?: string;
  workoutsPerWeek?: number;
  equipmentAccess?: string;
  injuries?: string;
  profileCompleted: boolean;
  preferredUnits: string;
  createdAt: Date;
  updatedAt: Date;
}

/** User profile fields used by the onboarding flow, settings page, and AI tools. */
export interface IUserProfile {
  gender?: string;
  dateOfBirth?: string;
  heightCm?: number;
  weightKg?: number;
  fitnessGoal?: string;
  experienceLevel?: string;
  workoutsPerWeek?: number;
  equipmentAccess?: string;
  injuries?: string;
  profileCompleted: boolean;
  preferredUnits: string;
}

export interface IPlan {
  _id: ObjectId;
  userId: ObjectId;
  name: string;
  goal?: string;
  description?: string;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  weeklyAnchor?: number;
  createdAt: Date;
  updatedAt: Date;
}

/** Subset of IPlan used by client-side list/detail pages where _id and dates are strings (from JSON). */
export interface IPlanSummary {
  _id: string;
  name: string;
  goal?: string;
  isActive: boolean;
  updatedAt?: string;
}

export interface IDaySchedule {
  date: string;
  dayNumber: number;
  dayLabel: string;
  workoutDayId: string | null;
  workoutTitle: string | null;
  isRest: boolean;
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
  isCompleted: boolean;
  isInGracePeriod: boolean;
  isMissed: boolean;
  isCatchUpEligible: boolean;
}

export interface IWeekSchedule {
  days: IDaySchedule[];
  todayIndex: number;
  missedDays: IDaySchedule[];
  planExpired: boolean;
  planExpiryMessage: string | null;
  weekOffset: number;
  weekStart: string;
  weekEnd: string;
}

export interface IWorkoutDay {
  _id: ObjectId;
  planId: ObjectId;
  userId: ObjectId;
  date: string;
  title: string;
  warmupInstructions?: string;
  cardioInstructions?: string;
  exercises?: IWorkoutExercise[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IWorkoutExercise {
  exerciseId: string;
  order: number;
  trackingMode?: 'reps' | 'duration';
  targetSets: number;
  targetRepetitions?: number;
  targetDurationValue?: number;
  durationUnit?: 'seconds' | 'minutes';
  restSeconds: number;
  notes?: string;
}

export interface IExercise {
  _id: ObjectId;
  name: string;
  category: string;
  description?: string;
  setupCues?: string[];
  executionCues?: string[];
  breathingCues?: string[];
  commonMistakes?: string[];
  safetyNotes?: string[];
  referenceUrls?: string[];
  ownerUserId?: ObjectId;
  isShared: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWorkoutSession {
  _id: ObjectId;
  userId: ObjectId;
  planId: ObjectId;
  workoutDayId: ObjectId;
  startedAt: Date;
  completedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IExerciseLog {
  _id: ObjectId;
  userId: ObjectId;
  sessionId: ObjectId;
  exerciseId: string;
  completed: boolean;
  trackingMode?: 'reps' | 'duration';
  sets?: number;
  weight?: number;
  repetitions?: number;
  durationValue?: number;
  durationUnit?: 'seconds' | 'minutes';
  notes?: string;
  loggedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IChatMessage {
  _id: ObjectId;
  userId: ObjectId;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Message shape returned by getChatHistory — MongoDB ObjectId is stringified for API use. */
export interface IChatMessageSummary {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string | null;
}

/** Data needed to create a new exercise. */
export interface ICreateExerciseDTO {
  name: string;
  category: string;
  description?: string;
  setupCues?: string[];
  executionCues?: string[];
  breathingCues?: string[];
  commonMistakes?: string[];
  safetyNotes?: string[];
  referenceUrls?: string[];
  ownerUserId?: ObjectId;
  isShared?: boolean;
  sourceIds?: {
    freeExerciseDb?: string;
    repdb?: string;
  };
  forceType?: string;
  level?: string;
  mechanic?: string;
  equipment?: string;
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  goals?: string[];
  tags?: string[];
  metValue?: number;
  isUnilateral?: boolean;
  isBodyweight?: boolean;
  imageUrls?: string[];
}

/**
 * External exercises loaded from the CDN exercise database.
 * Extends IExercise with additional fields from the exercise database schema
 * that the Mongoose model does not have in IExercise (forceType, level, etc.).
 * The `id` field is used by external exercises in place of `_id`.
 */
export interface IExternalExercise {
  _id?: string;
  id?: string;
  name: string;
  category: string;
  description?: string;
  setupCues?: string[];
  executionCues?: string[];
  breathingCues?: string[];
  commonMistakes?: string[];
  safetyNotes?: string[];
  referenceUrls?: string[];
  sourceIds?: {
    freeExerciseDb?: string;
    repdb?: string;
  };
  forceType?: string;
  level?: string;
  mechanic?: string;
  equipment?: string;
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  goals?: string[];
  tags?: string[];
  metValue?: number;
  isUnilateral?: boolean;
  isBodyweight?: boolean;
  imageUrls?: string[];
  isShared?: boolean;
}

/** Lightweight exercise shape for list/grid UI — _id as string for client use. */
export interface IExerciseSummary {
  _id: string;
  name: string;
  category: string;
  primaryMuscles?: string[];
  equipment?: string;
  level?: string;
  imageUrls?: string[];
}

/** Exercise option used in the WorkoutDayEditor exercise picker dropdown. */
export interface IExerciseOption {
  _id: string;
  id?: string;
  name: string;
  category: string;
}

/** Workout exercise with resolved exercise name, for display in session/editor views. */
export interface IWorkoutExerciseWithName extends IWorkoutExercise {
  exerciseName?: string;
  /** Fallback name field that may be present from external exercise data. */
  name?: string;
}

/** Full workout day with exercise names resolved, returned by getWorkoutDayWithExerciseNames. */
export interface IWorkoutDayWithNames extends IWorkoutDay {
  exercises: IWorkoutExerciseWithName[];
}

/** Client-side workout day (IDs as strings from JSON) used by workout session page. */
export interface IWorkoutDayClient {
  _id: string;
  planId?: string;
  title: string;
  warmupInstructions?: string;
  cardioInstructions?: string;
  exercises: IWorkoutExerciseWithName[];
}

/** Workout day summary used by plan detail page (all IDs as strings for client). */
export interface IWorkoutDaySummary {
  _id: string;
  date: string;
  title: string;
  warmupInstructions?: string;
  cardioInstructions?: string;
}

/** Exercise log entry used by progress page (dates as strings from API JSON). */
export interface ILogEntry {
  loggedAt: string;
  weight?: number;
  repetitions?: number;
  sets?: number;
  completed: boolean;
}

// ─── OAuth 2.0 / MCP Auth ───────────────────────────────────────────────────

/** Stored OAuth access token issued by the LiftFlow authorization server. */
export interface IOAuthToken {
  token: string;
  userId: ObjectId;
  clientId: string;
  scope: string;
  createdAt: Date;
  expiresAt: Date;
}

/** Volatile in-memory authorization code (10-minute TTL, single-use). */
export interface IAuthCode {
  userId: string;
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  scope: string;
  expiresAt: number;
}

/** Volatile in-memory client registration (RFC 7591 dynamic registration). */
export interface IOAuthClient {
  clientId: string;
  clientSecret: string | null;
  redirectUris: string[];
  tokenEndpointAuthMethod: string;
  issuedAt: number;
}
