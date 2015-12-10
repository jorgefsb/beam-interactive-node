import Packets from '../../../lib/robot/packets';
import {UnknownPacketError, FatalCodingError} from '../../../lib/errors';
import {expect, assert} from 'chai';

describe('robot packets', () => {
    const errPacket = new Buffer([
        0x03, 0x0a, 0x0c, 0x48, 0x65, 0x6c, 0x6c, 0x6f,
        0x20, 0x77, 0x6f, 0x72, 0x6c, 0x64, 0x21
    ]);

    it('encodes a packet correctly', () => {
        const packet = new Packets.Error({ message: 'Hello world!' });
        expect(packet.encode().equals(errPacket)).to.be.true;
    });

    it('decodes a packet correctly', () => {
        const packet = new Packets.Error({ message: 'Hello world!' });
        expect(Packets.Error.decode(errPacket)).to.deep.equal(packet);
        expect(Packets.decode(errPacket)).to.deep.equal(packet);
    });

    it('throws an error on malformed packet id', () => {
        expect(() => Packets.decode(new Buffer([0xff]))).to.throw(FatalCodingError);
    });

    it('throws an error on malformed packet body', () => {
        expect(() => Packets.decode(new Buffer([0x03, 0x08, 0x96, 0x01]))).to.throw(FatalCodingError);
    });

    it('throws an error if invalid packet ID', () => {
        expect(() => Packets.decode(new Buffer([0xff, 0x00]))).to.throw(UnknownPacketError);
    });
});
