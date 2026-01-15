import type { getNodesState } from '$lib/components/states/nodes-state.svelte';
import type { getPropertiesState } from '$lib/components/states/properties.svelte';
import type { getConnectionsState } from '$lib/components/states/connections.svelte';
import type { PropertyNodeType } from '$lib/types';
import { getNodeIdFromBackendUri, getNodeClassTypeFromUri } from '$lib/utils/uri';
import { 
	isAssetNodeType, 
	isConnectionNodeType, 
	isPropertyNodeType,
	isVisualizablePropertyType,
	type BackendNode 
} from '$lib/utils/validators';
import { logger } from '$lib/utils/logger';

/**
 * Process and add a single node to appropriate state stores
 */
export function processNode(
	node: BackendNode,
	nodesState: ReturnType<typeof getNodesState>,
	propertiesState: ReturnType<typeof getPropertiesState>,
	connectionsState: ReturnType<typeof getConnectionsState>
): void {
	try {
		const classType = getNodeClassTypeFromUri(node.class_uri);
		const nodeId = getNodeIdFromBackendUri(node.uri);

		if (isAssetNodeType(classType)) {
			processAssetNode(node, nodeId, nodesState);
		} else if (isConnectionNodeType(classType)) {
			processConnectionNode(node, nodeId, connectionsState);
		} else if (isPropertyNodeType(classType)) {
			processPropertyNode(node, nodeId, classType, nodesState, propertiesState);
		} else if (classType === 'SINDITKG') {
			processSINDITKGNode(node, nodeId, nodesState);
		} else {
			logger.warn('Unknown node type encountered', { classType, nodeUri: node.uri });
		}
	} catch (error) {
		logger.error('Error processing node', error, { nodeUri: node.uri });
	}
}

/**
 * Process an AbstractAsset node
 */
function processAssetNode(
	node: BackendNode,
	nodeId: string,
	nodesState: ReturnType<typeof getNodesState>
): void {
	const assetDescription = getNodeProperty(node, 'assetDescription', '');
	const assetProperties = getNodeProperty(node, 'assetProperties');
	const assetType = getNodeProperty(node, 'assetType');

	nodesState.addAbstractAssetNode(
		nodeId,
		node.label,
		assetDescription,
		assetProperties,
		assetType
	);
}

/**
 * Process a Connection node
 */
function processConnectionNode(
	node: BackendNode,
	nodeId: string,
	connectionsState: ReturnType<typeof getConnectionsState>
): void {
	const description = getNodeProperty(node, 'connectionDescription', '');
	const host = getNodeProperty(node, 'host', '');
	const port = getNodeProperty(node, 'port', 0);
	const type = getNodeProperty(node, 'type', '');
	const isConnected = getNodeProperty(node, 'isConnected', false);

	connectionsState.addConnectionNode(
		nodeId,
		node.label,
		description,
		host,
		port,
		type,
		isConnected
	);
}

/**
 * Process a Property node
 */
function processPropertyNode(
	node: BackendNode,
	nodeId: string,
	classType: PropertyNodeType,
	nodesState: ReturnType<typeof getNodesState>,
	propertiesState: ReturnType<typeof getPropertiesState>
): void {
	// Add to properties state for compatibility
	propertiesState.addPropertyNode(classType, node);

	// Add visualizable properties to nodes state
	if (isVisualizablePropertyType(classType)) {
		const propertyNode = createPropertyNodeObject(node, nodeId, classType);
		
		try {
			nodesState.addVisualizableNode(propertyNode);
		} catch (error) {
			logger.error('Error adding visualizable property node', error, { 
				nodeId, 
				classType 
			});
		}
	}
}

/**
 * Process a SINDITKG node
 */
function processSINDITKGNode(
	node: BackendNode,
	nodeId: string,
	nodesState: ReturnType<typeof getNodesState>
): void {
	const assets = getNodeProperty(node, 'assets');
	
	nodesState.addSINDITKGNode(
		nodeId,
		node.label,
		node.uri,
		assets
	);
}

/**
 * Create a property node object for visualization
 */
function createPropertyNodeObject(
	node: BackendNode,
	nodeId: string,
	classType: PropertyNodeType
): Record<string, unknown> {
	// Ensure we always have a propertyName
	const propertyName = 
		getNodeProperty(node, 'propertyName') ||
		node.label ||
		nodeId.split('/').pop() ||
		'Unknown Property';

	const propertyNode: Record<string, unknown> = {
		id: nodeId,
		nodeType: classType,
		propertyName,
		description: getNodeProperty(node, 'propertyDescription') || 
		             getNodeProperty(node, 'description', ''),
		propertyDataType: getNodeProperty(node, 'propertyDataType'),
		propertyUnit: getNodeProperty(node, 'propertyUnit'),
		propertyValue: getNodeProperty(node, 'propertyValue'),
		propertyValueTimestamp: getNodeProperty(node, 'propertyValueTimestamp'),
		propertyConnection: getNodeProperty(node, 'propertyConnection')
	};

	// Add type-specific fields
	if (classType === 'StreamingProperty') {
		propertyNode.streamingTopic = getNodeProperty(node, 'streamingTopic');
		propertyNode.streamingPath = getNodeProperty(node, 'streamingPath');
	} else if (classType === 'TimeseriesProperty') {
		propertyNode.query = getNodeProperty(node, 'query');
		propertyNode.timeseriesIdentifiers = getNodeProperty(node, 'timeseriesIdentifiers');
		propertyNode.timeseriesRetrievalMethod = getNodeProperty(node, 'timeseriesRetrievalMethod');
		propertyNode.timeseriesTags = getNodeProperty(node, 'timeseriesTags');
	} else if (classType === 'S3ObjectProperty') {
		propertyNode.bucket = getNodeProperty(node, 'bucket');
		propertyNode.key = getNodeProperty(node, 'key');
	} else if (classType === 'PropertyCollection') {
		propertyNode.collectionProperties = getNodeProperty(node, 'collectionProperties');
	} else if (classType === 'AbstractAssetProperty') {
		propertyNode.propertyValue = getNodeProperty(node, 'propertyValue', '');
	}

	return propertyNode;
}

/**
 * Safely get a property from a node with optional default value
 */
function getNodeProperty<T = unknown>(
	node: BackendNode,
	property: string,
	defaultValue?: T
): T | undefined {
	if (property in node) {
		return node[property] as T;
	}
	return defaultValue;
}
