import { AssertionError } from './errors';

export function noop() {}

/**
 * Bubbles a certain event up from the child EventEmitter to the parent.
 * @param  {String} event
 * @param  {EventEmitter} child
 * @param  {EventEmitter} parent
 * @param  {String} [emit="emit"]
 */
export function bubble(event, child, parent, emit = 'emit') {
    child.on(event, (...args) => parent[emit](event, ...args));
}

/**
 * Finds an item from the list; like Array.prototype.find, but for people
 * without the babel polyfill.
 *
 * @param  {Array} array
 * @param  {Function} predicate
 * @return {*}
 */
export function find(array, predicate) {
    for (let i = 0; i < array.length; i++) {
        if (predicate(array[i])) {
            return array[i];
        }
    }

    return undefined;
}

/**
 * Similar to .find, but looks for and returns values in an object.
 * The predicate will be invoked with `(key, value)`.
 *
 * @param  {Object} obj
 * @param  {Function} predicate
 * @return {*}
 */
export function findValue(obj, predicate) {
    for (const key in obj) {
        if (obj.hasOwnProperty(key) && predicate(key, obj[key])) {
            return obj[key];
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
export function strRepeat(str, times) {
    let output = '';
    for (let i = 0; i < times; i++) {
        output += str;
    }

    return output;
}

/**
 * Adds a and b and returns their result. If either A or B is falsey
 * (undefined, null, NaN, etc), it'll treat it as zero.
 * @param {Number} a
 * @param {Number} b
 * @return {Number}
 */
export function addIf(a, b) {
    return (a || 0) + (b || 0);
}

/**
 * Indents the string n times.
 * @param  {String} str
 * @param  {Number} times
 * @param  {String} indenter
 * @return {String}
 */
export function indent(str, times, indenter = '    ') {
    const indentation = strRepeat(indenter, times);
    const feed = /\r?\n/.exec(str);
    if (feed === null) return indentation + str;

    const lines = str.split(feed[0]);
    for (let i = 0; i < lines.length; i++) {
        lines[i] = indentation + lines[i];
    }

    return lines.join(feed[0]);
}

/**
 * Asserts that the `condition` is true.
 * @param  {Boolean} condition
 * @param  {String} error
 * @throws {AssertionError} if false
 */
export function assert(condition, error = 'expected false to be true') {
    if (!condition) {
        throw new AssertionError(error);
    }
}
