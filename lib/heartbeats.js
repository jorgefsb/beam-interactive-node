
import sendHeartbeats from 'ws-heartbeats';

const defaultOptions = {
    heartbeatInterval: 3000,
    heartbeatTimeout: 2000,
};

/**
 * Given a websocket instance this function adds heartbeat capabilities
 * from the ws-heartbeats module to it.
 * @param {WebSocket} websocket
 */
export default function addHeartBeats(websocket, options = defaultOptions) {
    // Very basic for now but allows for further expansion to add options
    // to be passed to the hearbeat handler

    // We wait for the websocket to be open before adding
    // heartbeats so that we do not get false positives
    websocket.on('open', () => {
        sendHeartbeats(websocket, options);
    });
}
