// Importing this is DEPRECATED and will be removed in the future.

const packets = require('../packets');
Object.keys(packets).forEach((key) => {
    const p = packets[key];

    Object.defineProperty(exports, key, {
        enumerable: true,
        get() {
            console.log('Deprecated: import \'robot/packets\', not ' +
                '\'robot/proto/packets\', from beam-interactive-node.');
            return p;
        }
    });
});

console.log(exports);
