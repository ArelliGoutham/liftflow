import mongoose, { Schema } from 'mongoose';
import type { IWorkoutSession } from '@/types';

const WorkoutSessionSchema = new Schema<IWorkoutSession>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User', index: true },
    planId: { type: Schema.Types.ObjectId, ref: 'Plan' },
    workoutDayId: { type: Schema.Types.ObjectId, ref: 'WorkoutDay' },
    type: { type: String, enum: ['planned', 'quick'], default: 'planned' },
    startedAt: { type: Date, required: true, default: Date.now },
    completedAt: { type: Date },
    notes: { type: String },
  },
  { timestamps: true }
);

const WorkoutSession = mongoose.models.WorkoutSession || mongoose.model<IWorkoutSession>('WorkoutSession', WorkoutSessionSchema);

export default WorkoutSession;
