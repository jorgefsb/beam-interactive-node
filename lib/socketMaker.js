import WebSocket from 'ws';

// window will be undefined in node.js
const isNode = typeof window === 'undefined';

/**
 * Wraps a DOM socket with EventEmitter-like syntax.
 * @param  {Socket} socket
 * @return {Socket}
 */
function wrapDOM (socket) {
    function wrapHandler (event, fn) {
        return (ev) => {
            if (event === 'message') {
                return fn(ev.data);
            }

            fn(ev);
        };
    }

    socket.on = function on (event, listener) {
        const wrapped = wrapHandler(event, listener);
        socket.addEventListener(event, wrapped);
    };

    socket.once = function once (event, listener) {
        const wrapped = wrapHandler(event, listener);
        socket.addEventListener(event, (ev) => {
            wrapped(ev);
            socket.removeEventListener(event, wrapped);
        });
    };

    return socket;
}

/**
 * Wraps a Node.js socket. Currently does nothing, but we may need this
 * later!
 * @param  {Socket} socket
 * @return {Socket}
 */
function wrapNode (socket) {
    return socket;
}

/**
 * Creates a new websocket. If this is running in-browser, it's
 * wrapped for compatibility with the standard EventEmitter API.
 * Note, however, this is just a partial implementation and will
 * need to be expanded if more fancy stuff is required.
 *
 * @param  {String} remote
 * @return {WebSocket}
 */
export default function makeSocket (remote) {
    const socket = new WebSocket(remote);

    if (isNode) return wrapNode(socket);

    return wrapDOM(socket);
}
