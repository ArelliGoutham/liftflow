import mongoose, { Schema } from 'mongoose';
import type { IOAuthToken } from '@/types';

const OAuthTokenSchema = new Schema<IOAuthToken>(
  {
    token: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    clientId: { type: String, required: true },
    scope: { type: String, default: 'tools' },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

const OAuthToken =
  mongoose.models.OAuthToken ||
  mongoose.model<IOAuthToken>('OAuthToken', OAuthTokenSchema);

export default OAuthToken;
