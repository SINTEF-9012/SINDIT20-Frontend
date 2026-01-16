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
	private readonly nodeCache = new Map<string, BackendNode>();

	constructor(config: PropertyFetcherConfig = {}) {
		this.maxIterations = config.maxIterations ?? 10;
		this.depth = config.depth ?? 1;
	}

	/**
	 * Populate the node cache with all available nodes
	 * @param allNodes - All nodes that are already loaded
	 */
	populateCache(allNodes: BackendNode[]): void {
		allNodes.forEach(node => {
			if (isBackendNode(node)) {
				this.nodeCache.set(node.uri, node);
				this.fetchedUris.add(node.uri);
			}
		});
		logger.info('PropertyFetcher cache populated', { cacheSize: this.nodeCache.size });
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
			const { cachedNodes, unfetchedUris } = this.collectPropertyUris(currentBatch);

			// Add cached nodes directly without fetching
			cachedNodes.forEach(node => {
				this.fetchedNodes.push(node);
				nodesToProcess.push(node);
			});

			if (unfetchedUris.length === 0) {
				break;
			}

			logger.info('Fetching missing property nodes', { 
				cachedCount: cachedNodes.length, 
				unfetchedCount: unfetchedUris.length 
			});

			// Fetch all properties in parallel
			const newNodes = await this.fetchPropertiesInParallel(unfetchedUris);

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
	 * Returns cached nodes and URIs that need to be fetched
	 */
	private collectPropertyUris(nodes: BackendNode[]): { cachedNodes: BackendNode[], unfetchedUris: string[] } {
		const cachedNodes: BackendNode[] = [];
		const unfetchedUris: string[] = [];

		nodes.forEach(node => {
			try {
				const classType = getNodeClassTypeFromUri(node.class_uri);

				// Collect from AbstractAsset nodes
				if (classType === 'AbstractAsset' && this.hasAssetProperties(node)) {
					node.assetProperties.forEach((prop: unknown) => {
						const uri = this.extractUri(prop);
						if (uri && !this.fetchedUris.has(uri)) {
							const cachedNode = this.nodeCache.get(uri);
							if (cachedNode) {
								cachedNodes.push(cachedNode);
								this.fetchedUris.add(uri);
							} else {
								unfetchedUris.push(uri);
							}
						}
					});
				}

				// Collect from PropertyCollection nodes
				if (classType === 'PropertyCollection' && this.hasCollectionProperties(node)) {
					node.collectionProperties.forEach((prop: unknown) => {
						const uri = this.extractUri(prop);
						if (uri && !this.fetchedUris.has(uri)) {
							const cachedNode = this.nodeCache.get(uri);
							if (cachedNode) {
								cachedNodes.push(cachedNode);
								this.fetchedUris.add(uri);
							} else {
								unfetchedUris.push(uri);
							}
						}
					});
				}
			} catch (error) {
				logger.warn('Error collecting property URIs', error, { nodeUri: node.uri });
			}
		});

		return { cachedNodes, unfetchedUris };
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
