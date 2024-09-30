import type {
	AbstractAsset,
	AbstractAssetProperty,
	Connection,
	AssetPropertyUri,
} from '$lib/types';
import { getContext, setContext } from 'svelte';
import { getToastState } from '$lib/components/states/toast-state.svelte';
import { writable, get } from 'svelte/store';
import {
	getNode as getNodeQuery,
	createAbstractNode as createAbstractNodeQuery,
	createConnectionNode as createConnectionNodeQuery,
	addAbstractPropertyToNode as addAbstractPropertyToNodeQuery,
	createAbstractPropertyNode as createAbstractAssetPropertyQuery,
} from '$apis/sindit-backend/kg';


// TODO: Split class into AbstractAssets, AbstractAssetProperties, and Connections?
export class Nodes {
	assets = writable<AbstractAsset[]>([]); // AbstractAssetNodes
	assetProperties = writable<AbstractAssetProperty[]>([]); // AbstractAssetPropertyNodes
	connections = writable<Connection[]>([]); // ConnectionNodes

	private toastState: ReturnType<typeof getToastState>;

	constructor() {
		this.toastState = getToastState();
	}

	private abstractAssetNodeObject(
		nodeName: string,
		description: string,
		position: { x: number; y: number },
		assetProperties: AssetPropertyUri[] = []
	): AbstractAsset {
		return {
			id: crypto.randomUUID(),
			nodeName,
			description,
			position,
			nodeType: 'AbstractAsset',
			assetProperties,
		};
	}

	private abstractAssetPropertyNodeObject(
		propertyName: string,
		description: string,
		propertyDataTypeURI: string,
		propertyUnitURI: string,
	): AbstractAssetProperty {
		return {
			id: crypto.randomUUID(),
			propertyName,
			description,
			nodeType: 'AbstractAssetProperty',
			propertyDataType: {
				uri: propertyDataTypeURI,
			},
			propertyUnit: {
				uri: propertyUnitURI,
			},
		};
	}

	private connectionNodeObject(
		connectionName: string,
		description: string,
		host: string,
		port: number,
		connectionType: 'MQTT' | 'InfluxDB' | 'SensApp'
	): Connection {
		return {
			id: crypto.randomUUID(),
			connectionName,
			description,
			nodeType: 'Connection',
			host,
			port,
			connectionType
		};
	}

	getAllAbstractAssetNodes() {
		return this.assets;
	}

	getAllAbstractAssetPropertyNodes() {
		return this.assetProperties;
	}

	getAllConnectionNodes() {
		return this.connections;
	}

	deleteAllAbstractAssets() {
		this.assets.set([]);
	}

	deleteAllAbstractProperties() {
		this.assetProperties.set([]);
	}

	deleteAllConnections() {
		this.connections.set([]);
	}

	deleteAllNodes() {
		this.deleteAllAbstractAssets();
		this.deleteAllAbstractProperties();
		this.deleteAllConnections();
	}

	// Add a new asset node to the state
	addAsset<T extends AbstractAsset>(
		asset: T
	) {
		this.assets.update((assets) => [...assets, asset]);
	}

	// Add a new asset property node to the state
	addAssetProperty<T extends AbstractAssetProperty>(
		assetProperty: T
	) {
		this.assetProperties.update((assetProperties) => [...assetProperties, assetProperty]);
	}

	// Add a new connection node to the state
	addConnection<T extends Connection>(
		connection: T
	) {
		this.connections.update((connections) => [...connections, connection]);
	}

	// Add a new AbstractAsset node
	addAbstractAssetNode(
		nodeName: string,
		description: string,
		position: { x: number; y: number },
		assetProperties: AssetPropertyUri[]
	) {
		const newAsset = this.abstractAssetNodeObject(nodeName, description, position, assetProperties);
		this.addAsset(newAsset);
	}

	// Add a new Connection node
	addConnectionNode(
		connectionName: string,
		description: string,
		host: string,
		port: number,
		connectionType: 'MQTT' | 'InfluxDB' | 'SensApp'
	) {
		const newNode = this.connectionNodeObject(connectionName, description, host, port, connectionType);
		this.addConnection(newNode);
	}

