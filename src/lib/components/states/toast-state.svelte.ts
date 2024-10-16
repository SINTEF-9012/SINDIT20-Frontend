import { writable } from 'svelte/store';
import type { Toast, LogLevel } from '$lib/types';
import { setContext, getContext } from 'svelte';

type Timeout = ReturnType<typeof setTimeout>;

// TODO: Remove zoomLevel from Node type if it is not used!

// Toast state class to manage event messages in the application
export class ToastState {
	toasts = writable<Toast[]>([]);
	toastToTimoutMap = new Map<string, Timeout>();

	constructor() {
		console.log("ToastState initialized");
	}

	destroy() {
		console.log('ToastState destroyed');
		for (const timeout of this.toastToTimoutMap.values()) {
			clearTimeout(timeout);
		}
		this.toastToTimoutMap.clear();
	}

	add(title: string, message: string, logLevel: LogLevel = 'info', durationMs: number = 15000) {
		const id = crypto.randomUUID();
		const newToast: Toast = { id, title, message, logLevel };
		this.toasts.update((t) => [...t, newToast]);
		console.log(`message (${id}) added to ToastState`);
		this.toastToTimoutMap.set(
			id,
			setTimeout(() => {
				this.remove(id);
			}, durationMs)
		);
	}

	remove(id: string) {
		const timeout = this.toastToTimoutMap.get(id);
		if (timeout) {
			clearTimeout(timeout);
			this.toastToTimoutMap.delete(id);
			console.log(`message (${id}) removed from ToastState`);
		}
		this.toasts.update((t) => t.filter((t) => t.id !== id));
	}
}

// Unique key to store the toast state in the Svelte context
const TOAST_KEY = Symbol('TOAST');

export function setToastState() {
	const toastState = new ToastState();
	setContext(TOAST_KEY, toastState);
	return toastState;
}

export function getToastState() {
	return getContext<ReturnType<typeof setToastState>>(TOAST_KEY);
}
