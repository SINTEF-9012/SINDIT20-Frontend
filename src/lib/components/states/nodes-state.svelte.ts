import type {
	AbstractAsset,
	StreamingProperty,
	SINDITKG,
	VisualizableNode,
	NodeUri,
} from '$lib/types';
import { getContext, setContext } from 'svelte';
import { getToastState } from '$lib/components/states/toast-state.svelte';
import { writable, get } from 'svelte/store';
import { getNodeIdFromBackendUri as utilsGetNodeIdFromBackendUri } from '$lib/utils';
import {
	createAbstractNode as createAbstractNodeQuery,
} from '$apis/sindit-backend/kg';



export class Nodes {
	// Store for all visualizable nodes (excludes Connection)
	visualizableNodes = writable<VisualizableNode[]>([]);
	// Keep backward compatibility
	assets = writable<AbstractAsset[]>([]);

	private toastState: ReturnType<typeof getToastState>;

	constructor() {
		this.toastState = getToastState();
	}

    destroy() {
        this.deleteAllNodes();
    }

	// Generate random position for new nodes - using wider range for better initial spread
	private generateRandomPosition(): { x: number; y: number } {
		return { x: Math.random() * 800 + 100, y: Math.random() * 600 + 100 };
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
			position = this.generateRandomPosition();
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

	private streamingPropertyNodeObject(
		id: string,
		propertyName: string,
		description: string,
		streamingTopic: string,
		streamingPath: string,
		propertyConnection: NodeUri,
		propertyDataType?: NodeUri,
		propertyUnit?: NodeUri,
		propertyValue?: string,
		propertyValueTimestamp?: string,
		position?: { x: number; y: number }
	): StreamingProperty {
		if (!position) {
			position = this.generateRandomPosition();
		}
		return {
			id,
			nodeType: 'StreamingProperty',
			propertyName,
			description,
			streamingTopic,
			streamingPath,
			propertyConnection,
			propertyDataType,
			propertyUnit,
			propertyValue,
			propertyValueTimestamp,
			position,
		};
	}

	private sinditKGNodeObject(
		id: string,
		label: string,
		uri: string,
		assets?: NodeUri[],
		position?: { x: number; y: number }
	): SINDITKG {
		if (!position) {
			position = this.generateRandomPosition();
		}
		return {
			id,
			uri,
			label,
			assets,
			nodeType: 'SINDITKG',
			position,
		};
	}

	// Get all visualizable nodes
	getAllVisualizableNodes(): VisualizableNode[] {
		return get(this.visualizableNodes);
	}

	// Keep backward compatibility
	getAllAbstractAssetNodes(): AbstractAsset[] {
		const allNodes = get(this.visualizableNodes);
		return allNodes.filter(node => node.nodeType === 'AbstractAsset') as AbstractAsset[];
	}

	// Add a visualizable node
	addVisualizableNode(node: VisualizableNode) {
		// Ensure the node has a valid position
		if (!node.position ||
			node.position.x === undefined ||
			node.position.y === undefined ||
			isNaN(node.position.x) ||
			isNaN(node.position.y)) {
			node.position = this.generateRandomPosition();
			console.log(`Setting initial position for new node: ${node.id} (${node.nodeType})`);
		}

		this.visualizableNodes.update(nodes => [...nodes, node]);

		// Keep assets in sync for backward compatibility
		if (node.nodeType === 'AbstractAsset') {
			this.assets.update(assets => [...assets, node as AbstractAsset]);
		}
	}

	// Get a node by id
	getNodeById(id: string): VisualizableNode | undefined {
		const nodes = get(this.visualizableNodes);
		return nodes.find(node => node.id === id);
	}

	// Get AbstractAsset node by id (backward compatibility)
	getAbstractAssetNode(id: string): AbstractAsset | undefined {
		const node = this.getNodeById(id);
		return node && node.nodeType === 'AbstractAsset' ? node as AbstractAsset : undefined;
	}

	// Update a node by id
	updateNode(id: string, updatedNode: VisualizableNode) {
		this.visualizableNodes.update(nodes => {
			const index = nodes.findIndex(node => node.id === id);
			if (index !== -1) {
				updatedNode.id = id;
				nodes[index] = updatedNode;
			}
			return [...nodes];
		});

		// Keep assets in sync for backward compatibility
		if (updatedNode.nodeType === 'AbstractAsset') {
			this.assets.update(assets => {
				const index = assets.findIndex(asset => asset.id === id);
				if (index !== -1) {
					assets[index] = updatedNode as AbstractAsset;
				}
				return [...assets];
			});
		}
	}

	// Update a node's position (used by D3 force layout)
	updateNodePosition(id: string, position: { x: number; y: number; fx?: number | null; fy?: number | null }) {
		const node = this.getNodeById(id);
		if (node) {
			this.visualizableNodes.update(nodes => {
				const index = nodes.findIndex(n => n.id === id);
				if (index !== -1) {
					nodes[index] = {
						...nodes[index],
						position: { x: position.x, y: position.y },
						// If fx/fy are provided, store them as well to remember pinned state
						fx: position.fx !== undefined ? position.fx : nodes[index].fx,
						fy: position.fy !== undefined ? position.fy : nodes[index].fy
					};
				}
				return [...nodes];
			});
		}
	}

	// Delete a node by id
	deleteNode(id: string) {
		const nodes = get(this.visualizableNodes);
		const nodeToDelete = nodes.find(node => node.id === id);

		if (!nodeToDelete) {
			this.toastState.add('Node not found', `Node "${id}" not found`, 'error');
			return;
		}

		this.visualizableNodes.update(nodes => nodes.filter(node => node.id !== id));

		// Keep assets in sync for backward compatibility
		if (nodeToDelete.nodeType === 'AbstractAsset') {
			this.assets.update(assets => assets.filter(asset => asset.id !== id));
		}

		this.toastState.add('Node deleted', `${nodeToDelete.nodeType} Node "${id}" has been deleted`, 'info');
	}

	deleteAllAbstractAssets() {
		this.assets.set([]);
		// Also remove from visualizable nodes
		this.visualizableNodes.update(nodes => nodes.filter(node => node.nodeType !== 'AbstractAsset'));
	}

	deleteAllNodes() {
		this.visualizableNodes.set([]);
		this.assets.set([]);
	}

	// Add nodes from backend data
	addStreamingPropertyNode(
		id: string,
		propertyName: string,
		description: string,
		streamingTopic: string,
		streamingPath: string,
		propertyConnection: NodeUri,
		propertyDataType?: NodeUri,
		propertyUnit?: NodeUri,
		propertyValue?: string,
		propertyValueTimestamp?: string
	): StreamingProperty {
		const newNode = this.streamingPropertyNodeObject(
			id, propertyName, description, streamingTopic, streamingPath,
			propertyConnection, propertyDataType, propertyUnit, propertyValue, propertyValueTimestamp
		);
		this.addVisualizableNode(newNode);
		return newNode;
	}

	addSINDITKGNode(
		id: string,
		label: string,
		uri: string,
		assets?: NodeUri[]
	): SINDITKG {
		const newNode = this.sinditKGNodeObject(id, label, uri, assets);
		this.addVisualizableNode(newNode);
		return newNode;
	}

	// Add a new asset node to the state (backward compatibility)
	addAsset<T extends AbstractAsset>(
		asset: T
	) {
		this.addVisualizableNode(asset);
	}

	// Add a new AbstractAsset node (backward compatibility)
	addAbstractAssetNode(
		id: string,
		nodeName: string,
		description: string,
		assetProperties: NodeUri[],
	): AbstractAsset {
		const newAsset = this.abstractAssetNodeObject(nodeName, description, assetProperties, undefined, id);
		this.addVisualizableNode(newAsset);
		return newAsset;
	}

	// Add a property to an AbstractAsset node (backward compatibility)
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
		this.addVisualizableNode(newNode);
		try {
			// API call to create a new AbstractNode in the backend
			await createAbstractNodeQuery(newNode.id, newNode.nodeName, newNode.description);
		} catch (error) {
			this.toastState.add('Error creating AbstractAsset node', error as string, 'error');
			this.deleteAbstractAssetNode(newNode.id);
		}
	}

