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

export function addNodesToStates(
    nodes: any,
    nodesState: ReturnType<typeof getNodesState>,
    propertiesState: ReturnType<typeof getPropertiesState>,
    connectionsState: ReturnType<typeof getConnectionsState>
) {
    // TODO: make this function more reliable
    console.log('addNodesToStates called with nodes:', nodes);
    backendNodesData.set(nodes);
    nodes.forEach((node: any) => {
        const class_uri = node.class_uri;
        const uri = getNodeIdFromBackendUri(node.uri);
        const class_type = getNodeClassTypeFromBackendClassUri(class_uri);

        console.log(`Processing node: ${node.label} (${class_type}) with ID: ${uri}`);

        if (assetNodeTypes.includes(class_type as AssetNodeType)) {
            console.log(`Adding AbstractAsset node: ${uri}`);
            nodesState.addAbstractAssetNode(uri, node.label, node.assetDescription, node.assetProperties);
        } else if (connectionNodeTypes.includes(class_type as ConnectionNodeType)) {
            // Skip Connection nodes - we don't visualize them
            console.log(`Adding Connection node: ${uri} (not visualized)`);
            connectionsState.addConnectionNode(uri, node.label, node.connectionDescription, node.host, node.port, node.type, node.isConnected);
        } else if (propertyNodeTypes.includes(class_type as PropertyNodeType)) {
            // Handle StreamingProperty as a visualizable node
            if (class_type === 'StreamingProperty') {
                console.log(`Adding StreamingProperty node: ${uri}`);
                nodesState.addStreamingPropertyNode(
                    uri,
                    node.propertyName || node.label,
                    node.propertyDescription || node.description || '',
                    node.streamingTopic,
                    node.streamingPath,
                    node.propertyConnection,
                    node.propertyDataType,
                    node.propertyUnit,
                    node.propertyValue,
                    node.propertyValueTimestamp
                );
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

export function getWorkspaceDictFromUri(workspaceUri: string): Workspace {
    let workspaceName = workspaceUri.split('#')[1] as string
    if (workspaceName === '' || workspaceName === undefined) {
        workspaceName = workspaceUri;
    }
    return {
        name: workspaceName,
        uri: workspaceUri,
    };
}

export async function getCurrentWorkspace(): Promise<Workspace> {
    const workspace = await getWorkspace();
    if (!workspace.workspace_uri) {
        selectedWorkspace.set('');
        isWorkspaceSelected.set(false);
    } else {
        const workspaceDict = getWorkspaceDictFromUri(workspace.workspace_uri);
        selectedWorkspace.set(workspaceDict.name);
        isWorkspaceSelected.set(true);
    }
    return getWorkspaceDictFromUri(workspace.workspace_uri);
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
