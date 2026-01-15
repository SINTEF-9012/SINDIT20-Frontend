import { env } from '$env/dynamic/public';
import type {
    Workspace, AllBackendNodeTypes, AssetNodeType, ConnectionNodeType, PropertyNodeType, KGNodeType
} from '$lib/types';
import { getNodesState } from '$lib/components/states/nodes-state.svelte';
import { getPropertiesState } from '$lib/components/states/properties.svelte';
import { getConnectionsState } from './components/states/connections.svelte';
import { getWorkspace } from '$apis/sindit-backend/workspace';
import {
    assetNodeTypes,
    connectionNodeTypes,
    propertyNodeTypes,
    kgNodeTypes,
    selectedWorkspace,
    isWorkspaceSelected,
    backendNodesData,
    isBackendRunning
} from '$lib/stores';
import {
    backendHealthCheck as backendHealthCheckQuery,
} from '$apis/sindit-backend/connection';
import { getNode as getNodeQuery } from '$apis/sindit-backend/kg';


const API_BASE_URI = env.PUBLIC_SINDIT_BACKEND_API_BASE_URI

// const connectionsState = getConnectionsState();

function checkAPIBaseUri(): void {
    if (API_BASE_URI === undefined) {
        throw new Error("API_BASE_URI is undefined. Add API_BASE_URI variable to '.env': API_BASE_URI=http://");
    }
}

export function getBackendUri(nodeId: string): string {
    // Get the backend URI for a node. The backend URI is the base URI + the node ID
    checkAPIBaseUri();
    return `${API_BASE_URI}${nodeId}`
}

export function getNodeIdFromBackendUri(uri: string): string {
    // Get the node ID from a backend URI. Backend URI is the base URI + the node ID
    checkAPIBaseUri();

    // Handle full ontology URIs (like http://sindit.sintef.no/2.0#humidity)
    if (uri.startsWith('http://') && !uri.startsWith(API_BASE_URI)) {
        // Remove the http:// protocol for ontology URIs
        return uri.replace('http://', '');
    }

    // Handle backend API URIs
    return uri.split(API_BASE_URI)[1] as string;
}

export function getNodeClassTypeFromBackendClassUri(class_uri: string): AllBackendNodeTypes {
    // Get the node class type from a backend class URI. The backend class comes after the # in the URI
    return class_uri.split('#')[1] as AllBackendNodeTypes;
}

