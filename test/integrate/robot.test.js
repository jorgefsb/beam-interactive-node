import Robot from '../../lib/robot';
import {expect} from 'chai';
import async from 'async';
import {setGamerKey, setGame} from './util';

describe('handshake', () => {
    let robot;

    beforeEach(function (done) {
        async.parallel([
            async.apply(setGamerKey, 42, 'asdf', 3),
            async.apply(setGame, 3, { reportInterval: 100 }),
        ], done);
    });

    afterEach(function () {
        robot.close();
    });

    it('handshakes when valid', function (done) {
        robot = new Robot('127.0.0.1:3442', 42, 'asdf');
        robot.handshake((err) => {
            expect(err).to.be.undefined;
            done();
        });
    });

    it('fails when invalid', function (done) {
        robot = new Robot('127.0.0.1:3442', 42, 'asdfasdfsdfsd');
        robot.handshake((err) => {
            expect(err).to.be.defined;
            expect(err.message).to.equal('Invalid channel ID or key.')
            done();
        });
    });

    describe('functionality', function () {
        beforeEach(function (done) {
            robot = new Robot('127.0.0.1:3442', 42, 'asdf');
            robot.handshake((err) => {
                expect(err).to.be.undefined;
                done();
            });
        });

        it('gets reports', function (done) {
            robot.on('report', function (report) {
                expect(report).to.containSubset({
                    quorum: 0,
                    connected: 0,
                    joystick: [],
                    tactile: []
                });
                done();
            });
        });
    });
});
