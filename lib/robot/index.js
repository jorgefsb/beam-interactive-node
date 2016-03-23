import Packets from './packets';
import Socket from '../connector';
import Client from '../client';
import Heartbeat from './heartbeats';
import { find } from '../util';

// Map of packet types to events that should be sent out on the robot.
const eventMap = [
    { ev: 'report', obj: Packets.Report },
    { ev: 'error', obj: Packets.Error },
];

export default class Robot extends Client {

    /**
     * Creates a new Robot that interacts with the remote server.
     * @param  {Object} options
     * @param  {String} options.remote  Address of the remote Robot server.
     * @param  {Number} options.channel The channel ID you're connecting to
     * @param  {String} options.key     Auth key obtained from the API.
     * @param {Boolean} [options.playbook=false] Whether the client should
     *                                           be started in playbook mode.
     * @param {Number} [options.reportInterval] Duration in milliseconds
     *                                          reports should be debounced
     *                                          to. Optional in playbook mode.
     */
    constructor(options) {
        super(options);
    }

    newConnector() {
        const socket = new Socket(
            (packet) => packet.encode(),
            (data) => Packets.decode(data),
            Packets.Error, this.options.remote + '/robot'
        );

        socket.heartbeater(new Heartbeat(
            this.options.ping.interval,
            this.options.ping.timeout
        ));

        socket.on('message', (message) => {
            const event = find(eventMap, (e) => message instanceof e.obj);
            if (event) {
                this.emit(event.ev, message);
            }
        });

        return socket;
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
    handshake(callback) {
        const connect = this.connect;

        connect.on('connect', () => {
            this.call(new Packets.Handshake({
                channel: this.options.channel,
                streamKey: this.options.key,
            }), Packets.HandshakeACK, callback);
        });

        connect.connect();
    }
}
