import { env } from '$env/dynamic/public';
import { ConfigError } from '$lib/errors';

/**
 * Get the API base URI from environment configuration.
 * @throws {ConfigError} When API_BASE_URI is not configured
 */
export function getApiBaseUri(): string {
	const apiBaseUri = env.PUBLIC_SINDIT_BACKEND_API_BASE_URI;
	if (!apiBaseUri) {
		throw new ConfigError(
			"API_BASE_URI is undefined. Add PUBLIC_SINDIT_BACKEND_API_BASE_URI variable to '.env'",
			'PUBLIC_SINDIT_BACKEND_API_BASE_URI'
		);
	}
	return apiBaseUri;
}

/**
 * Convert a node ID to a full backend URI.
 * @param nodeId - The node ID to convert
 * @returns Full backend URI
 */
export function getBackendUri(nodeId: string): string {
	const apiBaseUri = getApiBaseUri();
	return `${apiBaseUri}${nodeId}`;
}

/**
 * Extract node ID from a backend URI.
 * @param uri - The backend URI
 * @returns The node ID portion of the URI
 */
export function getNodeIdFromBackendUri(uri: string): string {
	const apiBaseUri = getApiBaseUri();

	// Handle full ontology URIs (like http://sindit.sintef.no/2.0#humidity)
	if (uri.startsWith('http://') && !uri.startsWith(apiBaseUri)) {
		// Remove the http:// protocol for ontology URIs
		return uri.replace('http://', '');
	}

	// Handle backend API URIs
	const parts = uri.split(apiBaseUri);
	if (parts.length < 2) {
		throw new ConfigError(`Invalid backend URI format: ${uri}`);
	}
	return parts[1];
}

/**
 * Extract node class type from a backend class URI.
 * @param classUri - The class URI (e.g., "urn:samm:sindit.sintef.no:1.0.0#AbstractAsset")
 * @returns The class type name (e.g., "AbstractAsset")
 */
export function getNodeClassTypeFromUri(classUri: string): string {
	const parts = classUri.split('#');
	if (parts.length < 2) {
		throw new ConfigError(`Invalid class URI format: ${classUri}`);
	}
	return parts[1];
}

/**
 * Extract workspace name from a workspace URI.
 * @param workspaceUri - The workspace URI
 * @returns Workspace name
 */
export function getWorkspaceNameFromUri(workspaceUri: string): string {
	const parts = workspaceUri.split('#');
	const workspaceName = parts[1];

	if (!workspaceName) {
		return workspaceUri;
	}

	return workspaceName;
}
