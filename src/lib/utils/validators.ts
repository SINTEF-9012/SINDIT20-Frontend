import type {
	AssetNodeType,
	ConnectionNodeType,
	PropertyNodeType,
	KGNodeType,
	AllBackendNodeTypes,
	NodeUri
} from '$lib/types';

/**
 * Type guard to check if a value is a NodeUri
 */
export function isNodeUri(value: unknown): value is NodeUri {
	return (
		typeof value === 'object' &&
		value !== null &&
		'uri' in value &&
		typeof (value as NodeUri).uri === 'string'
	);
}

/**
 * Type guard to check if a node type is an AssetNodeType
 */
export function isAssetNodeType(nodeType: string): nodeType is AssetNodeType {
	return nodeType === 'AbstractAsset';
}

/**
 * Type guard to check if a node type is a ConnectionNodeType
 */
export function isConnectionNodeType(nodeType: string): nodeType is ConnectionNodeType {
	return nodeType === 'Connection';
}

/**
 * Type guard to check if a node type is a PropertyNodeType
 */
export function isPropertyNodeType(nodeType: string): nodeType is PropertyNodeType {
	const propertyTypes: PropertyNodeType[] = [
		'Property',
		'AbstractAssetProperty',
		'DatabaseProperty',
		'StreamingProperty',
		'TimeseriesProperty',
		'S3ObjectProperty',
		'PropertyCollection'
	];
	return propertyTypes.includes(nodeType as PropertyNodeType);
}

/**
 * Type guard to check if a node type is a KGNodeType
 */
export function isKGNodeType(nodeType: string): nodeType is KGNodeType {
	return nodeType === 'SINDITKG';
}

/**
 * Type guard to check if a node type is visualizable (can be displayed on canvas)
 */
export function isVisualizablePropertyType(nodeType: string): boolean {
	const visualizableTypes = [
		'AbstractAssetProperty',
		'StreamingProperty',
		'TimeseriesProperty',
		'S3ObjectProperty',
		'PropertyCollection'
	];
	return visualizableTypes.includes(nodeType);
}

/**
 * Type guard for backend node with required fields
 */
export interface BackendNode {
	uri: string;
	class_uri: string;
	label: string;
	[key: string]: unknown;
}

/**
 * Check if a value is a valid backend node
 */
export function isBackendNode(value: unknown): value is BackendNode {
	return (
		typeof value === 'object' &&
		value !== null &&
		'uri' in value &&
		'class_uri' in value &&
		'label' in value &&
		typeof (value as BackendNode).uri === 'string' &&
		typeof (value as BackendNode).class_uri === 'string' &&
		typeof (value as BackendNode).label === 'string'
	);
}

/**
 * Validate if a string is a valid URI format
 */
export function isValidUri(uri: string): boolean {
	try {
		// Check if it's a valid URL or URN
		return uri.startsWith('http://') ||
		       uri.startsWith('https://') ||
		       uri.startsWith('urn:');
	} catch {
		return false;
	}
}

/**
 * Assert that a value is defined (not null or undefined)
 */
export function assertDefined<T>(value: T | null | undefined, message?: string): asserts value is T {
	if (value === null || value === undefined) {
		throw new Error(message || 'Value is null or undefined');
	}
}

/**
 * Check if an object has a specific property with type checking
 */
export function hasProperty<T extends object, K extends PropertyKey>(
	obj: T,
	key: K
): obj is T & Record<K, unknown> {
	return key in obj;
}
