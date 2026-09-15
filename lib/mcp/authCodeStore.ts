import { generateRandomToken, AUTH_CODE_TTL_MS } from '@/lib/mcp/oauthUtils';
import type { IAuthCode } from '@/types';

/**
 * In-memory store for short-lived authorization codes.
 * Codes are single-use and expire after 10 minutes (AUTH_CODE_TTL_MS).
 */
const authCodes = new Map<string, IAuthCode>();

/**
 * Stores an authorization code with the given parameters and a 10-minute TTL.
 * @param userId - Authenticated user's MongoDB ObjectId as string
 * @param clientId - The client identifier from the registration
 * @param redirectUri - The redirect URI to validate at token exchange
 * @param codeChallenge - PKCE code_challenge from the authorize request
 * @param codeChallengeMethod - PKCE method (expected "S256")
 * @param scope - Requested scope string
 * @returns The generated authorization code (32-byte hex)
 */
export function storeAuthCode(
  userId: string,
  clientId: string,
  redirectUri: string,
  codeChallenge: string,
  codeChallengeMethod: string,
  scope: string
): string {
  const code = generateRandomToken();
  authCodes.set(code, {
    userId,
    clientId,
    redirectUri,
    codeChallenge,
    codeChallengeMethod,
    scope,
    expiresAt: Date.now() + AUTH_CODE_TTL_MS,
  });
  return code;
}

/**
 * Retrieves and consumes an authorization code (single-use).
 * Returns null if the code does not exist or has expired.
 * @param code - The authorization code to consume
 * @returns The stored auth code data, or null if invalid/expired
 */
export function consumeAuthCode(code: string): IAuthCode | null {
  const entry = authCodes.get(code);
  if (!entry) return null;
  authCodes.delete(code);
  if (Date.now() > entry.expiresAt) return null;
  return entry;
}

/**
 * Removes all expired authorization codes from the store.
 * @returns The number of expired codes removed
 */
export function cleanExpiredAuthCodes(): number {
  let removed = 0;
  const now = Date.now();
  authCodes.forEach((entry, code) => {
    if (now > entry.expiresAt) {
      authCodes.delete(code);
      removed++;
    }
  });
  return removed;
}
