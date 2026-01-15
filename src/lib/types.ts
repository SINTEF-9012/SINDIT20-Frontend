// Frontend specifics



export type Workspace = {
	name: string;
	uri: string;
	is_default?: boolean;
};

// Toast messages
export type Toast = {
	id: string;
	title: string;
	message: string;
	logLevel: LogLevel;
};

export type LogLevel = 'debug' | 'info' | 'warning' | 'error';


// 3D Model

export type GLTFModel = {name: string, path: string};


// Backend node types
export type AssetNodeType = 'AbstractAsset';
export type ConnectionNodeType = 'Connection';
export type PropertyNodeType = 'Property' | 'AbstractAssetProperty' | 'DatabaseProperty' | 'StreamingProperty' | 'TimeseriesProperty' | 'S3ObjectProperty' | 'PropertyCollection';
export type KGNodeType = 'SINDITKG';
export type AllBackendNodeTypes = AssetNodeType | ConnectionNodeType | PropertyNodeType | KGNodeType;

// Connection types
export type ConnectionType = 'MQTT' | 'InfluxDB' | 'S3';

// Backend node uris
export type NodeUri = { uri: string }

// Internal position type
type Position = {
	x: number;
	y: number;
};

// Nodes (Assets)
export interface Node {
	id: string;
	nodeName: string;
	description: string;
	position: Position;
}


export interface AbstractAsset extends Node {
	assetProperties?: NodeUri[];
	nodeType: 'AbstractAsset';
}

export interface Property {
	id: string;
	nodeType: PropertyNodeType;
	propertyName: string;
	description: string;
	propertyDataType?: NodeUri;
	propertyUnit?: NodeUri;
	propertyValue?: string;
	propertyValueTimestamp?: string;
	propertyConnection?: NodeUri;
	position?: Position; // Add position for visualization
}

export interface AbstractAssetProperty extends Property {
	nodeType: 'AbstractAssetProperty';
	propertyValue: string;
}

export interface DatabaseProperty extends Property {
	nodeType: 'DatabaseProperty';
	propertyConnection: NodeUri;
	query?: string;
}

export interface StreamingProperty extends Property {
	nodeType: 'StreamingProperty';
	streamingTopic: string;
  	streamingPath: string;
	propertyConnection: NodeUri;
	position?: Position; // Add position for visualization
}

export interface S3ObjectProperty extends Property {
	nodeType: 'S3ObjectProperty';
	propertyConnection: NodeUri;
	bucket: string;
	key: string;
	position?: Position; // Add position for visualization
}

export interface PropertyCollection extends Property {
	nodeType: 'PropertyCollection';
	collectionProperties: Property[] | NodeUri[];
	position?: Position; // Add position for visualization
}

export interface SINDITKG {
	id: string;
	uri: string;
	label: string;
	assets?: NodeUri[];
	nodeType: 'SINDITKG';
	position?: Position; // Add position for visualization
}

// Union type for all visualizable nodes (excludes Connection)
export type VisualizableNode = AbstractAsset | StreamingProperty | S3ObjectProperty | PropertyCollection | SINDITKG;

export interface Connection {
	id: string;
	nodeType: 'Connection'
	connectionName: string;
	description: string;
	host: string;
	port: number;
	connectionType: ConnectionType;
	isConnected: boolean;
}

// Links
export interface Link {
	id: string;
	sourceNodeId: string;
	targetNodeId: string;
	linkDirection: LinkDirection;
	linkDescription: string;
	linkWeight: number;
}

export type LinkDirection = 'left' | 'right' | 'none';



// APIs

// APIs // sindit-backend

// APIs // sindit-backend // metamodel

export type ReturnedDataTypeAllUnits = {
	uri: string,
	prefName: string,
	code: string
}

export type ReturnedDataTypeSearchUnits = {
	uri: string,
	prefName: string,
	symbol: string,
	code: string
}

export type ReturnedDataTypeAllDataTypes = {
	uri: string,
	label: string
}
