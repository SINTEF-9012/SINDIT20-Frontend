import { getNode as getNodeQuery } from '$apis/sindit-backend/kg';
import { getNodeIdFromBackendUri, getNodeClassTypeFromUri } from '$lib/utils/uri';
import { logger } from '$lib/utils/logger';
import { isBackendNode, type BackendNode } from '$lib/utils/validators';

/**
 * Configuration for PropertyFetcher
 */
interface PropertyFetcherConfig {
	maxIterations?: number;
	depth?: number;
}

/**
 * Handles recursive fetching of property nodes from backend
 */
export class PropertyFetcher {
	private readonly maxIterations: number;
	private readonly depth: number;
	private readonly fetchedUris = new Set<string>();
	private readonly fetchedNodes: BackendNode[] = [];

	constructor(config: PropertyFetcherConfig = {}) {
		this.maxIterations = config.maxIterations ?? 10;
		this.depth = config.depth ?? 1;
	}

	/**
	 * Fetch all referenced properties recursively from a set of nodes
	 * @param initialNodes - Initial set of nodes to process
	 * @returns Array of all fetched property nodes
	 */
	async fetchAllProperties(initialNodes: BackendNode[]): Promise<BackendNode[]> {
		// Mark initial nodes as already fetched
		initialNodes.forEach(node => {
			if (isBackendNode(node)) {
				this.fetchedUris.add(node.uri);
			}
		});

		const nodesToProcess = [...initialNodes];
		let iteration = 0;

		while (nodesToProcess.length > 0 && iteration < this.maxIterations) {
			iteration++;
			logger.debug('Property fetching iteration', { iteration, queueSize: nodesToProcess.length });

			const currentBatch = nodesToProcess.splice(0, nodesToProcess.length);
			const referencedPropertyUris = this.collectPropertyUris(currentBatch);

			if (referencedPropertyUris.size === 0) {
				break;
			}

			// Fetch all properties in parallel
			const newNodes = await this.fetchPropertiesInParallel(Array.from(referencedPropertyUris));

			// Add newly fetched nodes to processing queue and results
			newNodes.forEach(node => {
				this.fetchedNodes.push(node);
				nodesToProcess.push(node);
			});
		}

		if (iteration >= this.maxIterations) {
			logger.warn('Property fetcher reached maximum iterations', { maxIterations: this.maxIterations });
		}

		return this.fetchedNodes;
	}

	/**
	 * Collect all property URIs referenced by nodes
	 */
	private collectPropertyUris(nodes: BackendNode[]): Set<string> {
		const propertyUris = new Set<string>();

		nodes.forEach(node => {
			try {
				const classType = getNodeClassTypeFromUri(node.class_uri);

				// Collect from AbstractAsset nodes
				if (classType === 'AbstractAsset' && this.hasAssetProperties(node)) {
					node.assetProperties.forEach((prop: unknown) => {
						const uri = this.extractUri(prop);
						if (uri && !this.fetchedUris.has(uri)) {
							propertyUris.add(uri);
						}
					});
				}

				// Collect from PropertyCollection nodes
				if (classType === 'PropertyCollection' && this.hasCollectionProperties(node)) {
					node.collectionProperties.forEach((prop: unknown) => {
						const uri = this.extractUri(prop);
						if (uri && !this.fetchedUris.has(uri)) {
							propertyUris.add(uri);
						}
					});
				}
			} catch (error) {
				logger.warn('Error collecting property URIs', error, { nodeUri: node.uri });
			}
		});

		return propertyUris;
	}

	/**
	 * Fetch multiple properties in parallel
	 */
	private async fetchPropertiesInParallel(uris: string[]): Promise<BackendNode[]> {
		const fetchPromises = uris.map(async (uri) => {
			try {
				const nodeId = getNodeIdFromBackendUri(uri);
				const node = await getNodeQuery(nodeId, this.depth);

				if (isBackendNode(node)) {
					this.fetchedUris.add(node.uri);
					return node;
				}

				logger.warn('Fetched node is not valid', { uri });
				return null;
			} catch (error) {
				logger.error('Failed to fetch property', error, { uri });
				return null;
			}
		});

		const results = await Promise.all(fetchPromises);
		return results.filter((node): node is BackendNode => node !== null);
	}

	/**
	 * Extract URI from property reference (can be string or object with uri field)
	 */
	private extractUri(prop: unknown): string | null {
		if (typeof prop === 'string') {
			return prop;
		}
		if (typeof prop === 'object' && prop !== null && 'uri' in prop) {
			const uri = (prop as { uri: unknown }).uri;
			return typeof uri === 'string' ? uri : null;
		}
		return null;
	}

	/**
	 * Type guard for nodes with assetProperties
	 */
	private hasAssetProperties(node: BackendNode): node is BackendNode & { assetProperties: unknown[] } {
		return 'assetProperties' in node && Array.isArray(node.assetProperties);
	}

	/**
	 * Type guard for nodes with collectionProperties
	 */
	private hasCollectionProperties(node: BackendNode): node is BackendNode & { collectionProperties: unknown[] } {
		return 'collectionProperties' in node && Array.isArray(node.collectionProperties);
	}
}
