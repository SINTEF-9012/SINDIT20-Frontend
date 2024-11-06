import { describe, it, vi, expect, beforeEach } from 'vitest';
import { writable } from 'svelte/store';
import { Nodes } from '$lib/components/states/nodes-state.svelte';

// Mock the Svelte-specific functions
vi.mock('$lib/components/states/toast-state.svelte', () => {
    return {
        getToastState: vi.fn().mockReturnValue({
            // Mock the return value of getToastState if needed
        })
    };
});

describe('Nodes State', () => {
    let nodesState = new Nodes();

    beforeEach(() => {
        nodesState.destroy();
        nodesState = new Nodes();
    });

    // Check that the nodes state is initialized with an empty array
    it('should initialize with an empty array', () => {
        expect(nodesState.getAllAbstractAssetNodes()).toEqual([]);
    });

    it('should add a new node', () => {
        const node = nodesState.addAbstractAssetNode('node1', 'Test Node', 'Test Description', []);
        expect(nodesState.getAllAbstractAssetNodes()).toEqual([node]);
    });
});
