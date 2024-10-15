import type { ConnectionType } from '$lib/types';
import { getBackendUri } from '$lib/utils';

const API_BASE_URL = import.meta.env.VITE_SINDIT_BACKEND_API
const API_BASE_ENDPOINT = `${API_BASE_URL}/kg`


export async function getNodes() {
    const endpoint = 'nodes';
    const url = `${API_BASE_ENDPOINT}/${endpoint}`;
    console.log("getNodes GET:", url)
    const response = await fetch(url);
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
    console.log("getNode GET:", url)
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Error performing GET request ${url}`);
    }
    return response.json();
}

export async function updateNode(node: any, overwrite: boolean = false) {
    const endpoint = 'node';
    let doOverwrite = 'false';
    if (overwrite) {
        doOverwrite = 'true';
    } else {
        doOverwrite = 'false';
    }
    const url = `${API_BASE_ENDPOINT}/${endpoint}?overwrite=${doOverwrite}`;
    console.log("updateNode POST:", url)
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(node)
    });
    if (!response.ok) {
        throw new Error(`Error performing POST request ${response.statusText}`);
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
    console.log("createAbstractNode POST:", url, data)
    const response = await fetch(url, {
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

export async function addPropertyToAssetNode(
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
    console.log("addPropertyToAssetNode POST:", url, asset)
    const response = await fetch(url, {
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
    const endpoint = 'asset_property';
    const url = `${API_BASE_ENDPOINT}/${endpoint}`;
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
    console.log("createAbstractPropertyNode POST:", url, data)
    const response = await fetch(url, {
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

export async function createStreamingPropertyNode(
    id: string, description: string,
    propertyName: string, propertyDataTypeURI: string, propertyUnitURI: string,
    streamingTopic: string, streamingPath: string, connectionId: string,
) {
    const endpoint = 'streaming_property';
    const url = `${API_BASE_ENDPOINT}/${endpoint}`;
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
        propertyConnection: {
            uri: getBackendUri(connectionId),
        },
        streamingTopic,
        streamingPath,
    }
    console.log("createStreamingPropertyNode POST:", url, data)
    const response = await fetch(url, {
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
    const endpoint = 'connection';
    const url = `${API_BASE_ENDPOINT}/${endpoint}`;
    const data = {
        uri: getBackendUri(id),
        label: connectionName,
        connectionDescription: description,
        host: host,
        port: port,
        type: connectionType
    }
    console.log("createConnectionNode POST:", url, data)
    const response = await fetch(url, {
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


export async function streamData(
    id: string,
    handleChunk: (chunk: string) => void,
) {
    const endpoint = 'stream';
    const uri = getBackendUri(id);
    const url = `${API_BASE_ENDPOINT}/${endpoint}?node_uri=${encodeURIComponent(uri)}`;
    console.log("streamData GET:", url)
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    let done = false;
    while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        const chunk = decoder.decode(value, { stream: true });

        // Handle the incoming chunk of data here
        handleChunk(chunk);
    }
}
