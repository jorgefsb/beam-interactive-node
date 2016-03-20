import { UnknownPacketError, UnexpectedServerResponse } from './errors';
import { EventEmitter } from 'events';
import { noop, bubble } from './util';
import makeSocket from './socketMaker';

/**
 * The Connector provides a high-level interface, implemented to interact
 * with Tetrisd on the frontend and robot.
 */
export default class Connector extends EventEmitter {

    /**
     * Creates a new Connector.
     * @param {Function} decode
     * @param {Function} encode
     * @param {Function} errorPacket
     * @param {String} remote remote address of the server.
     */
    constructor(encode, decode, errorPacket, remote) {
        super();
        this.handlers = [];
        this.remote = remote;
        this.errorPacket = errorPacket;
        this.encode = encode;
        this.decode = decode;
        this.open = true;
    }

    /**
     * Attempts to start a connection to the remote server.
     * @param {Function} [callback]
     * @param {Function} [generator]
     */
    connect(callback = noop, generator = makeSocket) {
        const socket = this.socket = generator(this.remote);

        bubble('error', socket, this, 'bubbleOpen');
        // Always bubble close
        bubble('close', socket, this);

        socket.once('open', () => {
            this.emit('connect');
            callback();
        });

        socket.on('unexpected-response', (req, res) => {
            callback(new UnexpectedServerResponse(
                `Unexpected server response ${res.statusCode}`));
        });

        socket.on('message', (data) => this.doDecode(data));
    }

    /**
     * Attempts to decode an incoming message.
     * @param  {String|Buffer} data
     */
    doDecode(data) {
        this.emit('raw-message', data);

        let message;
        try {
            message = this.decode(data);
        } catch (e) {
            if (e instanceof UnknownPacketError) {
                this.emit('unrecognized', e.data);
            } else {
                this.emit('error', e);
            }

            return;
        }

        this.handleIncoming(message);
    }

    /**
     * Sets whether the Connector is open. This is if the Connector
     * is currently connected _or trying to connection_. It's independent
     * of the underlying socket connection.
     * @param {Boolean} state
     */
    setOpen(state) {
        this.open = state;
    }

    /**
     * Gets the opened state of the socket.
     * @return {Boolea}
     */
    getOpen() {
        return this.open;
    }

    /**
     * Bubbles an event if the connector is open.
     * @protected
     * @param {String} event
     * @param {...} args
     */
    bubbleOpen(event, ...args) {
        if (this.open) this.emit(event, ...args);
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
    handleIncoming(message) {
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
    call(packet, Expected, callback) {
        this.handlers.push((message) => {
            if (message instanceof Expected) {
                callback(undefined, message);
            } else if (message instanceof this.errorPacket) {
                callback(message);
            } else {
                return false;
            }

            return true;
        });

        this.send(packet);
    }

    /**
     * Sends a packet to tetrisd.
     * @param  {Packet} packet
     * @return {Connector}
     */
    send(packet) {
        let encoded;
        try {
            encoded = this.encode(packet);
        } catch (e) {
            return this.emit('error', e);
        }

        this.emit('sending', encoded);
        this.socket.send(encoded);
        return this;
    }

    /**
     * Closes the client socket.
     */
    close() {
        if (this.socket) {
            this.socket.close();
            this.socket = undefined;
        }
    }
}
