import {Encoder, Decoder} from './stream';
import {EventEmitter} from 'events';
import {Socket} from 'net';
import Packets from './packets';

import {noop, bubble} from '../util';

/**
 * The ProtoClient provides high-level interaction against the Robot server,
 * allowing for events as well as request/response flows.
 */
export default class ProtoClient extends EventEmitter {

    /**
     * Creates a new ProtoClient.
     * @param  {String} remote ip:port of the robot server.
     */
    constructor (remote) {
        super();
        this.handlers = [];
        this.remote = remote;
    }

    /**
     * Connects the protocol client to the given remote address.
     * @param  {Function} callback Invoked when the connection is established,
     *                             or fails.
     * @return {ProtoClient}
     */
    connect (callback=noop) {
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

    /**
     * Handles an incoming message. This watches for replies from "called"
     * functions before dispatching an event. Using this method, calls
     * can be safely concurrent.
     *
     * This relies partly on the assumption that requests set first will be
     * answered first (FIFO), which is currently an attribute of the Tetrisd
     * server. If this ever is not the case, the protocol will be adjusted
     * so that packets can be numbered.
     *
     * @private
     */
    handleIncoming (message) {
        for (let i = 0; i < this.handlers.length; i++) {
            if (this.handlers[i](message)) {
                this.handlers.splice(i, 1);
                return;
            }
        }

        this.emit('message', message);
    }

    /**
     * Sends the packet to the server, then waits for the expected reply
     * (or an error) in response.
     * @param  {Object} packet
     * @param  {Class} Expected
     * @param  {Function} callback
     */
    call (packet, Expected, callback) {
        this.handlers.push((message) => {
            if (message instanceof Expected) {
                callback(undefined, message);
            } else if (message instanceof Packets.Error) {
                callback(message);
            } else {
                return false;
            }

            return true;
        });

        this.encoder.push(packet);
    }

    /**
     * Sends a packet to the robot.
     * @param  {Packet} packet
     */
    send (packet) {
        this.encoder.push(packet);
    }

    /**
     * Closes the client socket.
     */
    close () {
        if (this.socket) this.socket.end();
    }
}
