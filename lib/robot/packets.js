import {FatalCodingError, UnknownPacketError} from '../errors';
import Protobuf from 'protobufjs';
import varint from 'varint';
import path from 'path';

const builder = Protobuf.loadProtoFile(path.join(__dirname, 'tetris.proto'));
const Packets = builder.build('tetris');


const idMap = {
    Handshake: 0,
    HandshakeACK: 1,
    Report: 2,
    Error: 3,
    ProgressUpdate: 4,
};

Object.keys(idMap).forEach(function genpacket (key) {
    const Packet = Packets[key];
    const id = idMap[key];

    Packet.id = id;

    Packet.prototype.encodeOriginal = Packet.prototype.encode;
    Packet.prototype.encode = function encode () {
        return Buffer.concat([
            new Buffer(varint.encode(id)),
            this.encodeOriginal().toBuffer(),
        ]);
    };

    /**
     * Attempts to decode the packet.
     * @param  {Buffer} buf
     * @return {[type]}     [description]
     */
    Packet.decodeOriginal = Packet.decode;
    Packet.decode = function decode (buf) {
        varint.decode(buf, 0);
        const offset = varint.decode.bytes;

        let decoded;
        try {
            decoded = Packet.decodeOriginal(buf.slice(offset));
        } catch (e) {
            throw new FatalCodingError(e);
        }

        return decoded;
    };
});

/**
 * Decodes a packet from a buffer.
 * @param  {Buffer} buf
 * @return {Packet}
 * @throws {CodingError}
 */
Object.defineProperty(Packets, 'decode', {
    value: function decode (buf) {
        const id = varint.decode(buf);
        if (id === undefined) {
            throw new FatalCodingError('Incomplete protobuf packet.');
        }

        for (const key in idMap) {
            const p = Packets[key];
            if (p.id === id) {
                return p.decode(buf);
            }
        }

        throw new UnknownPacketError(id, buf);
    },
});

export default Packets;
