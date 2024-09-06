import { writable } from 'svelte/store';

export const selectedWorkspace = writable('');
export const createNodeMode = writable(false);
export const createLinkMode = writable(false);
export const modalMetadata = writable({toolName: '', operationMode: ''});
export const selectedNodes = writable<string[]>([]);
