import type { ObjectId } from 'mongoose';

export interface IUser {
  _id: ObjectId;
  authProviderId: string;
  name: string;
  email: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPlan {
  _id: ObjectId;
  userId: ObjectId;
  name: string;
  goal?: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWorkoutDay {
  _id: ObjectId;
  planId: ObjectId;
  userId: ObjectId;
  weekNumber: number;
  dayOfWeek: number;
  title: string;
  warmupInstructions?: string;
  cardioInstructions?: string;
  exercises?: IWorkoutExercise[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IWorkoutExercise {
  exerciseId: ObjectId;
  order: number;
  targetSets: number;
  targetRepetitions?: number;
  targetDurationSeconds?: number;
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
  exerciseId: ObjectId;
  completed: boolean;
  sets?: number;
  weight?: number;
  repetitions?: number;
  durationSeconds?: number;
  notes?: string;
  loggedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
