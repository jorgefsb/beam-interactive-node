import {EventEmitter} from 'events';

/**
 * The Client provides a high-level interface, implemented to interact
 * with Tetrisd on the frontend and robot.
 */
export default class Client extends EventEmitter {

    /**
     * Creates a new WsClient.
     * @param  {String} remote remote address of the server.
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
     * @return {Client}
     */
    connect () {
        throw new Error('Not implemented.');
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
     * Returns the class of an error packet for this client type.
     * @return {Function}
     * @private
     */
    getErrorPacket () {
        throw new Error('Not implemented.');
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
            } else if (message instanceof this.getErrorPacket()) {
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
     */
    send () {
        throw new Error('Not implemented.');
    }

    /**
     * Closes the client socket.
     */
    close () {
        throw new Error('Not implemented.');
    }
}
