import { writable } from 'svelte/store';
import type { NodeType, GLTFModel } from '$lib/types';

export const selectedWorkspace = writable('');
export const createNodeMode = writable(false);
export const createLinkMode = writable(false);
export const modalMetadata = writable({toolName: '', operationMode: ''});
export const selectedNodes = writable<string[]>([]);
export const selectedNodeId = writable('');
export const selectedLinkId = writable('');

export const nodeSize = 100; //
export const defaultNodeType: NodeType = 'AbstractAsset';

export const selected3DModel = writable<GLTFModel>({name: '', path: ''});
