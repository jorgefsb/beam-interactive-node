import Packets from './packets';
import Socket from './socket';
import {EventEmitter} from 'events';
import {bubble} from '../util';


export default class Frontend extends EventEmitter {

    /**
     * Creates a new Robot that interacts with the remote server.
     * @param {Object} options
     * @param {String} options.remote Fully qualified address (including
     *                                ws(s)://) of the remote Robot server.
     * @param {Number} options.channel The channel ID to connect to.
     * @param {Number} options.user    The user ID.
     * @param {String} options.key     Auth key obtained from the API.
     */
    constructor (options) {
        super();
        this.socket = new Socket(options.remote + '/play/' + options.channel);
        this.handshakePacket = new Packets.Handshake({
            id: options.user,
            key: options.key,
        });

        bubble('error', this.socket, this);
    }

    /**
     * Sends a handshake packet and waits for a response from the server.
     * This method should be invoked prior to any other methods being run,
     * and it's expected that you'll wait for a callback before
     * invoking other methods.
     *
     * @param {Function} callback Invoked when a handshake resolves. Iff
     *                            it fails, it will be called with an error
     *                            as its first argument.
     */
    handshake (callback) {
        const socket = this.socket;

        socket.connect((err) => {
            if (err) {
                callback(err);
            } else {
                socket.call(this.handshakePacket, Packets.HandshakeACK, callback);
            }
        });
    }

    /**
     * Closes the robot and the underlying TCP connection.
     */
    close () {
        this.socket.close();
    }
}
