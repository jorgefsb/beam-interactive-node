import { EventEmitter } from 'events';
import { strRepeat, indent, bubble } from './util';


export default class Client extends EventEmitter {

    constructor(options) {
        super();

        this.options = Object.assign({
            debug: false,
            ping: { timeout: 1000, interval: 3000 },
        }, options);

        this.connect = this.newConnector();
        bubble('error', this.connect, this);
        bubble('close', this.connect, this);

        // By default Node throws when errors are emitted without a listener.
        // But it's quite bad at printing out those errors. We'll watch
        // and process for uncaught error events manually.
        this.on('error', (err) => {
            if (this.listeners('error').length > 1) {
                return;
            }

            /* eslint-disable no-console */
            console.error(this.prettyError(err));
            /* eslint-enable */
        });

        if (this.options.debug) {
            this.connect
                .on('raw-message', (data) => this.logEntry(data, true))
                .on('sending', (data) => this.logEntry(data, false));
        }
    }

    /**
     * Logs an incoming/outgoing series of bytes. Used in debug mode.
     * @param  {*} data
     * @param  {Boolean} incoming
     */
    logEntry(data, incoming) {
        const now = new Date();
        let message = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()} ` +
            strRepeat(incoming ? '<' : '>', 3) + ' ';

        if (Buffer.isBuffer(data)) {
            message += data.toString('hex');
        } else {
            message += data;
        }

        /* eslint-disable no-console */
        console.log(message);
        /* eslint-enable */
    }

    /**
     * Pretty-prints a client error.
     * @param  {Error} err
     */
    prettyError(err) {
        const divider = strRepeat('-', 20) + ' ';
        let output = divider +
            'Uncaught error in the tetris ' + this.constructor.name + ' client.\n\n' +
            '    > ' + err.toString() + '\n\n' +
            'Client options:\n' +
            indent(JSON.stringify(this.options, null, '  '), 1) + '\n\n';

        if (err.stack) {
            output += 'Stack trace: ' + err.stack + '\n\n';
        }

        if (typeof err === 'object' && Object.keys(err).length > 0) {
            output += 'Error: \n' + indent(JSON.stringify(err, null, '  '), 1) + '\n\n';
        }

        output += divider + '\n';

        return output;
    }

    /**
     * Creates and returns a new Connector based on the client options.
     * @protected
     * @return {Connector}
     */
    newConnector() {
        throw new Error('not implemented');
    }

    /**
     * Sends a packet to the underlying connection.
     * @param  {Object} packet
     */
    send(packet) {
        this.connect.send(packet);
    }

    /**
     * Sends a packet that a responses is expected to.
     * @param  {Object}   packet
     * @param  {Function} response Class of the packet response.
     * @param  {Function} callback
     */
    call(packet, response, callback) {
        this.connect.call(packet, response, callback);
    }

    /**
     * Closes the client and the underlying connection.
     */
    close() {
        this.connect.close();
    }
}
