"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const remapping_1 = __importDefault(require("@ampproject/remapping"));
const node_path_1 = require("node:path");
const node_url_1 = require("node:url");
const node_worker_threads_1 = require("node:worker_threads");
const sass_1 = require("sass");
const rebasing_importer_1 = require("./rebasing-importer");
if (!node_worker_threads_1.parentPort || !node_worker_threads_1.workerData) {
    throw new Error('Sass worker must be executed as a Worker.');
}
// The importer variables are used to proxy import requests to the main thread
const { workerImporterPort, importerSignal } = node_worker_threads_1.workerData;
node_worker_threads_1.parentPort.on('message', (message) => {
    if (!node_worker_threads_1.parentPort) {
        throw new Error('"parentPort" is not defined. Sass worker must be executed as a Worker.');
    }
    const { id, hasImporter, hasLogger, source, options, rebase } = message;
    const entryDirectory = (0, node_path_1.dirname)(options.url);
    let warnings;
    try {
        const directoryCache = new Map();
        const rebaseSourceMaps = options.sourceMap ? new Map() : undefined;
        if (hasImporter) {
            // When a custom importer function is present, the importer request must be proxied
            // back to the main thread where it can be executed.
            // This process must be synchronous from the perspective of dart-sass. The `Atomics`
            // functions combined with the shared memory `importSignal` and the Node.js
            // `receiveMessageOnPort` function are used to ensure synchronous behavior.
            const proxyImporter = {
                findFileUrl: (url, options) => {
                    Atomics.store(importerSignal, 0, 0);
                    workerImporterPort.postMessage({ id, url, options });
                    Atomics.wait(importerSignal, 0, 0);
                    const result = (0, node_worker_threads_1.receiveMessageOnPort)(workerImporterPort)?.message;
                    return result ? (0, node_url_1.pathToFileURL)(result) : null;
                },
            };
            options.importers = [
                rebase
                    ? (0, rebasing_importer_1.sassBindWorkaround)(new rebasing_importer_1.ModuleUrlRebasingImporter(entryDirectory, directoryCache, rebaseSourceMaps, proxyImporter.findFileUrl))
                    : proxyImporter,
            ];
        }
        if (rebase && options.loadPaths?.length) {
            options.importers ?? (options.importers = []);
            options.importers.push((0, rebasing_importer_1.sassBindWorkaround)(new rebasing_importer_1.LoadPathsUrlRebasingImporter(entryDirectory, directoryCache, rebaseSourceMaps, options.loadPaths)));
            options.loadPaths = undefined;
        }
        let relativeImporter;
        if (rebase) {
            relativeImporter = (0, rebasing_importer_1.sassBindWorkaround)(new rebasing_importer_1.RelativeUrlRebasingImporter(entryDirectory, directoryCache, rebaseSourceMaps));
        }
        // The synchronous Sass render function can be up to two times faster than the async variant
        const result = (0, sass_1.compileString)(source, {
            ...options,
            // URL is not serializable so to convert to string in the parent and back to URL here.
            url: (0, node_url_1.pathToFileURL)(options.url),
            // The `importer` option (singular) handles relative imports
            importer: relativeImporter,
            logger: hasLogger
                ? {
                    warn(message, { deprecation, span, stack }) {
                        warnings ?? (warnings = []);
                        warnings.push({
                            message,
                            deprecation,
                            stack,
                            span: span && convertSourceSpan(span),
                        });
                    },
                }
                : undefined,
        });
        if (result.sourceMap && rebaseSourceMaps?.size) {
            // Merge the intermediate rebasing source maps into the final Sass generated source map.
            // Casting is required due to small but compatible differences in typings between the packages.
            result.sourceMap = (0, remapping_1.default)(result.sourceMap, 
            // To prevent an infinite lookup loop, skip getting the source when the rebasing source map
            // is referencing its original self.
            (file, context) => (file !== context.importer ? rebaseSourceMaps.get(file) : null));
        }
        node_worker_threads_1.parentPort.postMessage({
            id,
            warnings,
            result: {
                ...result,
                // URL is not serializable so to convert to string here and back to URL in the parent.
                loadedUrls: result.loadedUrls.map((p) => (0, node_url_1.fileURLToPath)(p)),
            },
        });
    }
    catch (error) {
        // Needed because V8 will only serialize the message and stack properties of an Error instance.
        if (error instanceof sass_1.Exception) {
            const { span, message, stack, sassMessage, sassStack } = error;
            node_worker_threads_1.parentPort.postMessage({
                id,
                warnings,
                error: {
                    span: convertSourceSpan(span),
                    message,
                    stack,
                    sassMessage,
                    sassStack,
                },
            });
        }
        else if (error instanceof Error) {
            const { message, stack } = error;
            node_worker_threads_1.parentPort.postMessage({ id, warnings, error: { message, stack } });
        }
        else {
            node_worker_threads_1.parentPort.postMessage({
                id,
                warnings,
                error: { message: 'An unknown error has occurred.' },
            });
        }
    }
});
/**
 * Converts a Sass SourceSpan object into a serializable form.
 * The SourceSpan object contains a URL property which must be converted into a string.
 * Also, most of the interface's properties are get accessors and are not automatically
 * serialized when sent back from the worker.
 *
 * @param span The Sass SourceSpan object to convert.
 * @returns A serializable form of the SourceSpan object.
 */
