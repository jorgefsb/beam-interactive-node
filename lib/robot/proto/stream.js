import {Readable, Writable} from 'stream';
import Packets from './packets';
import varint from 'varint';
import assert from 'assert';
import {find} from '../../util';

// Listing of protocol buffer types to their IDs, as defined in the docs:
//
//   ==== =============
//    ID   Packet
//   ==== =============
//   0    Handshake
//   1    HandshakeACK
//   2    Report
//   3    Error
//   ==== =============
//
// These are the only packets which may be sent as "top level" packets.
const idList = [
    { id: 0, obj: Packets.Handshake },
    { id: 1, obj: Packets.HandshakeACK },
    { id: 2, obj: Packets.Report },
    { id: 3, obj: Packets.Error },
    { id: 4, obj: Packets.ProgressUpdate },
];

// Make sure we didn't screw up.
idList.forEach((l) => assert(l.obj !== undefined));

/**
 * A DecodeError is thrown when some invalid information is given
 * to the decoder. When thrown, all data in the buffer will be
 * discarded.
 */
export class DecodeError extends Error {
    constructor (e) {
        super(e.message);
        this.inner = e;
    }
}

/**
 * Decoder transforms a stream of protocol buffers (created with
 * some Writer) into Javascript objects.
 *
 * @example
 * const decoder = new Decoder(packet);
 * decoder.on('message', function (packet) {
 *     console.log(packet);
 * });
 * mystream.pipe(decoder);
 */
export class Decoder extends Writable {
    /**
     * Creates a new stream decoder; it's used to consume a stream of
     * data, and emits messages which are decoded protobuf objects.
     */
    constructor () {
        super();
        this.buffer = new Buffer(0);
    }

    /**
     * Decodes a packet from the buffer, returning the number of bytes
     * consumed. If it returns zero, then no bytes are consumed and reading
     * should stop until we get more information.
     * @param  {Buffer} buffer
     * @return {Number}
     * @fires message a decoded protobuf message.
     * @fires error on an unknown packet.
     */
    decodePacket (buffer) {
        let bytes = 0;

        // Read the buffer length and packet ID off first. Varint.decode
        // will return undefined if the length is incomplete; in this case,
        // we return and wait to read next time.
        const length = varint.decode(buffer, bytes);
        if (length === undefined) return 0;
        bytes += varint.decode.bytes;

        const packet = varint.decode(buffer, bytes);
        if (packet === undefined) return 0;
        bytes += varint.decode.bytes + length;

        // Break if the buffer doesn't hold the entire protobuf.
        if (buffer.length < bytes) return 0;

        // Try to find the identifier in the list. Emit an error if it
        // doesn't exist and, if it does, send out a message.
        const ident = find(idList, (l) => l.id === packet);
        if (ident === undefined) {
            this.emit('error', new DecodeError(
                'Unknown packet ID ' + packet + ' (' + length + ' bytes)'));
            // Return the number of bytes so we don't get stuck on the bad packet.
            return bytes;
        }

        let decoded;
        try {
            decoded = ident.obj.decode(buffer.slice(bytes - length, bytes));
        } catch (e) {
            this.emit('error', e.decoded ? new DecodeError(e) : e);
        }

        if (decoded) this.emit('message', decoded);

        return bytes;
    }

    /**
     * @private
     */
    _write (chunk, enc, next) {
        let buffer = Buffer.concat([ this.buffer, chunk ]);

        let offset;
        do {
            buffer = buffer.slice(offset);
            offset = this.decodePacket(buffer);
        } while (offset > 0);

        this.buffer = buffer;
        next();
    }
}

/**
 * Encoder is used to transform protocol buffers into a stream.
 *
 * @example
 * const encoder = new Encoder(packet);
 * encoder.pipe(myStream);
 *
 * encoder.push(someObj);
 */
export class Encoder extends Readable {
    /**
     * Encodes a plain object to a protocol buffer and pushes
     * it onto the stream.
     * @param  {Object} packet
     * @return {Encoder}
     */
    push (packet) {
        const ident = find(idList, (l) => packet instanceof l.obj);
        if (ident === undefined) throw new Error('Unknown packet.', packet);

        const bytes = packet.toBuffer();
        super.push(new Buffer(varint.encode(bytes.length)));
        super.push(new Buffer(varint.encode(ident.id)));
        super.push(bytes);
        return this;
    }

    /**
     * Closes the encoder.
     */
    close () {
        super.push(null);
    }

    /**
     * Implements Reader. Does nothing - we push stuff actively.
     * @private
     */
    _read () {}
}
