// Frontend specifics

export type Workspace = {
	name: string;
	uri: string;
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
export type PropertyNodeType = 'AbstractAssetProperty' | 'DatabaseProperty' | 'StreamingProperty' | 'TimeseriesProperty';
export type AllBackendNodeTypes = AssetNodeType | ConnectionNodeType | PropertyNodeType;

// Connection types
export type ConnectionType = 'MQTT' | 'InfluxDB' | 'SensApp';

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
	propertyName: string;
	description: string;
	propertyDataType: {
		uri: string;
	};
	propertyUnit: {
		uri: string;
	};
	propertyValue?: string;
	propertyValueTimestamp?: string;
	propertyConnection?: NodeUri;
}

export interface AbstractAssetProperty extends Property {
	nodeType: 'AbstractAssetProperty';
}

export interface DatabaseProperty extends Property {
	nodeType: 'DatabaseProperty';
	query?: string;
}

export interface StreamingProperty extends Property {
	nodeType: 'StreamingProperty';
	streamingTopic: string;
  	streamingPath: string;
}

export interface Connection {
	id: string;
	nodeType: 'Connection'
	connectionName: string;
	description: string;
	host: string;
	port: number;
	connectionType: ConnectionType;
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
