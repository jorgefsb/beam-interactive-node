import Packets from './proto/packets';
import Client from './proto/client';
import {EventEmitter} from 'events';
import {bubble} from './util';

// Map of packet types to events that should be sent out on the robot.
const eventMap = [
    { ev: 'report', obj: Packets.Report },
    { ev: 'error', obj: Packets.Error },
];

export default class Robot extends EventEmitter {

    /**
     * Creates a new Robot that interacts with the remote server.
     * @param  {String} remote    Address of the remote Robot server.
     * @param  {Number} channel   The channel ID you're connecting to
     * @param  {String} streamKey Auth key obtained from the API previously.
     */
    constructor (remote, channel, streamKey) {
        super();
        this.handshakePacket = new Packets.Handshake({ channel, streamKey });
        const client = this.client = new Client(remote);


        client.on('message', (message) => {
            const event = eventMap.find((e) => message instanceof e.obj);
            if (event) {
                this.emit(event.ev, message);
            }
        });

        bubble('error', client, this);
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
        const client = this.client;

        client.on('connect', () => {
            client.call(this.handshakePacket, Packets.HandshakeACK, callback);
        });

        client.connect();
    }

    /**
     * Closes the robot and the underlying TCP connection.
     */
    close () {
        this.client.close();
    }
}
