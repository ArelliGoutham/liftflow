import mongoose, { Schema } from 'mongoose';

const OAuthClientSchema = new Schema(
  {
    clientId: { type: String, required: true, unique: true, index: true },
    clientSecret: { type: String, default: null },
    redirectUris: [{ type: String }],
    tokenEndpointAuthMethod: { type: String, default: 'none' },
  },
  { timestamps: true }
);

const OAuthClient = mongoose.models.OAuthClient || mongoose.model('OAuthClient', OAuthClientSchema);

export default OAuthClient;
