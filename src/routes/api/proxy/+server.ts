// This file implements a universal server-side proxy endpoint for the frontend.
// It handles authentication, token generation, token renewal, and proxies all backend API requests (GET/POST).
// Credentials are stored in secure HTTP-only cookies, and the proxy automatically renews tokens as needed.
// All frontend API calls should go through this endpoint for secure, centralized authentication and backend access.

import { json } from '@sveltejs/kit';
import { env as envPrivate } from '$env/dynamic/private';
import { env as envPublic } from '$env/dynamic/public';

// Workspaces - SINDIT API endpoints
const API_BASE_URL = envPublic.PUBLIC_SINDIT_BACKEND_API;
const API_USERNAME = envPrivate.PRIVATE_SINDIT_BACKEND_USRERNAME;
const API_PASSWORD = envPrivate.PRIVATE_SINDIT_BACKEND_PASSWORD;

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
    const url = `${API_BASE_URL}/${endpoint}`;
    const options: RequestInit = {
        method,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };
    if (body) options.body = JSON.stringify(body);
    return fetch(url, options);
}

async function handleProxy({ request, cookies, url, method }: { request: Request, cookies: any, url: URL, method: string }) {
    const endpoint = url.searchParams.get('endpoint');
    if (!endpoint) return json({ error: 'No endpoint specified' }, { status: 400 });

    let token = cookies.get('api_token');
    // Use provided env for username/password if not in cookies
    const username = cookies.get('session_username') || API_USERNAME;
    const password = cookies.get('session_password') || API_PASSWORD;
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

export async function GET({ request, cookies, url }) {
    return handleProxy({ request, cookies, url, method: 'GET' });
}

export async function POST({ request, cookies, url }) {
    return handleProxy({ request, cookies, url, method: 'POST' });
}

export async function PUT({ request, cookies, url }) {
    return handleProxy({ request, cookies, url, method: 'PUT' });
}

export async function DELETE({ request, cookies, url }) {
    return handleProxy({ request, cookies, url, method: 'DELETE' });
}

// You can add other HTTP methods similarly if needed.