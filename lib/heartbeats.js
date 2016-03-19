
import sendHeartbeats from 'ws-heartbeats';
/**
 * Given a websocket instance this function adds heartbeat capabilities
 * from the ws-heartbeats module to it.
 * @param {WebSocket} websocket
 */
export default function addHeartBeats(websocket, options = {}) {
    // Very basic for now but allows for further expansion to add options
    // to be passed to the hearbeat handler

    // We wait for the websocket to be open before adding
    // heartbeats so that we do not get false positives
    websocket.on('open', () => {
        sendHeartbeats(websocket, options);
    });
}
