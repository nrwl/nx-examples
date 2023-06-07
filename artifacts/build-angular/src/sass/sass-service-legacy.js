"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SassLegacyWorkerImplementation = void 0;
const path_1 = require("path");
const worker_threads_1 = require("worker_threads");
const environment_options_1 = require("../utils/environment-options");
/**
 * The maximum number of Workers that will be created to execute render requests.
 */
const MAX_RENDER_WORKERS = environment_options_1.maxWorkers;
/**
 * A Sass renderer implementation that provides an interface that can be used by Webpack's
 * `sass-loader`. The implementation uses a Worker thread to perform the Sass rendering
 * with the `dart-sass` package.  The `dart-sass` synchronous render function is used within
 * the worker which can be up to two times faster than the asynchronous variant.
 */
class SassLegacyWorkerImplementation {
    constructor() {
        this.workers = [];
        this.availableWorkers = [];
        this.requests = new Map();
        this.workerPath = (0, path_1.join)(__dirname, './worker-legacy.js');
        this.idCounter = 1;
        this.nextWorkerIndex = 0;
    }
    /**
     * Provides information about the Sass implementation.
     * This mimics enough of the `dart-sass` value to be used with the `sass-loader`.
     */
    get info() {
        return 'dart-sass\tworker';
    }
    /**
     * The synchronous render function is not used by the `sass-loader`.
     */
    renderSync() {
        throw new Error('Sass renderSync is not supported.');
    }
    /**
     * Asynchronously request a Sass stylesheet to be renderered.
     *
     * @param options The `dart-sass` options to use when rendering the stylesheet.
     * @param callback The function to execute when the rendering is complete.
     */
    render(options, callback) {
        // The `functions`, `logger` and `importer` options are JavaScript functions that cannot be transferred.
        // If any additional function options are added in the future, they must be excluded as well.
        const { functions, importer, logger, ...serializableOptions } = options;
        // The CLI's configuration does not use or expose the ability to defined custom Sass functions
        if (functions && Object.keys(functions).length > 0) {
            throw new Error('Sass custom functions are not supported.');
        }
        let workerIndex = this.availableWorkers.pop();
        if (workerIndex === undefined) {
            if (this.workers.length < MAX_RENDER_WORKERS) {
                workerIndex = this.workers.length;
                this.workers.push(this.createWorker());
            }
            else {
                workerIndex = this.nextWorkerIndex++;
                if (this.nextWorkerIndex >= this.workers.length) {
                    this.nextWorkerIndex = 0;
                }
            }
        }
        const request = this.createRequest(workerIndex, callback, importer);
        this.requests.set(request.id, request);
        this.workers[workerIndex].postMessage({
            id: request.id,
            hasImporter: !!importer,
            options: serializableOptions,
        });
    }
    /**
     * Shutdown the Sass render worker.
     * Executing this method will stop any pending render requests.
     */
    close() {
        for (const worker of this.workers) {
            try {
                void worker.terminate();
            }
            catch { }
        }
        this.requests.clear();
    }
    createWorker() {
        const { port1: mainImporterPort, port2: workerImporterPort } = new worker_threads_1.MessageChannel();
        const importerSignal = new Int32Array(new SharedArrayBuffer(4));
        const worker = new worker_threads_1.Worker(this.workerPath, {
            workerData: { workerImporterPort, importerSignal },
            transferList: [workerImporterPort],
        });
        worker.on('message', (response) => {
            const request = this.requests.get(response.id);
            if (!request) {
                return;
            }
            this.requests.delete(response.id);
            this.availableWorkers.push(request.workerIndex);
            if (response.result) {
                // The results are expected to be Node.js `Buffer` objects but will each be transferred as
                // a Uint8Array that does not have the expected `toString` behavior of a `Buffer`.
                const { css, map, stats } = response.result;
                const result = {
                    // This `Buffer.from` override will use the memory directly and avoid making a copy
                    css: Buffer.from(css.buffer, css.byteOffset, css.byteLength),
                    stats,
                };
                if (map) {
                    // This `Buffer.from` override will use the memory directly and avoid making a copy
                    result.map = Buffer.from(map.buffer, map.byteOffset, map.byteLength);
                }
                request.callback(undefined, result);
            }
            else {
                request.callback(response.error);
            }
        });
        mainImporterPort.on('message', ({ id, url, prev, fromImport, }) => {
            const request = this.requests.get(id);
            if (!request?.importers) {
                mainImporterPort.postMessage(null);
                Atomics.store(importerSignal, 0, 1);
                Atomics.notify(importerSignal, 0);
                return;
            }
            this.processImporters(request.importers, url, prev, fromImport)
                .then((result) => {
                mainImporterPort.postMessage(result);
            })
                .catch((error) => {
                mainImporterPort.postMessage(error);
            })
                .finally(() => {
                Atomics.store(importerSignal, 0, 1);
                Atomics.notify(importerSignal, 0);
            });
        });
        mainImporterPort.unref();
        return worker;
    }
    async processImporters(importers, url, prev, fromImport) {
        let result = null;
        for (const importer of importers) {
            result = await new Promise((resolve) => {
                // Importers can be both sync and async
                const innerResult = importer.call({ fromImport }, url, prev, resolve);
                if (innerResult !== undefined) {
                    resolve(innerResult);
                }
            });
            if (result) {
                break;
            }
        }
        return result;
    }
    createRequest(workerIndex, callback, importer) {
        return {
            id: this.idCounter++,
            workerIndex,
            callback,
            importers: !importer || Array.isArray(importer) ? importer : [importer],
        };
    }
}
exports.SassLegacyWorkerImplementation = SassLegacyWorkerImplementation;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Fzcy1zZXJ2aWNlLWxlZ2FjeS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2J1aWxkX2FuZ3VsYXIvc3JjL3Nhc3Mvc2Fzcy1zZXJ2aWNlLWxlZ2FjeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7QUFFSCwrQkFBNEI7QUFVNUIsbURBQXdEO0FBQ3hELHNFQUEwRDtBQUUxRDs7R0FFRztBQUNILE1BQU0sa0JBQWtCLEdBQUcsZ0NBQVUsQ0FBQztBQTBCdEM7Ozs7O0dBS0c7QUFDSCxNQUFhLDhCQUE4QjtJQUEzQztRQUNtQixZQUFPLEdBQWEsRUFBRSxDQUFDO1FBQ3ZCLHFCQUFnQixHQUFhLEVBQUUsQ0FBQztRQUNoQyxhQUFRLEdBQUcsSUFBSSxHQUFHLEVBQXlCLENBQUM7UUFDNUMsZUFBVSxHQUFHLElBQUEsV0FBSSxFQUFDLFNBQVMsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO1FBQzVELGNBQVMsR0FBRyxDQUFDLENBQUM7UUFDZCxvQkFBZSxHQUFHLENBQUMsQ0FBQztJQTRMOUIsQ0FBQztJQTFMQzs7O09BR0c7SUFDSCxJQUFJLElBQUk7UUFDTixPQUFPLG1CQUFtQixDQUFDO0lBQzdCLENBQUM7SUFFRDs7T0FFRztJQUNILFVBQVU7UUFDUixNQUFNLElBQUksS0FBSyxDQUFDLG1DQUFtQyxDQUFDLENBQUM7SUFDdkQsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsTUFBTSxDQUFDLE9BQXlCLEVBQUUsUUFBd0I7UUFDeEQsd0dBQXdHO1FBQ3hHLDZGQUE2RjtRQUM3RixNQUFNLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsR0FBRyxtQkFBbUIsRUFBRSxHQUFHLE9BQU8sQ0FBQztRQUV4RSw4RkFBOEY7UUFDOUYsSUFBSSxTQUFTLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxN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LEVBQUUsRUFBRSxJQUFJLENBQUMsU0FBUyxFQUFFO1lBQ3BCLFdBQVc7WUFDWCxRQUFRO1lBQ1IsU0FBUyxFQUFFLENBQUMsUUFBUSxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUM7U0FDeEUsQ0FBQztJQUNKLENBQUM7Q0FDRjtBQWxNRCx3RUFrTUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsgam9pbiB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHtcbiAgTGVnYWN5QXN5bmNJbXBvcnRlciBhcyBBc3luY0ltcG9ydGVyLFxuICBMZWdhY3lSZXN1bHQgYXMgQ29tcGlsZVJlc3VsdCxcbiAgTGVnYWN5RXhjZXB0aW9uIGFzIEV4Y2VwdGlvbixcbiAgTGVnYWN5SW1wb3J0ZXJSZXN1bHQgYXMgSW1wb3J0ZXJSZXN1bHQsXG4gIExlZ2FjeUltcG9ydGVyVGhpcyBhcyBJbXBvcnRlclRoaXMsXG4gIExlZ2FjeU9wdGlvbnMgYXMgT3B0aW9ucyxcbiAgTGVnYWN5U3luY0ltcG9ydGVyIGFzIFN5bmNJbXBvcnRlcixcbn0gZnJvbSAnc2Fzcyc7XG5pbXBvcnQgeyBNZXNzYWdlQ2hhbm5lbCwgV29ya2VyIH0gZnJvbSAnd29ya2VyX3RocmVhZHMnO1xuaW1wb3J0IHsgbWF4V29ya2VycyB9IGZyb20gJy4uL3V0aWxzL2Vudmlyb25tZW50LW9wdGlvbnMnO1xuXG4vKipcbiAqIFRoZSBtYXhpbXVtIG51bWJlciBvZiBXb3JrZXJzIHRoYXQgd2lsbCBiZSBjcmVhdGVkIHRvIGV4ZWN1dGUgcmVuZGVyIHJlcXVlc3RzLlxuICovXG5jb25zdCBNQVhfUkVOREVSX1dPUktFUlMgPSBtYXhXb3JrZXJzO1xuXG4vKipcbiAqIFRoZSBjYWxsYmFjayB0eXBlIGZvciB0aGUgYGRhcnQtc2Fzc2AgYXN5bmNocm9ub3VzIHJlbmRlciBmdW5jdGlvbi5cbiAqL1xudHlwZSBSZW5kZXJDYWxsYmFjayA9IChlcnJvcj86IEV4Y2VwdGlvbiwgcmVzdWx0PzogQ29tcGlsZVJlc3VsdCkgPT4gdm9pZDtcblxuLyoqXG4gKiBBbiBvYmplY3QgY29udGFpbmluZyB0aGUgY29udGV4dHVhbCBpbmZvcm1hdGlvbiBmb3IgYSBzcGVjaWZpYyByZW5kZXIgcmVxdWVzdC5cbiAqL1xuaW50ZXJmYWNlIFJlbmRlclJlcXVlc3Qge1xuICBpZDogbnVtYmVyO1xuICB3b3JrZXJJbmRleDogbnVtYmVyO1xuICBjYWxsYmFjazogUmVuZGVyQ2FsbGJhY2s7XG4gIGltcG9ydGVycz86IChTeW5jSW1wb3J0ZXIgfCBBc3luY0ltcG9ydGVyKVtdO1xufVxuXG4vKipcbiAqIEEgcmVzcG9uc2UgZnJvbSB0aGUgU2FzcyByZW5kZXIgV29ya2VyIGNvbnRhaW5pbmcgdGhlIHJlc3VsdCBvZiB0aGUgb3BlcmF0aW9uLlxuICovXG5pbnRlcmZhY2UgUmVuZGVyUmVzcG9uc2VNZXNzYWdlIHtcbiAgaWQ6IG51bWJlcjtcbiAgZXJyb3I/OiBFeGNlcHRpb247XG4gIHJlc3VsdD86IENvbXBpbGVSZXN1bHQ7XG59XG5cbi8qKlxuICogQSBTYXNzIHJlbmRlcmVyIGltcGxlbWVudGF0aW9uIHRoYXQgcHJvdmlkZXMgYW4gaW50ZXJmYWNlIHRoYXQgY2FuIGJlIHVzZWQgYnkgV2VicGFjaydzXG4gKiBgc2Fzcy1sb2FkZXJgLiBUaGUgaW1wbGVtZW50YXRpb24gdXNlcyBhIFdvcmtlciB0aHJlYWQgdG8gcGVyZm9ybSB0aGUgU2FzcyByZW5kZXJpbmdcbiAqIHdpdGggdGhlIGBkYXJ0LXNhc3NgIHBhY2thZ2UuICBUaGUgYGRhcnQtc2Fzc2Agc3luY2hyb25vdXMgcmVuZGVyIGZ1bmN0aW9uIGlzIHVzZWQgd2l0aGluXG4gKiB0aGUgd29ya2VyIHdoaWNoIGNhbiBiZSB1cCB0byB0d28gdGltZXMgZmFzdGVyIHRoYW4gdGhlIGFzeW5jaHJvbm91cyB2YXJpYW50LlxuICovXG5leHBvcnQgY2xhc3MgU2Fzc0xlZ2FjeVdvcmtlckltcGxlbWVudGF0aW9uIHtcbiAgcHJpdmF0ZSByZWFkb25seSB3b3JrZXJzOiBXb3JrZXJbXSA9IFtdO1xuICBwcml2YXRlIHJlYWRvbmx5IGF2YWlsYWJsZVdvcmtlcnM6IG51bWJlcltdID0gW107XG4gIHByaXZhdGUgcmVhZG9ubHkgcmVxdWVzdHMgPSBuZXcgTWFwPG51bWJlciwgUmVuZGVyUmVxdWVzdD4oKTtcbiAgcHJpdmF0ZSByZWFkb25seSB3b3JrZXJQYXRoID0gam9pbihfX2Rpcm5hbWUsICcuL3dvcmtlci1sZWdhY3kuanMnKTtcbiAgcHJpdmF0ZSBpZENvdW50ZXIgPSAxO1xuICBwcml2YXRlIG5leHRXb3JrZXJJbmRleCA9IDA7XG5cbiAgLyoqXG4gICAqIFByb3ZpZGVzIGluZm9ybWF0aW9uIGFib3V0IHRoZSBTYXNzIGltcGxlbWVudGF0aW9uLlxuICAgKiBUaGlzIG1pbWljcyBlbm91Z2ggb2YgdGhlIGBkYXJ0LXNhc3NgIHZhbHVlIHRvIGJlIHVzZWQgd2l0aCB0aGUgYHNhc3MtbG9hZGVyYC5cbiAgICovXG4gIGdldCBpbmZvKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuICdkYXJ0LXNhc3NcXHR3b3JrZXInO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBzeW5jaHJvbm91cyByZW5kZXIgZnVuY3Rpb24gaXMgbm90IHVzZWQgYnkgdGhlIGBzYXNzLWxvYWRlcmAuXG4gICAqL1xuICByZW5kZXJTeW5jKCk6IG5ldmVyIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1Nhc3MgcmVuZGVyU3luYyBpcyBub3Qgc3VwcG9ydGVkLicpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFzeW5jaHJvbm91c2x5IHJlcXVlc3QgYSBTYXNzIHN0eWxlc2hlZXQgdG8gYmUgcmVuZGVyZXJlZC5cbiAgICpcbiAgICogQHBhcmFtIG9wdGlvbnMgVGhlIGBkYXJ0LXNhc3NgIG9wdGlvbnMgdG8gdXNlIHdoZW4gcmVuZGVyaW5nIHRoZSBzdHlsZXNoZWV0LlxuICAgKiBAcGFyYW0gY2FsbGJhY2sgVGhlIGZ1bmN0aW9uIHRvIGV4ZWN1dGUgd2hlbiB0aGUgcmVuZGVyaW5nIGlzIGNvbXBsZXRlLlxuICAgKi9cbiAgcmVuZGVyKG9wdGlvbnM6IE9wdGlvbnM8J2FzeW5jJz4sIGNhbGxiYWNrOiBSZW5kZXJDYWxsYmFjayk6IHZvaWQge1xuICAgIC8vIFRoZSBgZnVuY3Rpb25zYCwgYGxvZ2dlcmAgYW5kIGBpbXBvcnRlcmAgb3B0aW9ucyBhcmUgSmF2YVNjcmlwdCBmdW5jdGlvbnMgdGhhdCBjYW5ub3QgYmUgdHJhbnNmZXJyZWQuXG4gICAgLy8gSWYgYW55IGFkZGl0aW9uYWwgZnVuY3Rpb24gb3B0aW9ucyBhcmUgYWRkZWQgaW4gdGhlIGZ1dHVyZSwgdGhleSBtdXN0IGJlIGV4Y2x1ZGVkIGFzIHdlbGwuXG4gICAgY29uc3QgeyBmdW5jdGlvbnMsIGltcG9ydGVyLCBsb2dnZXIsIC4uLnNlcmlhbGl6YWJsZU9wdGlvbnMgfSA9IG9wdGlvbnM7XG5cbiAgICAvLyBUaGUgQ0xJJ3MgY29uZmlndXJhdGlvbiBkb2VzIG5vdCB1c2Ugb3IgZXhwb3NlIHRoZSBhYmlsaXR5IHRvIGRlZmluZWQgY3VzdG9tIFNhc3MgZnVuY3Rpb25zXG4gICAgaWYgKGZ1bmN0aW9ucyAmJiBPYmplY3Qua2V5cyhmdW5jdGlvbnMpLmxlbmd0aCA+IDApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignU2FzcyBjdXN0b20gZnVuY3Rpb25zIGFyZSBub3Qgc3VwcG9ydGVkLicpO1xuICAgIH1cblxuICAgIGxldCB3b3JrZXJJbmRleCA9IHRoaXMuYXZhaWxhYmxlV29ya2Vycy5wb3AoKTtcbiAgICBpZiAod29ya2VySW5kZXggPT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKHRoaXMud29ya2Vycy5sZW5ndGggPCBNQVhfUkVOREVSX1dPUktFUlMpIHtcbiAgICAgICAgd29ya2VySW5kZXggPSB0aGlzLndvcmtlcnMubGVuZ3RoO1xuICAgICAgICB0aGlzLndvcmtlcnMucHVzaCh0aGlzLmNyZWF0ZVdvcmtlcigpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHdvcmtlckluZGV4ID0gdGhpcy5uZXh0V29ya2VySW5kZXgrKztcbiAgICAgICAgaWYgKHRoaXMubmV4dFdvcmtlckluZGV4ID49IHRoaXMud29ya2Vycy5sZW5ndGgpIHtcbiAgICAgICAgICB0aGlzLm5leHRXb3JrZXJJbmRleCA9IDA7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCByZXF1ZXN0ID0gdGhpcy5jcmVhdGVSZXF1ZXN0KHdvcmtlckluZGV4LCBjYWxsYmFjaywgaW1wb3J0ZXIpO1xuICAgIHRoaXMucmVxdWVzdHMuc2V0KHJlcXVlc3QuaWQsIHJlcXVlc3QpO1xuXG4gICAgdGhpcy53b3JrZXJzW3dvcmtlckluZGV4XS5wb3N0TWVzc2FnZSh7XG4gICAgICBpZDogcmVxdWVzdC5pZCxcbiAgICAgIGhhc0ltcG9ydGVyOiAhIWltcG9ydGVyLFxuICAgICAgb3B0aW9uczogc2VyaWFsaXphYmxlT3B0aW9ucyxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaHV0ZG93biB0aGUgU2FzcyByZW5kZXIgd29ya2VyLlxuICAgKiBFeGVjdXRpbmcgdGhpcyBtZXRob2Qgd2lsbCBzdG9wIGFueSBwZW5kaW5nIHJlbmRlciByZXF1ZXN0cy5cbiAgICovXG4gIGNsb3NlKCk6IHZvaWQge1xuICAgIGZvciAoY29uc3Qgd29ya2VyIG9mIHRoaXMud29ya2Vycykge1xuICAgICAgdHJ5IHtcbiAgICAgICAgdm9pZCB3b3JrZXIudGVybWluYXRlKCk7XG4gICAgICB9IGNhdGNoIHt9XG4gICAgfVxuICAgIHRoaXMucmVxdWVzdHMuY2xlYXIoKTtcbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlV29ya2VyKCk6IFdvcmtlciB7XG4gICAgY29uc3QgeyBwb3J0MTogbWFpbkltcG9ydGVyUG9ydCwgcG9ydDI6IHdvcmtlckltcG9ydGVyUG9ydCB9ID0gbmV3IE1lc3NhZ2VDaGFubmVsKCk7XG4gICAgY29uc3QgaW1wb3J0ZXJTaWduYWwgPSBuZXcgSW50MzJBcnJheShuZXcgU2hhcmVkQXJyYXlCdWZmZXIoNCkpO1xuXG4gICAgY29uc3Qgd29ya2VyID0gbmV3IFdvcmtlcih0aGlzLndvcmtlclBhdGgsIHtcbiAgICAgIHdvcmtlckRhdGE6IHsgd29ya2VySW1wb3J0ZXJQb3J0LCBpbXBvcnRlclNpZ25hbCB9LFxuICAgICAgdHJhbnNmZXJMaXN0OiBbd29ya2VySW1wb3J0ZXJQb3J0XSxcbiAgICB9KTtcblxuICAgIHdvcmtlci5vbignbWVzc2FnZScsIChyZXNwb25zZTogUmVuZGVyUmVzcG9uc2VNZXNzYWdlKSA9PiB7XG4gICAgICBjb25zdCByZXF1ZXN0ID0gdGhpcy5yZXF1ZXN0cy5nZXQocmVzcG9uc2UuaWQpO1xuICAgICAgaWYgKCFyZXF1ZXN0KSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgdGhpcy5yZXF1ZXN0cy5kZWxldGUocmVzcG9uc2UuaWQpO1xuICAgICAgdGhpcy5hdmFpbGFibGVXb3JrZXJzLnB1c2gocmVxdWVzdC53b3JrZXJJbmRleCk7XG5cbiAgICAgIGlmIChyZXNwb25zZS5yZXN1bHQpIHtcbiAgICAgICAgLy8gVGhlIHJlc3VsdHMgYXJlIGV4cGVjdGVkIHRvIGJlIE5vZGUuanMgYEJ1ZmZlcmAgb2JqZWN0cyBidXQgd2lsbCBlYWNoIGJlIHRyYW5zZmVycmVkIGFzXG4gICAgICAgIC8vIGEgVWludDhBcnJheSB0aGF0IGRvZXMgbm90IGhhdmUgdGhlIGV4cGVjdGVkIGB0b1N0cmluZ2AgYmVoYXZpb3Igb2YgYSBgQnVmZmVyYC5cbiAgICAgICAgY29uc3QgeyBjc3MsIG1hcCwgc3RhdHMgfSA9IHJlc3BvbnNlLnJlc3VsdDtcbiAgICAgICAgY29uc3QgcmVzdWx0OiBDb21waWxlUmVzdWx0ID0ge1xuICAgICAgICAgIC8vIFRoaXMgYEJ1ZmZlci5mcm9tYCBvdmVycmlkZSB3aWxsIHVzZSB0aGUgbWVtb3J5IGRpcmVjdGx5IGFuZCBhdm9pZCBtYWtpbmcgYSBjb3B5XG4gICAgICAgICAgY3NzOiBCdWZmZXIuZnJvbShjc3MuYnVmZmVyLCBjc3MuYnl0ZU9mZnNldCwgY3NzLmJ5dGVMZW5ndGgpLFxuICAgICAgICAgIHN0YXRzLFxuICAgICAgICB9O1xuICAgICAgICBpZiAobWFwKSB7XG4gICAgICAgICAgLy8gVGhpcyBgQnVmZmVyLmZyb21gIG92ZXJyaWRlIHdpbGwgdXNlIHRoZSBtZW1vcnkgZGlyZWN0bHkgYW5kIGF2b2lkIG1ha2luZyBhIGNvcHlcbiAgICAgICAgICByZXN1bHQubWFwID0gQnVmZmVyLmZyb20obWFwLmJ1ZmZlciwgbWFwLmJ5dGVPZmZzZXQsIG1hcC5ieXRlTGVuZ3RoKTtcbiAgICAgICAgfVxuICAgICAgICByZXF1ZXN0LmNhbGxiYWNrKHVuZGVmaW5lZCwgcmVzdWx0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlcXVlc3QuY2FsbGJhY2socmVzcG9uc2UuZXJyb3IpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgbWFpbkltcG9ydGVyUG9ydC5vbihcbiAgICAgICdtZXNzYWdlJyxcbiAgICAgICh7XG4gICAgICAgIGlkLFxuICAgICAgICB1cmwsXG4gICAgICAgIHByZXYsXG4gICAgICAgIGZyb21JbXBvcnQsXG4gICAgICB9OiB7XG4gICAgICAgIGlkOiBudW1iZXI7XG4gICAgICAgIHVybDogc3RyaW5nO1xuICAgICAgICBwcmV2OiBzdHJpbmc7XG4gICAgICAgIGZyb21JbXBvcnQ6IGJvb2xlYW47XG4gICAgICB9KSA9PiB7XG4gICAgICAgIGNvbnN0IHJlcXVlc3QgPSB0aGlzLnJlcXVlc3RzLmdldChpZCk7XG4gICAgICAgIGlmICghcmVxdWVzdD8uaW1wb3J0ZXJzKSB7XG4gICAgICAgICAgbWFpbkltcG9ydGVyUG9ydC5wb3N0TWVzc2FnZShudWxsKTtcbiAgICAgICAgICBBdG9taWNzLnN0b3JlKGltcG9ydGVyU2lnbmFsLCAwLCAxKTtcbiAgICAgICAgICBBdG9taWNzLm5vdGlmeShpbXBvcnRlclNpZ25hbCwgMCk7XG5cbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnByb2Nlc3NJbXBvcnRlcnMocmVxdWVzdC5pbXBvcnRlcnMsIHVybCwgcHJldiwgZnJvbUltcG9ydClcbiAgICAgICAgICAudGhlbigocmVzdWx0KSA9PiB7XG4gICAgICAgICAgICBtYWluSW1wb3J0ZXJQb3J0LnBvc3RNZXNzYWdlKHJlc3VsdCk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgICAgICAgICBtYWluSW1wb3J0ZXJQb3J0LnBvc3RNZXNzYWdlKGVycm9yKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5maW5hbGx5KCgpID0+IHtcbiAgICAgICAgICAgIEF0b21pY3Muc3RvcmUoaW1wb3J0ZXJTaWduYWwsIDAsIDEpO1xuICAgICAgICAgICAgQXRvbWljcy5ub3RpZnkoaW1wb3J0ZXJTaWduYWwsIDApO1xuICAgICAgICAgIH0pO1xuICAgICAgfSxcbiAgICApO1xuXG4gICAgbWFpbkltcG9ydGVyUG9ydC51bnJlZigpO1xuXG4gICAgcmV0dXJuIHdvcmtlcjtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcHJvY2Vzc0ltcG9ydGVycyhcbiAgICBpbXBvcnRlcnM6IEl0ZXJhYmxlPFN5bmNJbXBvcnRlciB8IEFzeW5jSW1wb3J0ZXI+LFxuICAgIHVybDogc3RyaW5nLFxuICAgIHByZXY6IHN0cmluZyxcbiAgICBmcm9tSW1wb3J0OiBib29sZWFuLFxuICApOiBQcm9taXNlPEltcG9ydGVyUmVzdWx0PiB7XG4gICAgbGV0IHJlc3VsdCA9IG51bGw7XG4gICAgZm9yIChjb25zdCBpbXBvcnRlciBvZiBpbXBvcnRlcnMpIHtcbiAgICAgIHJlc3VsdCA9IGF3YWl0IG5ldyBQcm9taXNlPEltcG9ydGVyUmVzdWx0PigocmVzb2x2ZSkgPT4ge1xuICAgICAgICAvLyBJbXBvcnRlcnMgY2FuIGJlIGJvdGggc3luYyBhbmQgYXN5bmNcbiAgICAgICAgY29uc3QgaW5uZXJSZXN1bHQgPSAoaW1wb3J0ZXIgYXMgQXN5bmNJbXBvcnRlcikuY2FsbChcbiAgICAgICAgICB7IGZyb21JbXBvcnQgfSBhcyBJbXBvcnRlclRoaXMsXG4gICAgICAgICAgdXJsLFxuICAgICAgICAgIHByZXYsXG4gICAgICAgICAgcmVzb2x2ZSxcbiAgICAgICAgKTtcbiAgICAgICAgaWYgKGlubmVyUmVzdWx0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICByZXNvbHZlKGlubmVyUmVzdWx0KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlUmVxdWVzdChcbiAgICB3b3JrZXJJbmRleDogbnVtYmVyLFxuICAgIGNhbGxiYWNrOiBSZW5kZXJDYWxsYmFjayxcbiAgICBpbXBvcnRlcjogU3luY0ltcG9ydGVyIHwgQXN5bmNJbXBvcnRlciB8IChTeW5jSW1wb3J0ZXIgfCBBc3luY0ltcG9ydGVyKVtdIHwgdW5kZWZpbmVkLFxuICApOiBSZW5kZXJSZXF1ZXN0IHtcbiAgICByZXR1cm4ge1xuICAgICAgaWQ6IHRoaXMuaWRDb3VudGVyKyssXG4gICAgICB3b3JrZXJJbmRleCxcbiAgICAgIGNhbGxiYWNrLFxuICAgICAgaW1wb3J0ZXJzOiAhaW1wb3J0ZXIgfHwgQXJyYXkuaXNBcnJheShpbXBvcnRlcikgPyBpbXBvcnRlciA6IFtpbXBvcnRlcl0sXG4gICAgfTtcbiAgfVxufVxuIl19