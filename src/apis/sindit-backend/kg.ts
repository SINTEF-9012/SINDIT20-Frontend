import { env } from '$env/dynamic/public';
import type {
	ConnectionType,
	AbstractAssetProperty,
	DatabaseProperty,
	StreamingProperty,
	TimeseriesProperty,
	S3ObjectProperty,
	PropertyCollection,
	Relationship,
	RelationshipNodeType
} from '$lib/types';
import {
	getBackendUri,
	getNodeIdFromBackendUri,
	getNodeClassTypeFromBackendClassUri
} from '$lib/utils';
import { authenticatedFetch } from '$lib/api-client';
import { fetchAllPages } from '$lib/pagination';

const API_BASE_URL = '/api/proxy';
const API_BASE_ENDPOINT = `${API_BASE_URL}?endpoint=kg`;

export async function getNodes(depth: number = 1, skip: number = 0, limit: number = 10) {
	const endpoint = 'nodes';
	const url = `${API_BASE_ENDPOINT}/${endpoint}?depth=${depth}&skip=${skip}&limit=${limit}`;
	const response = await authenticatedFetch(url);
	if (!response.ok) {
		throw new Error(`Error performing GET request ${url}`);
	}
	return response.json();
}

export async function getNode(nodeId: string, depth: number = 1) {
	const endpoint = 'node';
	const uri = getBackendUri(nodeId);
	const url = `${API_BASE_ENDPOINT}/${endpoint}?node_uri=${encodeURIComponent(uri)}&depth=${depth}`;
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
	// Resolve URI — prefer node.uri, fall back to node.id for backwards compat
	const resolvedUri = getBackendUri(node.uri ?? node.id);
	// Strip frontend-only fields that backend models don't accept
	const { id: _id, nodeType: _nodeType, position: _position, description: _description, ...nodePayload } = node;
	nodePayload.uri = resolvedUri;
	const response = await authenticatedFetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(nodePayload)
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

export async function getNodesByClass(
	nodeClass: string,
	depth: number = 1,
	skip: number = 0,
	limit: number = 10
) {
	const endpoint = 'nodes_by_type';
	const url = `${API_BASE_ENDPOINT}/${endpoint}?type_uri=${encodeURIComponent(nodeClass)}&depth=${depth}&skip=${skip}&limit=${limit}`;
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
	return fetchAllPages((d, skip, limit) => getNodes(d, skip, limit), depth, pageSize);
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
export async function getAllNodesByClass(
	nodeClass: string,
	depth: number = 1,
	pageSize: number = 100
) {
	return fetchAllPages(
		(d, skip, limit) => getNodesByClass(nodeClass, d, skip, limit),
		depth,
		pageSize
	);
}

export async function createAbstractNode(nodeId: string, nodeName: string, description: string) {
	const endpoint = 'asset';
	const url = `${API_BASE_ENDPOINT}/${endpoint}`;
	const data = {
		uri: getBackendUri(nodeId),
		label: nodeName,
		assetDescription: description,
		assetProperties: []
	};
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

export async function addPropertyToAssetNode(nodeId: string, propertyURI: string) {
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

export async function createAbstractPropertyNode(newProperty: AbstractAssetProperty) {
	const endpoint = 'asset_property';
	const url = `${API_BASE_ENDPOINT}/${endpoint}`;
	const data: {
		uri: string;
		label: string;
		propertyName: string;
		propertyDescription: string;
		propertyValue?: string;
		propertyValueTimestamp?: string;
		propertySemanticID?: { uri: string };
		propertyDataType?: { uri: string };
		propertyUnit?: { uri: string };
	} = {
		uri: getBackendUri(newProperty.id),
		label: newProperty.propertyName,
		propertyName: newProperty.propertyName,
		propertyDescription: newProperty.description
	};
	if (newProperty.propertyValue) {
		data.propertyValue = newProperty.propertyValue;
	}
	if (newProperty.propertyValueTimestamp) {
		data.propertyValueTimestamp = newProperty.propertyValueTimestamp;
	}
	if (newProperty.propertySemanticID) {
		const semId = newProperty.propertySemanticID;
		data.propertySemanticID = { uri: typeof semId === 'string' ? semId : semId.uri };
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

export async function createStreamingPropertyNode(newProperty: StreamingProperty) {
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
		propertySemanticID?: { uri: string };
		propertyDataType?: { uri: string };
		propertyUnit?: { uri: string };
	} = {
		uri: getBackendUri(newProperty.id),
		label: newProperty.propertyName,
		propertyName: newProperty.propertyName,
		propertyDescription: newProperty.description,
		propertyConnection: { uri: getBackendUri(newProperty.propertyConnection.uri) },
		streamingPath: newProperty.streamingPath,
		streamingTopic: newProperty.streamingTopic
	};
	if (newProperty.propertyValue) data.propertyValue = newProperty.propertyValue;
	if (newProperty.propertyValueTimestamp) data.propertyValueTimestamp = newProperty.propertyValueTimestamp;
	if (newProperty.propertySemanticID) {
		const semId = newProperty.propertySemanticID;
		data.propertySemanticID = { uri: typeof semId === 'string' ? semId : semId.uri };
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

export async function createTimeseriesPropertyNode(newProperty: TimeseriesProperty) {
	const endpoint = 'timeseries_property';
	const url = `${API_BASE_ENDPOINT}/${endpoint}`;
	const data: {
		uri: string;
		label: string;
		propertyName: string;
		propertyDescription: string;
		propertyConnection: { uri: string };
		query?: string;
		propertyIdentifiers?: Record<string, any>;
		timeseriesIdentifiers?: Record<string, any>;
		timeseriesRetrievalMethod?: string;
		timeseriesTags?: Record<string, any>;
		propertyValue?: string;
		propertyValueTimestamp?: string;
		propertySemanticID?: { uri: string };
		propertyDataType?: { uri: string };
		propertyUnit?: { uri: string };
	} = {
		uri: getBackendUri(newProperty.id),
		label: newProperty.propertyName,
		propertyName: newProperty.propertyName,
		propertyDescription: newProperty.description,
		propertyConnection: { uri: getBackendUri(newProperty.propertyConnection.uri) }
	};
	if (newProperty.query) {
		data.query = newProperty.query;
	}
	if (newProperty.timeseriesIdentifiers) {
		data.timeseriesIdentifiers = newProperty.timeseriesIdentifiers;
	}
	if (newProperty.timeseriesRetrievalMethod) {
		data.timeseriesRetrievalMethod = newProperty.timeseriesRetrievalMethod;
	}
	if (newProperty.timeseriesTags) {
		data.timeseriesTags = newProperty.timeseriesTags;
	}
	if (newProperty.propertyValue) data.propertyValue = newProperty.propertyValue;
	if (newProperty.propertyValueTimestamp) data.propertyValueTimestamp = newProperty.propertyValueTimestamp;
	if (newProperty.propertySemanticID) {
		const semId = newProperty.propertySemanticID;
		data.propertySemanticID = { uri: typeof semId === 'string' ? semId : semId.uri };
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

export async function createDatabasePropertyNode(newProperty: DatabaseProperty) {
	const endpoint = 'database_property';
	const url = `${API_BASE_ENDPOINT}/${endpoint}`;
	const data: {
		uri: string;
		label: string;
		propertyName: string;
		propertyDescription: string;
		query?: string;
		propertyIdentifiers?: Record<string, any>;
		propertyConnection?: { uri: string };
		propertyValue?: string;
		propertyValueTimestamp?: string;
		propertySemanticID?: { uri: string };
		propertyDataType?: { uri: string };
		propertyUnit?: { uri: string };
	} = {
		uri: getBackendUri(newProperty.id),
		label: newProperty.propertyName,
		propertyName: newProperty.propertyName,
		propertyDescription: newProperty.description
	};
	if (newProperty.query) data.query = newProperty.query;
	if (newProperty.propertyIdentifiers) data.propertyIdentifiers = newProperty.propertyIdentifiers;
	if (newProperty.propertyConnection?.uri) {
		data.propertyConnection = { uri: getBackendUri(newProperty.propertyConnection.uri) };
	}
	if (newProperty.propertyValue) data.propertyValue = newProperty.propertyValue;
	if (newProperty.propertyValueTimestamp) data.propertyValueTimestamp = newProperty.propertyValueTimestamp;
	if (newProperty.propertySemanticID) {
		const semId = newProperty.propertySemanticID;
		data.propertySemanticID = { uri: typeof semId === 'string' ? semId : semId.uri };
	}
	if (newProperty.propertyDataType) data.propertyDataType = { uri: newProperty.propertyDataType.uri };
	if (newProperty.propertyUnit) data.propertyUnit = { uri: newProperty.propertyUnit.uri };
	const response = await authenticatedFetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data)
	});
	if (!response.ok) {
		throw new Error(`Error performing POST request ${response.statusText}`);
	}
	return response.json();
}

export async function createS3PropertyNode(newProperty: S3ObjectProperty) {
	const endpoint = 's3_object';
	const url = `${API_BASE_ENDPOINT}/${endpoint}`;
	const data: {
		uri: string;
		label: string;
		propertyName: string;
		propertyDescription: string;
		bucket: string;
		key: string;
		urlMode?: string;
		propertyConnection?: { uri: string };
		propertyValue?: string;
		propertyValueTimestamp?: string;
		propertySemanticID?: { uri: string };
		propertyDataType?: { uri: string };
		propertyUnit?: { uri: string };
	} = {
		uri: getBackendUri(newProperty.id),
		label: newProperty.propertyName,
		propertyName: newProperty.propertyName,
		propertyDescription: newProperty.description,
		bucket: newProperty.bucket,
		key: newProperty.key
	};
	if (newProperty.urlMode) data.urlMode = newProperty.urlMode;
	if (newProperty.propertyConnection?.uri) {
		data.propertyConnection = { uri: getBackendUri(newProperty.propertyConnection.uri) };
	}
	if (newProperty.propertyValue) data.propertyValue = newProperty.propertyValue;
	if (newProperty.propertyValueTimestamp) data.propertyValueTimestamp = newProperty.propertyValueTimestamp;
	if (newProperty.propertySemanticID) {
		const semId = newProperty.propertySemanticID;
		data.propertySemanticID = { uri: typeof semId === 'string' ? semId : semId.uri };
	}
	if (newProperty.propertyDataType) data.propertyDataType = { uri: newProperty.propertyDataType.uri };
	if (newProperty.propertyUnit) data.propertyUnit = { uri: newProperty.propertyUnit.uri };
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

export async function createSINDITKGNode(uri: string, label: string, assetIds?: string[], connectionIds?: string[]) {
	const endpoint = 'sindit_kg';
	const url = `${API_BASE_ENDPOINT}/${endpoint}`;
	const data: any = {
		uri: getBackendUri(uri),
		label
	};
	if (assetIds && assetIds.length > 0) {
		data.assets = assetIds.map((id) => ({ uri: getBackendUri(id) }));
	}
	if (connectionIds && connectionIds.length > 0) {
		data.dataConnections = connectionIds.map((id) => ({ uri: getBackendUri(id) }));
	}
	const response = await authenticatedFetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data)
	});
	if (!response.ok) {
		throw new Error(`Error performing POST request ${response.statusText}`);
	}
	return response.json();
}

export async function createPropertyCollectionNode(newProperty: PropertyCollection) {
	const endpoint = 'property_collection';
	const url = `${API_BASE_ENDPOINT}/${endpoint}`;
	const data: {
		uri: string;
		label: string;
		propertyName: string;
		propertyDescription: string;
		collectionProperties: any[];
		propertyValue?: string;
		propertyValueTimestamp?: string;
		propertySemanticID?: { uri: string };
		propertyDataType?: { uri: string };
		propertyUnit?: { uri: string };
	} = {
		uri: getBackendUri(newProperty.id),
		label: newProperty.propertyName,
		propertyName: newProperty.propertyName,
		propertyDescription: newProperty.description,
		collectionProperties: newProperty.collectionProperties
			? (newProperty.collectionProperties as any[]).map((p) =>
					'uri' in p ? p : { uri: getBackendUri((p as any).id ?? p) }
			  )
			: []
	};
	if (newProperty.propertyValue) data.propertyValue = newProperty.propertyValue;
	if (newProperty.propertyValueTimestamp) data.propertyValueTimestamp = newProperty.propertyValueTimestamp;
	if (newProperty.propertySemanticID) {
		const semId = newProperty.propertySemanticID;
		data.propertySemanticID = { uri: typeof semId === 'string' ? semId : semId.uri };
	}
	if (newProperty.propertyDataType) data.propertyDataType = { uri: newProperty.propertyDataType.uri };
	if (newProperty.propertyUnit) data.propertyUnit = { uri: newProperty.propertyUnit.uri };
	const response = await authenticatedFetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data)
	});
	if (!response.ok) {
		throw new Error(`Error performing POST request ${response.statusText}`);
	}
	return response.json();
}

export async function createConnectionNode(
	id: string,
	connectionName: string,
	description: string,
	host: string,
	port: number,
	connectionType: ConnectionType,
	username?: string,
	passwordPath?: string,
	tokenPath?: string,
	configuration?: Record<string, unknown>
) {
	const endpoint = 'connection';
	const url = `${API_BASE_ENDPOINT}/${endpoint}`;
	const data: Record<string, unknown> = {
		uri: getBackendUri(id),
		label: connectionName,
		connectionDescription: description,
		host: host,
		port: port,
		type: connectionType
	};
	if (username) data.username = username;
	if (passwordPath) data.passwordPath = passwordPath;
	if (tokenPath) data.tokenPath = tokenPath;
	if (configuration && Object.keys(configuration).length > 0) data.configuration = configuration;
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

// Relationship APIs

/**
 * Fetch relationships with pagination.
 *
 * @param skip - Number of relationships to skip (default: 0)
 * @param limit - Number of relationships to fetch (default: 10)
 * @returns Promise resolving to paginated relationships
 */
export async function getRelationships(skip: number = 0, limit: number = 10) {
	const endpoint = 'relationship';
	const url = `${API_BASE_ENDPOINT}/${endpoint}?skip=${skip}&limit=${limit}`;
	const response = await authenticatedFetch(url);
	if (!response.ok) {
		throw new Error(`Error performing GET request ${url}`);
	}
	return response.json();
}

/**
 * Fetch ALL relationships by automatically handling pagination.
 * This will make multiple requests until all relationships are retrieved.
 *
 * @param pageSize - Number of relationships to fetch per request (default: 100)
 * @returns Promise resolving to array of all relationships
 */
export async function getAllRelationships(pageSize: number = 100): Promise<Relationship[]> {
	const raw = await fetchAllPages(
		(d, skip, limit) => getRelationships(skip, limit),
		1, // depth is not used for relationships, pass dummy value
		pageSize
	);
	// Map backend fields (uri, class_uri) to frontend fields (id, nodeType)
	return (raw as any[]).map((rel) => ({
		...rel,
		id: getNodeIdFromBackendUri(rel.uri),
		nodeType: getNodeClassTypeFromBackendClassUri(rel.class_uri) as RelationshipNodeType
	}));
}

/**
 * Fetch relationships for a specific node.
 *
 * @param nodeId - The node ID to fetch relationships for
 * @returns Promise resolving to array of relationships
 */
export async function getRelationshipsByNode(nodeId: string): Promise<Relationship[]> {
	const endpoint = 'relationship_by_node';
	const uri = getBackendUri(nodeId);
	const url = `${API_BASE_ENDPOINT}/${endpoint}?node_uri=${encodeURIComponent(uri)}`;
	const response = await authenticatedFetch(url);
	if (!response.ok) {
		throw new Error(`Error performing GET request ${url}`);
	}
	return response.json();
}

/**
 * Create a new relationship between two assets.
 *
 * @param relationship - The relationship object to create
 * @returns Promise resolving to the created relationship
 */
export async function createRelationship(relationship: Relationship) {
	const endpoint = 'relationship';
	const url = `${API_BASE_ENDPOINT}/${endpoint}`;
	// Transform payload to match backend RDFModel: use uri instead of id, strip frontend-only fields
	const { id, nodeType, class_uri: _classUri, ...relPayload } = relationship as any;
	if (id) relPayload.uri = getBackendUri(id);
	// Do NOT send class_uri — backend sets it from AbstractRelationship.CLASS_URI automatically
	const response = await authenticatedFetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(relPayload)
	});
	if (!response.ok) {
		throw new Error(`Error performing POST request ${response.statusText}`);
	}
	return response.json();
}

export async function deleteRelationship(relationshipId: string): Promise<void> {
	const endpoint = 'relationship';
	const uri = getBackendUri(relationshipId);
	const url = `${API_BASE_ENDPOINT}/${endpoint}?relationship_uri=${encodeURIComponent(uri)}`;
	const response = await authenticatedFetch(url, { method: 'DELETE' });
	if (!response.ok) {
		throw new Error(`Error deleting relationship: ${response.statusText}`);
	}
}

// Experimental /kg/stream API - REMOVED
// The streaming API endpoint is experimental and has been removed from the frontend
