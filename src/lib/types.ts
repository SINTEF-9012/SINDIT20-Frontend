// Frontend specifics


// Toast messages
export type Toast = {
	id: string;
	title: string;
	message: string;
	logLevel: LogLevel;
};

export type LogLevel = 'debug' | 'info' | 'warning' | 'error';


// Nodes
export interface Node {
	id: string;
	nodeName: string;
	nodeDescription: string;
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
}

export interface AbstractAssetProperty extends Node {
	nodeType: 'AbstractAssetProperty';
	propertyName: string;
	propertyDescription: string;
	propertyValue: string;
	propertyDataType: string;
	propertyUnit: string;
	propertySemanticId: string;
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
