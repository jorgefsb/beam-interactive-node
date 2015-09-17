import Frontend from '../../lib/frontend';
import {expect} from 'chai';
import async from 'async';
import {setPlayerKey, connectRobot} from './util';

describe('handshake', () => {
    let robot;
    let frontend;
    let options;

    before(function (done) {
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
            key: 'asdf'
        };
        setPlayerKey(13, 'asdf', 1, done);
    });

    afterEach(() => {
        frontend.close();
    });

    after(function () {
        robot.close();
    });

    it('works when connecting to an online stream', function (done) {
        frontend = new Frontend(options);
        frontend.handshake((err) => {
            expect(err).to.be.undefined;
            done();
        });
    });

    it('fails connecting to an offline stream', function (done) {
        options.channel = 666;
        frontend = new Frontend(options);
        frontend.handshake((err) => {
            expect(err).to.be.defined;
            done();
        });
    });
});
