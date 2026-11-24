import { authenticatedFetch } from '$lib/api-client';

const API_BASE_URL = '/api/proxy';
const API_BASE_ENDPOINT = `${API_BASE_URL}?endpoint=vault`;

export async function listSecretPaths(): Promise<{ secret_paths: string[] }> {
	const url = `${API_BASE_ENDPOINT}/path`;
	const response = await authenticatedFetch(url);
	if (!response.ok) {
		throw new Error(`Error performing GET request ${url}: ${response.statusText}`);
	}
	return response.json();
}

export async function storeSecret(secretPath: string, secretValue: string): Promise<{ result: boolean }> {
	// Secret goes in the body, never the URL: URLs are written to access logs.
	const url = `${API_BASE_ENDPOINT}/secret`;
	const response = await authenticatedFetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ secret_path: secretPath, secret_value: secretValue })
	});
	if (!response.ok) {
		throw new Error(`Error performing POST request ${url}: ${response.statusText}`);
	}
	return response.json();
}
