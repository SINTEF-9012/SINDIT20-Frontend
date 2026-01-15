import { writable, get } from 'svelte/store';
import { setContext, getContext } from 'svelte';
import { getToastState } from '$lib/components/states/toast-state.svelte';
import { browser } from '$app/environment';

export interface AuthUser {
	email: string;
	token: string;
}

export class AuthState {
	user = writable<AuthUser | null>(null);
	isAuthenticated = writable<boolean>(false);
	loading = writable<boolean>(false);
	error = writable<string | null>(null);
	private toastState: ReturnType<typeof getToastState>;

	constructor() {
		this.toastState = getToastState();
		// Restore session from localStorage if available
		if (browser) {
			const savedUser = localStorage.getItem('sindit_auth_user');
			if (savedUser) {
				try {
					const user = JSON.parse(savedUser);
					this.user.set(user);
					// Validate token before setting authenticated
					this.validateSession();
				} catch {}
			}
		}
	}

	async signIn(username: string, password: string) {
		this.loading.set(true);
		this.error.set(null);
		try {
			// Call backend API for authentication (login endpoint)
			const res = await fetch('/api/proxy?endpoint=login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username, password })
			});
			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || 'Sign-in failed');
			}
			const data = await res.json();
			const token = data.access_token || data.token;
			if (!token) throw new Error('No token received');
			const user = { email: username, token };
			this.user.set(user);
			this.isAuthenticated.set(true);
			if (browser) {
				localStorage.setItem('sindit_auth_user', JSON.stringify(user));
			}
			this.toastState.add('Signed in', `Welcome back, ${username}!`, 'info');
		} catch (err: any) {
			this.error.set(err.message || 'Sign-in failed');
			this.isAuthenticated.set(false);
		} finally {
			this.loading.set(false);
		}
	}

	async validateSession() {
		try {
			// Call a lightweight endpoint to verify the token is still valid
			const res = await fetch('/api/proxy?endpoint=ws/get', {
				method: 'GET'
			});
			if (res.ok) {
				this.isAuthenticated.set(true);
			} else {
				throw new Error('Session invalid');
			}
		} catch {
			// Token invalid, clear state
			this.user.set(null);
			this.isAuthenticated.set(false);
			if (browser) {
				localStorage.removeItem('sindit_auth_user');
			}
		}
	}

	async signOut() {
		this.user.set(null);
		this.isAuthenticated.set(false);
		if (browser) {
			localStorage.removeItem('sindit_auth_user');
		}
		try {
			await fetch('/api/proxy?endpoint=logout', {
				method: 'POST',
				credentials: 'same-origin'
			});
		} catch (e) {
			// Ignore errors, just clear local state
		}
		this.toastState.add('Signed out', 'You have been signed out.', 'info');
	}
}

const KEY = Symbol('AuthState');

export function setAuthState() {
	const state = new AuthState();
	setContext(KEY, state);
	return state;
}

export function getAuthState() {
	return getContext<ReturnType<typeof setAuthState>>(KEY);
}
