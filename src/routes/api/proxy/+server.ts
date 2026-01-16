// This file implements a universal server-side proxy endpoint for the frontend.
// It handles authentication, token generation, token renewal, and proxies all backend API requests (GET/POST).
// Credentials are stored in secure HTTP-only cookies, and the proxy automatically renews tokens as needed.
// All frontend API calls should go through this endpoint for secure, centralized authentication and backend access.

import { json } from '@sveltejs/kit';
import { env as envPublic } from '$env/dynamic/public';

// Workspaces - SINDIT API endpoints
const API_BASE_URL = envPublic.PUBLIC_SINDIT_BACKEND_API;

async function getToken(username: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ username, password })
    });
    if (!response.ok) throw new Error('Failed to get token');
    const { access_token, token_type } = await response.json();
    return access_token;
}

async function proxyToBackend({ endpoint, method, token, body }: { endpoint: string, method: string, token: string, body?: any }) {
    // Encode only parameter values in the query string, support multiple params, leave # as part of the value if present
    let url = API_BASE_URL;
    if (endpoint) {
        const [endpointPath, endpointQuery] = endpoint.split('?', 2);
        // Remove leading slash to avoid double slashes
        const endpointClean = endpointPath.startsWith('/') ? endpointPath.slice(1) : endpointPath;
        url += `/${endpointClean}`;
        if (endpointQuery) {
            // Support multiple params, encode only values, preserve keys and '='
            const encodedQuery = endpointQuery
                .split('&')
                .map(pair => {
                    const eqIdx = pair.indexOf('=');
                    if (eqIdx === -1) {
                        // No value, just encode key
                        return encodeURIComponent(pair);
                    }
                    const key = pair.slice(0, eqIdx);
                    const value = pair.slice(eqIdx + 1);
                    return `${key}=${encodeURIComponent(value)}`;
                })
                .join('&');
            url += `?${encodedQuery}`;
        }
    }
    const options: RequestInit = {
        method,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };
    if (body) options.body = JSON.stringify(body);
    console.log("endpoint:", endpoint);
    console.log(`Proxying ${method} request to: ${url}`, body ? `with body: ${JSON.stringify(body)}` : '');
    return fetch(url, options);
}

async function handleProxy({ request, cookies, url, method }: { request: Request, cookies: any, url: URL, method: string }) {
    const endpoint = url.searchParams.get('endpoint');
    if (!endpoint) return json({ error: 'No endpoint specified' }, { status: 400 });

    let token = cookies.get('api_token');
    // Use provided env for username/password if not in cookies
    const username = cookies.get('session_username');
    const password = cookies.get('session_password');
    if (!username || !password) return json({ error: 'Not authenticated' }, { status: 401 });

    let body = undefined;
    if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
        try {
            body = await request.json();
        } catch {
            body = undefined;
        }
    }

    let backendRes = await proxyToBackend({ endpoint, method, token, body });

    if (backendRes.status === 401) {
        // Token expired, renew
        try {
            token = await getToken(username, password);
            cookies.set('api_token', token, { httpOnly: true, secure: true, sameSite: 'strict', path: '/' });
            backendRes = await proxyToBackend({ endpoint, method, token, body });
        } catch {
            return json({ error: 'Session expired, please log in again.' }, { status: 401 });
        }
    }

    const data = await backendRes.json();
    return json(data, { status: backendRes.status });
}

// Add a login endpoint for storing username/password in session cookies and generating a token
export async function POST({ request, cookies, url }) {
    if (url.searchParams.get('endpoint') === 'login') {
        // Handle login: store username and password in secure cookies
        const { username, password } = await request.json();
        if (!username || !password) {
            return json({ error: 'Username and password required' }, { status: 400 });
        }
        // Try to get a token to verify credentials
        try {
            const token = await getToken(username, password);
            cookies.set('session_username', username, { httpOnly: true, secure: true, sameSite: 'strict', path: '/' });
            cookies.set('session_password', password, { httpOnly: true, secure: true, sameSite: 'strict', path: '/' });
            cookies.set('api_token', token, { httpOnly: true, secure: true, sameSite: 'strict', path: '/' });
            return json({ success: true, access_token: token });
        } catch (e) {
            return json({ error: 'Invalid username or password' }, { status: 401 });
        }
    }
    if (url.searchParams.get('endpoint') === 'logout') {
        // Clear all auth/session cookies
        cookies.set('session_username', '', { httpOnly: true, secure: true, sameSite: 'strict', path: '/', maxAge: 0 });
        cookies.set('session_password', '', { httpOnly: true, secure: true, sameSite: 'strict', path: '/', maxAge: 0 });
        cookies.set('api_token', '', { httpOnly: true, secure: true, sameSite: 'strict', path: '/', maxAge: 0 });
        return json({ success: true });
    }
    return handleProxy({ request, cookies, url, method: 'POST' });
}

export async function GET({ request, cookies, url }) {
    console.log("GET request to proxy endpoint:", url);
    return handleProxy({ request, cookies, url, method: 'GET' });
}

export async function PUT({ request, cookies, url }) {
    return handleProxy({ request, cookies, url, method: 'PUT' });
}

export async function DELETE({ request, cookies, url }) {
    return handleProxy({ request, cookies, url, method: 'DELETE' });
}

// You can add other HTTP methods similarly if needed.
