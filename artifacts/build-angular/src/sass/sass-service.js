"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SassWorkerImplementation = void 0;
const node_path_1 = require("node:path");
const node_url_1 = require("node:url");
const node_worker_threads_1 = require("node:worker_threads");
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
class SassWorkerImplementation {
    constructor(rebase = false) {
        this.rebase = rebase;
        this.workers = [];
        this.availableWorkers = [];
        this.requests = new Map();
        this.workerPath = (0, node_path_1.join)(__dirname, './worker.js');
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
    compileString() {
        throw new Error('Sass compileString is not supported.');
    }
    /**
     * Asynchronously request a Sass stylesheet to be renderered.
     *
     * @param source The contents to compile.
     * @param options The `dart-sass` options to use when rendering the stylesheet.
     */
    compileStringAsync(source, options) {
        // The `functions`, `logger` and `importer` options are JavaScript functions that cannot be transferred.
        // If any additional function options are added in the future, they must be excluded as well.
        const { functions, importers, url, logger, ...serializableOptions } = options;
        // The CLI's configuration does not use or expose the ability to defined custom Sass functions
        if (functions && Object.keys(functions).length > 0) {
            throw new Error('Sass custom functions are not supported.');
        }
        return new Promise((resolve, reject) => {
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
            const callback = (error, result) => {
                if (error) {
                    const url = error.span?.url;
                    if (url) {
                        error.span.url = (0, node_url_1.pathToFileURL)(url);
                    }
                    reject(error);
                    return;
                }
                if (!result) {
                    reject(new Error('No result.'));
                    return;
                }
                resolve(result);
            };
            const request = this.createRequest(workerIndex, callback, logger, importers);
            this.requests.set(request.id, request);
            this.workers[workerIndex].postMessage({
                id: request.id,
                source,
                hasImporter: !!importers?.length,
                hasLogger: !!logger,
                rebase: this.rebase,
                options: {
                    ...serializableOptions,
                    // URL is not serializable so to convert to string here and back to URL in the worker.
                    url: url ? (0, node_url_1.fileURLToPath)(url) : undefined,
                },
            });
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
        const { port1: mainImporterPort, port2: workerImporterPort } = new node_worker_threads_1.MessageChannel();
        const importerSignal = new Int32Array(new SharedArrayBuffer(4));
        const worker = new node_worker_threads_1.Worker(this.workerPath, {
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
            if (response.warnings && request.logger?.warn) {
                for (const { message, span, ...options } of response.warnings) {
                    request.logger.warn(message, {
                        ...options,
                        span: span && {
                            ...span,
                            url: span.url ? (0, node_url_1.pathToFileURL)(span.url) : undefined,
                        },
                    });
                }
            }
            if (response.result) {
                request.callback(undefined, {
                    ...response.result,
                    // URL is not serializable so in the worker we convert to string and here back to URL.
                    loadedUrls: response.result.loadedUrls.map((p) => (0, node_url_1.pathToFileURL)(p)),
                });
            }
            else {
                request.callback(response.error);
            }
        });
        mainImporterPort.on('message', ({ id, url, options }) => {
            const request = this.requests.get(id);
            if (!request?.importers) {
                mainImporterPort.postMessage(null);
                Atomics.store(importerSignal, 0, 1);
                Atomics.notify(importerSignal, 0);
                return;
            }
            this.processImporters(request.importers, url, {
                ...options,
                previousResolvedModules: request.previousResolvedModules,
            })
                .then((result) => {
                if (result) {
                    request.previousResolvedModules ?? (request.previousResolvedModules = new Set());
                    request.previousResolvedModules.add((0, node_path_1.dirname)(result));
                }
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
    async processImporters(importers, url, options) {
        for (const importer of importers) {
            if (this.isImporter(importer)) {
                // Importer
                throw new Error('Only File Importers are supported.');
            }
            // File importer (Can be sync or aync).
            const result = await importer.findFileUrl(url, options);
            if (result) {
                return (0, node_url_1.fileURLToPath)(result);
            }
        }
        return null;
    }
    createRequest(workerIndex, callback, logger, importers) {
        return {
            id: this.idCounter++,
            workerIndex,
            callback,
            logger,
            importers,
        };
    }
    isImporter(value) {
        return 'canonicalize' in value && 'load' in value;
    }
}
exports.SassWorkerImplementation = SassWorkerImplementation;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Fzcy1zZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvYnVpbGRfYW5ndWxhci9zcmMvc2Fzcy9zYXNzLXNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7O0FBRUgseUNBQTBDO0FBQzFDLHVDQUF3RDtBQUN4RCw2REFBNkQ7QUFXN0Qsc0VBQTBEO0FBRTFEOztHQUVHO0FBQ0gsTUFBTSxrQkFBa0IsR0FBRyxnQ0FBVSxDQUFDO0FBdUR0Qzs7Ozs7R0FLRztBQUNILE1BQWEsd0JBQXdCO0lBUW5DLFlBQW9CLFNBQVMsS0FBSztRQUFkLFdBQU0sR0FBTixNQUFNLENBQVE7UUFQakIsWUFBTyxHQUFhLEVBQUUsQ0FBQztRQUN2QixxQkFBZ0IsR0FBYSxFQUFFLENBQUM7UUFDaEMsYUFBUSxHQUFHLElBQUksR0FBRyxFQUF5QixDQUFDO1FBQzVDLGVBQVUsR0FBRyxJQUFBLGdCQUFJLEVBQUMsU0FBUyxFQUFFLGFBQWEsQ0FBQyxDQUFDO1FBQ3JELGNBQVMsR0FBRyxDQUFDLENBQUM7UUFDZCxvQkFBZSxHQUFHLENBQUMsQ0FBQztJQUVTLENBQUM7SUFFdEM7OztPQUdHO0lBQ0gsSUFBSSxJQUFJO1FBQ04sT0FBTyxtQkFBbUIsQ0FBQztJQUM3QixDQUFDO0lBRUQ7O09BRUc7SUFDSCxhQUFhO1FBQ1gsTUFBTSxJQUFJLEtBQUssQ0FBQyxzQ0FBc0MsQ0FBQyxDQUFDO0lBQzFELENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILGtCQUFrQixDQUNoQixNQUFjLEVBQ2QsT0FBbUY7UUFFbkYsd0dBQXdHO1FBQ3hHLDZGQUE2RjtRQUM3RixNQUFNLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUFFLEdBQUcsbUJBQW1CLEVBQUUsR0FBRyxPQUFPLENBQUM7UUFFOUUsOEZBQThGO1FBQzlGLElB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QyxDQUFDO2FBQzlCO1NBQ0Y7UUFFRCxPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFFTyxhQUFhLENBQ25CLFdBQW1CLEVBQ25CLFFBQXdCLEVBQ3hCLE1BQTBCLEVBQzFCLFNBQWtDO1FBRWxDLE9BQU87WUFDTCxFQUFFLEVBQUUsSUFBSSxDQUFDLFNBQVMsRUFBRTtZQUNwQixXQUFXO1lBQ1gsUUFBUTtZQUNSLE1BQU07WUFDTixTQUFTO1NBQ1YsQ0FBQztJQUNKLENBQUM7SUFFTyxVQUFVLENBQUMsS0FBZ0I7UUFDakMsT0FBTyxjQUFjLElBQUksS0FBSyxJQUFJLE1BQU0sSUFBSSxLQUFLLENBQUM7SUFDcEQsQ0FBQztDQUNGO0FBck9ELDREQXFPQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBkaXJuYW1lLCBqb2luIH0gZnJvbSAnbm9kZTpwYXRoJztcbmltcG9ydCB7IGZpbGVVUkxUb1BhdGgsIHBhdGhUb0ZpbGVVUkwgfSBmcm9tICdub2RlOnVybCc7XG5pbXBvcnQgeyBNZXNzYWdlQ2hhbm5lbCwgV29ya2VyIH0gZnJvbSAnbm9kZTp3b3JrZXJfdGhyZWFkcyc7XG5pbXBvcnQge1xuICBDb21waWxlUmVzdWx0LFxuICBFeGNlcHRpb24sXG4gIEZpbGVJbXBvcnRlcixcbiAgSW1wb3J0ZXIsXG4gIExvZ2dlcixcbiAgU291cmNlU3BhbixcbiAgU3RyaW5nT3B0aW9uc1dpdGhJbXBvcnRlcixcbiAgU3RyaW5nT3B0aW9uc1dpdGhvdXRJbXBvcnRlcixcbn0gZnJvbSAnc2Fzcyc7XG5pbXBvcnQgeyBtYXhXb3JrZXJzIH0gZnJvbSAnLi4vdXRpbHMvZW52aXJvbm1lbnQtb3B0aW9ucyc7XG5cbi8qKlxuICogVGhlIG1heGltdW0gbnVtYmVyIG9mIFdvcmtlcnMgdGhhdCB3aWxsIGJlIGNyZWF0ZWQgdG8gZXhlY3V0ZSByZW5kZXIgcmVxdWVzdHMuXG4gKi9cbmNvbnN0IE1BWF9SRU5ERVJfV09SS0VSUyA9IG1heFdvcmtlcnM7XG5cbi8qKlxuICogVGhlIGNhbGxiYWNrIHR5cGUgZm9yIHRoZSBgZGFydC1zYXNzYCBhc3luY2hyb25vdXMgcmVuZGVyIGZ1bmN0aW9uLlxuICovXG50eXBlIFJlbmRlckNhbGxiYWNrID0gKGVycm9yPzogRXhjZXB0aW9uLCByZXN1bHQ/OiBDb21waWxlUmVzdWx0KSA9PiB2b2lkO1xuXG50eXBlIEZpbGVJbXBvcnRlck9wdGlvbnMgPSBQYXJhbWV0ZXJzPEZpbGVJbXBvcnRlclsnZmluZEZpbGVVcmwnXT5bMV07XG5cbmV4cG9ydCBpbnRlcmZhY2UgRmlsZUltcG9ydGVyV2l0aFJlcXVlc3RDb250ZXh0T3B0aW9ucyBleHRlbmRzIEZpbGVJbXBvcnRlck9wdGlvbnMge1xuICAvKipcbiAgICogVGhpcyBpcyBhIGN1c3RvbSBvcHRpb24gYW5kIGlzIHJlcXVpcmVkIGFzIFNBU1MgZG9lcyBub3QgcHJvdmlkZSBjb250ZXh0IGZyb20gd2hpY2ggdGhlIGZpbGUgaXMgYmVpbmcgcmVzb2x2ZWQuXG4gICAqIFRoaXMgYnJlYWtzIFlhcm4gUE5QIGFzIHRyYW5zaXRpdmUgZGVwcyBjYW5ub3QgYmUgcmVzb2x2ZWQgZnJvbSB0aGUgd29ya3NwYWNlIHJvb3QuXG4gICAqXG4gICAqIFdvcmthcm91bmQgdW50aWwgaHR0cHM6Ly9naXRodWIuY29tL3Nhc3Mvc2Fzcy9pc3N1ZXMvMzI0NyBpcyBhZGRyZXNzZWQuXG4gICAqL1xuICBwcmV2aW91c1Jlc29sdmVkTW9kdWxlcz86IFNldDxzdHJpbmc+O1xufVxuXG4vKipcbiAqIEFuIG9iamVjdCBjb250YWluaW5nIHRoZSBjb250ZXh0dWFsIGluZm9ybWF0aW9uIGZvciBhIHNwZWNpZmljIHJlbmRlciByZXF1ZXN0LlxuICovXG5pbnRlcmZhY2UgUmVuZGVyUmVxdWVzdCB7XG4gIGlkOiBudW1iZXI7XG4gIHdvcmtlckluZGV4OiBudW1iZXI7XG4gIGNhbGxiYWNrOiBSZW5kZXJDYWxsYmFjaztcbiAgbG9nZ2VyPzogTG9nZ2VyO1xuICBpbXBvcnRlcnM/OiBJbXBvcnRlcnNbXTtcbiAgcHJldmlvdXNSZXNvbHZlZE1vZHVsZXM/OiBTZXQ8c3RyaW5nPjtcbn1cblxuLyoqXG4gKiBBbGwgYXZhaWxhYmxlIGltcG9ydGVyIHR5cGVzLlxuICovXG50eXBlIEltcG9ydGVycyA9XG4gIHwgSW1wb3J0ZXI8J3N5bmMnPlxuICB8IEltcG9ydGVyPCdhc3luYyc+XG4gIHwgRmlsZUltcG9ydGVyPCdzeW5jJz5cbiAgfCBGaWxlSW1wb3J0ZXI8J2FzeW5jJz47XG5cbi8qKlxuICogQSByZXNwb25zZSBmcm9tIHRoZSBTYXNzIHJlbmRlciBXb3JrZXIgY29udGFpbmluZyB0aGUgcmVzdWx0IG9mIHRoZSBvcGVyYXRpb24uXG4gKi9cbmludGVyZmFjZSBSZW5kZXJSZXNwb25zZU1lc3NhZ2Uge1xuICBpZDogbnVtYmVyO1xuICBlcnJvcj86IEV4Y2VwdGlvbjtcbiAgcmVzdWx0PzogT21pdDxDb21waWxlUmVzdWx0LCAnbG9hZGVkVXJscyc+ICYgeyBsb2FkZWRVcmxzOiBzdHJpbmdbXSB9O1xuICB3YXJuaW5ncz86IHtcbiAgICBtZXNzYWdlOiBzdHJpbmc7XG4gICAgZGVwcmVjYXRpb246IGJvb2xlYW47XG4gICAgc3RhY2s/OiBzdHJpbmc7XG4gICAgc3Bhbj86IE9taXQ8U291cmNlU3BhbiwgJ3VybCc+ICYgeyB1cmw/OiBzdHJpbmcgfTtcbiAgfVtdO1xufVxuXG4vKipcbiAqIEEgU2FzcyByZW5kZXJlciBpbXBsZW1lbnRhdGlvbiB0aGF0IHByb3ZpZGVzIGFuIGludGVyZmFjZSB0aGF0IGNhbiBiZSB1c2VkIGJ5IFdlYnBhY2snc1xuICogYHNhc3MtbG9hZGVyYC4gVGhlIGltcGxlbWVudGF0aW9uIHVzZXMgYSBXb3JrZXIgdGhyZWFkIHRvIHBlcmZvcm0gdGhlIFNhc3MgcmVuZGVyaW5nXG4gKiB3aXRoIHRoZSBgZGFydC1zYXNzYCBwYWNrYWdlLiAgVGhlIGBkYXJ0LXNhc3NgIHN5bmNocm9ub3VzIHJlbmRlciBmdW5jdGlvbiBpcyB1c2VkIHdpdGhpblxuICogdGhlIHdvcmtlciB3aGljaCBjYW4gYmUgdXAgdG8gdHdvIHRpbWVzIGZhc3RlciB0aGFuIHRoZSBhc3luY2hyb25vdXMgdmFyaWFudC5cbiAqL1xuZXhwb3J0IGNsYXNzIFNhc3NXb3JrZXJJbXBsZW1lbnRhdGlvbiB7XG4gIHByaXZhdGUgcmVhZG9ubHkgd29ya2VyczogV29ya2VyW10gPSBbXTtcbiAgcHJpdmF0ZSByZWFkb25seSBhdmFpbGFibGVXb3JrZXJzOiBudW1iZXJbXSA9IFtdO1xuICBwcml2YXRlIHJlYWRvbmx5IHJlcXVlc3RzID0gbmV3IE1hcDxudW1iZXIsIFJlbmRlclJlcXVlc3Q+KCk7XG4gIHByaXZhdGUgcmVhZG9ubHkgd29ya2VyUGF0aCA9IGpvaW4oX19kaXJuYW1lLCAnLi93b3JrZXIuanMnKTtcbiAgcHJpdmF0ZSBpZENvdW50ZXIgPSAxO1xuICBwcml2YXRlIG5leHRXb3JrZXJJbmRleCA9IDA7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSByZWJhc2UgPSBmYWxzZSkge31cblxuICAvKipcbiAgICogUHJvdmlkZXMgaW5mb3JtYXRpb24gYWJvdXQgdGhlIFNhc3MgaW1wbGVtZW50YXRpb24uXG4gICAqIFRoaXMgbWltaWNzIGVub3VnaCBvZiB0aGUgYGRhcnQtc2Fzc2AgdmFsdWUgdG8gYmUgdXNlZCB3aXRoIHRoZSBgc2Fzcy1sb2FkZXJgLlxuICAgKi9cbiAgZ2V0IGluZm8oKTogc3RyaW5nIHtcbiAgICByZXR1cm4gJ2RhcnQtc2Fzc1xcdHdvcmtlcic7XG4gIH1cblxuICAvKipcbiAgICogVGhlIHN5bmNocm9ub3VzIHJlbmRlciBmdW5jdGlvbiBpcyBub3QgdXNlZCBieSB0aGUgYHNhc3MtbG9hZGVyYC5cbiAgICovXG4gIGNvbXBpbGVTdHJpbmcoKTogbmV2ZXIge1xuICAgIHRocm93IG5ldyBFcnJvcignU2FzcyBjb21waWxlU3RyaW5nIGlzIG5vdCBzdXBwb3J0ZWQuJyk7XG4gIH1cblxuICAvKipcbiAgICogQXN5bmNocm9ub3VzbHkgcmVxdWVzdCBhIFNhc3Mgc3R5bGVzaGVldCB0byBiZSByZW5kZXJlcmVkLlxuICAgKlxuICAgKiBAcGFyYW0gc291cmNlIFRoZSBjb250ZW50cyB0byBjb21waWxlLlxuICAgKiBAcGFyYW0gb3B0aW9ucyBUaGUgYGRhcnQtc2Fzc2Agb3B0aW9ucyB0byB1c2Ugd2hlbiByZW5kZXJpbmcgdGhlIHN0eWxlc2hlZXQuXG4gICAqL1xuICBjb21waWxlU3RyaW5nQXN5bmMoXG4gICAgc291cmNlOiBzdHJpbmcsXG4gICAgb3B0aW9uczogU3RyaW5nT3B0aW9uc1dpdGhJbXBvcnRlcjwnYXN5bmMnPiB8IFN0cmluZ09wdGlvbnNXaXRob3V0SW1wb3J0ZXI8J2FzeW5jJz4sXG4gICk6IFByb21pc2U8Q29tcGlsZVJlc3VsdD4ge1xuICAgIC8vIFRoZSBgZnVuY3Rpb25zYCwgYGxvZ2dlcmAgYW5kIGBpbXBvcnRlcmAgb3B0aW9ucyBhcmUgSmF2YVNjcmlwdCBmdW5jdGlvbnMgdGhhdCBjYW5ub3QgYmUgdHJhbnNmZXJyZWQuXG4gICAgLy8gSWYgYW55IGFkZGl0aW9uYWwgZnVuY3Rpb24gb3B0aW9ucyBhcmUgYWRkZWQgaW4gdGhlIGZ1dHVyZSwgdGhleSBtdXN0IGJlIGV4Y2x1ZGVkIGFzIHdlbGwuXG4gICAgY29uc3QgeyBmdW5jdGlvbnMsIGltcG9ydGVycywgdXJsLCBsb2dnZXIsIC4uLnNlcmlhbGl6YWJsZU9wdGlvbnMgfSA9IG9wdGlvbnM7XG5cbiAgICAvLyBUaGUgQ0xJJ3MgY29uZmlndXJhdGlvbiBkb2VzIG5vdCB1c2Ugb3IgZXhwb3NlIHRoZSBhYmlsaXR5IHRvIGRlZmluZWQgY3VzdG9tIFNhc3MgZnVuY3Rpb25zXG4gICAgaWYgKGZ1bmN0aW9ucyAmJiBPYmplY3Qua2V5cyhmdW5jdGlvbnMpLmxlbmd0aCA+IDApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignU2FzcyBjdXN0b20gZnVuY3Rpb25zIGFyZSBub3Qgc3VwcG9ydGVkLicpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgUHJvbWlzZTxDb21waWxlUmVzdWx0PigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBsZXQgd29ya2VySW5kZXggPSB0aGlzLmF2YWlsYWJsZVdvcmtlcnMucG9wKCk7XG4gICAgICBpZiAod29ya2VySW5kZXggPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBpZiAodGhpcy53b3JrZXJzLmxlbmd0aCA8IE1BWF9SRU5ERVJfV09SS0VSUykge1xuICAgICAgICAgIHdvcmtlckluZGV4ID0gdGhpcy53b3JrZXJzLmxlbmd0aDtcbiAgICAgICAgICB0aGlzLndvcmtlcnMucHVzaCh0aGlzLmNyZWF0ZVdvcmtlcigpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB3b3JrZXJJbmRleCA9IHRoaXMubmV4dFdvcmtlckluZGV4Kys7XG4gICAgICAgICAgaWYgKHRoaXMubmV4dFdvcmtlckluZGV4ID49IHRoaXMud29ya2Vycy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHRoaXMubmV4dFdvcmtlckluZGV4ID0gMDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY29uc3QgY2FsbGJhY2s6IFJlbmRlckNhbGxiYWNrID0gKGVycm9yLCByZXN1bHQpID0+IHtcbiAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgY29uc3QgdXJsID0gZXJyb3Iuc3Bhbj8udXJsIGFzIHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgICAgICAgICBpZiAodXJsKSB7XG4gICAgICAgICAgICBlcnJvci5zcGFuLnVybCA9IHBhdGhUb0ZpbGVVUkwodXJsKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZWplY3QoZXJyb3IpO1xuXG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFyZXN1bHQpIHtcbiAgICAgICAgICByZWplY3QobmV3IEVycm9yKCdObyByZXN1bHQuJykpO1xuXG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVzb2x2ZShyZXN1bHQpO1xuICAgICAgfTtcblxuICAgICAgY29uc3QgcmVxdWVzdCA9IHRoaXMuY3JlYXRlUmVxdWVzdCh3b3JrZXJJbmRleCwgY2FsbGJhY2ssIGxvZ2dlciwgaW1wb3J0ZXJzKTtcbiAgICAgIHRoaXMucmVxdWVzdHMuc2V0KHJlcXVlc3QuaWQsIHJlcXVlc3QpO1xuXG4gICAgICB0aGlzLndvcmtlcnNbd29ya2VySW5kZXhdLnBvc3RNZXNzYWdlKHtcbiAgICAgICAgaWQ6IHJlcXVlc3QuaWQsXG4gICAgICAgIHNvdXJjZSxcbiAgICAgICAgaGFzSW1wb3J0ZXI6ICEhaW1wb3J0ZXJzPy5sZW5ndGgsXG4gICAgICAgIGhhc0xvZ2dlcjogISFsb2dnZXIsXG4gICAgICAgIHJlYmFzZTogdGhpcy5yZWJhc2UsXG4gICAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgICAuLi5zZXJpYWxpemFibGVPcHRpb25zLFxuICAgICAgICAgIC8vIFVSTCBpcyBub3Qgc2VyaWFsaXphYmxlIHNvIHRvIGNvbnZlcnQgdG8gc3RyaW5nIGhlcmUgYW5kIGJhY2sgdG8gVVJMIGluIHRoZSB3b3JrZXIuXG4gICAgICAgICAgdXJsOiB1cmwgPyBmaWxlVVJMVG9QYXRoKHVybCkgOiB1bmRlZmluZWQsXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaHV0ZG93biB0aGUgU2FzcyByZW5kZXIgd29ya2VyLlxuICAgKiBFeGVjdXRpbmcgdGhpcyBtZXRob2Qgd2lsbCBzdG9wIGFueSBwZW5kaW5nIHJlbmRlciByZXF1ZXN0cy5cbiAgICovXG4gIGNsb3NlKCk6IHZvaWQge1xuICAgIGZvciAoY29uc3Qgd29ya2VyIG9mIHRoaXMud29ya2Vycykge1xuICAgICAgdHJ5IHtcbiAgICAgICAgdm9pZCB3b3JrZXIudGVybWluYXRlKCk7XG4gICAgICB9IGNhdGNoIHt9XG4gICAgfVxuICAgIHRoaXMucmVxdWVzdHMuY2xlYXIoKTtcbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlV29ya2VyKCk6IFdvcmtlciB7XG4gICAgY29uc3QgeyBwb3J0MTogbWFpbkltcG9ydGVyUG9ydCwgcG9ydDI6IHdvcmtlckltcG9ydGVyUG9ydCB9ID0gbmV3IE1lc3NhZ2VDaGFubmVsKCk7XG4gICAgY29uc3QgaW1wb3J0ZXJTaWduYWwgPSBuZXcgSW50MzJBcnJheShuZXcgU2hhcmVkQXJyYXlCdWZmZXIoNCkpO1xuXG4gICAgY29uc3Qgd29ya2VyID0gbmV3IFdvcmtlcih0aGlzLndvcmtlclBhdGgsIHtcbiAgICAgIHdvcmtlckRhdGE6IHsgd29ya2VySW1wb3J0ZXJQb3J0LCBpbXBvcnRlclNpZ25hbCB9LFxuICAgICAgdHJhbnNmZXJMaXN0OiBbd29ya2VySW1wb3J0ZXJQb3J0XSxcbiAgICB9KTtcblxuICAgIHdvcmtlci5vbignbWVzc2FnZScsIChyZXNwb25zZTogUmVuZGVyUmVzcG9uc2VNZXNzYWdlKSA9PiB7XG4gICAgICBjb25zdCByZXF1ZXN0ID0gdGhpcy5yZXF1ZXN0cy5nZXQocmVzcG9uc2UuaWQpO1xuICAgICAgaWYgKCFyZXF1ZXN0KSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgdGhpcy5yZXF1ZXN0cy5kZWxldGUocmVzcG9uc2UuaWQpO1xuICAgICAgdGhpcy5hdmFpbGFibGVXb3JrZXJzLnB1c2gocmVxdWVzdC53b3JrZXJJbmRleCk7XG5cbiAgICAgIGlmIChyZXNwb25zZS53YXJuaW5ncyAmJiByZXF1ZXN0LmxvZ2dlcj8ud2Fybikge1xuICAgICAgICBmb3IgKGNvbnN0IHsgbWVzc2FnZSwgc3BhbiwgLi4ub3B0aW9ucyB9IG9mIHJlc3BvbnNlLndhcm5pbmdzKSB7XG4gICAgICAgICAgcmVxdWVzdC5sb2dnZXIud2FybihtZXNzYWdlLCB7XG4gICAgICAgICAgICAuLi5vcHRpb25zLFxuICAgICAgICAgICAgc3Bhbjogc3BhbiAmJiB7XG4gICAgICAgICAgICAgIC4uLnNwYW4sXG4gICAgICAgICAgICAgIHVybDogc3Bhbi51cmwgPyBwYXRoVG9GaWxlVVJMKHNwYW4udXJsKSA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHJlc3BvbnNlLnJlc3VsdCkge1xuICAgICAgICByZXF1ZXN0LmNhbGxiYWNrKHVuZGVmaW5lZCwge1xuICAgICAgICAgIC4uLnJlc3BvbnNlLnJlc3VsdCxcbiAgICAgICAgICAvLyBVUkwgaXMgbm90IHNlcmlhbGl6YWJsZSBzbyBpbiB0aGUgd29ya2VyIHdlIGNvbnZlcnQgdG8gc3RyaW5nIGFuZCBoZXJlIGJhY2sgdG8gVVJMLlxuICAgICAgICAgIGxvYWRlZFVybHM6IHJlc3BvbnNlLnJlc3VsdC5sb2FkZWRVcmxzLm1hcCgocCkgPT4gcGF0aFRvRmlsZVVSTChwKSksXG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVxdWVzdC5jYWxsYmFjayhyZXNwb25zZS5lcnJvcik7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBtYWluSW1wb3J0ZXJQb3J0Lm9uKFxuICAgICAgJ21lc3NhZ2UnLFxuICAgICAgKHsgaWQsIHVybCwgb3B0aW9ucyB9OiB7IGlkOiBudW1iZXI7IHVybDogc3RyaW5nOyBvcHRpb25zOiBGaWxlSW1wb3J0ZXJPcHRpb25zIH0pID0+IHtcbiAgICAgICAgY29uc3QgcmVxdWVzdCA9IHRoaXMucmVxdWVzdHMuZ2V0KGlkKTtcbiAgICAgICAgaWYgKCFyZXF1ZXN0Py5pbXBvcnRlcnMpIHtcbiAgICAgICAgICBtYWluSW1wb3J0ZXJQb3J0LnBvc3RNZXNzYWdlKG51bGwpO1xuICAgICAgICAgIEF0b21pY3Muc3RvcmUoaW1wb3J0ZXJTaWduYWwsIDAsIDEpO1xuICAgICAgICAgIEF0b21pY3Mubm90aWZ5KGltcG9ydGVyU2lnbmFsLCAwKTtcblxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMucHJvY2Vzc0ltcG9ydGVycyhyZXF1ZXN0LmltcG9ydGVycywgdXJsLCB7XG4gICAgICAgICAgLi4ub3B0aW9ucyxcbiAgICAgICAgICBwcmV2aW91c1Jlc29sdmVkTW9kdWxlczogcmVxdWVzdC5wcmV2aW91c1Jlc29sdmVkTW9kdWxlcyxcbiAgICAgICAgfSlcbiAgICAgICAgICAudGhlbigocmVzdWx0KSA9PiB7XG4gICAgICAgICAgICBpZiAocmVzdWx0KSB7XG4gICAgICAgICAgICAgIHJlcXVlc3QucHJldmlvdXNSZXNvbHZlZE1vZHVsZXMgPz89IG5ldyBTZXQoKTtcbiAgICAgICAgICAgICAgcmVxdWVzdC5wcmV2aW91c1Jlc29sdmVkTW9kdWxlcy5hZGQoZGlybmFtZShyZXN1bHQpKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbWFpbkltcG9ydGVyUG9ydC5wb3N0TWVzc2FnZShyZXN1bHQpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgICAgICAgbWFpbkltcG9ydGVyUG9ydC5wb3N0TWVzc2FnZShlcnJvcik7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuZmluYWxseSgoKSA9PiB7XG4gICAgICAgICAgICBBdG9taWNzLnN0b3JlKGltcG9ydGVyU2lnbmFsLCAwLCAxKTtcbiAgICAgICAgICAgIEF0b21pY3Mubm90aWZ5KGltcG9ydGVyU2lnbmFsLCAwKTtcbiAgICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgKTtcblxuICAgIG1haW5JbXBvcnRlclBvcnQudW5yZWYoKTtcblxuICAgIHJldHVybiB3b3JrZXI7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHByb2Nlc3NJbXBvcnRlcnMoXG4gICAgaW1wb3J0ZXJzOiBJdGVyYWJsZTxJbXBvcnRlcnM+LFxuICAgIHVybDogc3RyaW5nLFxuICAgIG9wdGlvbnM6IEZpbGVJbXBvcnRlcldpdGhSZXF1ZXN0Q29udGV4dE9wdGlvbnMsXG4gICk6IFByb21pc2U8c3RyaW5nIHwgbnVsbD4ge1xuICAgIGZvciAoY29uc3QgaW1wb3J0ZXIgb2YgaW1wb3J0ZXJzKSB7XG4gICAgICBpZiAodGhpcy5pc0ltcG9ydGVyKGltcG9ydGVyKSkge1xuICAgICAgICAvLyBJbXBvcnRlclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ09ubHkgRmlsZSBJbXBvcnRlcnMgYXJlIHN1cHBvcnRlZC4nKTtcbiAgICAgIH1cblxuICAgICAgLy8gRmlsZSBpbXBvcnRlciAoQ2FuIGJlIHN5bmMgb3IgYXluYykuXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBpbXBvcnRlci5maW5kRmlsZVVybCh1cmwsIG9wdGlvbnMpO1xuICAgICAgaWYgKHJlc3VsdCkge1xuICAgICAgICByZXR1cm4gZmlsZVVSTFRvUGF0aChyZXN1bHQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcHJpdmF0ZSBjcmVhdGVSZXF1ZXN0KFxuICAgIHdvcmtlckluZGV4OiBudW1iZXIsXG4gICAgY2FsbGJhY2s6IFJlbmRlckNhbGxiYWNrLFxuICAgIGxvZ2dlcjogTG9nZ2VyIHwgdW5kZWZpbmVkLFxuICAgIGltcG9ydGVyczogSW1wb3J0ZXJzW10gfCB1bmRlZmluZWQsXG4gICk6IFJlbmRlclJlcXVlc3Qge1xuICAgIHJldHVybiB7XG4gICAgICBpZDogdGhpcy5pZENvdW50ZXIrKyxcbiAgICAgIHdvcmtlckluZGV4LFxuICAgICAgY2FsbGJhY2ssXG4gICAgICBsb2dnZXIsXG4gICAgICBpbXBvcnRlcnMsXG4gICAgfTtcbiAgfVxuXG4gIHByaXZhdGUgaXNJbXBvcnRlcih2YWx1ZTogSW1wb3J0ZXJzKTogdmFsdWUgaXMgSW1wb3J0ZXIge1xuICAgIHJldHVybiAnY2Fub25pY2FsaXplJyBpbiB2YWx1ZSAmJiAnbG9hZCcgaW4gdmFsdWU7XG4gIH1cbn1cbiJdfQ==