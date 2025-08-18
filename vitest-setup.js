import { vi } from 'vitest';
import dotenv from 'dotenv';

// this is to get the environment variables into $env/dynamic/public
// so that they're available during the tests
dotenv.config();

// Define SvelteKit globals that are normally set by the framework
global.__SVELTEKIT_DEV__ = false;
global.__SVELTEKIT_APP_VERSION_FILE__ = '';
global.__SVELTEKIT_APP_VERSION_POLL_INTERVAL__ = 0;

// Mock SvelteKit stores
vi.mock('$app/stores', () => ({
    page: {
        subscribe: vi.fn(() => () => {}),
        set: vi.fn(),
        update: vi.fn()
    },
    navigating: {
        subscribe: vi.fn(() => () => {}),
        set: vi.fn(),
        update: vi.fn()
    },
    updated: {
        subscribe: vi.fn(() => () => {}),
        set: vi.fn(),
        update: vi.fn()
    }
}));

// Mock SvelteKit navigation
vi.mock('$app/navigation', () => ({
    goto: vi.fn(),
    invalidate: vi.fn(),
    invalidateAll: vi.fn(),
    preloadData: vi.fn(),
    preloadCode: vi.fn(),
    beforeNavigate: vi.fn(),
    afterNavigate: vi.fn(),
    pushState: vi.fn(),
    replaceState: vi.fn()
}));

// console.log(import.meta.env);
vi.mock('$env/dynamic/public', () => ({
    env: {
        PUBLIC_SINDIT_BACKEND_API: import.meta.env.PUBLIC_SINDIT_BACKEND_API,
        PUBLIC_SINDIT_BACKEND_API_BASE_URI: import.meta.env.PUBLIC_SINDIT_BACKEND_API_BASE_URI
    },
}));

global.window = global.window || {};
global.window.matchMedia = global.window.matchMedia || function() {
    return {
        matches: false,
        addListener: function() {}, // Use addListener for older environments
        removeListener: function() {}, // Use removeListener
        addEventListener: function(type, listener) { // Fallback for addEventListener
            if (type === 'change') this.addListener(listener);
        },
        removeEventListener: function(type, listener) { // Fallback for removeEventListener
            if (type === 'change') this.removeListener(listener);
        },
        dispatchEvent: function() {},
    };
};
