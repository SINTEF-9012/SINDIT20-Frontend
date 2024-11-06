import { describe, it, vi, expect, beforeEach } from 'vitest';
import { Nodes } from '$lib/components/states/nodes-state.svelte';

// Mock Toast State
vi.mock('$lib/components/states/toast-state.svelte', () => {
    return {
        getToastState: vi.fn().mockReturnValue({
            add: vi.fn(),
        })
    };
});

describe('Nodes State', () => {
    let nodesState = new Nodes();

    beforeEach(() => {
        nodesState.destroy();
        nodesState = new Nodes();
    });

    it('should initialize with an empty array', () => {
        expect(nodesState.getAllAbstractAssetNodes()).toEqual([]);
    });

    it('should add a new node', () => {
        const node = nodesState.addAbstractAssetNode('node1', 'Test Node', 'Test Description', []);
        expect(nodesState.getAllAbstractAssetNodes()).toEqual([node]);
    });

    it('should delete all nodes', () => {
        nodesState.addAbstractAssetNode('node1', 'Test Node', 'Test Description', []);
        nodesState.deleteAllNodes();
        expect(nodesState.getAllAbstractAssetNodes()).toEqual([]);
    });

    it('should delete a node', () => {
        const node1 = nodesState.addAbstractAssetNode('node1', 'Test Node', 'Test Description', []);
        const node2 = nodesState.addAbstractAssetNode('node2', 'Test Node', 'Test Description', []);
        nodesState.deleteAbstractAssetNode(node2.id);

        expect(nodesState.getAllAbstractAssetNodes()).toEqual([node1]);
    });

    it('should add property to node', () => {
        const property_uri = 'property1';
        const node = nodesState.addAbstractAssetNode('node1', 'Test Node', 'Test Description', []);
        nodesState.addPropertyToAbstractAssetNode(node.id, property_uri);
        const abstractAssetNode = nodesState.getAbstractAssetNode(node.id);

        expect(abstractAssetNode).toBeDefined();
        expect(abstractAssetNode).to.have.property('assetProperties');
        if (abstractAssetNode) {
            expect(abstractAssetNode.assetProperties).to.deep.include({uri: property_uri});
        }
    });

    it('should update the node description', () => {
        const newDescription = 'New Description';
        const node = nodesState.addAbstractAssetNode('node1', 'Test Node', 'Test Description', []);
        const updatedAsset = { ...node, description: newDescription };
        nodesState.updateAbstractAssetNode(node.id, updatedAsset);
        const updatedNode = nodesState.getAbstractAssetNode(node.id);

        expect(updatedNode).toBeDefined();
        expect(updatedNode).to.have.property('description', newDescription);
    });

});
