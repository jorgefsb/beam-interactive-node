import {Encoder, Decoder} from './stream';
import {Socket} from 'net';
import Connector from '../../connector';
import Packets from './packets';

import {noop, bubble} from '../../util';

/**
 * The ProtoConnector provides high-level interaction against the
 * Robot server, allowing for events as well as request/response flows.
 */
export default class ProtoConnector extends Connector {

    connect (callback = noop) {
        const socket = this.socket = new Socket();

        const encoder = this.encoder = new Encoder();
        const decoder = this.decoder = new Decoder();

        encoder.pipe(socket);
        socket.pipe(decoder);

        bubble('error', encoder, this, 'bubbleOpen');
        bubble('error', decoder, this, 'bubbleOpen');
        bubble('error', socket, this, 'bubbleOpen');
        bubble('end', socket, this);

        decoder.on('message', (message) => this.handleIncoming(message));

        const [ host, port ] = this.remote.split(':');
        socket.connect(parseInt(port, 10), host, (err) => {
            if (err) {
                this.emit('error', err);
            } else {
                this.emit('connect');
            }

            callback(err);
        });

        return this;
    }

    getErrorPacket () {
        return Packets.Error;
    }

    send (packet) {
        this.encoder.push(packet);
    }

    close () {
        if (this.socket) {
            this.socket.end();
            this.setOpen(false);
        }
    }
}
