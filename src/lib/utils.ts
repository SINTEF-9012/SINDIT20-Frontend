
import type {
    Workspace, AllBackendNodeTypes, AssetNodeType, ConnectionNodeType, PropertyNodeType
} from '$lib/types';
import { getNodesState } from '$lib/components/states/nodes-state.svelte';
import { getPropertiesState } from '$lib/components/states/properties.svelte';
import { getConnectionsState } from './components/states/connections.svelte';
import { getWorkspace } from '$apis/sindit-backend/workspace';
import {
    assetNodeTypes,
    connectionNodeTypes,
    propertyNodeTypes,
    selectedWorkspace,
    isWorkspaceSelected,
    backendNodesData
} from '$lib/stores';


const API_BASE_URI = import.meta.env.VITE_SINDIT_BACKEND_API_BASE_URI

// const connectionsState = getConnectionsState();


export function getBackendUri(nodeId: string): string {
    // Get the backend URI for a node. The backend URI is the base URI + the node ID
    return `${API_BASE_URI}${nodeId}`
}

export function getNodeIdFromBackendUri(uri: string): string {
    // Get the node ID from a backend URI. Backend URI is the base URI + the node ID
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
    backendNodesData.set(nodes);
    nodes.forEach(node => {
        const class_uri = node.class_uri;
        const uri = getNodeIdFromBackendUri(node.uri);
        const class_type = getNodeClassTypeFromBackendClassUri(class_uri);
        if (assetNodeTypes.includes(class_type as AssetNodeType)) {
            nodesState.addAbstractAssetNode(uri, node.label, node.assetDescription, node.assetProperties);
        } else if (connectionNodeTypes.includes(class_type as ConnectionNodeType)) {
            connectionsState.addConnectionNode(uri, node.label, node.connectionDescription, node.host, node.port, node.connectionType);
        } else if (propertyNodeTypes.includes(class_type as PropertyNodeType)) {
            propertiesState.addPropertyNode(class_type as PropertyNodeType, node)
        } else {
            throw new Error(`Unknown node type ${class_type}`);
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
        //console.log("Updated nodes:", updatedNodes);
        return updatedNodes;
    });
}
