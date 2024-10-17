
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
