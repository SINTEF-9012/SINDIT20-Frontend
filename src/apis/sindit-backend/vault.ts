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
	const url = `${API_BASE_ENDPOINT}/secret?secret_path=${encodeURIComponent(secretPath)}&secret_value=${encodeURIComponent(secretValue)}`;
	const response = await authenticatedFetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' }
	});
	if (!response.ok) {
		throw new Error(`Error performing POST request ${url}: ${response.statusText}`);
	}
	return response.json();
}
