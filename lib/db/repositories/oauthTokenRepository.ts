import connectToDatabase from '@/lib/db/connection';
import OAuthToken from '@/lib/db/models/OAuthToken';
import { generateRandomToken, TOKEN_TTL_SECONDS } from '@/lib/mcp/oauthUtils';
import type { IOAuthToken, ITokenValidationResult } from '@/types';

/**
 * Creates a new OAuth access token (and refresh token) for a user with a 24-hour expiry.
 * @param userId - Authenticated user's MongoDB ObjectId as string
 * @param clientId - The OAuth client identifier
 * @param scope - The granted scope string (default 'tools')
 * @returns Object containing the access token and refresh token strings
 */
export async function createToken(
  userId: string,
  clientId: string,
  scope: string = 'tools'
): Promise<{ accessToken: string; refreshToken: string }> {
  await connectToDatabase();
  const token = generateRandomToken();
  const refreshToken = generateRandomToken();
  const expiresAt = new Date(Date.now() + TOKEN_TTL_SECONDS * 1000);
  await OAuthToken.create({ token, userId, clientId, scope, refreshToken, expiresAt });
  return { accessToken: token, refreshToken };
}

/**
 * Validates an access token and returns the associated userId and scope if valid.
 * @param token - The access token to validate
 * @returns Object with userId and scope if valid and not expired, null otherwise
 */
export async function validateToken(token: string): Promise<ITokenValidationResult | null> {
  try {
    await connectToDatabase();
    const record = await OAuthToken.findOne({ token }).lean() as unknown as IOAuthToken | null;
    if (!record) return null;
    if (new Date(record.expiresAt) < new Date()) return null;
    return { userId: record.userId.toString(), scope: record.scope };
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

/**
 * Exchanges a refresh token for a new access token, rotating the refresh token.
 * The old token document is deleted and replaced with a new one.
 * @param refreshToken - The refresh token to exchange
 * @returns Object with new accessToken, refreshToken, and scope, or null if invalid
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<{ accessToken: string; refreshToken: string; scope: string } | null> {
  try {
    await connectToDatabase();
    const record = await OAuthToken.findOneAndDelete({
      refreshToken,
    }).lean() as unknown as IOAuthToken | null;
    if (!record) return null;

    const newAccessToken = generateRandomToken();
    const newRefreshToken = generateRandomToken();
    const expiresAt = new Date(Date.now() + TOKEN_TTL_SECONDS * 1000);

    await OAuthToken.create({
      token: newAccessToken,
      userId: record.userId,
      clientId: record.clientId,
      scope: record.scope,
      refreshToken: newRefreshToken,
      expiresAt,
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken, scope: record.scope };
  } catch (err) {
    console.error('[oauthTokenRepository] refreshAccessToken error:', err);
    return null;
  }
}
