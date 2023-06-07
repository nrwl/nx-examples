"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _JavaScriptTransformer_workerPool, _JavaScriptTransformer_commonOptions;
Object.defineProperty(exports, "__esModule", { value: true });
exports.JavaScriptTransformer = void 0;
const piscina_1 = __importDefault(require("piscina"));
/**
 * A class that performs transformation of JavaScript files and raw data.
 * A worker pool is used to distribute the transformation actions and allow
 * parallel processing. Transformation behavior is based on the filename and
 * data. Transformations may include: async downleveling, Angular linking,
 * and advanced optimizations.
 */
class JavaScriptTransformer {
    constructor(options, maxThreads) {
        _JavaScriptTransformer_workerPool.set(this, void 0);
        _JavaScriptTransformer_commonOptions.set(this, void 0);
        __classPrivateFieldSet(this, _JavaScriptTransformer_workerPool, new piscina_1.default({
            filename: require.resolve('./javascript-transformer-worker'),
            maxThreads,
        }), "f");
        // Extract options to ensure only the named options are serialized and sent to the worker
        const { sourcemap, thirdPartySourcemaps = false, advancedOptimizations = false, jit = false, } = options;
        __classPrivateFieldSet(this, _JavaScriptTransformer_commonOptions, {
            sourcemap,
            thirdPartySourcemaps,
            advancedOptimizations,
            jit,
        }, "f");
    }
    /**
     * Performs JavaScript transformations on a file from the filesystem.
     * If no transformations are required, the data for the original file will be returned.
     * @param filename The full path to the file.
     * @param skipLinker If true, bypass all Angular linker processing; if false, attempt linking.
     * @returns A promise that resolves to a UTF-8 encoded Uint8Array containing the result.
     */
    transformFile(filename, skipLinker) {
        // Always send the request to a worker. Files are almost always from node modules which measn
        // they may need linking. The data is also not yet available to perform most transformation checks.
        return __classPrivateFieldGet(this, _JavaScriptTransformer_workerPool, "f").run({
            filename,
            skipLinker,
            ...__classPrivateFieldGet(this, _JavaScriptTransformer_commonOptions, "f"),
        });
    }
    /**
     * Performs JavaScript transformations on the provided data of a file. The file does not need
     * to exist on the filesystem.
     * @param filename The full path of the file represented by the data.
     * @param data The data of the file that should be transformed.
     * @param skipLinker If true, bypass all Angular linker processing; if false, attempt linking.
     * @returns A promise that resolves to a UTF-8 encoded Uint8Array containing the result.
     */
    async transformData(filename, data, skipLinker) {
        // Perform a quick test to determine if the data needs any transformations.
        // This allows directly returning the data without the worker communication overhead.
        let forceAsyncTransformation;
        if (skipLinker && !__classPrivateFieldGet(this, _JavaScriptTransformer_commonOptions, "f").advancedOptimizations) {
            // If the linker is being skipped and no optimizations are needed, only async transformation is left.
            // This checks for async generator functions and class methods. All other async transformation is handled by esbuild.
            forceAsyncTransformation = data.includes('async') && /async(?:\s+function)?\s*\*/.test(data);
            if (!forceAsyncTransformation) {
                const keepSourcemap = __classPrivateFieldGet(this, _JavaScriptTransformer_commonOptions, "f").sourcemap &&
                    (!!__classPrivateFieldGet(this, _JavaScriptTransformer_commonOptions, "f").thirdPartySourcemaps || !/[\\/]node_modules[\\/]/.test(filename));
                return Buffer.from(keepSourcemap ? data : data.replace(/^\/\/# sourceMappingURL=[^\r\n]*/gm, ''), 'utf-8');
            }
        }
        return __classPrivateFieldGet(this, _JavaScriptTransformer_workerPool, "f").run({
            filename,
            data,
            // Send the async check result if present to avoid rechecking in the worker
            forceAsyncTransformation,
            skipLinker,
            ...__classPrivateFieldGet(this, _JavaScriptTransformer_commonOptions, "f"),
        });
    }
    /**
     * Stops all active transformation tasks and shuts down all workers.
     * @returns A void promise that resolves when closing is complete.
     */
    close() {
        return __classPrivateFieldGet(this, _JavaScriptTransformer_workerPool, "f").destroy();
    }
}
exports.JavaScriptTransformer = JavaScriptTransformer;
_JavaScriptTransformer_workerPool = new WeakMap(), _JavaScriptTransformer_commonOptions = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiamF2YXNjcmlwdC10cmFuc2Zvcm1lci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2J1aWxkX2FuZ3VsYXIvc3JjL2J1aWxkZXJzL2Jyb3dzZXItZXNidWlsZC9qYXZhc2NyaXB0LXRyYW5zZm9ybWVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVILHNEQUE4QjtBQVk5Qjs7Ozs7O0dBTUc7QUFDSCxNQUFhLHFCQUFxQjtJQUloQyxZQUFZLE9BQXFDLEVBQUUsVUFBbUI7UUFIdEUsb0RBQXFCO1FBQ3JCLHVEQUF1RDtRQUdyRCx1QkFBQSxJQUFJLHFDQUFlLElBQUksaUJBQU8sQ0FBQztZQUM3QixRQUFRLEVBQUUsT0FBTyxDQUFDLE9BQU8sQ0FBQyxpQ0FBaUMsQ0FBQztZQUM1RCxVQUFVO1NBQ1gsQ0FBQyxNQUFBLENBQUM7UUFFSCx5RkFBeUY7UUFDekYsTUFBTSxFQUNKLFNBQVMsRUFDVCxvQkFBb0IsR0FBRyxLQUFLLEVBQzVCLHFCQUFxQixHQUFHLEtBQUssRUFDN0IsR0FBRyxHQUFHLEtBQUssR0FDWixHQUFHLE9BQU8sQ0FBQztRQUNaLHVCQUFBLElBQUksd0NBQWtCO1lBQ3BCLFNBQVM7WUFDVCxvQkFBb0I7WUFDcEIscUJBQXFCO1lBQ3JCLEdBQUc7U0FDSixNQUFBLENBQUM7SUFDSixDQUFDO0lBRUQ7Ozs7OztPQU1HO0lBQ0gsYUFBYSxDQUFDLFFBQWdCLEVBQUUsVUFBb0I7UUFDbEQsNkZBQTZGO1FBQzdGLG1HQUFtRztRQUNuRyxPQUFPLHVCQUFBLElBQUkseUNBQVksQ0FBQyxHQUFHLENBQUM7WUFDMUIsUUFBUTtZQUNSLFVBQVU7WUFDVixHQUFHLHVCQUFBLElBQUksNENBQWU7U0FDdkIsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVEOzs7Ozs7O09BT0c7SUFDSCxLQUFLLENBQUMsYUFBYSxDQUFDLFFBQWdCLEVBQUUsSUFBWSxFQUFFLFVBQW1CO1FBQ3JFLDJFQUEyRTtRQUMzRSxxRkFBcUY7UUFDckYsSUFBSSx3QkFBd0IsQ0FBQztRQUM3QixJQUFJLFVBQVUsSUFBSSxDQUFDLHVCQUFBLElBQUksNENBQWUsQ0FBQyxxQkFBcUIsRUFBRTtZQUM1RCxxR0FBcUc7WUFDckcscUhBQXFIO1lBQ3JILHdCQUF3QixHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLElBQUksNEJBQTRCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBRTdGLElBQUksQ0FBQyx3QkFBd0IsRUFBRTtnQkFDN0IsTUFBTSxhQUFhLEdBQ2pCLHVCQUFBLElBQUksNENBQWUsQ0FBQyxTQUFTO29CQUM3QixDQUFDLENBQUMsQ0FBQyx1QkFBQSxJQUFJLDRDQUFlLENBQUMsb0JBQW9CLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztnQkFFM0YsT0FBTyxNQUFNLENBQUMsSUFBSSxDQUNoQixhQUFhLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxvQ0FBb0MsRUFBRSxFQUFFLENBQUMsRUFDN0UsT0FBTyxDQUNSLENBQUM7YUFDSDtTQUNGO1FBRUQsT0FBTyx1QkFBQSxJQUFJLHlDQUFZLENBQUMsR0FBRyxDQUFDO1lBQzFCLFFBQVE7WUFDUixJQUFJO1lBQ0osMkVBQTJFO1lBQzNFLHdCQUF3QjtZQUN4QixVQUFVO1lBQ1YsR0FBRyx1QkFBQSxJQUFJLDRDQUFlO1NBQ3ZCLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRDs7O09BR0c7SUFDSCxLQUFLO1FBQ0gsT0FBTyx1QkFBQSxJQUFJLHlDQUFZLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDcEMsQ0FBQztDQUNGO0FBeEZELHNEQXdGQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgUGlzY2luYSBmcm9tICdwaXNjaW5hJztcblxuLyoqXG4gKiBUcmFuc2Zvcm1hdGlvbiBvcHRpb25zIHRoYXQgc2hvdWxkIGFwcGx5IHRvIGFsbCB0cmFuc2Zvcm1lZCBmaWxlcyBhbmQgZGF0YS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBKYXZhU2NyaXB0VHJhbnNmb3JtZXJPcHRpb25zIHtcbiAgc291cmNlbWFwOiBib29sZWFuO1xuICB0aGlyZFBhcnR5U291cmNlbWFwcz86IGJvb2xlYW47XG4gIGFkdmFuY2VkT3B0aW1pemF0aW9ucz86IGJvb2xlYW47XG4gIGppdD86IGJvb2xlYW47XG59XG5cbi8qKlxuICogQSBjbGFzcyB0aGF0IHBlcmZvcm1zIHRyYW5zZm9ybWF0aW9uIG9mIEphdmFTY3JpcHQgZmlsZXMgYW5kIHJhdyBkYXRhLlxuICogQSB3b3JrZXIgcG9vbCBpcyB1c2VkIHRvIGRpc3RyaWJ1dGUgdGhlIHRyYW5zZm9ybWF0aW9uIGFjdGlvbnMgYW5kIGFsbG93XG4gKiBwYXJhbGxlbCBwcm9jZXNzaW5nLiBUcmFuc2Zvcm1hdGlvbiBiZWhhdmlvciBpcyBiYXNlZCBvbiB0aGUgZmlsZW5hbWUgYW5kXG4gKiBkYXRhLiBUcmFuc2Zvcm1hdGlvbnMgbWF5IGluY2x1ZGU6IGFzeW5jIGRvd25sZXZlbGluZywgQW5ndWxhciBsaW5raW5nLFxuICogYW5kIGFkdmFuY2VkIG9wdGltaXphdGlvbnMuXG4gKi9cbmV4cG9ydCBjbGFzcyBKYXZhU2NyaXB0VHJhbnNmb3JtZXIge1xuICAjd29ya2VyUG9vbDogUGlzY2luYTtcbiAgI2NvbW1vbk9wdGlvbnM6IFJlcXVpcmVkPEphdmFTY3JpcHRUcmFuc2Zvcm1lck9wdGlvbnM+O1xuXG4gIGNvbnN0cnVjdG9yKG9wdGlvbnM6IEphdmFTY3JpcHRUcmFuc2Zvcm1lck9wdGlvbnMsIG1heFRocmVhZHM/OiBudW1iZXIpIHtcbiAgICB0aGlzLiN3b3JrZXJQb29sID0gbmV3IFBpc2NpbmEoe1xuICAgICAgZmlsZW5hbWU6IHJlcXVpcmUucmVzb2x2ZSgnLi9qYXZhc2NyaXB0LXRyYW5zZm9ybWVyLXdvcmtlcicpLFxuICAgICAgbWF4VGhyZWFkcyxcbiAgICB9KTtcblxuICAgIC8vIEV4dHJhY3Qgb3B0aW9ucyB0byBlbnN1cmUgb25seSB0aGUgbmFtZWQgb3B0aW9ucyBhcmUgc2VyaWFsaXplZCBhbmQgc2VudCB0byB0aGUgd29ya2VyXG4gICAgY29uc3Qge1xuICAgICAgc291cmNlbWFwLFxuICAgICAgdGhpcmRQYXJ0eVNvdXJjZW1hcHMgPSBmYWxzZSxcbiAgICAgIGFkdmFuY2VkT3B0aW1pemF0aW9ucyA9IGZhbHNlLFxuICAgICAgaml0ID0gZmFsc2UsXG4gICAgfSA9IG9wdGlvbnM7XG4gICAgdGhpcy4jY29tbW9uT3B0aW9ucyA9IHtcbiAgICAgIHNvdXJjZW1hcCxcbiAgICAgIHRoaXJkUGFydHlTb3VyY2VtYXBzLFxuICAgICAgYWR2YW5jZWRPcHRpbWl6YXRpb25zLFxuICAgICAgaml0LFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogUGVyZm9ybXMgSmF2YVNjcmlwdCB0cmFuc2Zvcm1hdGlvbnMgb24gYSBmaWxlIGZyb20gdGhlIGZpbGVzeXN0ZW0uXG4gICAqIElmIG5vIHRyYW5zZm9ybWF0aW9ucyBhcmUgcmVxdWlyZWQsIHRoZSBkYXRhIGZvciB0aGUgb3JpZ2luYWwgZmlsZSB3aWxsIGJlIHJldHVybmVkLlxuICAgKiBAcGFyYW0gZmlsZW5hbWUgVGhlIGZ1bGwgcGF0aCB0byB0aGUgZmlsZS5cbiAgICogQHBhcmFtIHNraXBMaW5rZXIgSWYgdHJ1ZSwgYnlwYXNzIGFsbCBBbmd1bGFyIGxpbmtlciBwcm9jZXNzaW5nOyBpZiBmYWxzZSwgYXR0ZW1wdCBsaW5raW5nLlxuICAgKiBAcmV0dXJucyBBIHByb21pc2UgdGhhdCByZXNvbHZlcyB0byBhIFVURi04IGVuY29kZWQgVWludDhBcnJheSBjb250YWluaW5nIHRoZSByZXN1bHQuXG4gICAqL1xuICB0cmFuc2Zvcm1GaWxlKGZpbGVuYW1lOiBzdHJpbmcsIHNraXBMaW5rZXI/OiBib29sZWFuKTogUHJvbWlzZTxVaW50OEFycmF5PiB7XG4gICAgLy8gQWx3YXlzIHNlbmQgdGhlIHJlcXVlc3QgdG8gYSB3b3JrZXIuIEZpbGVzIGFyZSBhbG1vc3QgYWx3YXlzIGZyb20gbm9kZSBtb2R1bGVzIHdoaWNoIG1lYXNuXG4gICAgLy8gdGhleSBtYXkgbmVlZCBsaW5raW5nLiBUaGUgZGF0YSBpcyBhbHNvIG5vdCB5ZXQgYXZhaWxhYmxlIHRvIHBlcmZvcm0gbW9zdCB0cmFuc2Zvcm1hdGlvbiBjaGVja3MuXG4gICAgcmV0dXJuIHRoaXMuI3dvcmtlclBvb2wucnVuKHtcbiAgICAgIGZpbGVuYW1lLFxuICAgICAgc2tpcExpbmtlcixcbiAgICAgIC4uLnRoaXMuI2NvbW1vbk9wdGlvbnMsXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogUGVyZm9ybXMgSmF2YVNjcmlwdCB0cmFuc2Zvcm1hdGlvbnMgb24gdGhlIHByb3ZpZGVkIGRhdGEgb2YgYSBmaWxlLiBUaGUgZmlsZSBkb2VzIG5vdCBuZWVkXG4gICAqIHRvIGV4aXN0IG9uIHRoZSBmaWxlc3lzdGVtLlxuICAgKiBAcGFyYW0gZmlsZW5hbWUgVGhlIGZ1bGwgcGF0aCBvZiB0aGUgZmlsZSByZXByZXNlbnRlZCBieSB0aGUgZGF0YS5cbiAgICogQHBhcmFtIGRhdGEgVGhlIGRhdGEgb2YgdGhlIGZpbGUgdGhhdCBzaG91bGQgYmUgdHJhbnNmb3JtZWQuXG4gICAqIEBwYXJhbSBza2lwTGlua2VyIElmIHRydWUsIGJ5cGFzcyBhbGwgQW5ndWxhciBsaW5rZXIgcHJvY2Vzc2luZzsgaWYgZmFsc2UsIGF0dGVtcHQgbGlua2luZy5cbiAgICogQHJldHVybnMgQSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgdG8gYSBVVEYtOCBlbmNvZGVkIFVpbnQ4QXJyYXkgY29udGFpbmluZyB0aGUgcmVzdWx0LlxuICAgKi9cbiAgYXN5bmMgdHJhbnNmb3JtRGF0YShmaWxlbmFtZTogc3RyaW5nLCBkYXRhOiBzdHJpbmcsIHNraXBMaW5rZXI6IGJvb2xlYW4pOiBQcm9taXNlPFVpbnQ4QXJyYXk+IHtcbiAgICAvLyBQZXJmb3JtIGEgcXVpY2sgdGVzdCB0byBkZXRlcm1pbmUgaWYgdGhlIGRhdGEgbmVlZHMgYW55IHRyYW5zZm9ybWF0aW9ucy5cbiAgICAvLyBUaGlzIGFsbG93cyBkaXJlY3RseSByZXR1cm5pbmcgdGhlIGRhdGEgd2l0aG91dCB0aGUgd29ya2VyIGNvbW11bmljYXRpb24gb3ZlcmhlYWQuXG4gICAgbGV0IGZvcmNlQXN5bmNUcmFuc2Zvcm1hdGlvbjtcbiAgICBpZiAoc2tpcExpbmtlciAmJiAhdGhpcy4jY29tbW9uT3B0aW9ucy5hZHZhbmNlZE9wdGltaXphdGlvbnMpIHtcbiAgICAgIC8vIElmIHRoZSBsaW5rZXIgaXMgYmVpbmcgc2tpcHBlZCBhbmQgbm8gb3B0aW1pemF0aW9ucyBhcmUgbmVlZGVkLCBvbmx5IGFzeW5jIHRyYW5zZm9ybWF0aW9uIGlzIGxlZnQuXG4gICAgICAvLyBUaGlzIGNoZWNrcyBmb3IgYXN5bmMgZ2VuZXJhdG9yIGZ1bmN0aW9ucyBhbmQgY2xhc3MgbWV0aG9kcy4gQWxsIG90aGVyIGFzeW5jIHRyYW5zZm9ybWF0aW9uIGlzIGhhbmRsZWQgYnkgZXNidWlsZC5cbiAgICAgIGZvcmNlQXN5bmNUcmFuc2Zvcm1hdGlvbiA9IGRhdGEuaW5jbHVkZXMoJ2FzeW5jJykgJiYgL2FzeW5jKD86XFxzK2Z1bmN0aW9uKT9cXHMqXFwqLy50ZXN0KGRhdGEpO1xuXG4gICAgICBpZiAoIWZvcmNlQXN5bmNUcmFuc2Zvcm1hdGlvbikge1xuICAgICAgICBjb25zdCBrZWVwU291cmNlbWFwID1cbiAgICAgICAgICB0aGlzLiNjb21tb25PcHRpb25zLnNvdXJjZW1hcCAmJlxuICAgICAgICAgICghIXRoaXMuI2NvbW1vbk9wdGlvbnMudGhpcmRQYXJ0eVNvdXJjZW1hcHMgfHwgIS9bXFxcXC9dbm9kZV9tb2R1bGVzW1xcXFwvXS8udGVzdChmaWxlbmFtZSkpO1xuXG4gICAgICAgIHJldHVybiBCdWZmZXIuZnJvbShcbiAgICAgICAgICBrZWVwU291cmNlbWFwID8gZGF0YSA6IGRhdGEucmVwbGFjZSgvXlxcL1xcLyMgc291cmNlTWFwcGluZ1VSTD1bXlxcclxcbl0qL2dtLCAnJyksXG4gICAgICAgICAgJ3V0Zi04JyxcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy4jd29ya2VyUG9vbC5ydW4oe1xuICAgICAgZmlsZW5hbWUsXG4gICAgICBkYXRhLFxuICAgICAgLy8gU2VuZCB0aGUgYXN5bmMgY2hlY2sgcmVzdWx0IGlmIHByZXNlbnQgdG8gYXZvaWQgcmVjaGVja2luZyBpbiB0aGUgd29ya2VyXG4gICAgICBmb3JjZUFzeW5jVHJhbnNmb3JtYXRpb24sXG4gICAgICBza2lwTGlua2VyLFxuICAgICAgLi4udGhpcy4jY29tbW9uT3B0aW9ucyxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdG9wcyBhbGwgYWN0aXZlIHRyYW5zZm9ybWF0aW9uIHRhc2tzIGFuZCBzaHV0cyBkb3duIGFsbCB3b3JrZXJzLlxuICAgKiBAcmV0dXJucyBBIHZvaWQgcHJvbWlzZSB0aGF0IHJlc29sdmVzIHdoZW4gY2xvc2luZyBpcyBjb21wbGV0ZS5cbiAgICovXG4gIGNsb3NlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiB0aGlzLiN3b3JrZXJQb29sLmRlc3Ryb3koKTtcbiAgfVxufVxuIl19