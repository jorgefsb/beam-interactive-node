function extendError (name, methods) {
    /* eslint-disable no-new-func */
    const Err = (new Function(`
        return function ${name}(message) {
            const err = new Error(message);
            this.stack = err.stack;
            this.message = err.message;
            if (this.constructor) {
                this.constructor.apply(this, arguments);
            }
        };
    `))();
    /* eslint-enable */

    Err.prototype = Object.create(Error.prototype);
    Object.assign(Err.prototype, methods);

    return Err;
}

/**
 * Type of error thrown when there's an issue with encoding or decoding.
 */
export const CodingError = extendError('CodingError');

/**
 * This error is thrown when there is a fatal error.
 */
export const FatalCodingError = extendError('FatalCodingError');

/**
 * Thrown when we get an packet that we don't know about.
 * @property {Buffer|String} data the packet's raw data, including its ID.
 */
export const UnknownPacketError = extendError('UnknownPacketError', {
    constructor (id, data) {
        this.message = `Unknown packet ID ${id}`;
        this.data = data;
    },
});

/**
 * Error type thrown by util.assert. Fill since browsers don't have
 * assert functions.
 */
export const AssertionError = extendError('AssertionError');

/**
 * Sent when we get a response that we didn't like when trying to
 * connect to the websocket.
 */
export const UnexpectedServerResponse = extendError('UnexpectedServerResponse');
