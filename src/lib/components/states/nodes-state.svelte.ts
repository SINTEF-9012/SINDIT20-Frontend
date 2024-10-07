import type {
	AbstractAsset,
	AbstractAssetProperty,
	NodeUri,
} from '$lib/types';
import { getContext, setContext } from 'svelte';
import { getToastState } from '$lib/components/states/toast-state.svelte';
import { writable, get } from 'svelte/store';
import {
	createAbstractNode as createAbstractNodeQuery,
	addAbstractPropertyToNode as addAbstractPropertyToNodeQuery,
	createAbstractPropertyNode as createAbstractAssetPropertyQuery,
} from '$apis/sindit-backend/kg';
import {
	getBackendUri,
	getNodeIdFromBackendUri
} from '$lib/utils';


// TODO: Split class into AbstractAssets, AbstractAssetProperties, and Connections?
export class Nodes {
	assets = writable<AbstractAsset[]>([]); // AbstractAssetNodes
	assetProperties = writable<AbstractAssetProperty[]>([]); // AbstractAssetPropertyNodes

	private toastState: ReturnType<typeof getToastState>;

	constructor() {
		this.toastState = getToastState();
	}

	private abstractAssetNodeObject(
		nodeName: string,
		description: string,
		assetProperties: NodeUri[] = [],
		position?: { x: number; y: number },
		id?: string
	): AbstractAsset {
		if (!id) {
			id = crypto.randomUUID();
		}
		if (!position) {
			position = {x: Math.random()*100, y: Math.random()*100}
		}
		return {
			id,
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
		id?: string
	): AbstractAssetProperty {
		if (!id) {
			id = crypto.randomUUID();
		}
		return {
			id,
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

	getAllAbstractAssetNodes() {
		return this.assets;
	}

	getAllAbstractAssetPropertyNodes() {
		return this.assetProperties;
	}

	deleteAllAbstractAssets() {
		this.assets.set([]);
	}

	deleteAllAbstractProperties() {
		this.assetProperties.set([]);
	}

	deleteAllNodes() {
		this.deleteAllAbstractAssets();
		this.deleteAllAbstractProperties();
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

	// Add a new AbstractAsset node
	addAbstractAssetNode(
		id: string,
		nodeName: string,
		description: string,
		assetProperties: NodeUri[],
	) {
		const newAsset = this.abstractAssetNodeObject(nodeName, description, assetProperties, undefined, id);
		this.addAsset(newAsset);
	}

	// Add a new AbstractAssetProperty node
	addAbstractAssetPropertyNode(
		id: string,
		propertyName: string,
		description: string,
		propertyDataTypeURI: string,
		propertyUnitURI: string
	) {
		const newProperty = this.abstractAssetPropertyNodeObject(propertyName, description, propertyDataTypeURI, propertyUnitURI, id);
		this.addAssetProperty(newProperty);
	}

	// Create a new AbstractAsset node (frontend and backend)
	async createAbstractAssetNode(
		nodeName: string,
		description: string,
		position: { x: number; y: number },
	) {
		// assume assetProperties is empty
		// do not send in id, as this will then be generated
		const newNode = this.abstractAssetNodeObject(nodeName, description, [], position);
		this.addAsset(newNode);
		try {
			// API call to create a new AbstractNode in the backend
			await createAbstractNodeQuery(newNode.id, newNode.nodeName, newNode.description);
		} catch (error) {
			this.toastState.add('Error creating AbstractAsset node', error as string, 'error');
			this.deleteAbstractAssetNode(newNode.id);
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
		// let newPropertyNode;
		const newProperty = this.abstractAssetPropertyNodeObject(propertyName, description, propertyDataTypeURI, propertyUnitURI);
		this.addAssetProperty(newProperty);
		try {
			// API call to create a new AbstractAssetProperty in the backend
			await createAbstractAssetPropertyQuery(newProperty.id, description, propertyName, propertyDataTypeURI, propertyUnitURI);
			// TODO: Add property to AbstractAsset node
			const asset = this.getAbstractAssetNode(nodeId) as AbstractAsset;
			if (!asset) {
				throw new Error('AbstractAsset node not found');
			}
			if (!asset.assetProperties) {
				asset.assetProperties = [];
			}
			// Add the new property to the AbstractAsset node
			asset.assetProperties.push({ uri: getBackendUri(newProperty.id) }); // (frontend)
			await addAbstractPropertyToNodeQuery(nodeId, newProperty.id) // (backend)
			console.log("node with new property:", this.getAbstractAssetNode(nodeId));

		} catch (error) {
			console.log("Error creating AbstractAssetProperty node", error);
			this.toastState.add('Error creating AbstractAssetProperty node', error as string, 'error');
			// TODO: revert all changes...
		}
	}

	// Get an AbstractAssetProperty node by id
	getAbstractAssetNodeProperties(ids: NodeUri[]) {
		const properties = get(this.assetProperties);
		// console.log("properties 1", properties);
		const uris = ids.map((id) => getNodeIdFromBackendUri(id.uri));
		// console.log("uris 2", uris);
		const fp = properties.filter((property) => uris.includes(property.id));
		// console.log("fp 3", fp);
		return fp;
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
const KEY = Symbol('NODES');

export function setNodesState() {
	const nodeState = new Nodes();
	setContext(KEY, nodeState);
	return nodeState;
}

export function getNodesState() {
	return getContext<ReturnType<typeof setNodesState>>(KEY);
}
