import connectToDatabase from '@/lib/db/connection';
import OAuthClient from '@/lib/db/models/OAuthClient';

/**
 * Registers a new OAuth client with redirect URIs.
 * @param redirectUris - Array of allowed redirect URIs
 * @returns Object containing client_id and null secret
 */
export async function registerOAuthClient(redirectUris: string[]): Promise<{
  clientId: string;
  clientSecret: string | null;
  issuedAt: number;
}> {
  await connectToDatabase();
  const crypto = await import('crypto');
  const clientId = crypto.randomBytes(32).toString('hex');
  const client = await OAuthClient.create({
    clientId,
    clientSecret: null,
    redirectUris,
    tokenEndpointAuthMethod: 'none',
  });
  return {
    clientId: client.clientId,
    clientSecret: null,
    issuedAt: client.createdAt?.getTime() ?? Date.now(),
  };
}

/**
 * Retrieves a registered client by client_id.
 * @param clientId - The client identifier
 * @returns Client record or null
 */
export async function getOAuthClient(clientId: string): Promise<any | null> {
  await connectToDatabase();
  return OAuthClient.findOne({ clientId }).lean() as unknown as Promise<any | null>;
}

/**
 * Validates a redirect URI for a client.
 * @param clientId - The client identifier
 * @param redirectUri - The redirect URI to validate
 * @returns True if valid
 */
export async function isValidRedirectUri(clientId: string, redirectUri: string): Promise<boolean> {
  const client = await getOAuthClient(clientId);
  if (!client) return false;
  return client.redirectUris?.includes(redirectUri) ?? false;
}
