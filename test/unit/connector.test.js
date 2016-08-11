import Connector from '../../lib/connector';
import { expect } from 'chai';
import { EventEmitter } from 'events';

describe('connector', () => {
    it('bubbles error correctly', () => {
        const c = new Connector('');
        let i = 0;
        c.on('error', () => i++);

        expect(i).to.equal(0);
        c.bubbleOpen('error', 'asdf');
        expect(i).to.equal(1);
        c.setOpen(false);
        c.bubbleOpen('error', 'asdf');
        expect(i).to.equal(1);
    });

    it('emits a disconnect event when the socket disconnects', callback => {
        const c = new Connector('');
        const emitter = new EventEmitter();
        c.connect(() => {}, () => emitter);
        c.on('disconnect', callback);
        emitter.emit('close');
    });

    it('emits a reconnect event after disconnecting', callback => {
        const c = new Connector('');
        const emitter = new EventEmitter();
        c.connect(() => {}, () => {
            setTimeout(() => {
                emitter.emit('open');
            }, 100);
            return emitter;
        });
        c.reconnectAttempts = -1;
        emitter.emit('close');
        c.on('disconnect', callback);
        c.on('reconnect', callback);
    });
});
