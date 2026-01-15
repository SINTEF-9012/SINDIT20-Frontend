import { writable } from 'svelte/store';
import type {
    GLTFModel,
    AssetNodeType,
    ConnectionNodeType,
    PropertyNodeType,
    KGNodeType,
    ConnectionType
} from '$lib/types';

// Backend running status
export const isBackendRunning = writable(false);

// workspace
export const selectedWorkspace = writable('');
export const isWorkspaceSelected = writable(false);

// node types
export const assetNodeTypes: AssetNodeType[] = ['AbstractAsset'];
export const connectionNodeTypes: ConnectionNodeType[] = ['Connection'];
export const propertyNodeTypes: PropertyNodeType[] = ['AbstractAssetProperty', 'DatabaseProperty', 'StreamingProperty', 'TimeseriesProperty', 'S3ObjectProperty', 'PropertyCollection'];
export const kgNodeTypes: KGNodeType[] = ['SINDITKG'];
export const nodeClasses = {
    'AbstractAsset': 'urn:samm:sindit.sintef.no:1.0.0#AbstractAsset',
    'Connection': 'urn:samm:sindit.sintef.no:1.0.0#Connection',
    'AbstractAssetProperty': 'urn:samm:sindit.sintef.no:1.0.0#AbstractAssetProperty',
    'DatabaseProperty': 'urn:samm:sindit.sintef.no:1.0.0#DatabaseProperty',
    'StreamingProperty': 'urn:samm:sindit.sintef.no:1.0.0#StreamingProperty',
    'TimeseriesProperty': 'urn:samm:sindit.sintef.no:1.0.0#TimeseriesProperty',
    'S3ObjectProperty': 'urn:samm:sindit.sintef.no:1.0.0#S3ObjectProperty',
    'SINDITKG': 'urn:samm:sindit.sintef.no:1.0.0#SINDITKG'
} as const;

// node
export const selectedNodes = writable<string[]>([]);
export const selectedNodeId = writable('');
export const nodeSize = 100;
export const createNodeMode = writable(false);
export const backendNodesData = writable<unknown[]>([]);

// links
export const selectedLinkId = writable('');
export const createLinkMode = writable(false);

// connections
export const createConnectionMode = writable(false);
export const connectionTypes: ConnectionType[] = ['MQTT', 'InfluxDB', 'S3']

// modals
export const modalMetadata = writable({toolName: '', operationMode: ''});

// 3D model
export const selected3DModel = writable<GLTFModel>({name: '', path: ''});
