// Importing this is DEPRECATED and will be removed in the future.

const packets = require('../packets');
Object.keys(packets).forEach(key => {
    const p = packets[key];

    Object.defineProperty(exports, key, {
        enumerable: true,
        get() {
            /* eslint-disable no-console */
            console.error('Deprecated: import \'robot/packets\', not ' +
                '\'robot/proto/packets\', from beam-interactive-node.');
            /* eslint-enable */
            return p;
        },
    });
});
