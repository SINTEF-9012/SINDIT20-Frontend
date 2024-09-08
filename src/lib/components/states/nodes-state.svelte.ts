import type { Node } from '$lib/types';
import { getContext, setContext } from 'svelte';
import { getToastState } from '$lib/components/states/toast-state.svelte';
import { writable, get } from 'svelte/store';

export class Nodes {
	nodes = writable<Node[]>([]);
	private toastState: ReturnType<typeof getToastState>;

	constructor() {
		this.toastState = getToastState();
		this.nodes.set([
			{
				id: '1',
				nodeName: 'Node 1',
				nodeDescription: 'Node 1 description',
				position: { x: 10, y: 10 }
			},
			{
				id: '2',
				nodeName: 'Node 2',
				nodeDescription: 'Node 2 description',
				position: { x: 20, y: 20 }
			},
			{
				id: '3',
				nodeName: 'Node 3',
				nodeDescription: 'Node 3 description',
				position: { x: 30, y: 10 }
			}
		]);
	}

	// Create a new node
	createNode(
		nodeName: string,
		nodeDescription: string,
		position: { x: number; y: number },
	) {
		const newNode: Node = {
			id: crypto.randomUUID(),
			nodeName,
			nodeDescription,
			position
		};
		this.nodes.update((nodes) => [...nodes, newNode]);
		this.toastState.add('Node created', `Node "${newNode.nodeName}" created`, 'info');
	}

	// Get a node by id
	getNode(id: string) {
		const nodes = get(this.nodes);
		return nodes.find((node) => node.id === id);
	}

	// Update a node by id
	updateNode(id: string, updatedNode: Node) {
		const nodes = get(this.nodes);
		const nodeId = nodes.findIndex((node) => node.id === id);
		updatedNode.id = id;
		this.nodes.update((nodes) => [
			...nodes.slice(0, nodeId),
			updatedNode,
			...nodes.slice(nodeId + 1)
		]);
		this.toastState.add('Node updated', `Node "${id}" updated`, 'info');
	}

	// Delete a node by index
	deleteNode(id: string) {
		const nodes = get(this.nodes);
		if (!nodes.find((node) => node.id === id)) {
			this.toastState.add('Node not found', `Node "${id}" not found`, 'error');
			return;
		} else {
			this.nodes.update((nodes) => [...nodes.filter((node) => node.id !== id)]);
			this.toastState.add('Node deleted', `Node "${id}" has been deleted`, 'info');
		}
	}

	// Get all nodes
	getAllNodes() {
		return this.nodes;
	}
}

// Unique key to store the state in the Svelte context
const NODES_KEY = Symbol('NODES');

export function setNodes() {
	const nodeState = new Nodes();
	setContext(NODES_KEY, nodeState);
	return nodeState;
}

export function getNodes() {
	return getContext<ReturnType<typeof setNodes>>(NODES_KEY);
}
