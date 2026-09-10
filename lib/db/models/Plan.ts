import mongoose, { Schema } from 'mongoose';
import type { IPlan } from '@/types';

const PlanSchema = new Schema<IPlan>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User', index: true },
    name: { type: String, required: true },
    goal: { type: String },
    description: { type: String },
    isActive: { type: Boolean, default: false },
    startDate: { type: String },
    endDate: { type: String },
    weeklyAnchor: { type: Number, default: 1 },
  },
  { timestamps: true }
);

const Plan = mongoose.models.Plan || mongoose.model<IPlan>('Plan', PlanSchema);

export default Plan;
