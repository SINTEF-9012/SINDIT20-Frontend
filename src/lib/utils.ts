import type { Workspace } from '$lib/types';
import type { getNodesState } from '$lib/components/states/nodes-state.svelte';
import type { getPropertiesState } from '$lib/components/states/properties.svelte';
import type { getConnectionsState } from './components/states/connections.svelte';
import { getWorkspace } from '$apis/sindit-backend/workspace';
import {
    selectedWorkspace,
    isWorkspaceSelected,
    backendNodesData,
    isBackendRunning
} from '$lib/stores';
import { backendHealthCheck as backendHealthCheckQuery } from '$apis/sindit-backend/connection';
import { PropertyFetcher } from '$lib/utils/property-fetcher';
import { processNode } from '$lib/utils/node-processor';
import { getWorkspaceNameFromUri } from '$lib/utils/uri';
import { isBackendNode, type BackendNode } from '$lib/utils/validators';
import { logger } from '$lib/utils/logger';

// Re-export URI utilities for backward compatibility
export { getBackendUri, getNodeIdFromBackendUri, getNodeClassTypeFromUri as getNodeClassTypeFromBackendClassUri } from '$lib/utils/uri';


/**
 * Add nodes from backend to application state stores
 * @param nodes - Raw nodes from backend API
 * @param nodesState - Nodes state store
 * @param propertiesState - Properties state store
 * @param connectionsState - Connections state store
 */
export async function addNodesToStates(
	nodes: unknown[],
	nodesState: ReturnType<typeof getNodesState>,
	propertiesState: ReturnType<typeof getPropertiesState>,
	connectionsState: ReturnType<typeof getConnectionsState>
): Promise<void> {
	// Validate and filter to backend nodes only
	const validNodes = nodes.filter(isBackendNode);

	if (validNodes.length === 0) {
		logger.warn('No valid backend nodes to process');
		return;
	}

	logger.info('Processing nodes from backend', { count: validNodes.length });
	backendNodesData.set(nodes);

	// Fetch all referenced property nodes recursively
	const propertyFetcher = new PropertyFetcher({ maxIterations: 10, depth: 1 });
	const fetchedProperties = await propertyFetcher.fetchAllProperties(validNodes);

	// Combine original and fetched nodes
	const allNodes = [...validNodes, ...fetchedProperties];
	backendNodesData.set(allNodes);

	logger.info('Processing all nodes including fetched properties', {
		total: allNodes.length,
		fetched: fetchedProperties.length
	});

	// Process each node and add to appropriate state
	allNodes.forEach(node => {
		processNode(node, nodesState, propertiesState, connectionsState);
	});
}

/**
 * Convert workspace URI to Workspace object
 * @param workspaceUri - Workspace URI (string or object with uri field)
 * @returns Workspace object with name and uri
 */
export function getWorkspaceDictFromUri(workspaceUri: string | { uri: string } | unknown): Workspace {
	// Handle case where workspaceUri might be an object instead of a string
	const uriString = typeof workspaceUri === 'string'
		? workspaceUri
		: (workspaceUri && typeof workspaceUri === 'object' && 'uri' in workspaceUri
			? (workspaceUri as { uri: string }).uri
			: String(workspaceUri));

	const workspaceName = getWorkspaceNameFromUri(uriString);
	return {
		name: workspaceName,
		uri: uriString,
	};
}

/**
 * Get the current workspace from backend and update stores
 * @returns Current workspace object
 */
export async function getCurrentWorkspace(): Promise<Workspace> {
	try {
		const response = await getWorkspace();

		// Check if response is already a Workspace object with name/uri
		if (response && typeof response === 'object' && 'name' in response && 'uri' in response) {
			const workspace = response as Workspace;
			selectedWorkspace.set(workspace.name);
			isWorkspaceSelected.set(true);
			logger.info('Current workspace loaded', { workspaceName: workspace.name });
			return workspace;
		}

		// Otherwise handle legacy format with workspace_uri
		if (!response.workspace_uri) {
			selectedWorkspace.set('');
			isWorkspaceSelected.set(false);
			logger.warn('No workspace selected');
			return { name: '', uri: '' };
		}

		const workspaceDict = getWorkspaceDictFromUri(response.workspace_uri);
		selectedWorkspace.set(workspaceDict.name);
		isWorkspaceSelected.set(true);
		logger.info('Current workspace loaded from URI', { workspaceName: workspaceDict.name });
		return workspaceDict;
	} catch (error) {
		logger.error('Failed to get current workspace', error);
		selectedWorkspace.set('');
		isWorkspaceSelected.set(false);
		return { name: '', uri: '' };
	}
}


/**
 * Update a specific node in the backend nodes data store
 * @param node2update - Node with updates to apply
 */
export async function updateBackendNodesData(node2update: BackendNode): Promise<void> {
	backendNodesData.update((nodes) => {
		return nodes.map((node) => {
			if (isBackendNode(node) && node.uri === node2update.uri) {
				return node2update;
			}
			return node;
		});
	});
}

/**
 * Check backend health and update running status
 */
export function checkBackendRunningStatus(): void {
	backendHealthCheckQuery()
		.then((isRunning) => {
			isBackendRunning.set(isRunning);
			logger.info('Backend health check completed', { isRunning });
		})
		.catch((error) => {
			logger.error('Backend health check failed', error);
			isBackendRunning.set(false);
		});
}
