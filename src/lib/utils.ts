
import type { NodeType } from '$lib/types';
import { backendNodesData } from '$lib/stores';
import { getNodesState } from '$lib/components/states/nodes-state.svelte';
import { getConnectionsState } from './components/states/connections.svelte';

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

export function getNodeClassTypeFromBackendClassUri(class_uri: string): NodeType {
    // Get the node class type from a backend class URI. The backend class comes after the # in the URI
    return class_uri.split('#')[1] as NodeType;
}

export function addNodesToStates(
    nodes: any,
    nodesState: ReturnType<typeof getNodesState>,
    connectionsState: ReturnType<typeof getConnectionsState>
) {
    // TODO: make this function more reliable
    backendNodesData.set(nodes);
    nodes.forEach(node => {
        const class_uri = node.class_uri;
        const uri = getNodeIdFromBackendUri(node.uri);
        const class_type = getNodeClassTypeFromBackendClassUri(class_uri);
        if (class_type === 'AbstractAsset') {
            nodesState.addAbstractAssetNode(uri, node.label, node.assetDescription, node.assetProperties);
        } else if (class_type === 'Connection') {
            console.log(node);
            // nodesState.addConnectionNode(uri, node.label, node.connectionDescription, node.host, node.port, node.connectionType);
        } else if (class_type === 'AbstractAssetProperty') {
            nodesState.addAbstractAssetPropertyNode(uri, node.label, node.propertyDescription, node.propertyDataType.uri, node.propertyUnit.uri);
        } else {
            throw new Error(`Unknown node type ${class_type}`);
        }
    });
}
