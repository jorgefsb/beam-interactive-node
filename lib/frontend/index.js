import Packets from './packets';
import Socket from './socket';
import Client from '../client';


export default class Frontend extends Client {

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
        super(options);
        this.reportQueue = {
            tactile: [],
            joystick: []
        };
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
     * @param {Function} callback Invoked when a handshake resolves. If
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
     * Add data to the report queue
     *
     * @param {String} Type of report (tactile or joystick)
     * @param {Object} data
     */
    report (type, data) {

        // Determine what the "id" key is based on type
        if (type === 'tactile') {
            let key = 'key';
        } else {
            let key = 'axis';
        }

        // Utility boolean for later
        let found = false;

        // If the element already exists, update it's values instead of inserting
        this.reportQueue[type] = this.reportQueue[type].map((obj) => {
            // Match found when the "id" key is found
            if (obj[key] === data[key]) {
                found = true;
                // Iterate over the object properties and either add up or replace
                Object.keys(obj).forEach(function (element, k) {
                    if (k === 'value') {
                        obj[k] = data[k];
                    }
                    if (k === 'down' || k === 'up') {
                        obj[k] += data[k];
                    }
                });
            }
        });

        // If we didn't find the data, just add it
        if (!found) {
            this.reportQueue[type] = data;
        }
    }

    /**
     * Start the internal ticker
     */
    startReportTicker (data) {
        if (!this.interval) {
            return;
        }
        this.interval = setInterval(() => {
            this.connect.call(new Packets.Report(this.reportQueue));
            this.reportQueue = {
                tactile: [],
                joystick: []
            };
        }, this.interval);
    }

    /**
     * Stop the internal ticker
     */
    stopReportTicker () {
        clearInterval(this.interval);
    }

    /**
     * Set the internal reportInterval
     *
     * @param {Number} interval
     */
    setReportInterval (interval) {
        this.interval = interval;
    }
}
