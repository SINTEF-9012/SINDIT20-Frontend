import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { AuthError, NetworkError } from '$lib/errors';

/**
 * Authenticated fetch wrapper that handles 401 responses globally.
 * Automatically clears auth state and redirects to home on authentication failures.
 *
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @returns Response object
 * @throws {AuthError} When authentication fails (401)
 * @throws {NetworkError} When network request fails
 */
export async function authenticatedFetch(url: string, options?: RequestInit): Promise<Response> {
	try {
		const response = await fetch(url, options);

		if (response.status === 401) {
			// Clear authentication state
			if (browser) {
				localStorage.removeItem('sindit_auth_user');
			}

			// Redirect to home page
			if (browser) {
				goto('/');
			}

			throw new AuthError('Authentication required. Please sign in.', {
				statusCode: 401,
				url
			});
		}

		return response;
	} catch (error) {
		// Re-throw AuthError as-is
		if (error instanceof AuthError) {
			throw error;
		}

		// Wrap network errors
		throw new NetworkError(
			`Network request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
			{ url, originalError: error }
		);
	}
}
