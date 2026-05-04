import { env } from '$env/dynamic/public';
import { authenticatedFetch } from '$lib/api-client';

// Workspaces - SINDIT API endpoints
const SINDIT_API_BASE_URL = env.PUBLIC_SINDIT_BACKEND_API;

const API_BASE_URL = '/api/proxy';
const API_BASE_ENDPOINT = `${API_BASE_URL}?endpoint=connection`;

export async function getBackendVersion(): Promise<string | null> {
	try {
		const response = await fetch(`${SINDIT_API_BASE_URL}/openapi.json`);
		if (!response.ok) return null;
		const data = await response.json();
		return data?.info?.version ?? null;
	} catch {
		return null;
	}
}

export async function backendHealthCheck(): Promise<boolean> {
	const url = `${API_BASE_URL}?endpoint=health/live`;
	try {
		const response = await fetch(url);
		// Health endpoint returns 204 No Content when healthy
		if (response.status === 204) {
			return true;
		} else {
			return false;
		}
	} catch (error) {
		console.error(error);
		return false;
	}
}

export async function refreshConnections(): Promise<boolean> {
	const url = '/api/proxy?endpoint=connections/refresh';
	console.log('refreshConnections POST:', url);
	const response = await authenticatedFetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		}
	});
	if (!response.ok) {
		throw new Error(`Error performing POST request ${url}`);
	}
	return true;
}

export async function refreshConnectionByUri(connectionUri: string): Promise<boolean> {
	const url = `/api/proxy?endpoint=connection/refresh?connection_uri=${encodeURIComponent(connectionUri)}`;
	const response = await authenticatedFetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		}
	});
	if (!response.ok) {
		throw new Error(`Error performing POST request ${url}`);
	}
	return true;
}
