import type { DataspaceManagement } from '$lib/types';
import { authenticatedFetch } from '$lib/api-client';
import { fetchAllPages } from '$lib/pagination';

const API_BASE_URL = '/api/proxy';
const API_BASE_ENDPOINT = `${API_BASE_URL}?endpoint=dataspace`;

export async function listDataspaces(skip: number = 0, limit: number = 100): Promise<DataspaceManagement[]> {
	const url = `${API_BASE_ENDPOINT}&skip=${skip}&limit=${limit}`;
	const response = await authenticatedFetch(url);
	if (!response.ok) {
		throw new Error(`Error performing GET request ${url}`);
	}
	return response.json();
}

export async function getAllDataspaces(): Promise<DataspaceManagement[]> {
	return fetchAllPages<DataspaceManagement>(
		(_depth, skip, limit) => listDataspaces(skip, limit),
		1,
		100
	);
}

export async function createDataspaceManagement(node: Partial<DataspaceManagement> & { uri?: string }): Promise<DataspaceManagement> {
	const url = `${API_BASE_ENDPOINT}/management`;
	const response = await authenticatedFetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(node)
	});
	if (!response.ok) {
		throw new Error(`Error performing POST request ${url}: ${response.statusText}`);
	}
	return response.json();
}

export async function deleteDataspaceManagement(nodeUri: string): Promise<void> {
	const url = `${API_BASE_ENDPOINT}/management?uri=${encodeURIComponent(nodeUri)}`;
	const response = await authenticatedFetch(url, {
		method: 'DELETE',
		headers: { 'Content-Type': 'application/json' }
	});
	if (!response.ok) {
		throw new Error(`Error performing DELETE request ${url}: ${response.statusText}`);
	}
}

export async function testDataspaceConnection(nodeUri: string): Promise<DataspaceManagement> {
	const url = `${API_BASE_ENDPOINT}/test_connection?uri=${encodeURIComponent(nodeUri)}`;
	const response = await authenticatedFetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' }
	});
	if (!response.ok) {
		throw new Error(`Error performing POST request ${url}: ${response.statusText}`);
	}
	return response.json();
}

export async function syncDataspace(nodeUri: string): Promise<void> {
	const url = `${API_BASE_ENDPOINT}/sync?uri=${encodeURIComponent(nodeUri)}`;
	const response = await authenticatedFetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' }
	});
	if (!response.ok) {
		throw new Error(`Error performing POST request ${url}: ${response.statusText}`);
	}
}

export async function getDataspaceCatalog(nodeUri: string): Promise<any[]> {
	const url = `${API_BASE_ENDPOINT}/catalog?uri=${encodeURIComponent(nodeUri)}`;
	const response = await authenticatedFetch(url);
	if (!response.ok) {
		throw new Error(`Error performing GET request ${url}: ${response.statusText}`);
	}
	return response.json();
}
export async function unpublishFromDataspace(dataspaceUri: string, nodeUris: string[]): Promise<void> {
	const url = `${API_BASE_ENDPOINT}/publish?uri=${encodeURIComponent(dataspaceUri)}`;
	const response = await authenticatedFetch(url, {
		method: 'DELETE',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ node_uris: nodeUris })
	});
	if (!response.ok) {
		throw new Error(`Error performing DELETE request ${url}: ${response.statusText}`);
	}
}

export async function publishToDataspace(dataspaceUri: string, nodeUris: string[]): Promise<{ requested: string[]; published: string[] }> {
	const url = `${API_BASE_ENDPOINT}/publish?uri=${encodeURIComponent(dataspaceUri)}`;
	const response = await authenticatedFetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ node_uris: nodeUris })
	});
	if (!response.ok) {
		throw new Error(`Error performing POST request ${url}: ${response.statusText}`);
	}
	return response.json();
}