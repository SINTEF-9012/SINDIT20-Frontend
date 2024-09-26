import type { ConnectionType, AbstractAsset } from '$lib/types';

const KG_BASE_URI = import.meta.env.VITE_SINDIT_KG_BASE_URI
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
    node_uri: string, depth: number = 1
) {
    const endpoint = 'node';
    const uri = `${KG_BASE_URI}${node_uri}`;
    const url = `${API_BASE_ENDPOINT}/${endpoint}?node_uri=${uri}&depth=${depth}`;
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
        uri: `${KG_BASE_URI}${nodeId}`,
        label: nodeName,
        assetDescription: description
    }
    const response = await fetch(`${url}`, {
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

export async function addAbstractPropertyToNode(
    assetNode: AbstractAsset, propertyURI: string
) {
    const endpoint = 'asset';
    const url = `${API_BASE_ENDPOINT}/${endpoint}`;
    const assetProperties = assetNode.assetProperties || [];
    const data = {
        uri: `${KG_BASE_URI}${assetNode.id}`,
        label: assetNode.nodeName,
        assetDescription: assetNode.description,
        assetProperties: [
            ...assetProperties,
            {
                uri: propertyURI
            }
        ]

    }
    const response = await fetch(`${url}`, {
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

export async function createAbstractPropertyNode(
    id: string, description: string,
    propertyName: string, propertyDataTypeURI: string, propertyUnitURI: string,
) {
    const data = {
        uri: `${KG_BASE_URI}${id}`,
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
    const response = await fetch(`${API_BASE_URL}/kg/asset_property`, {
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

export async function createConnectionNode(
    nodeId: string, nodeName: string, description: string,
    host: string, port: number,
    connectionType: ConnectionType,
) {
    const data = {
        uri: `${KG_BASE_URI}${nodeId}`,
        label: nodeName,
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
