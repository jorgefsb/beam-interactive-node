import WebSocket from 'ws';
import Packets, {decode} from './packets';
import Connector from '../connector';

import {noop, bubble} from '../util';

/**
 * The WeConnector provides high-level interaction against the Robot server,
 * allowing for events as well as request/response flows.
 */
export default class WeConnector extends Connector {

    connect (callback = noop) {
        const socket = this.socket = new WebSocket(this.remote);

        bubble('error', socket, this);

        socket.once('open', () => {
            this.emit('connect');
            callback();
        });

        // Tetrisd will return a 404 if the stream is offline. The websocket
        // connection will then fail. We have to handle that specifically.
        socket.on('unexpected-response', (req, res) => {
            if (res.statusCode === 404) {
                return callback(new Packets.Error({ message: 'The gamer is offline.'}));
            }

            this.emit('error', new Error('unexpected server response (' + res.statusCode + ')'));
        });

        socket.on('message', (data) => {
            const message = decode(data);
            if (message) {
                this.handleIncoming(message);
            } else {
                this.emit('unrecognized', data);
            }
        });

        return this;
    }

    getErrorPacket () {
        return Packets.Error;
    }

    send (packet) {
        this.socket.send(packet.encode());
    }

    close () {
        if (this.socket) this.socket.close();
    }
}
