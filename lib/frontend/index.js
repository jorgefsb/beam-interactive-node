import Packets from './packets';
import Socket from './socket';
import Client from '../client';
import {noop} from '../util';


export default class Frontend extends Client {

    /**
     * Creates a new Robot that interacts with the remote server.
     * @param {Object} options
     * @param {String} options.remote Fully qualified address (including
     *                                ws(s)://) of the remote Robot server.
     * @param {Number} options.channel The channel ID to connect to.
     * @param {Number} options.user    The user ID.
     * @param {Number} options.reportInterval Duration in milliseconds
     *                                        reports should be
     *                                        debounced to.
     * @param {String} options.key     Auth key obtained from the API.
     */
    constructor (options) {
        super(options);
    }

    newConnector () {
        return new Socket(this.options.remote + '/play/' + this.options.channel);
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
                connect.call(new Packets.Handshake({
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
        if (!this.reporter) {
            this.reporter = new Reporter(this, this.options.reportInterval);
        }

        this.reporter.add(data, callback);
    }
}
