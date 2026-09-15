import connectToDatabase from '@/lib/db/connection';
import AuthCode from '@/lib/db/models/AuthCode';

/**
 * Creates an authorization code in MongoDB with 10-minute expiry.
 * @param userId - The authenticated user's ObjectId
 * @param clientId - The OAuth client ID
 * @param redirectUri - The redirect URI
 * @param codeChallenge - PKCE code challenge
 * @param codeChallengeMethod - PKCE method (S256)
 * @returns The generated authorization code string
 */
export async function createAuthCode(
  userId: string,
  clientId: string,
  redirectUri: string,
  codeChallenge: string | undefined,
  codeChallengeMethod: string = 'S256'
): Promise<string> {
  await connectToDatabase();
  const crypto = await import('crypto');
  const code = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await AuthCode.create({
    code,
    userId,
    clientId,
    redirectUri,
    codeChallenge,
    codeChallengeMethod,
    expiresAt,
  });

  return code;
}

/**
 * Consumes and returns an auth code (deletes it after retrieval).
 * @param code - The authorization code
 * @returns The auth code record or null if not found/expired
 */
export async function consumeAuthCode(code: string): Promise<any | null> {
  await connectToDatabase();
  const record = await AuthCode.findOneAndDelete({
    code,
    expiresAt: { $gt: new Date() },
  }).lean();
  return record as any;
}
