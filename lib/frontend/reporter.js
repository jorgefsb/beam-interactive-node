import Packets from './packets';
import {find, noop} from '../util';

/**
 * The reporter is responsible for building report data and
 * aggregating it if frequent input is given.
 */
export default class Reporter {

    /**
     * Creates a new Reporter.
     * @param  {Client} client
     * @param  {Number} interval
     */
    constructor (client, interval) {
        this.client = client;
        this.interval = interval;
        this.resetQueued();
    }

    /**
     * Adds report data to the queue.
     * @param {Object} data
     * @param {Function} [callback] fired when the report is sent
     */
    add (data, callback = noop) {
        this.mergeTactile(data);
        this.mergeJoystick(data);

        if (!this.waiting) {
            const delay = (this.lastSent + this.interval) - Date.now();
            setTimeout(() => this.runSend(), Math.max(0, delay));
            this.waiting = true;
        }

        this.queued.callbacks.push(callback);
    }

    /**
     * Merges queued tactile data with that of the given report.
     * @param  {Object} data
     */
    mergeTactile (data) {
        const report = this.queued.report;

        for (let i = 0; data.tactile && i < data.tactile.length; i++) {
            const right = data.tactile[i];
            const left = find(report.tactile, (l) => l.id === right.id);

            if (left !== undefined) {
                left.down += right.down;
                left.up += right.up;
            } else {
                report.tactile.push(right);
            }
        }
    }

    /**
     * Merges queued joystick data with that of the given report.
     * @param  {Object} data
     */
    mergeJoystick (data) {
        const report = this.queued.report;

        for (let i = 0; data.joystick && i < data.joystick.length; i++) {
            const right = data.joystick[i];
            const left = find(report.joystick, (l) => l.id === right.id);

            if (left !== undefined) {
                left.x = (left.x + right.x) / 2;
                left.y = (left.y + right.y) / 2;
            } else {
                report.joystick.push(right);
            }
        }
    }

    /**
     * Resets queued data. Should be run after reports are sent.
     * @private
     */
    resetQueued () {
        this.queued = { report: { joystick: [], tactile: [] }, callbacks: [] };
        this.lastSent = Date.now();
        this.waiting = false;
    }

    /**
     * Dispatches queued data out to the socket, and completes
     * any pending callbacks.
     * @private
     */
    runSend () {
        const q = this.queued;
        this.client.send(new Packets.Report(q.report));

        for (let i = 0; i < q.callbacks.length; i++) {
            q.callbacks[i]();
        }

        this.resetQueued();
    }
}
