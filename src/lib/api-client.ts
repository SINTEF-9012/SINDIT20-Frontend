import { browser } from '$app/environment';
import { goto } from '$app/navigation';

/**
 * Authenticated fetch wrapper that handles 401 responses globally.
 * Automatically clears auth state and redirects to home on authentication failures.
 */
export async function authenticatedFetch(url: string, options?: RequestInit): Promise<Response> {
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
        
        throw new Error('NOT_AUTHENTICATED');
    }
    
    return response;
}
