"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.debugPerformance = exports.useLegacySass = exports.maxWorkers = exports.allowMinify = exports.shouldBeautify = exports.allowMangle = void 0;
const color_1 = require("./color");
function isDisabled(variable) {
    return variable === '0' || variable.toLowerCase() === 'false';
}
function isEnabled(variable) {
    return variable === '1' || variable.toLowerCase() === 'true';
}
function isPresent(variable) {
    return typeof variable === 'string' && variable !== '';
}
// Optimization and mangling
const debugOptimizeVariable = process.env['NG_BUILD_DEBUG_OPTIMIZE'];
const debugOptimize = (() => {
    if (!isPresent(debugOptimizeVariable) || isDisabled(debugOptimizeVariable)) {
        return {
            mangle: true,
            minify: true,
            beautify: false,
        };
    }
    const debugValue = {
        mangle: false,
        minify: false,
        beautify: true,
    };
    if (isEnabled(debugOptimizeVariable)) {
        return debugValue;
    }
    for (const part of debugOptimizeVariable.split(',')) {
        switch (part.trim().toLowerCase()) {
            case 'mangle':
                debugValue.mangle = true;
                break;
            case 'minify':
                debugValue.minify = true;
                break;
            case 'beautify':
                debugValue.beautify = true;
                break;
        }
    }
    return debugValue;
})();
const mangleVariable = process.env['NG_BUILD_MANGLE'];
exports.allowMangle = isPresent(mangleVariable)
    ? !isDisabled(mangleVariable)
    : debugOptimize.mangle;
exports.shouldBeautify = debugOptimize.beautify;
exports.allowMinify = debugOptimize.minify;
/**
 * Some environments, like CircleCI which use Docker report a number of CPUs by the host and not the count of available.
 * This cause `Error: Call retries were exceeded` errors when trying to use them.
 *
 * @see https://github.com/nodejs/node/issues/28762
 * @see https://github.com/webpack-contrib/terser-webpack-plugin/issues/143
 * @see https://ithub.com/angular/angular-cli/issues/16860#issuecomment-588828079
 *
 */
