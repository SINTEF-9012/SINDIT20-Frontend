// Workspaces - SINDIT API endpoints
const API_BASE_URL = import.meta.env.VITE_SINDIT_BACKEND_API
const API_BASE_ENDPOINT = `${API_BASE_URL}/ws`


export async function getWorkspace(): Promise<{workspace_uri: string}> {
    const endpoint = 'get';
    const url = `${API_BASE_ENDPOINT}/${endpoint}`;
    console.log("getCurrentWorkspace", `${url}`)
    const response = await fetch(`${url}`);
    if (!response.ok) {
        throw new Error(`Error performing GET request ${url}`);
    }
    return response.json();
}

export async function listWorkspaces() {
    const endpoint = 'list';
    const url = `${API_BASE_ENDPOINT}/${endpoint}`;
    console.log("listWorkspaces", `${url}`)
    const response = await fetch(`${url}`);
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
    console.log("switchWorkspace", `${base_url}`)
    const url = `${base_url}?workspace_uri=${encodeURIComponent(workspaceUri)}`
    const response = await fetch(url, {
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
