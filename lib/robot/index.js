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
export default class Robot extends Client {

    newConnector() {
        const socket = new Socket(
            packet => packet.encode(),
            data => Packets.decode(data),
            Packets.Error, `${this.options.remote}/robot`
        );

        socket.heartbeater(new Heartbeat(
            this.options.ping.interval,
            this.options.ping.timeout
        ));

        socket.on('message', message => {
            const event = find(eventMap, e => message instanceof e.obj);
            if (event) {
                this.emit(event.ev, message);
            }
        });

        return socket;
    }

    /**
     * @override
     */
    sendHandshake(callback) {
        this.call(new Packets.Handshake({
            channel: this.options.channel,
            streamKey: this.options.key,
        }), Packets.HandshakeACK, callback);
    }
}
