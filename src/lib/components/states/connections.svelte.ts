import type { Connection, ConnectionType } from '$lib/types';
import { writable, get } from 'svelte/store';
import { getContext, setContext } from 'svelte';
import { getToastState } from '$lib/components/states/toast-state.svelte';
import {
    getNode as getNodeQuery,
    createConnectionNode as createConnectionNodeQuery
} from '$apis/sindit-backend/kg';


export class Connections {
    connections = writable<Connection[]>([]); // ConnectionNodes
    private toastState: ReturnType<typeof getToastState>;

    constructor() {
        this.toastState = getToastState();
    }

	destroy() {
        // this.deleteAllConnections();
		this.connections.set([]);
    }

    private connectionNodeObject(
		connectionName: string,
		description: string,
		host: string,
		port: number,
		connectionType: ConnectionType,
		id?: string
	): Connection {
		if (!id) {
			id = crypto.randomUUID();
		}
		return {
			id,
			connectionName,
			description,
			nodeType: 'Connection',
			host,
			port,
			connectionType
		};
	}

    getConnection(id: string) {
        const connections = get(this.connections);
        return connections.find((node) => node.id === id);
    }

    getAllConnectionNodes() {
		return get(this.connections);
	}

    deleteConnection(id: string) {
        this.connections.update((connections) => connections.filter((node) => node.id !== id));
    }

	addConnection<T extends Connection>(
		connection: T
	) {
		this.connections.update((connections) => [...connections, connection]);
	}

    isConnectionConnected(id: string) {
        // const conn = this.getConnection(id);
        const node = getNodeQuery(id);
        // TODO: check connection status
        return node;
    }

	addConnectionNode(
		id: string,
		connectionName: string,
		description: string,
		host: string,
		port: number,
		connectionType: ConnectionType
	) {
		const newConnection = this.connectionNodeObject(connectionName, description, host, port, connectionType, id);
		this.addConnection(newConnection);
	}

	// Create a new Connection node
	async createConnectionNode(
		nodeName: string,
		description: string,
		host: string,
		port: number,
		connectionType: ConnectionType
	) {
		const newNode = this.connectionNodeObject(nodeName, description, host, port, connectionType);
        this.addConnection(newNode);
		try {
			await createConnectionNodeQuery(newNode.id, newNode.connectionName, newNode.description, host, port, connectionType);
		} catch (error) {
			this.deleteConnection(newNode.id);
			this.toastState.add('Error creating Connection', error as string, 'error');
		}
	}
}


// Unique key to store the state in the Svelte context
const KEY = Symbol('Connections');

export function setConnectionsState() {
	const state = new Connections();
	setContext(KEY, state);
	return state;
}

export function getConnectionsState() {
	return getContext<ReturnType<typeof setConnectionsState>>(KEY);
}
