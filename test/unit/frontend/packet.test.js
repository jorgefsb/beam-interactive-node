import Packets from '../../../lib/frontend/packets';
import {UnknownPacketError, FatalCodingError} from '../../../lib/errors';
import {expect, assert} from 'chai';

describe('frontend packets', () => {
    const report = new Packets.Report({
        joystick: [
            { axis: 0, value: 0.5 },
            { axis: 1, value: 0.75 },
        ],
        tactile: [
            { key: 0, down: 1 },
            { key: 38, down: 2, up: 1 },
        ]
    });

    const err = new Packets.Error({ message: 'Hello world!' });

    it('decodes a single packet', () => {
        const expected = new Packets.Error({ message: 'Hello world!' });
        expect(Packets.Error.decode('erro{"message":"Hello world!"}')).to.deep.equal(expected);
        expect(Packets.decode('erro{"message":"Hello world!"}')).to.deep.equal(expected);
    });

    it('throws correctly decoding an incomplete packet', () => {
        expect(() => Packets.decode('er')).to.throw(FatalCodingError);
    });

    it('throws correctly decoding an invalid packet', () => {
        expect(() => Packets.decode('erro{asdfsdf}')).to.throw(FatalCodingError);
    });

    it('throws correctly decoding an unknown', () => {
        try {
            Packets.decode('wtff{"foo":42}')
        } catch (e) {
            expect(e).to.be.an.instanceof(UnknownPacketError);
            expect(e.data).to.equal('wtff{"foo":42}');
            return;
        }

        assert.fail('decode should have thrown');
    });

    it('encodes plain object', () => {
        expect(new Packets.Error({ message: 'Hello world!' }).encode()).to.equal('erro{"message":"Hello world!"}');
    });

    it('encodes custom fn', () => {
        expect(new Packets.Error({ toJSON: () => '{"foo":"bar"}' }).encode()).to.equal('erro{"foo":"bar"}');
    });

    it('encodes whatever', () => {
        expect(new Packets.Error('wat').encode()).to.equal('errowat');
    });

    it('converts to json', () => {
        expect(err.toJSON()).to.equal('{"message":"Hello world!"}');
    });

    it('converts to plain object', () => {
        expect(err.toObject()).to.deep.equal({ message: "Hello world!" });
    });

    it('gets attributes', () => {
        expect(report.get('tactile')).to.deep.equal(report.props.tactile);
        expect(report.get('tactile.0.down')).to.equal(1);
        expect(report.get('tactile.a.b')).to.be.undefined;
    })
});
