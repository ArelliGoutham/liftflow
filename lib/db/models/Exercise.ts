import mongoose, { Schema } from 'mongoose';

const ExerciseSchema = new Schema(
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
    sourceIds: {
      freeExerciseDb: { type: String },
      repdb: { type: String },
    },
    forceType: { type: String },
    level: { type: String },
    mechanic: { type: String },
    equipment: { type: String },
    primaryMuscles: [{ type: String }],
    secondaryMuscles: [{ type: String }],
    goals: [{ type: String }],
    tags: [{ type: String }],
    metValue: { type: Number },
    isUnilateral: { type: Boolean },
    isBodyweight: { type: Boolean },
    imageUrls: [{ type: String }],
  },
  { timestamps: true }
);

const Exercise = mongoose.models.Exercise || mongoose.model('Exercise', ExerciseSchema);

export default Exercise;
