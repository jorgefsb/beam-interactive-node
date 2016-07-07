import Heartbeats from '../../lib/heartbeats';
import { PingTimeoutError } from '../../lib/errors';
import { EventEmitter } from 'events';
import { expect } from 'chai';
import sinon from 'sinon';

describe('heartbeats', () => {
    let clock;
    let socket;
    let beats;

    beforeEach(() => {
        clock = sinon.useFakeTimers();
        beats = new Heartbeats(100, 20);
        beats._ping = sinon.stub();
        socket = new EventEmitter();
        socket.close = sinon.stub();

        beats.start(socket);
    });

    afterEach(() => {
        clock.restore();
    });

    it('runs the ping after an interval', () => {
        expect(beats._ping.called).to.be.false;
        clock.tick(99);
        expect(beats._ping.called).to.be.false;
        clock.tick(2);
        expect(beats._ping.called).to.be.true;
    });

    it('closes the socket without a response after a timeout', () => {
        let err = null;
        socket.once('error', e => { err = e; });

        expect(socket.close.called).to.be.false;
        clock.tick(119);
        expect(socket.close.called).to.be.false;
        expect(err).to.be.null;
        clock.tick(2);
        expect(socket.close.called).to.be.true;
        expect(err).to.be.an.instanceof(PingTimeoutError);
    });

    it('updates the time when touched', () => {
        clock.tick(50);
        beats.touch();
        clock.tick(99);
        expect(beats._ping.called).to.be.false;
        expect(socket.close.called).to.be.false;
        clock.tick(2);
        expect(beats._ping.called).to.be.true;
    });

    it('does not ping after closing', () => {
        socket.emit('close');
        clock.tick(200);

        expect(socket.close.called).to.be.false;
        expect(beats._ping.called).to.be.false;
    });
});