const maxWorkersVariable = process.env['NG_BUILD_MAX_WORKERS'];
exports.maxWorkers = isPresent(maxWorkersVariable) ? +maxWorkersVariable : 4;
const legacySassVariable = process.env['NG_BUILD_LEGACY_SASS'];
exports.useLegacySass = (() => {
    if (!isPresent(legacySassVariable)) {
        return false;
    }
    // eslint-disable-next-line no-console
    console.warn(color_1.colors.yellow(`Warning: 'NG_BUILD_LEGACY_SASS' environment variable support will be removed in version 16.`));
    return isEnabled(legacySassVariable);
})();
const debugPerfVariable = process.env['NG_BUILD_DEBUG_PERF'];
exports.debugPerformance = isPresent(debugPerfVariable) && isEnabled(debugPerfVariable);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW52aXJvbm1lbnQtb3B0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2J1aWxkX2FuZ3VsYXIvc3JjL3V0aWxzL2Vudmlyb25tZW50LW9wdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7O0FBRUgsbUNBQWlDO0FBRWpDLFNBQVMsVUFBVSxDQUFDLFFBQWdCO0lBQ2xDLE9BQU8sUUFBUSxLQUFLLEdBQUcsSUFBSSxRQUFRLENBQUMsV0FBVyxFQUFFLEtBQUssT0FBTyxDQUFDO0FBQ2hFLENBQUM7QUFFRCxTQUFTLFNBQVMsQ0FBQyxRQUFnQjtJQUNqQyxPQUFPLFFBQVEsS0FBSyxHQUFHLElBQUksUUFBUSxDQUFDLFdBQVcsRUFBRSxLQUFLLE1BQU0sQ0FBQztBQUMvRCxDQUFDO0FBRUQsU0FBUyxTQUFTLENBQUMsUUFBNEI7SUFDN0MsT0FBTyxPQUFPLFFBQVEsS0FBSyxRQUFRLElBQUksUUFBUSxLQUFLLEVBQUUsQ0FBQztBQUN6RCxDQUFDO0FBRUQsNEJBQTRCO0FBQzVCLE1BQU0scUJBQXFCLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO0FBQ3JFLE1BQU0sYUFBYSxHQUFHLENBQUMsR0FBRyxFQUFFO0lBQzFCLElBQUksQ0FBQyxTQUFTLENBQUMscUJBQXFCLENBQUMsSUFBSSxVQUFVLENBQUMscUJBQXFCLENBQUMsRUFBRTtRQUMxRSxPQUFPO1lBQ0wsTUFBTSxFQUFFLElBQUk7WUFDWixNQUFNLEVBQUUsSUFBSTtZQUNaLFFBQVEsRUFBRSxLQUFLO1NBQ2hCLENBQUM7S0FDSDtJQUVELE1BQU0sVUFBVSxHQUFHO1FBQ2pCLE1BQU0sRUFBRSxLQUFLO1FBQ2IsTUFBTSxFQUFFLEtBQUs7UUFDYixRQUFRLEVBQUUsSUFBSTtLQUNmLENBQUM7SUFFRixJQUFJLFNBQVMsQ0FBQyxxQkFBcUIsQ0FBQyxFQUFFO1FBQ3BDLE9BQU8sVUFBVSxDQUFDO0tBQ25CO0lBRUQsS0FBSyxNQUFNLElBQUksSUFBSSxxQkFBcUIsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUU7UUFDbkQsUUFBUSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFLEVBQUU7WUFDakMsS0FBSyxRQUFRO2dCQUNYLFVBQVUsQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDO2dCQUN6QixNQUFNO1lBQ1IsS0FBSyxRQUFRO2dCQUNYLFVBQVUsQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDO2dCQUN6QixNQUFNO1lBQ1IsS0FBSyxVQUFVO2dCQUNiLFVBQVUsQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO2dCQUMzQixNQUFNO1NBQ1Q7S0FDRjtJQUVELE9BQU8sVUFBVSxDQUFDO0FBQ3BCLENBQUMsQ0FBQyxFQUFFLENBQUM7QUFFTCxNQUFNLGNBQWMsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDLENBQUM7QUFDekMsUUFBQSxXQUFXLEdBQUcsU0FBUyxDQUFDLGNBQWMsQ0FBQztJQUNsRCxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsY0FBYyxDQUFDO0lBQzdCLENBQUMsQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDO0FBRVosUUFBQSxjQUFjLEdBQUcsYUFBYSxDQUFDLFFBQVEsQ0FBQztBQUN4QyxRQUFBLFdBQVcsR0FBRyxhQUFhLENBQUMsTUFBTSxDQUFDO0FBRWhEOzs7Ozs7OztHQVFHO0FBQ0gsTUFBTSxrQkFBa0IsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLHNCQUFzQixDQUFDLENBQUM7QUFDbEQsUUFBQSxVQUFVLEdBQUcsU0FBUyxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUVsRixNQUFNLGtCQUFrQixHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsc0JBQXNCLENBQUMsQ0FBQztBQUNsRCxRQUFBLGFBQWEsR0FBWSxDQUFDLEdBQUcsRUFBRTtJQUMxQyxJQUFJLENBQUMsU0FBUyxDQUFDLGtCQUFrQixDQUFDLEVBQUU7UUFDbEMsT0FBTyxLQUFLLENBQUM7S0FDZDtJQUVELHNDQUFzQztJQUN0QyxPQUFPLENBQUMsSUFBSSxDQUNWLGNBQU0sQ0FBQyxNQUFNLENBQ1gsNkZBQTZGLENBQzlGLENBQ0YsQ0FBQztJQUVGLE9BQU8sU0FBUyxDQUFDLGtCQUFrQixDQUFDLENBQUM7QUFDdkMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztBQUVMLE1BQU0saUJBQWlCLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO0FBQ2hELFFBQUEsZ0JBQWdCLEdBQUcsU0FBUyxDQUFDLGlCQUFpQixDQUFDLElBQUksU0FBUyxDQUFDLGlCQUFpQixDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsgY29sb3JzIH0gZnJvbSAnLi9jb2xvcic7XG5cbmZ1bmN0aW9uIGlzRGlzYWJsZWQodmFyaWFibGU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICByZXR1cm4gdmFyaWFibGUgPT09ICcwJyB8fCB2YXJpYWJsZS50b0xvd2VyQ2FzZSgpID09PSAnZmFsc2UnO1xufVxuXG5mdW5jdGlvbiBpc0VuYWJsZWQodmFyaWFibGU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICByZXR1cm4gdmFyaWFibGUgPT09ICcxJyB8fCB2YXJpYWJsZS50b0xvd2VyQ2FzZSgpID09PSAndHJ1ZSc7XG59XG5cbmZ1bmN0aW9uIGlzUHJlc2VudCh2YXJpYWJsZTogc3RyaW5nIHwgdW5kZWZpbmVkKTogdmFyaWFibGUgaXMgc3RyaW5nIHtcbiAgcmV0dXJuIHR5cGVvZiB2YXJpYWJsZSA9PT0gJ3N0cmluZycgJiYgdmFyaWFibGUgIT09ICcnO1xufVxuXG4vLyBPcHRpbWl6YXRpb24gYW5kIG1hbmdsaW5nXG5jb25zdCBkZWJ1Z09wdGltaXplVmFyaWFibGUgPSBwcm9jZXNzLmVudlsnTkdfQlVJTERfREVCVUdfT1BUSU1JWkUnXTtcbmNvbnN0IGRlYnVnT3B0aW1pemUgPSAoKCkgPT4ge1xuICBpZiAoIWlzUHJlc2VudChkZWJ1Z09wdGltaXplVmFyaWFibGUpIHx8IGlzRGlzYWJsZWQoZGVidWdPcHRpbWl6ZVZhcmlhYmxlKSkge1xuICAgIHJldHVybiB7XG4gICAgICBtYW5nbGU6IHRydWUsXG4gICAgICBtaW5pZnk6IHRydWUsXG4gICAgICBiZWF1dGlmeTogZmFsc2UsXG4gICAgfTtcbiAgfVxuXG4gIGNvbnN0IGRlYnVnVmFsdWUgPSB7XG4gICAgbWFuZ2xlOiBmYWxzZSxcbiAgICBtaW5pZnk6IGZhbHNlLFxuICAgIGJlYXV0aWZ5OiB0cnVlLFxuICB9O1xuXG4gIGlmIChpc0VuYWJsZWQoZGVidWdPcHRpbWl6ZVZhcmlhYmxlKSkge1xuICAgIHJldHVybiBkZWJ1Z1ZhbHVlO1xuICB9XG5cbiAgZm9yIChjb25zdCBwYXJ0IG9mIGRlYnVnT3B0aW1pemVWYXJpYWJsZS5zcGxpdCgnLCcpKSB7XG4gICAgc3dpdGNoIChwYXJ0LnRyaW0oKS50b0xvd2VyQ2FzZSgpKSB7XG4gICAgICBjYXNlICdtYW5nbGUnOlxuICAgICAgICBkZWJ1Z1ZhbHVlLm1hbmdsZSA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnbWluaWZ5JzpcbiAgICAgICAgZGVidWdWYWx1ZS5taW5pZnkgPSB0cnVlO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2JlYXV0aWZ5JzpcbiAgICAgICAgZGVidWdWYWx1ZS5iZWF1dGlmeSA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBkZWJ1Z1ZhbHVlO1xufSkoKTtcblxuY29uc3QgbWFuZ2xlVmFyaWFibGUgPSBwcm9jZXNzLmVudlsnTkdfQlVJTERfTUFOR0xFJ107XG5leHBvcnQgY29uc3QgYWxsb3dNYW5nbGUgPSBpc1ByZXNlbnQobWFuZ2xlVmFyaWFibGUpXG4gID8gIWlzRGlzYWJsZWQobWFuZ2xlVmFyaWFibGUpXG4gIDogZGVidWdPcHRpbWl6ZS5tYW5nbGU7XG5cbmV4cG9ydCBjb25zdCBzaG91bGRCZWF1dGlmeSA9IGRlYnVnT3B0aW1pemUuYmVhdXRpZnk7XG5leHBvcnQgY29uc3QgYWxsb3dNaW5pZnkgPSBkZWJ1Z09wdGltaXplLm1pbmlmeTtcblxuLyoqXG4gKiBTb21lIGVudmlyb25tZW50cywgbGlrZSBDaXJjbGVDSSB3aGljaCB1c2UgRG9ja2VyIHJlcG9ydCBhIG51bWJlciBvZiBDUFVzIGJ5IHRoZSBob3N0IGFuZCBub3QgdGhlIGNvdW50IG9mIGF2YWlsYWJsZS5cbiAqIFRoaXMgY2F1c2UgYEVycm9yOiBDYWxsIHJldHJpZXMgd2VyZSBleGNlZWRlZGAgZXJyb3JzIHdoZW4gdHJ5aW5nIHRvIHVzZSB0aGVtLlxuICpcbiAqIEBzZWUgaHR0cHM6Ly9naXRodWIuY29tL25vZGVqcy9ub2RlL2lzc3Vlcy8yODc2MlxuICogQHNlZSBodHRwczovL2dpdGh1Yi5jb20vd2VicGFjay1jb250cmliL3RlcnNlci13ZWJwYWNrLXBsdWdpbi9pc3N1ZXMvMTQzXG4gKiBAc2VlIGh0dHBzOi8vaXRodWIuY29tL2FuZ3VsYXIvYW5ndWxhci1jbGkvaXNzdWVzLzE2ODYwI2lzc3VlY29tbWVudC01ODg4MjgwNzlcbiAqXG4gKi9cbmNvbnN0IG1heFdvcmtlcnNWYXJpYWJsZSA9IHByb2Nlc3MuZW52WydOR19CVUlMRF9NQVhfV09SS0VSUyddO1xuZXhwb3J0IGNvbnN0IG1heFdvcmtlcnMgPSBpc1ByZXNlbnQobWF4V29ya2Vyc1ZhcmlhYmxlKSA/ICttYXhXb3JrZXJzVmFyaWFibGUgOiA0O1xuXG5jb25zdCBsZWdhY3lTYXNzVmFyaWFibGUgPSBwcm9jZXNzLmVudlsnTkdfQlVJTERfTEVHQUNZX1NBU1MnXTtcbmV4cG9ydCBjb25zdCB1c2VMZWdhY3lTYXNzOiBib29sZWFuID0gKCgpID0+IHtcbiAgaWYgKCFpc1ByZXNlbnQobGVnYWN5U2Fzc1ZhcmlhYmxlKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXG4gIGNvbnNvbGUud2FybihcbiAgICBjb2xvcnMueWVsbG93KFxuICAgICAgYFdhcm5pbmc6ICdOR19CVUlMRF9MRUdBQ1lfU0FTUycgZW52aXJvbm1lbnQgdmFyaWFibGUgc3VwcG9ydCB3aWxsIGJlIHJlbW92ZWQgaW4gdmVyc2lvbiAxNi5gLFxuICAgICksXG4gICk7XG5cbiAgcmV0dXJuIGlzRW5hYmxlZChsZWdhY3lTYXNzVmFyaWFibGUpO1xufSkoKTtcblxuY29uc3QgZGVidWdQZXJmVmFyaWFibGUgPSBwcm9jZXNzLmVudlsnTkdfQlVJTERfREVCVUdfUEVSRiddO1xuZXhwb3J0IGNvbnN0IGRlYnVnUGVyZm9ybWFuY2UgPSBpc1ByZXNlbnQoZGVidWdQZXJmVmFyaWFibGUpICYmIGlzRW5hYmxlZChkZWJ1Z1BlcmZWYXJpYWJsZSk7XG4iXX0=