import type {
	Node,
	AbstractAsset,
	AbstractAssetProperty,
	Connection,
	MQTTConnection,
	InfluxDBConnection
} from '$lib/types';
import { defaultNodeType } from '$lib/stores';
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
				position: { x: 10, y: 10 },
				nodeType: defaultNodeType
			},
			{
				id: '2',
				nodeName: 'Node 2',
				nodeDescription: 'Node 2 description',
				position: { x: 20, y: 20 },
				nodeType: defaultNodeType
			},
			{
				id: '3',
				nodeName: 'Node 3',
				nodeDescription: 'Node 3 description',
				position: { x: 30, y: 10 },
				nodeType: defaultNodeType
			}
		]);
	}

	// Create a new node
	createNode<T extends Node>(
		node: T
	) {
		this.nodes.update((nodes) => [...nodes, node]);
		this.toastState.add('Node created', `Node "${node.nodeName}" created`, 'info');
	}

	// Create a new AbstractAsset node
	createAbstractAssetNode(
		nodeName: string,
		nodeDescription: string,
		position: { x: number; y: number },
	) {
		const newNode: AbstractAsset = {
			id: crypto.randomUUID(),
			nodeName,
			nodeDescription,
			position,
			nodeType: 'AbstractAsset'
		};
		this.createNode(newNode);
	}

	// Create a new AbstractAssetProperty node
	createAbstractAssetPropertyNode(
		nodeName: string,
		nodeDescription: string,
		position: { x: number; y: number },
		propertyName: string,
		propertyDescription: string,
		propertyValue: string,
		propertyDataType: string,
		propertyUnit: string,
		propertySemanticId: string
	) {
		const newNode: AbstractAssetProperty = {
			id: crypto.randomUUID(),
			nodeName,
			nodeDescription,
			position,
			nodeType: 'AbstractAssetProperty',
			propertyName,
			propertyDescription,
			propertyValue,
			propertyDataType,
			propertyUnit,
			propertySemanticId
		};
		this.createNode(newNode);
	}

	// Create a new Connection node
	createConnectionNode(
		nodeName: string,
		nodeDescription: string,
		position: { x: number; y: number },
		host: string,
		port: string,
		connectionType: 'MQTT' | 'InfluxDB' | 'SensApp'
	) {
		const newNode: Connection = {
			id: crypto.randomUUID(),
			nodeName,
			nodeDescription,
			position,
			nodeType: 'Connection',
			host,
			port,
			connectionType
		};
		this.createNode(newNode);
	}

	// Create a new MQTTConnection node
	createMQTTConnectionNode(
		nodeName: string,
		nodeDescription: string,
		position: { x: number; y: number },
		host: string,
		port: string,
		credentialReference: string
	) {
		const newNode: MQTTConnection = {
			id: crypto.randomUUID(),
			nodeName,
			nodeDescription,
			position,
			nodeType: 'Connection',
			connectionType: 'MQTT',
			host,
			port,
			credentialReference
		};
		this.createNode(newNode);
	}

	// Create a new InfluxDBConnection node
	createInfluxDBConnectionNode(
		nodeName: string,
		nodeDescription: string,
		position: { x: number; y: number },
		host: string,
		port: string,
		bucket: string,
		org: string,
		credentialReference: string
	) {
		const newNode: InfluxDBConnection = {
			id: crypto.randomUUID(),
			nodeName,
			nodeDescription,
			position,
			nodeType: 'Connection',
			connectionType: 'InfluxDB',
			host,
			port,
			bucket,
			org,
			credentialReference
		};
		this.createNode(newNode);
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
