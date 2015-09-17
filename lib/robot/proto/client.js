import {Encoder, Decoder} from './stream';
import {Socket} from 'net';
import Client from '../../client';
import Packets from './packets';

import {noop, bubble} from '../../util';

/**
 * The ProtoClient provides high-level interaction against the Robot server,
 * allowing for events as well as request/response flows.
 */
export default class ProtoClient extends Client {

    connect (callback = noop) {
        const socket = this.socket = new Socket();

        const encoder = this.encoder = new Encoder();
        const decoder = this.decoder = new Decoder();

        encoder.pipe(socket);
        socket.pipe(decoder);

        bubble('error', encoder, this);
        bubble('error', decoder, this);
        bubble('error', socket, this);
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
        if (this.socket) this.socket.end();
    }
}
