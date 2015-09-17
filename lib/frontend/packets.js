function packet (name, id) {
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

    /**
     * Encodes the packet to a string to be sent over the websocket.
     * @return {String}
     */
    Packet.prototype.encode = function encode () {
        return this.id + JSON.stringify(this.props);
    };

    /**
     * Gets a property of the packet, deeply.
     * @param  {String} prop
     * @return {*}
     */
    Packet.prototype.get = function get (prop) {
        const parts = prop.split('.');

        let obj = this.props;
        while (parts.length && obj !== undefined && obj !== null) {
            obj = obj[parts.shift()];
        }

        return obj;
    };

    /**
     * Returns a plain object of the packet properties.
     * @return {Object}
     */
    Packet.prototype.toObject = function toObject () {
        return this.props;
    };

    /**
     * Encodes the packet to a JSON string. This is NOT for wire transfer:
     * use encode() if you need to send the packet to tetrisd.
     * @return {String}
     */
    Packet.prototype.toJSON = function toJSON () {
        return JSON.stringify(this.props);
    };

    /**
     * Returns whether the packet give in the string matches this one.
     * @param  {String} str
     * @return {Boolean}
     */
    Packet.matches = function matches (str) {
        return str.slice(0, id.length) === id;
    };

    /**
     * Attempts to decode the packet from the given string. Throws a
     * TypeError if the string is of the wrong type.
     * @param  {String} str
     * @return {Packet}
     * @throws TypeError if the string is of the wrong type
     */
    Packet.decode = function decode (str) {
        if (!Packet.matches(str)) {
            throw new TypeError(`Expected packet ${slug} to be ${id} (a ${name} packet)`);
        }

        return new Packet(JSON.parse(str.slice(id.length)));
    };

    return Packet;
}

const packets = Object.freeze({
    Handshake: packet('Handshake', 'hshk'),
    HandshakeACK: packet('HandshakeAcknowledgment', 'hack'),
    Report: packet('Report', 'data'),
    Error: packet('Error', 'erro'),
});

export default packets;

/**
 * Decodes a packet from a string.
 * @param  {String} str
 * @return {Packet} or undefined if the packet is not recognized.
 */
export function decode (str) {
    for (var key in packets) {
        const packet = packets[key];
        if (packet.matches(str)) {
            return packet.decode(str);
        }
    }

    return undefined;
};
