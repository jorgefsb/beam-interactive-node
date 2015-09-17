import Packets from '../../../lib/frontend/packets';
import {expect} from 'chai';

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

    it('decodes', () => {
        expect(Packets.Error.decode('erro{"message":"Hello world!"}').get('message')).to.equal('Hello world!');
    });

    it('encodes', () => {
        expect(err.encode()).to.equal('erro{"message":"Hello world!"}');
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
