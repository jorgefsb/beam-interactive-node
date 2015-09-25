export default class Reporter {

    /**
     * Creates a new reporter
     * @param {Number} interval    Report interval
     * @param {Function} caller    Used to send data to tetrisd
     */
    constructor (interval, caller) {
        this.reportQueue = {
            tactile: [],
            joystick: [],
        };
        this.caller = caller;
        this.interval = interval;
    }

    /**
     * Add data to the report queue
     *
     * @param {String} Type of report (tactile or joystick)
     * @param {Object} data
     */
    add (type, data) {
        // Determine what the "id" key is based on type
        let key;
        if (type === 'tactile') {
            key = 'key';
        } else {
            key = 'axis';
        }

        // Utility boolean for later
        let found = false;

        // If the element already exists, update it's values instead of inserting
        this.reportQueue[type] = this.reportQueue[type].map((obj) => {
            // Match found when the "id" key is found
            if (obj[key] === data[key]) {
                found = true;
                // Iterate over the object properties and either add up or replace
                let k;
                for (k in p) {
                    if (k === 'value') {
                        obj[k] = data[k];
                    }
                    if (k === 'down' || k === 'up') {
                        obj[k] += data[k];
                    }
                }
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
    startTicker () {
        if (!this.interval) {
            return;
        }
        this.interval = setInterval(() => {
            this.caller();
            this.reportQueue = {
                tactile: [],
                joystick: [],
            };
        }, this.interval);
    }

    /**
     * Stop the internal ticker
     */
    stopTicker () {
        clearInterval(this.interval);
    }

}
