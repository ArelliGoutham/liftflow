import mongoose, { Schema } from 'mongoose';
import type { IUser } from '@/types';

const UserSchema = new Schema<IUser>(
  {
    authProviderId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    image: { type: String },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