export async function addNodesToStates(
    nodes: any,
    nodesState: ReturnType<typeof getNodesState>,
    propertiesState: ReturnType<typeof getPropertiesState>,
    connectionsState: ReturnType<typeof getConnectionsState>
) {
    // TODO: make this function more reliable

    // Log property nodes specifically
    const propertyNodes = nodes.filter((n: any) => {
        try {
            const class_type = getNodeClassTypeFromBackendClassUri(n.class_uri);
            return ['AbstractAssetProperty', 'StreamingProperty', 'TimeseriesProperty', 'S3ObjectProperty', 'PropertyCollection'].includes(class_type);
        } catch { return false; }
    });
    if (propertyNodes.length > 0) {
    }

    backendNodesData.set(nodes);

	// Recursively collect and fetch all referenced property URIs from assets and property collections
	const allNodeUris = new Set<string>(nodes.map((n: any) => n.uri));
	const nodesToProcess = [...nodes];
	const fetchedNodes: any[] = [];


	// Keep fetching until we have all referenced nodes
	let iteration = 0;
	while (nodesToProcess.length > 0 && iteration < 10) { // Safety limit of 10 iterations
		iteration++;

		const referencedPropertyUris = new Set<string>();

		// Collect property URIs from current batch
		nodesToProcess.forEach((node: any) => {
			try {
				const class_uri = node.class_uri;
				const class_type = getNodeClassTypeFromBackendClassUri(class_uri);

				// Collect property URIs from AbstractAsset nodes
				if (class_type === 'AbstractAsset' && node.assetProperties) {
					node.assetProperties.forEach((prop: any) => {
						if (prop.uri && !allNodeUris.has(prop.uri)) {
							referencedPropertyUris.add(prop.uri);
						}
					});
				}

				// Collect property URIs from PropertyCollection nodes
				if (class_type === 'PropertyCollection' && node.collectionProperties) {
					node.collectionProperties.forEach((prop: any) => {
						if (prop.uri && !allNodeUris.has(prop.uri)) {
							referencedPropertyUris.add(prop.uri);
						}
					});
				}
			} catch (error) {
				console.warn('[Property Fetcher] Error processing node:', error);
			}
		});


		// Clear the queue for next iteration
		nodesToProcess.length = 0;

		// Fetch missing property nodes
		for (const propUri of referencedPropertyUris) {
			try {
				const propId = getNodeIdFromBackendUri(propUri);
				const propNode = await getNodeQuery(propId, 1);
				if (propNode) {
					fetchedNodes.push(propNode);
					allNodeUris.add(propNode.uri);
					// Add to queue for processing in next iteration (might have more references)
					nodesToProcess.push(propNode);
				}
			} catch (error) {
				console.warn(`[Property Fetcher] Failed to fetch ${propUri}:`, error);
			}
		}
	}

	// Add all fetched property nodes to the main nodes array
	if (fetchedNodes.length > 0) {
		nodes = [...nodes, ...fetchedNodes];
		backendNodesData.set(nodes);
	}

    // Now process all nodes (original + fetched)
    nodes.forEach((node: any) => {
        const class_uri = node.class_uri;
        const uri = getNodeIdFromBackendUri(node.uri);
        const class_type = getNodeClassTypeFromBackendClassUri(class_uri);


		if (assetNodeTypes.includes(class_type as AssetNodeType)) {
			nodesState.addAbstractAssetNode(uri, node.label, node.assetDescription, node.assetProperties, node.assetType);
		} else if (connectionNodeTypes.includes(class_type as ConnectionNodeType)) {
            // Skip Connection nodes - we don't visualize them
            connectionsState.addConnectionNode(uri, node.label, node.connectionDescription, node.host, node.port, node.type, node.isConnected);
        } else if (propertyNodeTypes.includes(class_type as PropertyNodeType)) {

            // Handle visualizable property nodes
            const visualizablePropertyTypes = ['AbstractAssetProperty', 'StreamingProperty', 'TimeseriesProperty', 'S3ObjectProperty', 'PropertyCollection'];

			if (visualizablePropertyTypes.includes(class_type)) {
				// Ensure we always have a propertyName
				const propertyName = node.propertyName || node.label || uri.split('/').pop() || 'Unknown Property';

                // Create a generic property object that works for all visualizable types
                const propertyNode: any = {
                    id: uri,
                    nodeType: class_type,
                    propertyName: propertyName,
                    description: node.propertyDescription || node.description || '',
                    propertyDataType: node.propertyDataType,
                    propertyUnit: node.propertyUnit,
                    propertyValue: node.propertyValue,
                    propertyValueTimestamp: node.propertyValueTimestamp,
                    propertyConnection: node.propertyConnection
                };

                // Add type-specific fields
                if (class_type === 'StreamingProperty') {
                    propertyNode.streamingTopic = node.streamingTopic;
                    propertyNode.streamingPath = node.streamingPath;
                } else if (class_type === 'TimeseriesProperty') {
                    propertyNode.query = node.query;
                    propertyNode.timeseriesIdentifiers = node.timeseriesIdentifiers;
                    propertyNode.timeseriesRetrievalMethod = node.timeseriesRetrievalMethod;
                    propertyNode.timeseriesTags = node.timeseriesTags;
                } else if (class_type === 'S3ObjectProperty') {
                    propertyNode.bucket = node.bucket;
                    propertyNode.key = node.key;
                } else if (class_type === 'PropertyCollection') {
                    propertyNode.collectionProperties = node.collectionProperties;
                } else if (class_type === 'AbstractAssetProperty') {
                    // AbstractAssetProperty has direct propertyValue (not connection-based)
                    propertyNode.propertyValue = node.propertyValue || '';
                }

                // Add as visualizable node
                try {
                    nodesState.addVisualizableNode(propertyNode);
                    // Verify it was actually added with propertyName
                    const addedNode = nodesState.getNodeById(propertyNode.id);
                    if (addedNode) {
                    }
                } catch (error) {
                    console.error('  -> ERROR adding to visualizable nodes:', error);
                }
            } else {
            }

            // Also add to properties state for compatibility
            propertiesState.addPropertyNode(class_type as PropertyNodeType, node);
        } else if (class_type === 'SINDITKG') {
            nodesState.addSINDITKGNode(uri, node.label, node.uri, node.assets);
        } else {
            console.warn(`Unknown node type ${class_type}`);
        }
    });
}

export function getWorkspaceDictFromUri(workspaceUri: string | any): Workspace {
    // Handle case where workspaceUri might be an object instead of a string
    const uriString = typeof workspaceUri === 'string' ? workspaceUri : (workspaceUri?.uri || String(workspaceUri));

    let workspaceName = uriString.split('#')[1] as string
    if (workspaceName === '' || workspaceName === undefined) {
        workspaceName = uriString;
    }
    return {
        name: workspaceName,
        uri: uriString,
    };
}

export async function getCurrentWorkspace(): Promise<Workspace> {
    const response = await getWorkspace();

    // Check if response is already a Workspace object with name/uri
    if (response && typeof response === 'object' && 'name' in response && 'uri' in response) {
        const workspace = response as Workspace;
        selectedWorkspace.set(workspace.name);
        isWorkspaceSelected.set(true);
        return workspace;
    }

    // Otherwise handle legacy format with workspace_uri
    if (!response.workspace_uri) {
        selectedWorkspace.set('');
        isWorkspaceSelected.set(false);
        return { name: '', uri: '' };
    } else {
        const workspaceDict = getWorkspaceDictFromUri(response.workspace_uri);
        selectedWorkspace.set(workspaceDict.name);
        isWorkspaceSelected.set(true);
        return workspaceDict;
    }
}


export async function updateBackendNodesData(node2update: any) {
    backendNodesData.update((nodes) => {
        const updatedNodes = nodes.map((node) => {
            if (node.uri === node2update.uri) {
                return node2update;
            } else {
                return node;
            }
        });
        return updatedNodes;
    });
}

export function checkBackendRunningStatus() {
    try {
        backendHealthCheckQuery().then((isRunning) => {
            isBackendRunning.set(isRunning);
        });
    } catch (error) {
        console.error("Error checking backend running status:", error);
        console.error("Setting isBackendRunning=false");
        isBackendRunning.set(false);
    }
}
