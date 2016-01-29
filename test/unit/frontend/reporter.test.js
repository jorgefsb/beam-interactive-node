import Reporter from '../../../lib/frontend/reporter';
import {expect} from 'chai';
import sinon from 'sinon';


describe('reporter', () => {
    let clock;
    let reporter;
    let mock;

    beforeEach(() => {
        clock = sinon.useFakeTimers();
        mock = { send: sinon.stub() };
        reporter = new Reporter(mock, 50);
    });

    afterEach(() => {
        clock.restore();
    })

    it('merges reports', () => {
        expect(reporter.queued.report).to.deep.equal({ joystick: [], tactile: [] });

        reporter.add({});
        expect(reporter.queued.report).to.deep.equal({ joystick: [], tactile: [] });

        reporter.add({
            joystick: [{ id: 0, x: 0.5, y: 0.25 }],
            tactile: [{ id: 2, down: 3, up: 2 }]
        });
        expect(reporter.queued.report).to.deep.equal({
            joystick: [{ id: 0, x: 0.5, y: 0.25 }],
            tactile: [{ id: 2, down: 3, up: 2 }]
        });

        reporter.add({
            joystick: [{ id: 0, x: 0.7, y: 0.45 }, { id: 1, x: 0.3, y: 0.6 }],
            tactile: [{ id: 2, down: 1, up: 1 }, { id: 3, down: 1, up: 1 }]
        });
        expect(reporter.queued.report).to.deep.equal({
            joystick: [{ id: 0, x: 0.6, y: 0.35 }, { id: 1, x: 0.3, y: 0.6 }],
            tactile: [{ id: 2, down: 4, up: 3 }, { id: 3, down: 1, up: 1 }]
        });
    });

    it('sends correctly', () => {
        const c1 = sinon.stub();
        const c2 = sinon.stub();
        const c3 = sinon.stub();

        reporter.add({
            joystick: [{ id: 0, x: 0.5, y: 0.25 }],
            tactile: [{ id: 2, down: 3, up: 2 }]
        }, c1);
        clock.tick(51);
        expect(c1.called).to.be.true;
        expect(mock.send.args.length).to.equal(1);
        expect(mock.send.args[0][0].props).to.deep.equal({
            joystick: [{ id: 0, x: 0.5, y: 0.25 }],
            tactile: [{ id: 2, down: 3, up: 2 }]
        });

        reporter.add({
            joystick: [{ id: 0, x: 0.5, y: 0.25 }],
            tactile: [{ id: 2, down: 3, up: 2 }]
        }, c2);
        clock.tick(20);
        reporter.add({
            joystick: [{ id: 0, x: 0.7, y: 0.45 }, { id: 1, x: 0.3, y: 0.6 }],
            tactile: [{ id: 2, down: 1, up: 1 }, { id: 3, down: 1, up: 1 }]
        }, c3);
        clock.tick(31);

        expect(c2.called).to.be.true;
        expect(c3.called).to.be.true;
        expect(mock.send.args.length).to.equal(2);
        expect(mock.send.args[1][0].props).to.deep.equal({
            joystick: [{ id: 0, x: 0.6, y: 0.35 }, { id: 1, x: 0.3, y: 0.6 }],
            tactile: [{ id: 2, down: 4, up: 3 }, { id: 3, down: 1, up: 1 }]
        });
    });
});
