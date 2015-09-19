export function noop () {}

/**
 * Bubbles a certain event up from the child EventEmitter to the parent.
 * @param  {String} event
 * @param  {EventEmitter} child
 * @param  {EventEmitter} parent
 */
export function bubble (event, child, parent) {
    child.on(event, (...args) => parent.emit(event, ...args));
}

/**
 * Finds an item from the list; like Array.prototype.find, but for people
 * without the babel polyfill.
 *
 * @param  {Array} array
 * @param  {Function} predicate
 * @return {*}
 */
export function find (array, predicate) {
    for (let i = 0; i < array.length; i++) {
        if (predicate(array[i])) {
            return array[i];
        }
    }

    return undefined;
}

/**
 * Repeats a string n times.
 * @param  {String} str
 * @param  {Number} times
 * @return {String}
 */
export function strRepeat (str, times) {
    let output = '';
    for (let i = 0; i < times; i++) {
        output += str;
    }

    return output;
}

/**
 * Indents the string n times.
 * @param  {String} str
 * @param  {Number} times
 * @param  {String} indenter
 * @return {String}
 */
export function indent (str, times, indenter = '    ') {
    const indentation = strRepeat(indenter, times);
    const feed = /\r?\n/.exec(str);
    if (feed === null) return indentation + str;

    const lines = str.split(feed[0]);
    for (let i = 0; i < lines.length; i++) {
        lines[i] = indentation + lines[i];
    }

    return lines.join(feed[0]);
}
