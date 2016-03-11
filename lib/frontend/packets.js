import { FatalCodingError, UnknownPacketError } from '../errors';
import isPlain from 'lodash.isplainobject';
import { assert } from '../util';

const idLength = 4;

class BasicPacket {

    /**
     * Encodes the packet to a string to be sent over the websocket.
     * @return {String}
     */
    encode() {
        let encoded;
        if (typeof this.props.toJSON === 'function') {
            encoded = this.props.toJSON();
        } else if (isPlain(this.props)) {
            encoded = JSON.stringify(this.props);
        } else {
            encoded = this.props;
        }

        return this.id + encoded;
    }

    /**
     * Gets a property of the packet, deeply.
     * @param  {String} prop
     * @return {*}
     */
    get(prop) {
        const parts = prop.split('.');

        let obj = this.props;
        while (parts.length && obj !== undefined && obj !== null) {
            obj = obj[parts.shift()];
        }

        return obj;
    }

    /**
     * Returns a plain object of the packet properties.
     * @return {Object}
     */
    toObject() {
        return this.props;
    }

    /**
     * Encodes the packet to a JSON string. This is NOT for wire transfer:
     * use encode() if you need to send the packet to tetrisd.
     * @return {String}
     */
    toJSON() {
        return JSON.stringify(this.props);
    }
}

function packet(name, id) {
    assert(id.length === idLength, 'expected ID length `' + id + '` to be 4');

    // We do a bit of eval here so that the packet is generated with
    // a nice name for debugging purposes.
    /* eslint-disable no-new-func */
    const Packet = (new Function(`
        return function ${name} (obj) {
            this.props = obj;
            this.id = '${id}';
        };
    `))();
    /* eslint-enable */

    Packet.prototype = Object.create(BasicPacket.prototype);

    /**
     * Returns whether the packet give in the string matches this one.
     * @param  {String} str
     * @return {Boolean}
     */
    Packet.matches = function matches(str) {
        return str.slice(0, idLength) === id;
    };

    /**
     * Attempts to decode the packet from the given string. Throws a
     * TypeError if the string is of the wrong type.
     * @param  {String} str
     * @return {Packet}
     * @throws TypeError if the string is of the wrong type
     */
    Packet.decode = function packetDecode(str) {
        let parsed;
        try {
            parsed = JSON.parse(str.slice(id.length));
        } catch (e) {
            throw new FatalCodingError(e);
        }

        return new Packet(parsed);
    };

    return Packet;
}

const packets = {
    Handshake: packet('Handshake', 'hshk'),
    HandshakeACK: packet('HandshakeACK', 'hack'),
    Report: packet('Report', 'data'),
    Error: packet('Error', 'erro'),
    Progress: packet('Progress', 'prog'),
    Playbook: packet('Playbook', 'play'),
    PlaybookACK: packet('PlaybookACK', 'pack'),
    PlaybookState: packet('PlaybookState', 'prdy'),
};

/**
 * Decodes a packet from a string.
 * @param  {String} str
 * @return {Packet}
 * @throws {CodingError}
 */
Object.defineProperty(packets, 'decode', {
    value(str) {
        if (!str || str.length < idLength) {
            throw new FatalCodingError('Incomplete JSON packet.', str);
        }

        for (const key in packets) {
            if (!packets.hasOwnProperty(key)) continue;

            const p = packets[key];
            if (p.matches(str)) {
                return p.decode(str);
            }
        }

        throw new UnknownPacketError(str.slice(0, idLength), str);
    },
});

export default Object.freeze(packets);
