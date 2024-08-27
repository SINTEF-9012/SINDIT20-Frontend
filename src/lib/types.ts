// Frontend specifics

export type Toast = {
	id: string;
	title: string;
	message: string;
	logLevel: LogLevel;
};

export type LogLevel = 'debug' | 'info' | 'warning' | 'error';

//

export interface Node {
	id: string;
	nodeName: string;
	nodeDescription: string;
	size: number;
	position: Position;
	zoomLevel: number;
}

type Position = {
	x: number;
	y: number;
};

export type LinkDirection = 'left' | 'right' | 'none';
