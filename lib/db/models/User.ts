import mongoose, { Schema } from 'mongoose';
import type { IUser } from '@/types';

const UserSchema = new Schema<IUser>(
  {
    authProviderId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    image: { type: String },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer-not-to-say'],
    },
    dateOfBirth: { type: String },
    heightCm: { type: Number },
    weightKg: { type: Number },
    fitnessGoal: {
      type: String,
      enum: ['strength', 'hypertrophy', 'weight-loss', 'general-fitness', 'endurance'],
    },
    experienceLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
    },
    workoutsPerWeek: { type: Number, min: 1, max: 7 },
    equipmentAccess: {
      type: String,
      enum: ['gym', 'home-bodyweight', 'home-dumbbells', 'home-full'],
    },
    injuries: { type: String },
    profileCompleted: { type: Boolean, default: false },
    preferredUnits: {
      type: String,
      enum: ['metric', 'imperial'],
      default: 'metric',
    },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
