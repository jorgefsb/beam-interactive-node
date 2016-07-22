// window will be undefined in node.js
const isNode = typeof window === 'undefined';
const WebSocket = isNode ? require('ws') : window.WebSocket;

/**
 * Wraps a DOM socket with EventEmitter-like syntax.
 * @param  {Socket} socket
 * @return {Socket}
 */
function wrapDOM(socket) {
    function wrapHandler(event, fn) {
        return ev => {
            switch (event) {
            case 'error':
                fn(ev.error);
                break;
            case 'message':
                fn(ev.data);
                break;
            default:
                fn(ev);
            }
        };
    }

    socket.on = function (event, listener) {
        const wrapped = wrapHandler(event, listener);
        socket.addEventListener(event, wrapped);
    };

    socket.once = function (event, listener) {
        const wrapped = wrapHandler(event, listener);
        socket.addEventListener(event, function handler (ev) {
            wrapped(ev);
            socket.removeEventListener(event, handler);
        });
    };

    socket.emit = function (event, ...data) {
        switch (event) {
        case 'error':
            socket.dispatchEvent(new ErrorEvent(event, { error: data[0] }));
            break;
        case 'message':
            socket.dispatchEvent(new MessageEvent(event, { data: data[0] }));
            break;
        default:
            socket.dispatchEvent(new CustomEvent(event, { detail: data }));
        }
    };

    return socket;
}

/**
 * Wraps a Node.js socket. Currently does nothing, but we may need this
 * later!
 * @param  {Socket} socket
 * @return {Socket}
 */
function wrapNode(socket) {
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
export default function makeSocket(remote) {
    const socket = new WebSocket(remote);

    if (isNode) return wrapNode(socket);

    return wrapDOM(socket);
}
