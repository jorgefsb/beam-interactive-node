export function noop () {}

/**
 * Bubbles a certain event up from the child EventEmitter to the parent.
 * @param  {String} event
 * @param  {EventEmitter} child
 * @param  {EventEmitter} parent
 */
export function bubble (event, child, parent) {
    child.on(event, () => {
        const args = Array.prototype.slice.call(arguments);
        args.unshift(event);
        parent.emit.apply(parent, args);
    });
}
