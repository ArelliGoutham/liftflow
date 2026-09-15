import crypto from 'crypto';

/** Default token lifetime in seconds (24 hours). */
export const TOKEN_TTL_SECONDS = 86400;

/** Default authorization code lifetime in milliseconds (10 minutes). */
export const AUTH_CODE_TTL_MS = 10 * 60 * 1000;

/**
 * Returns the base URL for OAuth endpoint construction, from NEXTAUTH_URL env var.
 * Trims trailing slash so callers can safely append paths.
 * @returns Base URL string (e.g. "https://liftflow-one.vercel.app" or "http://localhost:3000")
 */
export function getOAuthBaseUrl(): string {
  const url = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  return url.replace(/\/$/, '');
}

/**
 * Generates a cryptographically random token (32-byte hex string).
 * @returns 64-character hex string suitable for access tokens or auth codes
 */
export function generateRandomToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Verifies a PKCE code_verifier against the stored code_challenge using S256.
 * @param verifier - The code_verifier sent by the client at the token endpoint
 * @param challenge - The code_challenge stored from the authorize endpoint
 * @returns True if the verifier matches the challenge
 */
export function verifyPkce(verifier: string, challenge: string): boolean {
  const hash = crypto.createHash('sha256').update(verifier).digest();
  const computed = hash.toString('base64url');
  return computed === challenge;
}
