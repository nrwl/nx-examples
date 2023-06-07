"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTTY = void 0;
function _isTruthy(value) {
    // Returns true if value is a string that is anything but 0 or false.
    return value !== undefined && value !== '0' && value.toUpperCase() !== 'FALSE';
}
function isTTY() {
    // If we force TTY, we always return true.
    const force = process.env['NG_FORCE_TTY'];
    if (force !== undefined) {
        return _isTruthy(force);
    }
    return !!process.stdout.isTTY && !_isTruthy(process.env['CI']);
}
exports.isTTY = isTTY;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHR5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvYnVpbGRfYW5ndWxhci9zcmMvdXRpbHMvdHR5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7OztBQUVILFNBQVMsU0FBUyxDQUFDLEtBQXlCO0lBQzFDLHFFQUFxRTtJQUNyRSxPQUFPLEtBQUssS0FBSyxTQUFTLElBQUksS0FBSyxLQUFLLEdBQUcsSUFBSSxLQUFLLENBQUMsV0FBVyxFQUFFLEtBQUssT0FBTyxDQUFDO0FBQ2pGLENBQUM7QUFFRCxTQUFnQixLQUFLO0lBQ25CLDBDQUEwQztJQUMxQyxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxDQUFDO0lBQzFDLElBQUksS0FBSyxLQUFLLFNBQVMsRUFBRTtRQUN2QixPQUFPLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztLQUN6QjtJQUVELE9BQU8sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUNqRSxDQUFDO0FBUkQsc0JBUUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuZnVuY3Rpb24gX2lzVHJ1dGh5KHZhbHVlOiB1bmRlZmluZWQgfCBzdHJpbmcpOiBib29sZWFuIHtcbiAgLy8gUmV0dXJucyB0cnVlIGlmIHZhbHVlIGlzIGEgc3RyaW5nIHRoYXQgaXMgYW55dGhpbmcgYnV0IDAgb3IgZmFsc2UuXG4gIHJldHVybiB2YWx1ZSAhPT0gdW5kZWZpbmVkICYmIHZhbHVlICE9PSAnMCcgJiYgdmFsdWUudG9VcHBlckNhc2UoKSAhPT0gJ0ZBTFNFJztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzVFRZKCk6IGJvb2xlYW4ge1xuICAvLyBJZiB3ZSBmb3JjZSBUVFksIHdlIGFsd2F5cyByZXR1cm4gdHJ1ZS5cbiAgY29uc3QgZm9yY2UgPSBwcm9jZXNzLmVudlsnTkdfRk9SQ0VfVFRZJ107XG4gIGlmIChmb3JjZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIF9pc1RydXRoeShmb3JjZSk7XG4gIH1cblxuICByZXR1cm4gISFwcm9jZXNzLnN0ZG91dC5pc1RUWSAmJiAhX2lzVHJ1dGh5KHByb2Nlc3MuZW52WydDSSddKTtcbn1cbiJdfQ==