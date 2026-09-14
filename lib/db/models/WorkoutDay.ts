import mongoose, { Schema } from 'mongoose';

const WorkoutExerciseSchema = new Schema(
  {
    exerciseId: { type: String, required: true },
    order: { type: Number, required: true, default: 0 },
    trackingMode: { type: String, enum: ['reps', 'duration'], default: 'reps' },
    targetSets: { type: Number, required: true, default: 3 },
    targetRepetitions: { type: Number },
    targetDurationValue: { type: Number },
    durationUnit: { type: String, enum: ['seconds', 'minutes'], default: 'seconds' },
    restSeconds: { type: Number, default: 90 },
    notes: { type: String },
  }
);

const WorkoutDaySchema = new Schema(
  {
    planId: { type: Schema.Types.ObjectId, required: true, ref: 'Plan' },
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User', index: true },
    date: { type: String, required: true },
    title: { type: String, required: true },
    warmupInstructions: { type: String },
    cardioInstructions: { type: String },
    exercises: [WorkoutExerciseSchema],
  },
  { timestamps: true }
);

WorkoutDaySchema.index({ planId: 1, date: 1 }, { unique: true });

const WorkoutDay = mongoose.models.WorkoutDay || mongoose.model('WorkoutDay', WorkoutDaySchema);

export default WorkoutDay;
