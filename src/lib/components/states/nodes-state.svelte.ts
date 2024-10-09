import type {
	AbstractAsset,
	NodeUri,
} from '$lib/types';
import { getContext, setContext } from 'svelte';
import { getToastState } from '$lib/components/states/toast-state.svelte';
import { writable, get } from 'svelte/store';
import {
	createAbstractNode as createAbstractNodeQuery,
} from '$apis/sindit-backend/kg';



export class Nodes {
	assets = writable<AbstractAsset[]>([]); // AbstractAssetNodes

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

	getAllAbstractAssetNodes() {
		return this.assets;
	}

	deleteAllAbstractAssets() {
		this.assets.set([]);
	}

	deleteAllNodes() {
		this.deleteAllAbstractAssets();
	}

	// Add a new asset node to the state
	addAsset<T extends AbstractAsset>(
		asset: T
	) {
		this.assets.update((assets) => [...assets, asset]);
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

	// Add a property to an AbstractAsset node
	async addPropertyToAbstractAssetNode(id: string, property_uri: string) {
		const asset = this.getAbstractAssetNode(id);
		if (!asset) {
			this.toastState.add('Node not found', `Node "${id}" not found`, 'error');
			return;
		}
		if (!asset.assetProperties) {
			asset.assetProperties = [{uri: property_uri}];
		} else {
			asset.assetProperties.push({uri: property_uri});
		}
		this.updateAbstractAssetNode(id, asset);
		console.log("asset node updated:", asset)
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
