import socketMaker from '../../lib/socketMaker';
import { expect } from 'chai';

describe('socketMaker', () => {
    it('adds heartbeats handling to a socket', () => {
        const socket = socketMaker('ws://127.0.0.1');
        socket.emit('open');
        expect(socket.listeners('pong').length).to.be.above(0);
    });
});