	// Add a new AbstractAssetProperty node
	addAbstractAssetPropertyNode(
		propertyName: string,
		description: string,
		propertyDataTypeURI: string,
		propertyUnitURI: string
	) {
		const newProperty = this.abstractAssetPropertyNodeObject(propertyName, description, propertyDataTypeURI, propertyUnitURI);
		this.addAssetProperty(newProperty);
	}

	// Create a new AbstractAsset node (frontend and backend)
	async createAbstractAssetNode(
		nodeName: string,
		description: string,
		position: { x: number; y: number },
	) {
		const newNode = this.abstractAssetNodeObject(nodeName, description, position);
		this.addAsset(newNode);
		try {
			// API call to create a new AbstractNode in the backend
			await createAbstractNodeQuery(newNode.id, newNode.nodeName, newNode.description);
		} catch (error) {
			this.toastState.add('Error creating AbstractAsset node', error, 'error');
			this.deleteAbstractAssetNode(newNode.id);
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
		this.addConnection(newNode);
		try {
			await createConnectionNodeQuery(newNode.id, newNode.nodeName, newNode.description, host, port, connectionType);
		} catch (error) {
			this.toastState.add('Error creating Connection node', error, 'error');
			// TODO: delete this.deleteConnection(newNode.id);
		}
	}

	// Create a new AbstractAssetProperty node
	async createAbstractAssetPropertyNode(
		nodeId: string,
		propertyName: string,
		description: string,
		propertyDataTypeURI: string,
		propertyUnitURI: string
	) {
		let newPropertyNode;
		const newProperty = this.abstractAssetPropertyNodeObject(propertyName, description, propertyDataTypeURI, propertyUnitURI);
		this.addAssetProperty(newProperty);
		try {
			// API call to create a new AbstractAssetProperty in the backend
			await createAbstractAssetPropertyQuery(newProperty.id, description, propertyName, propertyDataTypeURI, propertyUnitURI);
			newPropertyNode = await getNodeQuery(newProperty.id);
			// TODO: Add to AbstractAsset node
			const asset = this.getAbstractAssetNode(nodeId) as AbstractAsset;
			if (!asset) {
				throw new Error('AbstractAsset node not found');
			}
			if (!asset.assetProperties) {
				asset.assetProperties = [];
			}
			// Add the new property to the AbstractAsset node
			asset.assetProperties.push({ uri: newPropertyNode.id }); // (frontend)
			await addAbstractPropertyToNodeQuery(asset, newPropertyNode.uri) // (backend)
			console.log(this.assets)

		} catch (error) {
			this.toastState.add('Error creating AbstractAssetProperty node', error, 'error');
			// TODO: revert all changes...
		}
	}

	// Get an AbstractAsset node by id
	getAbstractAssetNode(id: string) {
		const assets = get(this.assets);
		return assets.find((asset) => asset.id === id);
	}

	// Update an AbstractAsset node by id
	updateAbstractAssetNode(id: string, updatedAsset: AbstractAsset) {
		const assets = get(this.assets);
		const assetId = assets.findIndex((asset) => asset.id === id);
		updatedAsset.id = id;
		this.assets.update((assets) => [
			...assets.slice(0, assetId),
			updatedAsset,
			...assets.slice(assetId + 1)
		]);
		this.toastState.add('Node updated', `AbstracAsset Node "${id}" updated`, 'info');
	}

	// Delete an AbstractAsset node by id
	deleteAbstractAssetNode(id: string) {
		const assets = get(this.assets);
		if (!assets.find((node) => node.id === id)) {
			this.toastState.add('Node not found', `Node "${id}" not found`, 'error');
			return;
		} else {
			this.assets.update((nodes) => [...nodes.filter((node) => node.id !== id)]);
			this.toastState.add('Node deleted', `AbstractAsset Node "${id}" has been deleted`, 'info');
		}
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
