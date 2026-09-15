import connectToDatabase from '@/lib/db/connection';
import OAuthToken from '@/lib/db/models/OAuthToken';
import { generateRandomToken, TOKEN_TTL_SECONDS } from '@/lib/mcp/oauthUtils';
import type { IOAuthToken } from '@/types';

/**
 * Creates a new OAuth access token for a user with a 24-hour expiry.
 * @param userId - Authenticated user's MongoDB ObjectId as string
 * @param clientId - The OAuth client identifier
 * @param scope - The granted scope string (default 'tools')
 * @returns The generated access token string
 */
export async function createToken(
  userId: string,
  clientId: string,
  scope: string = 'tools'
): Promise<string> {
  await connectToDatabase();
  const token = generateRandomToken();
  const expiresAt = new Date(Date.now() + TOKEN_TTL_SECONDS * 1000);
  await OAuthToken.create({ token, userId, clientId, scope, expiresAt });
  return token;
}

/**
 * Validates an access token and returns the associated userId if valid.
 * @param token - The access token to validate
 * @returns The userId string if valid and not expired, null otherwise
 */
export async function validateToken(token: string): Promise<string | null> {
  try {
    await connectToDatabase();
    const record = await OAuthToken.findOne({ token }).lean() as unknown as IOAuthToken | null;
    if (!record) return null;
    if (new Date(record.expiresAt) < new Date()) return null;
    return record.userId.toString();
  } catch (err) {
    console.error('[oauthTokenRepository] validateToken error:', err);
    return null;
  }
}

/**
 * Revokes (deletes) an access token.
 * @param token - The access token to revoke
 * @returns True if a token was deleted, false if not found
 */
export async function revokeToken(token: string): Promise<boolean> {
  try {
    await connectToDatabase();
    const result = await OAuthToken.deleteOne({ token });
    return result.deletedCount > 0;
  } catch (err) {
    console.error('[oauthTokenRepository] revokeToken error:', err);
    return false;
  }
}

/**
 * Removes all expired access tokens from the database.
 * @returns The number of expired tokens deleted
 */
export async function cleanExpiredTokens(): Promise<number> {
  try {
    await connectToDatabase();
    const result = await OAuthToken.deleteMany({
      expiresAt: { $lt: new Date() },
    });
    return result.deletedCount || 0;
  } catch (err) {
    console.error('[oauthTokenRepository] cleanExpiredTokens error:', err);
    return 0;
  }
}
