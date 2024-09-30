import { writable } from 'svelte/store';
import type { NodeType, GLTFModel } from '$lib/types';


// workspace
export const selectedWorkspace = writable('');

// node
export const selectedNodes = writable<string[]>([]);
export const selectedNodeId = writable('');
export const nodeSize = 100;
export const defaultNodeType: NodeType = 'AbstractAsset';
export const createNodeMode = writable(false);


// links
export const selectedLinkId = writable('');
export const createLinkMode = writable(false);

// connections
export const createConnectionMode = writable(false);

//
export const modalMetadata = writable({toolName: '', operationMode: ''});

// 3D model
export const selected3DModel = writable<GLTFModel>({name: '', path: ''});
