
import type { NodeType } from '$lib/types';

const API_BASE_URI = import.meta.env.VITE_SINDIT_BACKEND_API_BASE_URI

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