	// Update an AbstractAsset node by id (backward compatibility)
	updateAbstractAssetNode(id: string, updatedAsset: AbstractAsset) {
		this.updateNode(id, updatedAsset);
		this.toastState.add('Node updated', `AbstractAsset Node "${id}" updated`, 'info');
	}

	// Delete an AbstractAsset node by id (backward compatibility)
	deleteAbstractAssetNode(id: string) {
		this.deleteNode(id);
	}

	// Generate implicit links between nodes based on their relationships
	generateImplicitLinks(): Array<{
		id: string;
		sourceNodeId: string;
		targetNodeId: string;
		linkDescription: string;
		linkWeight: number;
		linkDirection: 'left' | 'right' | 'none';
	}> {
		const links: Array<{
			id: string;
			sourceNodeId: string;
			targetNodeId: string;
			linkDescription: string;
			linkWeight: number;
			linkDirection: 'left' | 'right' | 'none';
		}> = [];

		const allNodes = get(this.visualizableNodes);

		// Create links between AbstractAssets and their properties
		allNodes.forEach(node => {
			if (node.nodeType === 'AbstractAsset' && node.assetProperties) {
				node.assetProperties.forEach(propertyRef => {
					// Find the corresponding property node (support all property types)
					const propertyId = utilsGetNodeIdFromBackendUri(propertyRef.uri);
					const propertyNode = allNodes.find(n =>
						(n.nodeType === 'StreamingProperty' ||
						 n.nodeType === 'S3ObjectProperty' ||
						 n.nodeType === 'PropertyCollection') &&
						n.id === propertyId
					);

					if (propertyNode) {
						links.push({
							id: `asset-property-${node.id}-${propertyNode.id}`,
							sourceNodeId: node.id,
							targetNodeId: propertyNode.id,
							linkDescription: 'has property',
							linkWeight: 2,
							linkDirection: 'right'
						});
					} else {
						console.log(`Property node not found for ID ${propertyId} from URI ${propertyRef.uri}`);
					}
				});
			}

			// Create links between SINDITKG and its assets
			if (node.nodeType === 'SINDITKG' && node.assets) {
				node.assets.forEach(assetRef => {
					// Find the corresponding asset node
					const assetId = utilsGetNodeIdFromBackendUri(assetRef.uri);
					const assetNode = allNodes.find(n =>
						n.nodeType === 'AbstractAsset' &&
						n.id === assetId
					);

					if (assetNode) {
						links.push({
							id: `kg-asset-${node.id}-${assetNode.id}`,
							sourceNodeId: node.id,
							targetNodeId: assetNode.id,
							linkDescription: 'contains asset',
							linkWeight: 3,
							linkDirection: 'right'
						});
					} else {
						console.log(`Asset node not found for ID ${assetId} from URI ${assetRef.uri}`);
					}
				});
			}
		});

		return links;
	}

