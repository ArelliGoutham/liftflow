import mongoose, { Schema } from 'mongoose';
import type { IExerciseLog } from '@/types';

const ExerciseLogSchema = new Schema<IExerciseLog>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User', index: true },
    sessionId: { type: Schema.Types.ObjectId, required: true, ref: 'WorkoutSession' },
    exerciseId: { type: String, required: true, index: true },
    completed: { type: Boolean, default: false },
    sets: { type: Number },
    weight: { type: Number },
    repetitions: { type: Number },
    durationSeconds: { type: Number },
    notes: { type: String },
    loggedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

const ExerciseLog = mongoose.models.ExerciseLog || mongoose.model<IExerciseLog>('ExerciseLog', ExerciseLogSchema);

export default ExerciseLog;
