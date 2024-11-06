import { describe, it, vi, expect, beforeEach } from 'vitest';
import { Connections } from '$lib/components/states/connections.svelte';
import type { ConnectionType } from '$lib/types';

// Mock Toast State
vi.mock('$lib/components/states/toast-state.svelte', () => {
    return {
        getToastState: vi.fn().mockReturnValue({
            add: vi.fn(),
        })
    };
});

describe('Connections State', () => {
    let connectionsState = new Connections();

    beforeEach(() => {
        connectionsState.destroy();
        connectionsState = new Connections();
    });

    it('should initialize with an empty array', () => {
        expect(connectionsState.getAllConnectionNodes()).toEqual([]);
    });

    it('should add a new connection', () => {
        const connection = connectionsState.addConnectionNode('node1', 'Test Node', 'Test Description', 'localhost', 8080, 'MQTT', false);
        expect(connectionsState.getAllConnectionNodes()).toEqual([connection]);
    });

    it('should delete a connection', () => {
        const connection = connectionsState.addConnectionNode('node1', 'Test Node', 'Test Description', 'localhost', 8080, 'MQTT', false);
        expect(connectionsState.getAllConnectionNodes()).toEqual([connection]);
        connectionsState.deleteConnection(connection.id);
        expect(connectionsState.getAllConnectionNodes()).toEqual([]);
    });

    it('should update the connection description', () => {
        const newDescription = 'New Description';
        const newConnectionType: ConnectionType = 'InfluxDB';
        const connection = connectionsState.addConnectionNode('node1', 'Test Node', 'Test Description', 'localhost', 8080, 'MQTT', false);
        const updatedConnection = { ...connection, description: newDescription, isConnected: true, connectionType: newConnectionType};
        connectionsState.updateConnection(connection.id, updatedConnection);
        const connectionNode = connectionsState.getConnection(updatedConnection.id);

        expect(connectionNode).toBeDefined();
        expect(connectionNode).to.have.property('description', newDescription);
        expect(connectionNode).to.have.property('isConnected', true);
        expect(connectionNode).to.have.property('connectionType', newConnectionType);
        expect(connectionNode).to.have.property('host', 'localhost');
        expect(connectionNode).to.have.property('port', 8080);
        expect(connectionNode).to.have.property('connectionName', 'Test Node');
        expect(connectionNode).to.have.property('id', 'node1');
    });

});
