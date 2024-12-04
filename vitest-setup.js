import { vi } from 'vitest';
import dotenv from 'dotenv';

// this is to get the environment variables into $env/dynamic/public
// so that they're available during the tests
dotenv.config();
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
