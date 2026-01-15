import { env } from '$env/dynamic/public';
import type { ConnectionType, AbstractAssetProperty, StreamingProperty, S3Property } from '$lib/types';
import { getBackendUri } from '$lib/utils';
import { authenticatedFetch } from '$lib/api-client';
import { fetchAllPages } from '$lib/pagination';

const API_BASE_URL = '/api/proxy';
const API_BASE_ENDPOINT = `${API_BASE_URL}?endpoint=kg`

export async function getNodes(depth: number = 1, skip: number = 0, limit: number = 10) {
    const endpoint = 'nodes';
    const url = `${API_BASE_ENDPOINT}/${endpoint}?depth=${depth}&skip=${skip}&limit=${limit}`;
    console.log("getNodes GET:", url)
    const response = await authenticatedFetch(url);
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
    const response = await authenticatedFetch(url);
    if (!response.ok) {
        throw new Error(`Error performing GET request ${url}`);
    }
    return response.json();
}

export async function updateNode(node: any, overwrite: boolean = true) {
    const endpoint = 'node';
    let doOverwrite = 'false';
    if (overwrite) {
        doOverwrite = 'true';
    } else {
        doOverwrite = 'false';
    }
    const url = `${API_BASE_ENDPOINT}/${endpoint}?overwrite=${doOverwrite}`;
    node.id = getBackendUri(node.id);
    console.log("updateNode POST:", url, node)
    const response = await authenticatedFetch(url, {
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

export async function deleteNode(nodeId: string): Promise<Response> {
    const endpoint = 'node';
    const uri = getBackendUri(nodeId);
    const url = `${API_BASE_ENDPOINT}/${endpoint}?node_uri=${encodeURIComponent(uri)}`;
    console.log("deleteNode DELETE:", url)
    const response = await authenticatedFetch(url, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    if (!response.ok) {
        throw new Error(`Error performing DELETE request ${response.statusText}`);
    }
    return response;
}

export async function getNodesByClass(nodeClass: string, depth: number = 1, skip: number = 0, limit: number = 10) {
    const endpoint = 'nodes_by_type';
    const url = `${API_BASE_ENDPOINT}/${endpoint}?type_uri=${encodeURIComponent(nodeClass)}&depth=${depth}&skip=${skip}&limit=${limit}`;
    console.log("getNodesByClass GET:", url)
    const response = await authenticatedFetch(url);
    if (!response.ok) {
        throw new Error(`Error performing GET request ${url}`);
    }
    return response.json();
}

/**
 * Fetch ALL nodes from the knowledge graph by automatically handling pagination.
 * This will make multiple requests until all nodes are retrieved.
 * 
 * @param depth - Depth of node relations to fetch (default: 1)
 * @param pageSize - Number of nodes to fetch per request (default: 100)
 * @returns Promise resolving to array of all nodes
 */
export async function getAllNodes(depth: number = 1, pageSize: number = 100) {
    console.log("getAllNodes: fetching all nodes with pagination")
    return fetchAllPages(
        (d, skip, limit) => getNodes(d, skip, limit),
        depth,
        pageSize
    );
}

/**
 * Fetch ALL nodes of a specific type by automatically handling pagination.
 * This will make multiple requests until all nodes of the type are retrieved.
 * 
 * @param nodeClass - The class/type URI of nodes to fetch
 * @param depth - Depth of node relations to fetch (default: 1)
 * @param pageSize - Number of nodes to fetch per request (default: 100)
 * @returns Promise resolving to array of all nodes of the specified type
 */
export async function getAllNodesByClass(nodeClass: string, depth: number = 1, pageSize: number = 100) {
    console.log(`getAllNodesByClass: fetching all nodes of type ${nodeClass} with pagination`)
    return fetchAllPages(
        (d, skip, limit) => getNodesByClass(nodeClass, d, skip, limit),
        depth,
        pageSize
    );
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
    const response = await authenticatedFetch(url, {
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
    const response = await authenticatedFetch(url, {
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
    newProperty: AbstractAssetProperty
) {
    const endpoint = 'asset_property';
    const url = `${API_BASE_ENDPOINT}/${endpoint}`;
    const data: {
        uri: string;
        label: string;
        propertyName: string;
        propertyDescription: string;
        propertyValue?: string;
        propertyValueTimestamp?: string;
        propertyDataType?: { uri: string };
        propertyUnit?: { uri: string };
    } = {
        uri: getBackendUri(newProperty.id),
        label: newProperty.propertyName,
        propertyName: newProperty.propertyName,
        propertyDescription: newProperty.description,
    }
    if (newProperty.propertyValue) {
        data.propertyValue = newProperty.propertyValue;
    }
    if (newProperty.propertyValueTimestamp) {
        data.propertyValueTimestamp = newProperty.propertyValueTimestamp;
    }
    if (newProperty.propertyDataType) {
        data.propertyDataType = {
            uri: newProperty.propertyDataType.uri
        };
    }
    if (newProperty.propertyUnit) {
        data.propertyUnit = {
            uri: newProperty.propertyUnit.uri
        };
    }
    console.log("createAbstractPropertyNode POST:", url, data)
    const response = await authenticatedFetch(url, {
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
    newProperty: StreamingProperty
) {
    const endpoint = 'streaming_property';
    const url = `${API_BASE_ENDPOINT}/${endpoint}`;
    const data: {
        uri: string;
        label: string;
        propertyName: string;
        propertyDescription: string;
        propertyConnection: { uri: string };
        streamingPath: string;
        streamingTopic: string;
        propertyValue?: string;
        propertyValueTimestamp?: string;
        propertyDataType?: { uri: string };
        propertyUnit?: { uri: string };
    } = {
        uri: getBackendUri(newProperty.id),
        label: newProperty.propertyName,
        propertyName: newProperty.propertyName,
        propertyDescription: newProperty.description,
        propertyConnection: { uri: getBackendUri(newProperty.propertyConnection.uri) },
        streamingPath: newProperty.streamingPath,
        streamingTopic: newProperty.streamingTopic,
    }
    if (newProperty.propertyDataType) {
        data.propertyDataType = {
            uri: newProperty.propertyDataType.uri
        };
    }
    if (newProperty.propertyUnit) {
        data.propertyUnit = {
            uri: newProperty.propertyUnit.uri
        };
    }
    console.log("createStreamingPropertyNode POST:", url, data)
    const response = await authenticatedFetch(url, {
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

export async function createS3PropertyNode(
    newProperty: S3Property
) {
    const endpoint = 's3_property';
    const url = `${API_BASE_ENDPOINT}/${endpoint}`;
    const data: {
        uri: string;
        label: string;
        propertyName: string;
        propertyDescription: string;
        bucket: string;
        key: string;
    } = {
        uri: getBackendUri(newProperty.id),
        label: newProperty.propertyName,
        propertyName: newProperty.propertyName,
        propertyDescription: newProperty.description,
        bucket: newProperty.bucket,
        key: newProperty.key,
    }
    console.log("createS3PropertyNode POST:", url, data)
    const response = await authenticatedFetch(url, {
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
    const response = await authenticatedFetch(url, {
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
    const uri = id; // getBackendUri(id);
    const url = `${API_BASE_ENDPOINT}/${endpoint}?node_uri=${encodeURIComponent(uri)}`;
    console.log("streamData GET:", url)
    const response = await authenticatedFetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    if (!response.ok) {
        throw new Error(`Error performing GET request ${url}`);
    }
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

export async function streamDataReader(
    id: string
): Promise<ReadableStreamDefaultReader<Uint8Array>> {
    const endpoint = 'stream';
    const uri = id; // getBackendUri(id);
    const url = `${API_BASE_ENDPOINT}/${endpoint}?node_uri=${encodeURIComponent(uri)}`;
    console.log("streamData GET:", url)
    const response = await authenticatedFetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    if (!response.ok) {
        throw new Error(`Error performing GET request ${url}`);
    }
    if (!response.body) {
        throw new Error('Response body is empty');
    }
    const reader = response.body.getReader();
    return reader;
}
