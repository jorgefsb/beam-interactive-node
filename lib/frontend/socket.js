import WebSocket from 'ws';
import Packets, {decode} from './packets';
import Connector from '../connector';

import {noop, bubble} from '../util';

/**
 * Creates a new websocket. If this is running in-browser, it's
 * wrapped for compatibility with the standard EventEmitter API.
 * Note, however, this is just a partial implementation and will
 * need to be expanded if more fancy stuff is required.
 *
 * @param  {String} remote
 * @return {WebSocket}
 */
function makeSocket (remote) {
    const socket = new WebSocket(remote);

    // window will be undefined in node.js
    if (typeof window === 'undefined') {
        return socket;
    }

    function wrapHandler (event, fn) {
        return (ev) => {
            if (event === 'message') {
                return fn(ev.data);
            }

            fn(ev);
        }
    }

    socket.on = function on (event, listener) {
        listener = wrapHandler(event, listener);
        socket.addEventListener(event, listener);
    };

    socket.once = function once (event, listener) {
        listener = wrapHandler(event, listener);
        socket.addEventListener(event, (ev) => {
            listener(ev);
            socket.removeEventListener(event, listener);
        });
    };

    return socket;
}

/**
 * The WeConnector provides high-level interaction against the Robot server,
 * allowing for events as well as request/response flows.
 */
export default class WeConnector extends Connector {

    connect (callback = noop) {
        const socket = this.socket = makeSocket(this.remote);

        bubble('error', socket, this, 'bubbleOpen');

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
