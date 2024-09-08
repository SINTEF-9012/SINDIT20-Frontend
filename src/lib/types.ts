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
	position: Position;}

type Position = {
	x: number;
	y: number;
};

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
