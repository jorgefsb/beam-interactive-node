/**
 * Type of error thrown when there's an issue with encoding or decoding.
 */
export class CodingError extends Error {}

/**
 * This error is thrown when there is a fatal error.
 */
export class FatalCodingError extends CodingError {}

/**
 * Thrown when we get an packet that we don't know about.
 * @property {Buffer|String} data the packet's raw data, including its ID.
 */
export class UnknownPacketError extends CodingError {
    constructor (id, data) {
        super('Unknown packet ID ' + id);
        this.data = data;
    }
}

/**
 * Error type thrown by util.assert. Fill since browsers don't have
 * assert functions.
 */
export class AssertionError extends Error {}
