import type {
	Node,
	AbstractAsset,
	AbstractAssetProperty,
	Connection,
	MQTTConnection,
	InfluxDBConnection
} from '$lib/types';
import { getContext, setContext } from 'svelte';
import { getToastState } from '$lib/components/states/toast-state.svelte';
import { writable, get } from 'svelte/store';
import {
	createAbstractNode as createAbstractNodeQuery,
	createAbstractPropertyNode as createAbstracAssetPropertyNodeQuery,
	createConnectionNode as createConnectionNodeQuery
} from '$apis/sindit-backend/api';
import { selectedWorkspace } from '$lib/stores';

export class Nodes {
	nodes = writable<Node[]>([]);
	private toastState: ReturnType<typeof getToastState>;
	private selectedWorkspace: string = "default";

	constructor() {
		this.toastState = getToastState();
		selectedWorkspace.subscribe((value) => {
			this.selectedWorkspace = value;
		});
	}

	private abstractAssetNodeObject(
		nodeName: string,
		description: string,
		position: { x: number; y: number }
	): AbstractAsset {
		return {
			id: crypto.randomUUID(),
			nodeName,
			description,
			position,
			nodeType: 'AbstractAsset'
		};
	}

	private abstractAssetPropertyNodeObject(
		nodeName: string,
		description: string,
		position: { x: number; y: number },
		propertyName: string,
		propertyValue: string,
		propertyDataTypeURI: string,
		propertyUnitURI: string,
	): AbstractAssetProperty {
		return {
			id: crypto.randomUUID(),
			nodeName,
			description,
			position,
			nodeType: 'AbstractAssetProperty',
			propertyName,
			propertyValue,
			propertyDataType: {
				uri: propertyDataTypeURI,
			},
			propertyUnit: {
				uri: propertyUnitURI,
			},
		};
	}

	private connectionNodeObject(
		nodeName: string,
		description: string,
		position: { x: number; y: number },
		host: string,
		port: number,
		connectionType: 'MQTT' | 'InfluxDB' | 'SensApp'
	): Connection {
		return {
			id: crypto.randomUUID(),
			nodeName,
			description,
			position,
			nodeType: 'Connection',
			host,
			port,
			connectionType
		};
	}

	deleteAllNodes() {
		this.nodes.set([]);
	}

	// Add or create a new node (add node in frontend, create node in backend)
	createNode<T extends Node>(
		node: T
	) {
		this.nodes.update((nodes) => [...nodes, node]);
	}

	// Add a new AbstractAsset node (imported from the API)
	addAbstractAssetNode(
		nodeName: string,
		description: string,
		position: { x: number; y: number },
	) {
		const newNode = this.abstractAssetNodeObject(nodeName, description, position);
		this.createNode(newNode);
	}

	// Add a new AbstractAssetProperty node (imported from the API)
	addAbstractAssetPropertyNode(
		nodeName: string,
		description: string,
		position: { x: number; y: number },
		propertyName: string,
		propertyValue: string,
		propertyDataType: string,
		propertyUnit: string,
		propertySemanticId: string
	) {
		const newNode = this.abstractAssetPropertyNodeObject(nodeName, description, position, propertyName, propertyValue, propertyDataType, propertyUnit, propertySemanticId);
		this.createNode(newNode);
	}

	// Add a new Connection node (imported from the API)
	addConnectionNode(
		nodeName: string,
		description: string,
		position: { x: number; y: number },
		host: string,
		port: number,
		connectionType: 'MQTT' | 'InfluxDB' | 'SensApp'
	) {
		const newNode = this.connectionNodeObject(nodeName, description, position, host, port, connectionType);
		this.createNode(newNode);
	}

	// Create a new AbstractAsset node (frontend and backend)
	async createAbstractAssetNode(
		nodeName: string,
		description: string,
		position: { x: number; y: number },
	) {
		const newNode = this.abstractAssetNodeObject(nodeName, description, position);
		this.createNode(newNode);
		try {
			await createAbstractNodeQuery(newNode.id, newNode.nodeName, newNode.description, this.selectedWorkspace); // API call to create a new AbstractNode in the backend
		} catch (error) {
			this.toastState.add('Error creating AbstractAsset node', error, 'error');
			this.deleteNode(newNode.id);
		}
	}

	// Create a new AbstractAssetProperty node
	async createAbstractAssetPropertyNode(
		nodeName: string,
		description: string,
		position: { x: number; y: number },
		propertyName: string,
		propertyValue: string,
		propertyDataType: string,
		propertyUnit: string,
	) {
		const newNode = this.abstractAssetPropertyNodeObject(nodeName, description, position, propertyName, propertyValue, propertyDataType, propertyUnit);
		this.createNode(newNode);
		try {
			await createAbstracAssetPropertyNodeQuery;
		} catch (error) {
			this.toastState.add('Error creating AbstractAssetProperty node', error, 'error');
			this.deleteNode(newNode.id);
		}
	}

	// Create a new Connection node
	async createConnectionNode(
		nodeName: string,
		description: string,
		position: { x: number; y: number },
		host: string,
		port: number,
		connectionType: 'MQTT' | 'InfluxDB' | 'SensApp'
	) {
		const newNode = this.connectionNodeObject(nodeName, description, position, host, port, connectionType);
		this.createNode(newNode);
		try {
			await createConnectionNodeQuery(newNode.id, newNode.nodeName, newNode.description, host, port, connectionType, this.selectedWorkspace);
		} catch (error) {
			this.toastState.add('Error creating Connection node', error, 'error');
			this.deleteNode(newNode.id);
		}
	}

	// Create a new MQTTConnection node
	createMQTTConnectionNode(
		nodeName: string,
		description: string,
		position: { x: number; y: number },
		host: string,
		port: number,
		credentialReference: string
	) {
		const newNode: MQTTConnection = {
			id: crypto.randomUUID(),
			nodeName,
			description,
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
		description: string,
		position: { x: number; y: number },
		host: string,
		port: number,
		bucket: string,
		org: string,
		credentialReference: string
	) {
		const newNode: InfluxDBConnection = {
			id: crypto.randomUUID(),
			nodeName,
			description,
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
