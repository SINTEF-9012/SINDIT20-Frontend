import { env } from '$env/dynamic/public';
import { authenticatedFetch } from '$lib/api-client';

// Workspaces - SINDIT API endpoints
const API_BASE_URL = '/api/proxy';
const API_BASE_ENDPOINT = `${API_BASE_URL}?endpoint=ws`

export async function getWorkspace(): Promise<{workspace_uri: string}> {
    const endpoint = 'get';
    const url = `${API_BASE_ENDPOINT}/${endpoint}`;
    const response = await authenticatedFetch(url);
    if (!response.ok) {
        throw new Error(`Error performing GET request ${url}`);
    }
    return response.json();
}

export async function listWorkspaces() {
    const endpoint = 'list';
    const url = `${API_BASE_ENDPOINT}/${endpoint}`;
    const response = await authenticatedFetch(url);
    if (!response.ok) {
        throw new Error(`Error performing GET request ${url}`);
    }
    return response.json();
}

export async function switchWorkspace(
    workspaceUri: string
) {
    const endpoint = 'switch';
    const base_url = `${API_BASE_ENDPOINT}/${endpoint}`;
    const url = `${base_url}?workspace_name=${encodeURIComponent(workspaceUri)}`
    const response = await authenticatedFetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
    });
    if (!response.ok) {
        throw new Error(`Error performing POST request ${url}`);
    }
    return response.json();
}