function convertSourceSpan(span) {
    return {
        text: span.text,
        context: span.context,
        end: {
            column: span.end.column,
            offset: span.end.offset,
            line: span.end.line,
        },
        start: {
            column: span.start.column,
            offset: span.start.offset,
            line: span.start.line,
        },
        url: span.url ? (0, node_url_1.fileURLToPath)(span.url) : undefined,
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvYnVpbGRfYW5ndWxhci9zcmMvc2Fzcy93b3JrZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7QUFFSCxzRUFBc0U7QUFDdEUseUNBQW9DO0FBQ3BDLHVDQUF3RDtBQUN4RCw2REFBZ0c7QUFDaEcsK0JBTWM7QUFDZCwyREFNNkI7QUFpQzdCLElBQUksQ0FBQyxnQ0FBVSxJQUFJLENBQUMsZ0NBQVUsRUFBRTtJQUM5QixNQUFNLElBQUksS0FBSyxDQUFDLDJDQUEyQyxDQUFDLENBQUM7Q0FDOUQ7QUFFRCw4RUFBOEU7QUFDOUUsTUFBTSxFQUFFLGtCQUFrQixFQUFFLGNBQWMsRUFBRSxHQUFHLGdDQUc5QyxDQUFDO0FBRUYsZ0NBQVUsQ0FBQyxFQUFFLENBQUMsU0FBUyxFQUFFLENBQUMsT0FBNkIsRUFBRSxFQUFFO0lBQ3pELElBQUksQ0FBQyxnQ0FBVSxFQUFFO1FBQ2YsTUFBTSxJQUFJLEtBQUssQ0FBQyx3RUFBd0UsQ0FBQyxDQUFDO0tBQzNGO0lBRUQsTUFBTSxFQUFFLEVBQUUsRUFBRSxXQUFXLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLEdBQUcsT0FBTyxDQUFDO0lBQ3hFLE1BQU0sY0FBYyxHQUFHLElBQUEsbUJBQU8sRUFBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDNUMsSUFBSSxRQU9TLENBQUM7SUFDZCxJQUFJO1FBQ0YsTUFBTSxjQUFjLEdBQUcsSUFBSSxHQUFHLEVBQTBCLENBQUM7UUFDekQsTUFBTSxnQkFBZ0IsR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUcsRUFBd0IsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO1FBQ3pGLElBQUksV0FBVyxFQUFFO1lBQ2YsbUZB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RixRQUFRO2dCQUNSLEtBQUssRUFBRSxFQUFFLE9BQU8sRUFBRSxnQ0FBZ0MsRUFBRTthQUNyRCxDQUFDLENBQUM7U0FDSjtLQUNGO0FBQ0gsQ0FBQyxDQUFDLENBQUM7QUFFSDs7Ozs7Ozs7R0FRRztBQUNILFNBQVMsaUJBQWlCLENBQUMsSUFBZ0I7SUFDekMsT0FBTztRQUNMLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSTtRQUNmLE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTztRQUNyQixHQUFHLEVBQUU7WUFDSCxNQUFNLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNO1lBQ3ZCLE1BQU0sRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU07WUFDdkIsSUFBSSxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSTtTQUNwQjtRQUNELEtBQUssRUFBRTtZQUNMLE1BQU0sRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU07WUFDekIsTUFBTSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTTtZQUN6QixJQUFJLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJO1NBQ3RCO1FBQ0QsR0FBRyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUEsd0JBQWEsRUFBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVM7S0FDcEQsQ0FBQztBQUNKLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IG1lcmdlU291cmNlTWFwcywgeyBSYXdTb3VyY2VNYXAgfSBmcm9tICdAYW1wcHJvamVjdC9yZW1hcHBpbmcnO1xuaW1wb3J0IHsgZGlybmFtZSB9IGZyb20gJ25vZGU6cGF0aCc7XG5pbXBvcnQgeyBmaWxlVVJMVG9QYXRoLCBwYXRoVG9GaWxlVVJMIH0gZnJvbSAnbm9kZTp1cmwnO1xuaW1wb3J0IHsgTWVzc2FnZVBvcnQsIHBhcmVudFBvcnQsIHJlY2VpdmVNZXNzYWdlT25Qb3J0LCB3b3JrZXJEYXRhIH0gZnJvbSAnbm9kZTp3b3JrZXJfdGhyZWFkcyc7XG5pbXBvcnQge1xuICBFeGNlcHRpb24sXG4gIEZpbGVJbXBvcnRlcixcbiAgU291cmNlU3BhbixcbiAgU3RyaW5nT3B0aW9uc1dpdGhJbXBvcnRlcixcbiAgY29tcGlsZVN0cmluZyxcbn0gZnJvbSAnc2Fzcyc7XG5pbXBvcnQge1xuICBEaXJlY3RvcnlFbnRyeSxcbiAgTG9hZFBhdGhzVXJsUmViYXNpbmdJbXBvcnRlcixcbiAgTW9kdWxlVXJsUmViYXNpbmdJbXBvcnRlcixcbiAgUmVsYXRpdmVVcmxSZWJhc2luZ0ltcG9ydGVyLFxuICBzYXNzQmluZFdvcmthcm91bmQsXG59IGZyb20gJy4vcmViYXNpbmctaW1wb3J0ZXInO1xuXG4vKipcbiAqIEEgcmVxdWVzdCB0byByZW5kZXIgYSBTYXNzIHN0eWxlc2hlZXQgdXNpbmcgdGhlIHN1cHBsaWVkIG9wdGlvbnMuXG4gKi9cbmludGVyZmFjZSBSZW5kZXJSZXF1ZXN0TWVzc2FnZSB7XG4gIC8qKlxuICAgKiBUaGUgdW5pcXVlIHJlcXVlc3QgaWRlbnRpZmllciB0aGF0IGxpbmtzIHRoZSByZW5kZXIgYWN0aW9uIHdpdGggYSBjYWxsYmFjayBhbmQgb3B0aW9uYWxcbiAgICogaW1wb3J0ZXIgb24gdGhlIG1haW4gdGhyZWFkLlxuICAgKi9cbiAgaWQ6IG51bWJlcjtcbiAgLyoqXG4gICAqIFRoZSBjb250ZW50cyB0byBjb21waWxlLlxuICAgKi9cbiAgc291cmNlOiBzdHJpbmc7XG4gIC8qKlxuICAgKiBUaGUgU2FzcyBvcHRpb25zIHRvIHByb3ZpZGUgdG8gdGhlIGBkYXJ0LXNhc3NgIGNvbXBpbGUgZnVuY3Rpb24uXG4gICAqL1xuICBvcHRpb25zOiBPbWl0PFN0cmluZ09wdGlvbnNXaXRoSW1wb3J0ZXI8J3N5bmMnPiwgJ3VybCc+ICYgeyB1cmw6IHN0cmluZyB9O1xuICAvKipcbiAgICogSW5kaWNhdGVzIHRoZSByZXF1ZXN0IGhhcyBhIGN1c3RvbSBpbXBvcnRlciBmdW5jdGlvbiBvbiB0aGUgbWFpbiB0aHJlYWQuXG4gICAqL1xuICBoYXNJbXBvcnRlcjogYm9vbGVhbjtcbiAgLyoqXG4gICAqIEluZGljYXRlcyB0aGUgcmVxdWVzdCBoYXMgYSBjdXN0b20gbG9nZ2VyIGZvciB3YXJuaW5nIG1lc3NhZ2VzLlxuICAgKi9cbiAgaGFzTG9nZ2VyOiBib29sZWFuO1xuICAvKipcbiAgICogSW5kaWNhdGVzIHBhdGhzIHdpdGhpbiB1cmwoKSBDU1MgZnVuY3Rpb25zIHNob3VsZCBiZSByZWJhc2VkLlxuICAgKi9cbiAgcmViYXNlOiBib29sZWFuO1xufVxuXG5pZiAoIXBhcmVudFBvcnQgfHwgIXdvcmtlckRhdGEpIHtcbiAgdGhyb3cgbmV3IEVycm9yKCdTYXNzIHdvcmtlciBtdXN0IGJlIGV4ZWN1dGVkIGFzIGEgV29ya2VyLicpO1xufVxuXG4vLyBUaGUgaW1wb3J0ZXIgdmFyaWFibGVzIGFyZSB1c2VkIHRvIHByb3h5IGltcG9ydCByZXF1ZXN0cyB0byB0aGUgbWFpbiB0aHJlYWRcbmNvbnN0IHsgd29ya2VySW1wb3J0ZXJQb3J0LCBpbXBvcnRlclNpZ25hbCB9ID0gd29ya2VyRGF0YSBhcyB7XG4gIHdvcmtlckltcG9ydGVyUG9ydDogTWVzc2FnZVBvcnQ7XG4gIGltcG9ydGVyU2lnbmFsOiBJbnQzMkFycmF5O1xufTtcblxucGFyZW50UG9ydC5vbignbWVzc2FnZScsIChtZXNzYWdlOiBSZW5kZXJSZXF1ZXN0TWVzc2FnZSkgPT4ge1xuICBpZiAoIXBhcmVudFBvcnQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1wicGFyZW50UG9ydFwiIGlzIG5vdCBkZWZpbmVkLiBTYXNzIHdvcmtlciBtdXN0IGJlIGV4ZWN1dGVkIGFzIGEgV29ya2VyLicpO1xuICB9XG5cbiAgY29uc3QgeyBpZCwgaGFzSW1wb3J0ZXIsIGhhc0xvZ2dlciwgc291cmNlLCBvcHRpb25zLCByZWJhc2UgfSA9IG1lc3NhZ2U7XG4gIGNvbnN0IGVudHJ5RGlyZWN0b3J5ID0gZGlybmFtZShvcHRpb25zLnVybCk7XG4gIGxldCB3YXJuaW5nczpcbiAgICB8IHtcbiAgICAgICAgbWVzc2FnZTogc3RyaW5nO1xuICAgICAgICBkZXByZWNhdGlvbjogYm9vbGVhbjtcbiAgICAgICAgc3RhY2s/OiBzdHJpbmc7XG4gICAgICAgIHNwYW4/OiBPbWl0PFNvdXJjZVNwYW4sICd1cmwnPiAmIHsgdXJsPzogc3RyaW5nIH07XG4gICAgICB9W11cbiAgICB8IHVuZGVmaW5lZDtcbiAgdHJ5IHtcbiAgICBjb25zdCBkaXJlY3RvcnlDYWNoZSA9IG5ldyBNYXA8c3RyaW5nLCBEaXJlY3RvcnlFbnRyeT4oKTtcbiAgICBjb25zdCByZWJhc2VTb3VyY2VNYXBzID0gb3B0aW9ucy5zb3VyY2VNYXAgPyBuZXcgTWFwPHN0cmluZywgUmF3U291cmNlTWFwPigpIDogdW5kZWZpbmVkO1xuICAgIGlmIChoYXNJbXBvcnRlcikge1xuICAgICAgLy8gV2hlbiBhIGN1c3RvbSBpbXBvcnRlciBmdW5jdGlvbiBpcyBwcmVzZW50LCB0aGUgaW1wb3J0ZXIgcmVxdWVzdCBtdXN0IGJlIHByb3hpZWRcbiAgICAgIC8vIGJhY2sgdG8gdGhlIG1haW4gdGhyZWFkIHdoZXJlIGl0IGNhbiBiZSBleGVjdXRlZC5cbiAgICAgIC8vIFRoaXMgcHJvY2VzcyBtdXN0IGJlIHN5bmNocm9ub3VzIGZyb20gdGhlIHBlcnNwZWN0aXZlIG9mIGRhcnQtc2Fzcy4gVGhlIGBBdG9taWNzYFxuICAgICAgLy8gZnVuY3Rpb25zIGNvbWJpbmVkIHdpdGggdGhlIHNoYXJlZCBtZW1vcnkgYGltcG9ydFNpZ25hbGAgYW5kIHRoZSBOb2RlLmpzXG4gICAgICAvLyBgcmVjZWl2ZU1lc3NhZ2VPblBvcnRgIGZ1bmN0aW9uIGFyZSB1c2VkIHRvIGVuc3VyZSBzeW5jaHJvbm91cyBiZWhhdmlvci5cbiAgICAgIGNvbnN0IHByb3h5SW1wb3J0ZXI6IEZpbGVJbXBvcnRlcjwnc3luYyc+ID0ge1xuICAgICAgICBmaW5kRmlsZVVybDogKHVybCwgb3B0aW9ucykgPT4ge1xuICAgICAgICAgIEF0b21pY3Muc3RvcmUoaW1wb3J0ZXJTaWduYWwsIDAsIDApO1xuICAgICAgICAgIHdvcmtlckltcG9ydGVyUG9ydC5wb3N0TWVzc2FnZSh7IGlkLCB1cmwsIG9wdGlvbnMgfSk7XG4gICAgICAgICAgQXRvbWljcy53YWl0KGltcG9ydGVyU2lnbmFsLCAwLCAwKTtcblxuICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHJlY2VpdmVNZXNzYWdlT25Qb3J0KHdvcmtlckltcG9ydGVyUG9ydCk/Lm1lc3NhZ2UgYXMgc3RyaW5nIHwgbnVsbDtcblxuICAgICAgICAgIHJldHVybiByZXN1bHQgPyBwYXRoVG9GaWxlVVJMKHJlc3VsdCkgOiBudWxsO1xuICAgICAgICB9LFxuICAgICAgfTtcbiAgICAgIG9wdGlvbnMuaW1wb3J0ZXJzID0gW1xuICAgICAgICByZWJhc2VcbiAgICAgICAgICA/IHNhc3NCaW5kV29ya2Fyb3VuZChcbiAgICAgICAgICAgICAgbmV3IE1vZHVsZVVybFJlYmFzaW5nSW1wb3J0ZXIoXG4gICAgICAgICAgICAgICAgZW50cnlEaXJlY3RvcnksXG4gICAgICAgICAgICAgICAgZGlyZWN0b3J5Q2FjaGUsXG4gICAgICAgICAgICAgICAgcmViYXNlU291cmNlTWFwcyxcbiAgICAgICAgICAgICAgICBwcm94eUltcG9ydGVyLmZpbmRGaWxlVXJsLFxuICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgKVxuICAgICAgICAgIDogcHJveHlJbXBvcnRlcixcbiAgICAgIF07XG4gICAgfVxuXG4gICAgaWYgKHJlYmFzZSAmJiBvcHRpb25zLmxvYWRQYXRocz8ubGVuZ3RoKSB7XG4gICAgICBvcHRpb25zLmltcG9ydGVycyA/Pz0gW107XG4gICAgICBvcHRpb25zLmltcG9ydGVycy5wdXNoKFxuICAgICAgICBzYXNzQmluZFdvcmthcm91bmQoXG4gICAgICAgICAgbmV3IExvYWRQYXRoc1VybFJlYmFzaW5nSW1wb3J0ZXIoXG4gICAgICAgICAgICBlbnRyeURpcmVjdG9yeSxcbiAgICAgICAgICAgIGRpcmVjdG9yeUNhY2hlLFxuICAgICAgICAgICAgcmViYXNlU291cmNlTWFwcyxcbiAgICAgICAgICAgIG9wdGlvbnMubG9hZFBhdGhzLFxuICAgICAgICAgICksXG4gICAgICAgICksXG4gICAgICApO1xuICAgICAgb3B0aW9ucy5sb2FkUGF0aHMgPSB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgbGV0IHJlbGF0aXZlSW1wb3J0ZXI7XG4gICAgaWYgKHJlYmFzZSkge1xuICAgICAgcmVsYXRpdmVJbXBvcnRlciA9IHNhc3NCaW5kV29ya2Fyb3VuZChcbiAgICAgICAgbmV3IFJlbGF0aXZlVXJsUmViYXNpbmdJbXBvcnRlcihlbnRyeURpcmVjdG9yeSwgZGlyZWN0b3J5Q2FjaGUsIHJlYmFzZVNvdXJjZU1hcHMpLFxuICAgICAgKTtcbiAgICB9XG5cbiAgICAvLyBUaGUgc3luY2hyb25vdXMgU2FzcyByZW5kZXIgZnVuY3Rpb24gY2FuIGJlIHVwIHRvIHR3byB0aW1lcyBmYXN0ZXIgdGhhbiB0aGUgYXN5bmMgdmFyaWFudFxuICAgIGNvbnN0IHJlc3VsdCA9IGNvbXBpbGVTdHJpbmcoc291cmNlLCB7XG4gICAgICAuLi5vcHRpb25zLFxuICAgICAgLy8gVVJMIGlzIG5vdCBzZXJpYWxpemFibGUgc28gdG8gY29udmVydCB0byBzdHJpbmcgaW4gdGhlIHBhcmVudCBhbmQgYmFjayB0byBVUkwgaGVyZS5cbiAgICAgIHVybDogcGF0aFRvRmlsZVVSTChvcHRpb25zLnVybCksXG4gICAgICAvLyBUaGUgYGltcG9ydGVyYCBvcHRpb24gKHNpbmd1bGFyKSBoYW5kbGVzIHJlbGF0aXZlIGltcG9ydHNcbiAgICAgIGltcG9ydGVyOiByZWxhdGl2ZUltcG9ydGVyLFxuICAgICAgbG9nZ2VyOiBoYXNMb2dnZXJcbiAgICAgICAgPyB7XG4gICAgICAgICAgICB3YXJuKG1lc3NhZ2UsIHsgZGVwcmVjYXRpb24sIHNwYW4sIHN0YWNrIH0pIHtcbiAgICAgICAgICAgICAgd2FybmluZ3MgPz89IFtdO1xuICAgICAgICAgICAgICB3YXJuaW5ncy5wdXNoKHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlLFxuICAgICAgICAgICAgICAgIGRlcHJlY2F0aW9uLFxuICAgICAgICAgICAgICAgIHN0YWNrLFxuICAgICAgICAgICAgICAgIHNwYW46IHNwYW4gJiYgY29udmVydFNvdXJjZVNwYW4oc3BhbiksXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9XG4gICAgICAgIDogdW5kZWZpbmVkLFxuICAgIH0pO1xuXG4gICAgaWYgKHJlc3VsdC5zb3VyY2VNYXAgJiYgcmViYXNlU291cmNlTWFwcz8uc2l6ZSkge1xuICAgICAgLy8gTWVyZ2UgdGhlIGludGVybWVkaWF0ZSByZWJhc2luZyBzb3VyY2UgbWFwcyBpbnRvIHRoZSBmaW5hbCBTYXNzIGdlbmVyYXRlZCBzb3VyY2UgbWFwLlxuICAgICAgLy8gQ2FzdGluZyBpcyByZXF1aXJlZCBkdWUgdG8gc21hbGwgYnV0IGNvbXBhdGlibGUgZGlmZmVyZW5jZXMgaW4gdHlwaW5ncyBiZXR3ZWVuIHRoZSBwYWNrYWdlcy5cbiAgICAgIHJlc3VsdC5zb3VyY2VNYXAgPSBtZXJnZVNvdXJjZU1hcHMoXG4gICAgICAgIHJlc3VsdC5zb3VyY2VNYXAgYXMgdW5rbm93biBhcyBSYXdTb3VyY2VNYXAsXG4gICAgICAgIC8vIFRvIHByZXZlbnQgYW4gaW5maW5pdGUgbG9va3VwIGxvb3AsIHNraXAgZ2V0dGluZyB0aGUgc291cmNlIHdoZW4gdGhlIHJlYmFzaW5nIHNvdXJjZSBtYXBcbiAgICAgICAgLy8gaXMgcmVmZXJlbmNpbmcgaXRzIG9yaWdpbmFsIHNlbGYuXG4gICAgICAgIChmaWxlLCBjb250ZXh0KSA9PiAoZmlsZSAhPT0gY29udGV4dC5pbXBvcnRlciA/IHJlYmFzZVNvdXJjZU1hcHMuZ2V0KGZpbGUpIDogbnVsbCksXG4gICAgICApIGFzIHVua25vd24gYXMgdHlwZW9mIHJlc3VsdC5zb3VyY2VNYXA7XG4gICAgfVxuXG4gICAgcGFyZW50UG9ydC5wb3N0TWVzc2FnZSh7XG4gICAgICBpZCxcbiAgICAgIHdhcm5pbmdzLFxuICAgICAgcmVzdWx0OiB7XG4gICAgICAgIC4uLnJlc3VsdCxcbiAgICAgICAgLy8gVVJMIGlzIG5vdCBzZXJpYWxpemFibGUgc28gdG8gY29udmVydCB0byBzdHJpbmcgaGVyZSBhbmQgYmFjayB0byBVUkwgaW4gdGhlIHBhcmVudC5cbiAgICAgICAgbG9hZGVkVXJsczogcmVzdWx0LmxvYWRlZFVybHMubWFwKChwKSA9PiBmaWxlVVJMVG9QYXRoKHApKSxcbiAgICAgIH0sXG4gICAgfSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgLy8gTmVlZGVkIGJlY2F1c2UgVjggd2lsbCBvbmx5IHNlcmlhbGl6ZSB0aGUgbWVzc2FnZSBhbmQgc3RhY2sgcHJvcGVydGllcyBvZiBhbiBFcnJvciBpbnN0YW5jZS5cbiAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBFeGNlcHRpb24pIHtcbiAgICAgIGNvbnN0IHsgc3BhbiwgbWVzc2FnZSwgc3RhY2ssIHNhc3NNZXNzYWdlLCBzYXNzU3RhY2sgfSA9IGVycm9yO1xuICAgICAgcGFyZW50UG9ydC5wb3N0TWVzc2FnZSh7XG4gICAgICAgIGlkLFxuICAgICAgICB3YXJuaW5ncyxcbiAgICAgICAgZXJyb3I6IHtcbiAgICAgICAgICBzcGFuOiBjb252ZXJ0U291cmNlU3BhbihzcGFuKSxcbiAgICAgICAgICBtZXNzYWdlLFxuICAgICAgICAgIHN0YWNrLFxuICAgICAgICAgIHNhc3NNZXNzYWdlLFxuICAgICAgICAgIHNhc3NTdGFjayxcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAoZXJyb3IgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgY29uc3QgeyBtZXNzYWdlLCBzdGFjayB9ID0gZXJyb3I7XG4gICAgICBwYXJlbnRQb3J0LnBvc3RNZXNzYWdlKHsgaWQsIHdhcm5pbmdzLCBlcnJvcjogeyBtZXNzYWdlLCBzdGFjayB9IH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBwYXJlbnRQb3J0LnBvc3RNZXNzYWdlKHtcbiAgICAgICAgaWQsXG4gICAgICAgIHdhcm5pbmdzLFxuICAgICAgICBlcnJvcjogeyBtZXNzYWdlOiAnQW4gdW5rbm93biBlcnJvciBoYXMgb2NjdXJyZWQuJyB9LFxuICAgICAgfSk7XG4gICAgfVxuICB9XG59KTtcblxuLyoqXG4gKiBDb252ZXJ0cyBhIFNhc3MgU291cmNlU3BhbiBvYmplY3QgaW50byBhIHNlcmlhbGl6YWJsZSBmb3JtLlxuICogVGhlIFNvdXJjZVNwYW4gb2JqZWN0IGNvbnRhaW5zIGEgVVJMIHByb3BlcnR5IHdoaWNoIG11c3QgYmUgY29udmVydGVkIGludG8gYSBzdHJpbmcuXG4gKiBBbHNvLCBtb3N0IG9mIHRoZSBpbnRlcmZhY2UncyBwcm9wZXJ0aWVzIGFyZSBnZXQgYWNjZXNzb3JzIGFuZCBhcmUgbm90IGF1dG9tYXRpY2FsbHlcbiAqIHNlcmlhbGl6ZWQgd2hlbiBzZW50IGJhY2sgZnJvbSB0aGUgd29ya2VyLlxuICpcbiAqIEBwYXJhbSBzcGFuIFRoZSBTYXNzIFNvdXJjZVNwYW4gb2JqZWN0IHRvIGNvbnZlcnQuXG4gKiBAcmV0dXJucyBBIHNlcmlhbGl6YWJsZSBmb3JtIG9mIHRoZSBTb3VyY2VTcGFuIG9iamVjdC5cbiAqL1xuZnVuY3Rpb24gY29udmVydFNvdXJjZVNwYW4oc3BhbjogU291cmNlU3Bhbik6IE9taXQ8U291cmNlU3BhbiwgJ3VybCc+ICYgeyB1cmw/OiBzdHJpbmcgfSB7XG4gIHJldHVybiB7XG4gICAgdGV4dDogc3Bhbi50ZXh0LFxuICAgIGNvbnRleHQ6IHNwYW4uY29udGV4dCxcbiAgICBlbmQ6IHtcbiAgICAgIGNvbHVtbjogc3Bhbi5lbmQuY29sdW1uLFxuICAgICAgb2Zmc2V0OiBzcGFuLmVuZC5vZmZzZXQsXG4gICAgICBsaW5lOiBzcGFuLmVuZC5saW5lLFxuICAgIH0sXG4gICAgc3RhcnQ6IHtcbiAgICAgIGNvbHVtbjogc3Bhbi5zdGFydC5jb2x1bW4sXG4gICAgICBvZmZzZXQ6IHNwYW4uc3RhcnQub2Zmc2V0LFxuICAgICAgbGluZTogc3Bhbi5zdGFydC5saW5lLFxuICAgIH0sXG4gICAgdXJsOiBzcGFuLnVybCA/IGZpbGVVUkxUb1BhdGgoc3Bhbi51cmwpIDogdW5kZWZpbmVkLFxuICB9O1xufVxuIl19