import mongoose, { Schema } from 'mongoose';
import type { IExercise } from '@/types';

const ExerciseSchema = new Schema<IExercise>(
  {
    name: { type: String, required: true, unique: true, index: true },
    category: { type: String, required: true, index: true },
    description: { type: String },
    setupCues: [{ type: String }],
    executionCues: [{ type: String }],
    breathingCues: [{ type: String }],
    commonMistakes: [{ type: String }],
    safetyNotes: [{ type: String }],
    referenceUrls: [{ type: String }],
    ownerUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    isShared: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Exercise = mongoose.models.Exercise || mongoose.model<IExercise>('Exercise', ExerciseSchema);

export default Exercise;
