import { PingTimeoutError } from './errors';

export default class Heartbeat {

    /**
     * The Heartbeater attaches to a socket and is responsible for monitoring
     * the connections state and emitting a `close` event if the connection
     * is detected to be dead.
     * @param  {Number} interval number of ms between heartbeat packets.
     * @param  {Number} timeout  duration in ms to be considered dead if we
     *                           don't get a ping back from the server.
     */
    constructor(interval, timeout) {
        this._socket = null;
        this._interval = interval;
        this._timeout = timeout;

        this._timers = [];
    }

    /**
     * Starts the heartbeat pinging on the socket.
     * @param  {Socket} socket
     * @return {Heartbeats}
     */
    start(socket) {
        this._socket = socket;
        this.touch();

        socket.on('error', () => this.close());
        socket.on('close', () => this.close());
        socket.on('message', () => this.touch());

        return this;
    }

    /**
     * Called at an interval to send a ping packet from to Tetrisd.
     * If/when the ping is reponded to, you may call .touch().
     */
    _ping() {
        throw new Error('not implement');
    }

    /**
     * Touch tells the heartbeater that data was received from the server.
     */
    touch() {
        this._timers.forEach((t) => clearTimeout(t));

        this._timers = [
            setTimeout(() => this._ping(), this._interval),
            setTimeout(() => {
                this._socket.emit('error', new PingTimeoutError());
                this._socket.close();
            }, this._interval + this._timeout),
        ];
    }

    /**
     * Closes the heartbeater. Called when the socket is closed.
     */
    close() {
        this._timers.forEach((t) => clearTimeout(t));
    }
}
