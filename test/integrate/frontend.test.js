import Frontend from '../../lib/frontend';
import { expect } from 'chai';
import { setPlayerKey, connectRobot } from './util';

describe('frontend', () => {
    let robot;
    let frontend;
    let options;

    before(done => {
        connectRobot((err, r) => {
            robot = r;
            done(err);
        });
    });

    beforeEach((done) => {
        options = {
            remote: 'ws://127.0.0.1:3443',
            channel: 42,
            user: 13,
            key: 'asdf',
        };
        setPlayerKey(13, 'asdf', 1, done);
    });

    afterEach(() => {
        frontend.close();
    });

    after(() => {
        robot.close();
    });

    it('works when connecting to an online stream', done => {
        frontend = new Frontend(options);
        frontend.handshake((err) => {
            expect(err).to.be.undefined;
            done();
        });
    });

    it('fails connecting to an offline stream', done => {
        options.channel = 666;
        frontend = new Frontend(options);
        frontend.handshake((err) => {
            expect(err).to.be.defined;
            done();
        });
    });
});
