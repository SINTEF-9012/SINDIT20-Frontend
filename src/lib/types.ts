// Frontend specifics


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

// Nodes
export interface Node {
	id: string;
	nodeName: string;
	description: string;
	position: Position;
	nodeType: NodeType;
}

type Position = {
	x: number;
	y: number;
};

export type NodeType = 'AbstractAsset' | 'AbstractAssetProperty' | 'Connection'

export interface AbstractAsset extends Node {
	nodeType: 'AbstractAsset';
	assetProperties?: AssetProperties[];
}

export type AssetProperties = { uri: string }

export interface AbstractAssetProperty {
	id: string;
	nodeType: 'AbstractAssetProperty';
	propertyName: string;
	description: string;
	propertyDataType: {
		uri: string;
	};
	propertyUnit: {
		uri: string;
	};
}

export interface Connection extends Node {
	nodeType: 'Connection'
	host: string;
	port: number;
	connectionType: ConnectionType;
}

export type ConnectionType = 'MQTT' | 'InfluxDB' | 'SensApp'

export interface MQTTConnection extends Connection {
	credentialReference: string; // reference to credentials
}

export interface InfluxDBConnection extends Connection {
	bucket: string;
	org: string;
	credentialReference: string; // reference to credentials
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

// sindit-backend

// metamodel

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