	// Initialize node positions for D3 force layout
	public ensureNodePositions() {
		const nodes = get(this.visualizableNodes);
		let hasChanges = false;

		// Only set initial positions for nodes that don't have one
		nodes.forEach(node => {
			if (!node.position ||
			    node.position.x === undefined ||
			    node.position.y === undefined ||
			    isNaN(node.position.x) ||
			    isNaN(node.position.y)) {
				// Initialize with random positions - D3 force simulation will handle the layout
				node.position = this.generateRandomPosition();
				hasChanges = true;
				console.log(`Initialized missing position for node: ${node.id} (${node.nodeType})`);
			}

			// Restore pinned state if fx/fy are set
			if (node.fx !== undefined && node.fx !== null && node.fy !== undefined && node.fy !== null) {
				// Ensure position matches fixed position for consistency
				node.position = { x: node.fx, y: node.fy };
				hasChanges = true;
				console.log(`Restored pinned state for node: ${node.id}`);
			}
		});

		if (hasChanges) {
			this.visualizableNodes.set([...nodes]); // Create new array to ensure reactivity
		}

		return nodes; // Return the nodes for convenience
	}

	// Diagnostic method to check node positions
	public logNodePositions() {
		const nodes = get(this.visualizableNodes);
		console.log(`=== Node Position Diagnostic (${nodes.length} nodes) ===`);

		nodes.forEach(node => {
			console.log(`Node: ${node.id} (${node.nodeType})`, {
				position: node.position,
				hasPosition: !!node.position,
				x: node.position?.x,
				y: node.position?.y,
				validX: node.position?.x !== undefined && !isNaN(node.position?.x),
				validY: node.position?.y !== undefined && !isNaN(node.position?.y)
			});
		});

		console.log('=== End Diagnostic ===');
	}

	// Placeholder for force re-layout - This will be handled by D3 in the component
	forceReLayout() {
		// Empty implementation - D3 will handle layout
		console.log('Layout will be handled by D3 force simulation');
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
