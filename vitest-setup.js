import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

import { setToastState } from '$lib/components/states/toast-state.svelte';
import { setNodesState } from '$lib/components/states/nodes-state.svelte';
import { setConnectionsState } from '$lib/components/states/connections.svelte';
import { setPropertiesState } from '$lib/components/states/properties.svelte';
import { setLinksState } from '$lib/components/states/links-state.svelte';

console.log('Vitest setup file is being executed');


Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // deprecated
        removeListener: vi.fn(), // deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

// Initialize Toast State
setToastState();

// Initialize Nodes State
setNodesState();

// Initialize Connections State
setConnectionsState();

// Initialize Properties State
setPropertiesState();

// Initialize Links State
setLinksState();

console.log('Vitest setup file has been executed');
