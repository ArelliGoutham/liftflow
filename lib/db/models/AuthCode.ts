import mongoose, { Schema } from 'mongoose';

const AuthCodeSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    clientId: { type: String, required: true },
    redirectUri: { type: String, required: true },
    codeChallenge: { type: String },
    codeChallengeMethod: { type: String, default: 'S256' },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

AuthCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 600 });

const AuthCode = mongoose.models.AuthCode || mongoose.model('AuthCode', AuthCodeSchema);

export default AuthCode;
