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
exports.JavaScriptOptimizerPlugin = void 0;
const piscina_1 = __importDefault(require("piscina"));
const environment_options_1 = require("../../utils/environment-options");
const esbuild_targets_1 = require("../../utils/esbuild-targets");
const webpack_diagnostics_1 = require("../../utils/webpack-diagnostics");
const esbuild_executor_1 = require("./esbuild-executor");
/**
 * The maximum number of Workers that will be created to execute optimize tasks.
 */
const MAX_OPTIMIZE_WORKERS = environment_options_1.maxWorkers;
/**
 * The name of the plugin provided to Webpack when tapping Webpack compiler hooks.
 */
const PLUGIN_NAME = 'angular-javascript-optimizer';
/**
 * A Webpack plugin that provides JavaScript optimization capabilities.
 *
 * The plugin uses both `esbuild` and `terser` to provide both fast and highly-optimized
 * code output. `esbuild` is used as an initial pass to remove the majority of unused code
 * as well as shorten identifiers. `terser` is then used as a secondary pass to apply
 * optimizations not yet implemented by `esbuild`.
 */
class JavaScriptOptimizerPlugin {
    constructor(options) {
        this.options = options;
        if (options.supportedBrowsers) {
            this.targets = (0, esbuild_targets_1.transformSupportedBrowsersToTargets)(options.supportedBrowsers);
        }
    }
    apply(compiler) {
        const { OriginalSource, SourceMapSource } = compiler.webpack.sources;
        compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation) => {
            const logger = compilation.getLogger('build-angular.JavaScriptOptimizerPlugin');
            compilation.hooks.processAssets.tapPromise({
                name: PLUGIN_NAME,
                stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE,
            }, async (compilationAssets) => {
                logger.time('optimize js assets');
                const scriptsToOptimize = [];
                const cache = compilation.options.cache && compilation.getCache('JavaScriptOptimizerPlugin');
                // Analyze the compilation assets for scripts that require optimization
                for (const assetName of Object.keys(compilationAssets)) {
                    if (!assetName.endsWith('.js')) {
                        continue;
                    }
                    const scriptAsset = compilation.getAsset(assetName);
                    // Skip assets that have already been optimized or are verbatim copies (project assets)
                    if (!scriptAsset || scriptAsset.info.minimized || scriptAsset.info.copied) {
                        continue;
                    }
                    const { source: scriptAssetSource, name } = scriptAsset;
                    let cacheItem;
                    if (cache) {
                        const eTag = cache.getLazyHashedEtag(scriptAssetSource);
                        cacheItem = cache.getItemCache(name, eTag);
                        const cachedOutput = await cacheItem.getPromise();
                        if (cachedOutput) {
                            logger.debug(`${name} restored from cache`);
                            compilation.updateAsset(name, cachedOutput.source, (assetInfo) => ({
                                ...assetInfo,
                                minimized: true,
                            }));
                            continue;
                        }
                    }
                    const { source, map } = scriptAssetSource.sourceAndMap();
                    scriptsToOptimize.push({
                        name: scriptAsset.name,
                        code: typeof source === 'string' ? source : source.toString(),
                        map,
                        cacheItem,
                    });
                }
                if (scriptsToOptimize.length === 0) {
                    return;
                }
                // Ensure all replacement values are strings which is the expected type for esbuild
                let define;
                if (this.options.define) {
                    define = {};
                    for (const [key, value] of Object.entries(this.options.define)) {
                        define[key] = String(value);
                    }
                }
                // Setup the options used by all worker tasks
                const optimizeOptions = {
                    sourcemap: this.options.sourcemap,
                    define,
                    keepNames: this.options.keepNames,
                    keepIdentifierNames: this.options.keepIdentifierNames,
                    target: this.targets,
                    removeLicenses: this.options.removeLicenses,
                    advanced: this.options.advanced,
                    // Perform a single native esbuild support check.
                    // This removes the need for each worker to perform the check which would
                    // otherwise require spawning a separate process per worker.
                    alwaysUseWasm: !(await esbuild_executor_1.EsbuildExecutor.hasNativeSupport()),
                };
                // Sort scripts so larger scripts start first - worker pool uses a FIFO queue
                scriptsToOptimize.sort((a, b) => a.code.length - b.code.length);
                // Initialize the task worker pool
                const workerPath = require.resolve('./javascript-optimizer-worker');
                const workerPool = new piscina_1.default({
                    filename: workerPath,
                    maxThreads: MAX_OPTIMIZE_WORKERS,
                });
                // Enqueue script optimization tasks and update compilation assets as the tasks complete
                try {
                    const tasks = [];
                    for (const { name, code, map, cacheItem } of scriptsToOptimize) {
                        logger.time(`optimize asset: ${name}`);
                        tasks.push(workerPool
                            .run({
                            asset: {
                                name,
                                code,
                                map,
                            },
                            options: optimizeOptions,
                        })
                            .then(async ({ code, name, map, errors }) => {
                            if (errors?.length) {
                                for (const error of errors) {
                                    (0, webpack_diagnostics_1.addError)(compilation, `Optimization error [${name}]: ${error}`);
                                }
                                return;
                            }
                            const optimizedAsset = map
                                ? new SourceMapSource(code, name, map)
                                : new OriginalSource(code, name);
                            compilation.updateAsset(name, optimizedAsset, (assetInfo) => ({
                                ...assetInfo,
                                minimized: true,
                            }));
                            logger.timeEnd(`optimize asset: ${name}`);
                            return cacheItem?.storePromise({
                                source: optimizedAsset,
                            });
                        }, (error) => {
                            (0, webpack_diagnostics_1.addError)(compilation, `Optimization error [${name}]: ${error.stack || error.message}`);
                        }));
                    }
                    await Promise.all(tasks);
                }
                finally {
                    void workerPool.destroy();
                }
                logger.timeEnd('optimize js assets');
            });
        });
    }
}
exports.JavaScriptOptimizerPlugin = JavaScriptOptimizerPlugin;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiamF2YXNjcmlwdC1vcHRpbWl6ZXItcGx1Z2luLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvYnVpbGRfYW5ndWxhci9zcmMvd2VicGFjay9wbHVnaW5zL2phdmFzY3JpcHQtb3B0aW1pemVyLXBsdWdpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7Ozs7QUFFSCxzREFBOEI7QUFFOUIseUVBQTZEO0FBQzdELGlFQUFrRjtBQUNsRix5RUFBMkQ7QUFDM0QseURBQXFEO0FBR3JEOztHQUVHO0FBQ0gsTUFBTSxvQkFBb0IsR0FBRyxnQ0FBVSxDQUFDO0FBRXhDOztHQUVHO0FBQ0gsTUFBTSxXQUFXLEdBQUcsOEJBQThCLENBQUM7QUFvRG5EOzs7Ozs7O0dBT0c7QUFDSCxNQUFhLHlCQUF5QjtJQUdwQyxZQUFvQixPQUFtQztRQUFuQyxZQUFPLEdBQVAsT0FBTyxDQUE0QjtRQUNyRCxJQUFJLE9BQU8sQ0FBQyxpQkFBaUIsRUFBRTtZQUM3QixJQUFJLENBQUMsT0FBTyxHQUFHLElBQUEscURBQW1DLEVBQUMsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUM7U0FDL0U7SUFDSCxDQUFDO0lBRUQsS0FBSyxDQUFDLFFBQWtCO1FBQ3RCLE1BQU0sRUFBRSxjQUFjLEVBQUUsZUFBZSxFQUFFLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUM7UUFFckUsUUFBUSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxDQUFDLFdBQVcsRUFBRSxFQUFFO1lBQzFELE1BQU0sTUFBTSxHQUFHLFdBQVcsQ0FBQyxTQUFTLENBQUMseUNBQXlDLENBQUMsQ0FBQztZQUVoRixXQUFXLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQ3hDO2dCQUNFLElBQUksRUFBRSxXQUFXO2dCQUNqQixLQUFL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SyxDQUFDLENBQUM7aUJBQzFCO3dCQUFTO29CQUNSLEtBQUssVUFBVSxDQUFDLE9BQU8sRUFBRSxDQUFDO2lCQUMzQjtnQkFFRCxNQUFNLENBQUMsT0FBTyxDQUFDLG9CQUFvQixDQUFDLENBQUM7WUFDdkMsQ0FBQyxDQUNGLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQXJLRCw4REFxS0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IFBpc2NpbmEgZnJvbSAncGlzY2luYSc7XG5pbXBvcnQgdHlwZSB7IENvbXBpbGVyLCBzb3VyY2VzIH0gZnJvbSAnd2VicGFjayc7XG5pbXBvcnQgeyBtYXhXb3JrZXJzIH0gZnJvbSAnLi4vLi4vdXRpbHMvZW52aXJvbm1lbnQtb3B0aW9ucyc7XG5pbXBvcnQgeyB0cmFuc2Zvcm1TdXBwb3J0ZWRCcm93c2Vyc1RvVGFyZ2V0cyB9IGZyb20gJy4uLy4uL3V0aWxzL2VzYnVpbGQtdGFyZ2V0cyc7XG5pbXBvcnQgeyBhZGRFcnJvciB9IGZyb20gJy4uLy4uL3V0aWxzL3dlYnBhY2stZGlhZ25vc3RpY3MnO1xuaW1wb3J0IHsgRXNidWlsZEV4ZWN1dG9yIH0gZnJvbSAnLi9lc2J1aWxkLWV4ZWN1dG9yJztcbmltcG9ydCB0eXBlIHsgT3B0aW1pemVSZXF1ZXN0T3B0aW9ucyB9IGZyb20gJy4vamF2YXNjcmlwdC1vcHRpbWl6ZXItd29ya2VyJztcblxuLyoqXG4gKiBUaGUgbWF4aW11bSBudW1iZXIgb2YgV29ya2VycyB0aGF0IHdpbGwgYmUgY3JlYXRlZCB0byBleGVjdXRlIG9wdGltaXplIHRhc2tzLlxuICovXG5jb25zdCBNQVhfT1BUSU1JWkVfV09SS0VSUyA9IG1heFdvcmtlcnM7XG5cbi8qKlxuICogVGhlIG5hbWUgb2YgdGhlIHBsdWdpbiBwcm92aWRlZCB0byBXZWJwYWNrIHdoZW4gdGFwcGluZyBXZWJwYWNrIGNvbXBpbGVyIGhvb2tzLlxuICovXG5jb25zdCBQTFVHSU5fTkFNRSA9ICdhbmd1bGFyLWphdmFzY3JpcHQtb3B0aW1pemVyJztcblxuLyoqXG4gKiBUaGUgb3B0aW9ucyB1c2VkIHRvIGNvbmZpZ3VyZSB0aGUge0BsaW5rIEphdmFTY3JpcHRPcHRpbWl6ZXJQbHVnaW59LlxuICovXG5leHBvcnQgaW50ZXJmYWNlIEphdmFTY3JpcHRPcHRpbWl6ZXJPcHRpb25zIHtcbiAgLyoqXG4gICAqIEVuYWJsZXMgYWR2YW5jZWQgb3B0aW1pemF0aW9ucyBpbiB0aGUgdW5kZXJseWluZyBKYXZhU2NyaXB0IG9wdGltaXplcnMuXG4gICAqIFRoaXMgY3VycmVudGx5IGluY3JlYXNlcyB0aGUgYHRlcnNlcmAgcGFzc2VzIHRvIDIgYW5kIGVuYWJsZXMgdGhlIGBwdXJlX2dldHRlcnNgXG4gICAqIG9wdGlvbiBmb3IgYHRlcnNlcmAuXG4gICAqL1xuICBhZHZhbmNlZD86IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIEFuIG9iamVjdCByZWNvcmQgb2Ygc3RyaW5nIGtleXMgdGhhdCB3aWxsIGJlIHJlcGxhY2VkIHdpdGggdGhlaXIgcmVzcGVjdGl2ZSB2YWx1ZXMgd2hlbiBmb3VuZFxuICAgKiB3aXRoaW4gdGhlIGNvZGUgZHVyaW5nIG9wdGltaXphdGlvbi5cbiAgICovXG4gIGRlZmluZTogUmVjb3JkPHN0cmluZywgc3RyaW5nIHwgbnVtYmVyIHwgYm9vbGVhbj47XG5cbiAgLyoqXG4gICAqIEVuYWJsZXMgdGhlIGdlbmVyYXRpb24gb2YgYSBzb3VyY2VtYXAgZHVyaW5nIG9wdGltaXphdGlvbi5cbiAgICogVGhlIG91dHB1dCBzb3VyY2VtYXAgd2lsbCBiZSBhIGZ1bGwgc291cmNlbWFwIGNvbnRhaW5pbmcgdGhlIG1lcmdlIG9mIHRoZSBpbnB1dCBzb3VyY2VtYXAgYW5kXG4gICAqIGFsbCBpbnRlcm1lZGlhdGUgc291cmNlbWFwcy5cbiAgICovXG4gIHNvdXJjZW1hcD86IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIEEgbGlzdCBvZiBzdXBwb3J0ZWQgYnJvd3NlcnMgdGhhdCBpcyB1c2VkIGZvciBvdXRwdXQgY29kZS5cbiAgICovXG4gIHN1cHBvcnRlZEJyb3dzZXJzPzogc3RyaW5nW107XG5cbiAgLyoqXG4gICAqIEVuYWJsZXMgdGhlIHJldGVudGlvbiBvZiBpZGVudGlmaWVyIG5hbWVzIGFuZCBlbnN1cmVzIHRoYXQgZnVuY3Rpb24gYW5kIGNsYXNzIG5hbWVzIGFyZVxuICAgKiBwcmVzZW50IGluIHRoZSBvdXRwdXQgY29kZS5cbiAgICpcbiAgICogKipOb3RlKio6IGluIHNvbWUgY2FzZXMgc3ltYm9scyBhcmUgc3RpbGwgcmVuYW1lZCB0byBhdm9pZCBjb2xsaXNpb25zLlxuICAgKi9cbiAga2VlcElkZW50aWZpZXJOYW1lczogYm9vbGVhbjtcblxuICAvKipcbiAgICogRW5hYmxlcyB0aGUgcmV0ZW50aW9uIG9mIG9yaWdpbmFsIG5hbWUgb2YgY2xhc3NlcyBhbmQgZnVuY3Rpb25zLlxuICAgKlxuICAgKiAqKk5vdGUqKjogdGhpcyBjYXVzZXMgaW5jcmVhc2Ugb2YgYnVuZGxlIHNpemUgYXMgaXQgY2F1c2VzIGRlYWQtY29kZSBlbGltaW5hdGlvbiB0byBub3Qgd29yayBmdWxseS5cbiAgICovXG4gIGtlZXBOYW1lczogYm9vbGVhbjtcblxuICAvKipcbiAgICogRW5hYmxlcyB0aGUgcmVtb3ZhbCBvZiBhbGwgbGljZW5zZSBjb21tZW50cyBmcm9tIHRoZSBvdXRwdXQgY29kZS5cbiAgICovXG4gIHJlbW92ZUxpY2Vuc2VzPzogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiBBIFdlYnBhY2sgcGx1Z2luIHRoYXQgcHJvdmlkZXMgSmF2YVNjcmlwdCBvcHRpbWl6YXRpb24gY2FwYWJpbGl0aWVzLlxuICpcbiAqIFRoZSBwbHVnaW4gdXNlcyBib3RoIGBlc2J1aWxkYCBhbmQgYHRlcnNlcmAgdG8gcHJvdmlkZSBib3RoIGZhc3QgYW5kIGhpZ2hseS1vcHRpbWl6ZWRcbiAqIGNvZGUgb3V0cHV0LiBgZXNidWlsZGAgaXMgdXNlZCBhcyBhbiBpbml0aWFsIHBhc3MgdG8gcmVtb3ZlIHRoZSBtYWpvcml0eSBvZiB1bnVzZWQgY29kZVxuICogYXMgd2VsbCBhcyBzaG9ydGVuIGlkZW50aWZpZXJzLiBgdGVyc2VyYCBpcyB0aGVuIHVzZWQgYXMgYSBzZWNvbmRhcnkgcGFzcyB0byBhcHBseVxuICogb3B0aW1pemF0aW9ucyBub3QgeWV0IGltcGxlbWVudGVkIGJ5IGBlc2J1aWxkYC5cbiAqL1xuZXhwb3J0IGNsYXNzIEphdmFTY3JpcHRPcHRpbWl6ZXJQbHVnaW4ge1xuICBwcml2YXRlIHRhcmdldHM6IHN0cmluZ1tdIHwgdW5kZWZpbmVkO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgb3B0aW9uczogSmF2YVNjcmlwdE9wdGltaXplck9wdGlvbnMpIHtcbiAgICBpZiAob3B0aW9ucy5zdXBwb3J0ZWRCcm93c2Vycykge1xuICAgICAgdGhpcy50YXJnZXRzID0gdHJhbnNmb3JtU3VwcG9ydGVkQnJvd3NlcnNUb1RhcmdldHMob3B0aW9ucy5zdXBwb3J0ZWRCcm93c2Vycyk7XG4gICAgfVxuICB9XG5cbiAgYXBwbHkoY29tcGlsZXI6IENvbXBpbGVyKSB7XG4gICAgY29uc3QgeyBPcmlnaW5hbFNvdXJjZSwgU291cmNlTWFwU291cmNlIH0gPSBjb21waWxlci53ZWJwYWNrLnNvdXJjZXM7XG5cbiAgICBjb21waWxlci5ob29rcy5jb21waWxhdGlvbi50YXAoUExVR0lOX05BTUUsIChjb21waWxhdGlvbikgPT4ge1xuICAgICAgY29uc3QgbG9nZ2VyID0gY29tcGlsYXRpb24uZ2V0TG9nZ2VyKCdidWlsZC1hbmd1bGFyLkphdmFTY3JpcHRPcHRpbWl6ZXJQbHVnaW4nKTtcblxuICAgICAgY29tcGlsYXRpb24uaG9va3MucHJvY2Vzc0Fzc2V0cy50YXBQcm9taXNlKFxuICAgICAgICB7XG4gICAgICAgICAgbmFtZTogUExVR0lOX05BTUUsXG4gICAgICAgICAgc3RhZ2U6IGNvbXBpbGVyLndlYnBhY2suQ29tcGlsYXRpb24uUFJPQ0VTU19BU1NFVFNfU1RBR0VfT1BUSU1JWkVfU0laRSxcbiAgICAgICAgfSxcbiAgICAgICAgYXN5bmMgKGNvbXBpbGF0aW9uQXNzZXRzKSA9PiB7XG4gICAgICAgICAgbG9nZ2VyLnRpbWUoJ29wdGltaXplIGpzIGFzc2V0cycpO1xuICAgICAgICAgIGNvbnN0IHNjcmlwdHNUb09wdGltaXplID0gW107XG4gICAgICAgICAgY29uc3QgY2FjaGUgPVxuICAgICAgICAgICAgY29tcGlsYXRpb24ub3B0aW9ucy5jYWNoZSAmJiBjb21waWxhdGlvbi5nZXRDYWNoZSgnSmF2YVNjcmlwdE9wdGltaXplclBsdWdpbicpO1xuXG4gICAgICAgICAgLy8gQW5hbHl6ZSB0aGUgY29tcGlsYXRpb24gYXNzZXRzIGZvciBzY3JpcHRzIHRoYXQgcmVxdWlyZSBvcHRpbWl6YXRpb25cbiAgICAgICAgICBmb3IgKGNvbnN0IGFzc2V0TmFtZSBvZiBPYmplY3Qua2V5cyhjb21waWxhdGlvbkFzc2V0cykpIHtcbiAgICAgICAgICAgIGlmICghYXNzZXROYW1lLmVuZHNXaXRoKCcuanMnKSkge1xuICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3Qgc2NyaXB0QXNzZXQgPSBjb21waWxhdGlvbi5nZXRBc3NldChhc3NldE5hbWUpO1xuICAgICAgICAgICAgLy8gU2tpcCBhc3NldHMgdGhhdCBoYXZlIGFscmVhZHkgYmVlbiBvcHRpbWl6ZWQgb3IgYXJlIHZlcmJhdGltIGNvcGllcyAocHJvamVjdCBhc3NldHMpXG4gICAgICAgICAgICBpZiAoIXNjcmlwdEFzc2V0IHx8IHNjcmlwdEFzc2V0LmluZm8ubWluaW1pemVkIHx8IHNjcmlwdEFzc2V0LmluZm8uY29waWVkKSB7XG4gICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCB7IHNvdXJjZTogc2NyaXB0QXNzZXRTb3VyY2UsIG5hbWUgfSA9IHNjcmlwdEFzc2V0O1xuICAgICAgICAgICAgbGV0IGNhY2hlSXRlbTtcblxuICAgICAgICAgICAgaWYgKGNhY2hlKSB7XG4gICAgICAgICAgICAgIGNvbnN0IGVUYWcgPSBjYWNoZS5nZXRMYXp5SGFzaGVkRXRhZyhzY3JpcHRBc3NldFNvdXJjZSk7XG4gICAgICAgICAgICAgIGNhY2hlSXRlbSA9IGNhY2hlLmdldEl0ZW1DYWNoZShuYW1lLCBlVGFnKTtcbiAgICAgICAgICAgICAgY29uc3QgY2FjaGVkT3V0cHV0ID0gYXdhaXQgY2FjaGVJdGVtLmdldFByb21pc2U8XG4gICAgICAgICAgICAgICAgeyBzb3VyY2U6IHNvdXJjZXMuU291cmNlIH0gfCB1bmRlZmluZWRcbiAgICAgICAgICAgICAgPigpO1xuXG4gICAgICAgICAgICAgIGlmIChjYWNoZWRPdXRwdXQpIHtcbiAgICAgICAgICAgICAgICBsb2dnZXIuZGVidWcoYCR7bmFtZX0gcmVzdG9yZWQgZnJvbSBjYWNoZWApO1xuICAgICAgICAgICAgICAgIGNvbXBpbGF0aW9uLnVwZGF0ZUFzc2V0KG5hbWUsIGNhY2hlZE91dHB1dC5zb3VyY2UsIChhc3NldEluZm8pID0+ICh7XG4gICAgICAgICAgICAgICAgICAuLi5hc3NldEluZm8sXG4gICAgICAgICAgICAgICAgICBtaW5pbWl6ZWQ6IHRydWUsXG4gICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHsgc291cmNlLCBtYXAgfSA9IHNjcmlwdEFzc2V0U291cmNlLnNvdXJjZUFuZE1hcCgpO1xuICAgICAgICAgICAgc2NyaXB0c1RvT3B0aW1pemUucHVzaCh7XG4gICAgICAgICAgICAgIG5hbWU6IHNjcmlwdEFzc2V0Lm5hbWUsXG4gICAgICAgICAgICAgIGNvZGU6IHR5cGVvZiBzb3VyY2UgPT09ICdzdHJpbmcnID8gc291cmNlIDogc291cmNlLnRvU3RyaW5nKCksXG4gICAgICAgICAgICAgIG1hcCxcbiAgICAgICAgICAgICAgY2FjaGVJdGVtLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHNjcmlwdHNUb09wdGltaXplLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIEVuc3VyZSBhbGwgcmVwbGFjZW1lbnQgdmFsdWVzIGFyZSBzdHJpbmdzIHdoaWNoIGlzIHRoZSBleHBlY3RlZCB0eXBlIGZvciBlc2J1aWxkXG4gICAgICAgICAgbGV0IGRlZmluZTogUmVjb3JkPHN0cmluZywgc3RyaW5nPiB8IHVuZGVmaW5lZDtcbiAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLmRlZmluZSkge1xuICAgICAgICAgICAgZGVmaW5lID0ge307XG4gICAgICAgICAgICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyh0aGlzLm9wdGlvbnMuZGVmaW5lKSkge1xuICAgICAgICAgICAgICBkZWZpbmVba2V5XSA9IFN0cmluZyh2YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gU2V0dXAgdGhlIG9wdGlvbnMgdXNlZCBieSBhbGwgd29ya2VyIHRhc2tzXG4gICAgICAgICAgY29uc3Qgb3B0aW1pemVPcHRpb25zOiBPcHRpbWl6ZVJlcXVlc3RPcHRpb25zID0ge1xuICAgICAgICAgICAgc291cmNlbWFwOiB0aGlzLm9wdGlvbnMuc291cmNlbWFwLFxuICAgICAgICAgICAgZGVmaW5lLFxuICAgICAgICAgICAga2VlcE5hbWVzOiB0aGlzLm9wdGlvbnMua2VlcE5hbWVzLFxuICAgICAgICAgICAga2VlcElkZW50aWZpZXJOYW1lczogdGhpcy5vcHRpb25zLmtlZXBJZGVudGlmaWVyTmFtZXMsXG4gICAgICAgICAgICB0YXJnZXQ6IHRoaXMudGFyZ2V0cyxcbiAgICAgICAgICAgIHJlbW92ZUxpY2Vuc2VzOiB0aGlzLm9wdGlvbnMucmVtb3ZlTGljZW5zZXMsXG4gICAgICAgICAgICBhZHZhbmNlZDogdGhpcy5vcHRpb25zLmFkdmFuY2VkLFxuICAgICAgICAgICAgLy8gUGVyZm9ybSBhIHNpbmdsZSBuYXRpdmUgZXNidWlsZCBzdXBwb3J0IGNoZWNrLlxuICAgICAgICAgICAgLy8gVGhpcyByZW1vdmVzIHRoZSBuZWVkIGZvciBlYWNoIHdvcmtlciB0byBwZXJmb3JtIHRoZSBjaGVjayB3aGljaCB3b3VsZFxuICAgICAgICAgICAgLy8gb3RoZXJ3aXNlIHJlcXVpcmUgc3Bhd25pbmcgYSBzZXBhcmF0ZSBwcm9jZXNzIHBlciB3b3JrZXIuXG4gICAgICAgICAgICBhbHdheXNVc2VXYXNtOiAhKGF3YWl0IEVzYnVpbGRFeGVjdXRvci5oYXNOYXRpdmVTdXBwb3J0KCkpLFxuICAgICAgICAgIH07XG5cbiAgICAgICAgICAvLyBTb3J0IHNjcmlwdHMgc28gbGFyZ2VyIHNjcmlwdHMgc3RhcnQgZmlyc3QgLSB3b3JrZXIgcG9vbCB1c2VzIGEgRklGTyBxdWV1ZVxuICAgICAgICAgIHNjcmlwdHNUb09wdGltaXplLnNvcnQoKGEsIGIpID0+IGEuY29kZS5sZW5ndGggLSBiLmNvZGUubGVuZ3RoKTtcblxuICAgICAgICAgIC8vIEluaXRpYWxpemUgdGhlIHRhc2sgd29ya2VyIHBvb2xcbiAgICAgICAgICBjb25zdCB3b3JrZXJQYXRoID0gcmVxdWlyZS5yZXNvbHZlKCcuL2phdmFzY3JpcHQtb3B0aW1pemVyLXdvcmtlcicpO1xuICAgICAgICAgIGNvbnN0IHdvcmtlclBvb2wgPSBuZXcgUGlzY2luYSh7XG4gICAgICAgICAgICBmaWxlbmFtZTogd29ya2VyUGF0aCxcbiAgICAgICAgICAgIG1heFRocmVhZHM6IE1BWF9PUFRJTUlaRV9XT1JLRVJTLFxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgLy8gRW5xdWV1ZSBzY3JpcHQgb3B0aW1pemF0aW9uIHRhc2tzIGFuZCB1cGRhdGUgY29tcGlsYXRpb24gYXNzZXRzIGFzIHRoZSB0YXNrcyBjb21wbGV0ZVxuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCB0YXNrcyA9IFtdO1xuICAgICAgICAgICAgZm9yIChjb25zdCB7IG5hbWUsIGNvZGUsIG1hcCwgY2FjaGVJdGVtIH0gb2Ygc2NyaXB0c1RvT3B0aW1pemUpIHtcbiAgICAgICAgICAgICAgbG9nZ2VyLnRpbWUoYG9wdGltaXplIGFzc2V0OiAke25hbWV9YCk7XG5cbiAgICAgICAgICAgICAgdGFza3MucHVzaChcbiAgICAgICAgICAgICAgICB3b3JrZXJQb29sXG4gICAgICAgICAgICAgICAgICAucnVuKHtcbiAgICAgICAgICAgICAgICAgICAgYXNzZXQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgICAgICAgICAgIGNvZGUsXG4gICAgICAgICAgICAgICAgICAgICAgbWFwLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBvcHRpb25zOiBvcHRpbWl6ZU9wdGlvbnMsXG4gICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgLnRoZW4oXG4gICAgICAgICAgICAgICAgICAgIGFzeW5jICh7IGNvZGUsIG5hbWUsIG1hcCwgZXJyb3JzIH0pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyb3JzPy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgZXJyb3Igb2YgZXJyb3JzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGFkZEVycm9yKGNvbXBpbGF0aW9uLCBgT3B0aW1pemF0aW9uIGVycm9yIFske25hbWV9XTogJHtlcnJvcn1gKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG9wdGltaXplZEFzc2V0ID0gbWFwXG4gICAgICAgICAgICAgICAgICAgICAgICA/IG5ldyBTb3VyY2VNYXBTb3VyY2UoY29kZSwgbmFtZSwgbWFwKVxuICAgICAgICAgICAgICAgICAgICAgICAgOiBuZXcgT3JpZ2luYWxTb3VyY2UoY29kZSwgbmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgY29tcGlsYXRpb24udXBkYXRlQXNzZXQobmFtZSwgb3B0aW1pemVkQXNzZXQsIChhc3NldEluZm8pID0+ICh7XG4gICAgICAgICAgICAgICAgICAgICAgICAuLi5hc3NldEluZm8sXG4gICAgICAgICAgICAgICAgICAgICAgICBtaW5pbWl6ZWQ6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgfSkpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgbG9nZ2VyLnRpbWVFbmQoYG9wdGltaXplIGFzc2V0OiAke25hbWV9YCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FjaGVJdGVtPy5zdG9yZVByb21pc2Uoe1xuICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlOiBvcHRpbWl6ZWRBc3NldCxcbiAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgKGVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgYWRkRXJyb3IoXG4gICAgICAgICAgICAgICAgICAgICAgICBjb21waWxhdGlvbixcbiAgICAgICAgICAgICAgICAgICAgICAgIGBPcHRpbWl6YXRpb24gZXJyb3IgWyR7bmFtZX1dOiAke2Vycm9yLnN0YWNrIHx8IGVycm9yLm1lc3NhZ2V9YCxcbiAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgYXdhaXQgUHJvbWlzZS5hbGwodGFza3MpO1xuICAgICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICB2b2lkIHdvcmtlclBvb2wuZGVzdHJveSgpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGxvZ2dlci50aW1lRW5kKCdvcHRpbWl6ZSBqcyBhc3NldHMnKTtcbiAgICAgICAgfSxcbiAgICAgICk7XG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==