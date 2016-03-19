import Packets from './packets';
import { find, noop, addIf, averageIf } from '../util';

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
    constructor(client, interval) {
        this.client = client;
        this.interval = interval;
        this.resetQueued();
    }

    /**
     * Adds report data to the queue.
     * @param {Object} data
     * @param {Function} [callback] fired when the report is sent
     */
    add(data, callback = noop) {
        this._mergeTactile(data);
        this._mergeJoystick(data);
        this._mergeScreen(data);

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
    _mergeTactile(data) {
        const report = this.queued.report;

        for (let i = 0; data.tactile && i < data.tactile.length; i++) {
            const right = data.tactile[i];
            const left = find(report.tactile, (l) => l.id === right.id);

            if (left !== undefined) {
                left.down = addIf(left.down, right.down);
                left.up = addIf(left.up, right.up);
            } else {
                report.tactile.push(right);
            }
        }
    }

    /**
     * Merges provided joystick input data with that of the queued report.
     * @param  {Object} data
     */
    _mergeJoystick(data) {
        const report = this.queued.report;

        for (let i = 0; data.joystick && i < data.joystick.length; i++) {
            this._mergeCoordinates(report.joystick, data.joystick[i]);
        }
    }

    /**
     * Merges a coordinate report with the corresponding
     * record in the array, averaging its means if one exists
     * or creating a new report if it doesn't.
     *
     * @param  {Array} arr
     * @param  {Object} right
     * @return {Object} the target recrod
     */
    _mergeCoordinates(arr, right) {
        const left = find(arr, (l) => l.id === right.id);

        if (left === undefined) {
            arr.push(right);
            return right;
        }

        left.x = averageIf(left.x, right.x);
        left.y = averageIf(left.y, right.y);
        return left;
    }

    /**
     * Merges provided screen input data with that of the queued report.
     * @param  {Object} data
     */
    _mergeScreen(data) {
        const report = this.queued.report;

        for (let i = 0; data.screen && i < data.screen.length; i++) {
            const right = data.screen[i];
            const left = this._mergeCoordinates(report.screen, right);

            if (left !== right) {
                left.clicks = addIf(left.clicks, right.clicks);
            }
        }
    }

    /**
     * Resets queued data. Should be run after reports are sent.
     * @private
     */
    resetQueued() {
        this.queued = {
            report: {
                joystick: [],
                tactile: [],
                screen: [],
            },
            callbacks: [],
        };

        this.lastSent = Date.now();
        this.waiting = false;
    }

    /**
     * Dispatches queued data out to the socket, and completes
     * any pending callbacks.
     * @private
     */
    runSend() {
        const q = this.queued;
        this.client.send(new Packets.Report(q.report));

        for (let i = 0; i < q.callbacks.length; i++) {
            q.callbacks[i]();
        }

        this.resetQueued();
    }
}
