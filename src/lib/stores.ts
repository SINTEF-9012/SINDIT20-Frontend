import { writable } from 'svelte/store';

export const createNodeMode = writable(false);
export const modalMetadata = writable({toolName: '', operationMode: ''});
