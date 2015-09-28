import Connector from '../../lib/connector';
import {expect} from 'chai';

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
    })
});
