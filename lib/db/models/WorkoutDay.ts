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
    planId: { type: Schema.Types.ObjectId, ref: 'Plan' },
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User', index: true },
    type: { type: String, enum: ['planned', 'quick'], default: 'planned' },
    date: { type: String, required: true },
    title: { type: String, required: true },
    warmupInstructions: { type: String },
    cardioInstructions: { type: String },
    exercises: [WorkoutExerciseSchema],
  },
  { timestamps: true }
);

// Only enforce uniqueness for planned workouts (which have a planId)
// Quick workouts have no planId so partial filter avoids conflicts
WorkoutDaySchema.index(
  { planId: 1, date: 1 },
  { unique: true, partialFilterExpression: { planId: { $type: 'objectId' } } }
);

const WorkoutDay = mongoose.models.WorkoutDay || mongoose.model('WorkoutDay', WorkoutDaySchema);

export default WorkoutDay;
