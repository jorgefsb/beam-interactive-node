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

    it('bubbles close correctly', () => {
        const c = new Connector('');
        const emitter = new EventEmitter();
        let i = false;
        c.connect(() => {}, () => emitter);
        c.on('close', () => { i = true; });
        emitter.emit('close');
        expect(i).to.be.ok;
    });
});
