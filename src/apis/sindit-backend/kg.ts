import type { ConnectionType } from '$lib/types';
import { getBackendUri } from '$lib/utils';

const API_BASE_URL = import.meta.env.VITE_SINDIT_BACKEND_API
const API_BASE_ENDPOINT = `${API_BASE_URL}/kg`


export async function getNodes() {
    const endpoint = 'nodes';
    const url = `${API_BASE_ENDPOINT}/${endpoint}`;
    console.log("getNodes", `${url}`)
    const response = await fetch(`${url}`);
    if (!response.ok) {
        throw new Error(`Error performing GET request ${url}`);
    }
    return response.json();
}

export async function getNode(
    nodeId: string, depth: number = 1
) {
    const endpoint = 'node';
    const uri = getBackendUri(nodeId);
    const url = `${API_BASE_ENDPOINT}/${endpoint}?node_uri=${encodeURIComponent(uri)}&depth=${depth}`;
    const response = await fetch(`${url}`);
    if (!response.ok) {
        throw new Error(`Error performing GET request ${url}`);
    }
    return response.json();
}


export async function createAbstractNode(
    nodeId: string, nodeName: string, description: string,
) {
    const endpoint = 'asset';
    const url = `${API_BASE_ENDPOINT}/${endpoint}`;
    const data = {
        uri: getBackendUri(nodeId),
        label: nodeName,
        assetDescription: description,
        assetProperties: []
    }
    console.log("create node:", data, url)
    const response = await fetch(`${url}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        throw new Error(`Error performing POST request ${response.statusText}`);
    }
    return response.json();
}

export async function addAbstractPropertyToNode(
    nodeId: string, propertyURI: string
) {
    const endpoint = 'asset';
    const url = `${API_BASE_ENDPOINT}/${endpoint}`;
    const asset = await getNode(nodeId);
    if (!asset) {
        throw new Error('Node not found');
    }
    if (!asset.assetProperties) {
        asset.assetProperties = [];
    }
    asset.assetProperties.push({ uri: getBackendUri(propertyURI) });
    console.log("asset", asset)
    const response = await fetch(`${url}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(asset)
    });
    if (!response.ok) {
        throw new Error(`Error performing POST request ${response.statusText}`);
    }
    return response.json();
}

export async function createAbstractPropertyNode(
    id: string, description: string,
    propertyName: string, propertyDataTypeURI: string, propertyUnitURI: string,
) {
    const data = {
        uri: getBackendUri(id),
        label: propertyName,
        propertyName,
        propertyDescription: description,
        propertyDataType: {
            uri: propertyDataTypeURI,
        },
        propertyUnit: {
            uri: propertyUnitURI,
        },
    }
    console.log("createAbstractPropertyNode", data)
    const response = await fetch(`${API_BASE_URL}/kg/asset_property`, {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json'
    },
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        throw new Error(`Error performing POST request ${response.statusText}`);
    }
    return response.json();
}

export async function createConnectionNode(
    id: string, connectionName: string, description: string,
    host: string, port: number,
    connectionType: ConnectionType,
) {
    const data = {
        uri: getBackendUri(id),
        label: connectionName,
        connectionDescription: description,
        host: host,
        port: port,
        type: connectionType
    }
    const response = await fetch(`${API_BASE_URL}/kg/connection`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        throw new Error('Error performing POST request');
    }
    return response.json();
}
