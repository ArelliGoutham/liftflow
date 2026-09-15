import { generateRandomToken } from '@/lib/mcp/oauthUtils';
import type { IOAuthClient } from '@/types';

/**
 * In-memory store for dynamically registered OAuth clients (RFC 7591).
 * Clients re-register after server restart — acceptable for first version.
 */
const clients = new Map<string, IOAuthClient>();

/**
 * Registers a new OAuth client with the given redirect URIs.
 * Public clients use token_endpoint_auth_method "none" (no client secret).
 * @param redirectUris - Array of allowed redirect URIs for the client
 * @returns The newly registered client containing client_id and null secret
 */
export function registerClient(redirectUris: string[]): IOAuthClient {
  const clientId = generateRandomToken();
  const client: IOAuthClient = {
    clientId,
    clientSecret: null,
    redirectUris,
    tokenEndpointAuthMethod: 'none',
    issuedAt: Date.now(),
  };
  clients.set(clientId, client);
  return client;
}

/**
 * Retrieves a registered client by client_id.
 * @param clientId - The client identifier to look up
 * @returns The client registration, or null if not found
 */
export function getClient(clientId: string): IOAuthClient | null {
  return clients.get(clientId) ?? null;
}

/**
 * Checks whether a redirect URI is valid for the given client.
 * @param clientId - The client identifier
 * @param redirectUri - The redirect URI to validate
 * @returns True if the client exists and the redirect URI is registered
 */
export function isValidRedirectUri(clientId: string, redirectUri: string): boolean {
  const client = clients.get(clientId);
  if (!client) return false;
  return client.redirectUris.includes(redirectUri);
}
