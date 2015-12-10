import Packets from './packets';
import Socket from '../connected';
import Client from '../client';
import Reporter from './reporter';
import {noop} from '../util';


export default class Frontend extends Client {

    /**
     * Creates a new Robot that interacts with the remote server.
     * @param {Object} options
     * @param {String} options.remote Fully qualified address (including
     *                                ws(s)://) of the remote Robot server.
     * @param {Number} options.channel The channel ID to connect to.
     * @param {Number} options.user    The user ID.
     * @param {Boolean} [options.playbook=false] Whether the client should
     *                                           be started in playbook mode.
     * @param {Number} [options.reportInterval] Duration in milliseconds
     *                                          reports should be debounced
     *                                          to. Optional in playbook mode.
     * @param {String} options.key     Auth key obtained from the API.
     */
    constructor (options) {
        super(options);

        this.reporter = new Reporter(this, this.options.reportInterval);
    }

    newConnector () {
        let endpoint;
        if (this.options.playbook) {
            endpoint = this.options.remote + '/playbook';
        } else {
            endpoint = this.options.remote + '/play/' + this.options.channel;
        }

        const socket = new Socket(
            (packet) => packet.encode(),
            (data) => Packets.decode(data),
            Packets.Error, endpoint
        );

        socket.on('message', (packet) => {
            this.emit('message', packet);
            this.emit(packet.id, packet.props);
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
    handshake (callback) {
        const connect = this.connect;

        connect.connect((err) => {
            if (err) {
                callback(err);
            } else {
                this.call(new Packets.Handshake({
                    id: this.options.user,
                    key: this.options.key,
                }), Packets.HandshakeACK, callback);
            }
        });
    }

    /**
     * Sends a new report with some data.
     * @param {Object} data
     * @param {Function} callback
     */
    report (data, callback = noop) {
        this.reporter.add(data, callback);
    }

    /**
     * Creates and returns a packet by name.
     * @param {String} name
     * @param {Object} [data] to populate the packet. If not passed, the
     *                        class will be returned.
     * @return {Object|Function}
     */
    static Packet (name, data) {
        const Packet = Packets[name];
        if (Packet === undefined) {
            throw new Error(`Tried to instatiate unknown packet "${name}".`);
        }

        return data ? new Packet(data) : Packet;
    }
}
