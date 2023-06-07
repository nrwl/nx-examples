"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CssOptimizerPlugin = void 0;
const esbuild_targets_1 = require("../../utils/esbuild-targets");
const webpack_diagnostics_1 = require("../../utils/webpack-diagnostics");
const esbuild_executor_1 = require("./esbuild-executor");
/**
 * The name of the plugin provided to Webpack when tapping Webpack compiler hooks.
 */
const PLUGIN_NAME = 'angular-css-optimizer';
/**
 * A Webpack plugin that provides CSS optimization capabilities.
 *
 * The plugin uses both `esbuild` to provide both fast and highly-optimized
 * code output.
 */
class CssOptimizerPlugin {
    constructor(options) {
        this.esbuild = new esbuild_executor_1.EsbuildExecutor();
        if (options?.supportedBrowsers) {
            this.targets = (0, esbuild_targets_1.transformSupportedBrowsersToTargets)(options.supportedBrowsers);
        }
    }
    apply(compiler) {
        const { OriginalSource, SourceMapSource } = compiler.webpack.sources;
        compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation) => {
            const logger = compilation.getLogger('build-angular.CssOptimizerPlugin');
            compilation.hooks.processAssets.tapPromise({
                name: PLUGIN_NAME,
                stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE,
            }, async (compilationAssets) => {
                const cache = compilation.options.cache && compilation.getCache(PLUGIN_NAME);
                logger.time('optimize css assets');
                for (const assetName of Object.keys(compilationAssets)) {
                    if (!/\.(?:css|scss|sass|less)$/.test(assetName)) {
                        continue;
                    }
                    const asset = compilation.getAsset(assetName);
                    // Skip assets that have already been optimized or are verbatim copies (project assets)
                    if (!asset || asset.info.minimized || asset.info.copied) {
                        continue;
                    }
                    const { source: styleAssetSource, name } = asset;
                    let cacheItem;
                    if (cache) {
                        const eTag = cache.getLazyHashedEtag(styleAssetSource);
                        cacheItem = cache.getItemCache(name, eTag);
                        const cachedOutput = await cacheItem.getPromise();
                        if (cachedOutput) {
                            logger.debug(`${name} restored from cache`);
                            await this.addWarnings(compilation, cachedOutput.warnings);
                            compilation.updateAsset(name, cachedOutput.source, (assetInfo) => ({
                                ...assetInfo,
                                minimized: true,
                            }));
                            continue;
                        }
                    }
                    const { source, map: inputMap } = styleAssetSource.sourceAndMap();
                    const input = typeof source === 'string' ? source : source.toString();
                    const optimizeAssetLabel = `optimize asset: ${asset.name}`;
                    logger.time(optimizeAssetLabel);
                    const { code, warnings, map } = await this.optimize(input, asset.name, inputMap, this.targets);
                    logger.timeEnd(optimizeAssetLabel);
                    await this.addWarnings(compilation, warnings);
                    const optimizedAsset = map
                        ? new SourceMapSource(code, name, map)
                        : new OriginalSource(code, name);
                    compilation.updateAsset(name, optimizedAsset, (assetInfo) => ({
                        ...assetInfo,
                        minimized: true,
                    }));
                    await cacheItem?.storePromise({
                        source: optimizedAsset,
                        warnings,
                    });
                }
                logger.timeEnd('optimize css assets');
            });
        });
    }
    /**
     * Optimizes a CSS asset using esbuild.
     *
     * @param input The CSS asset source content to optimize.
     * @param name The name of the CSS asset. Used to generate source maps.
     * @param inputMap Optionally specifies the CSS asset's original source map that will
     * be merged with the intermediate optimized source map.
     * @param target Optionally specifies the target browsers for the output code.
     * @returns A promise resolving to the optimized CSS, source map, and any warnings.
     */
    optimize(input, name, inputMap, target) {
        let sourceMapLine;
        if (inputMap) {
            // esbuild will automatically remap the sourcemap if provided
            sourceMapLine = `\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,${Buffer.from(JSON.stringify(inputMap)).toString('base64')} */`;
        }
        return this.esbuild.transform(sourceMapLine ? input + sourceMapLine : input, {
            loader: 'css',
            legalComments: 'inline',
            minify: true,
            sourcemap: !!inputMap && 'external',
            sourcefile: name,
            target,
        });
    }
    async addWarnings(compilation, warnings) {
        if (warnings.length > 0) {
            for (const warning of await this.esbuild.formatMessages(warnings, { kind: 'warning' })) {
                (0, webpack_diagnostics_1.addWarning)(compilation, warning);
            }
        }
    }
}
exports.CssOptimizerPlugin = CssOptimizerPlugin;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3NzLW9wdGltaXplci1wbHVnaW4uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy93ZWJwYWNrL3BsdWdpbnMvY3NzLW9wdGltaXplci1wbHVnaW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7O0FBSUgsaUVBQWtGO0FBQ2xGLHlFQUE2RDtBQUM3RCx5REFBcUQ7QUFFckQ7O0dBRUc7QUFDSCxNQUFNLFdBQVcsR0FBRyx1QkFBdUIsQ0FBQztBQU01Qzs7Ozs7R0FLRztBQUNILE1BQWEsa0JBQWtCO0lBSTdCLFlBQVksT0FBbUM7UUFGdkMsWUFBTyxHQUFHLElBQUksa0NBQWUsRUFBRSxDQUFDO1FBR3RDLElBQUksT0FBTyxFQUFFLGlCQUFpQixFQUFFO1lBQzlCLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBQSxxREFBbUMsRUFBQyxPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQztTQUMvRTtJQUNILENBQUM7SUFFRCxLQUFLLENBQUMsUUFBa0I7UUFDdEIsTUFBTSxFQUFFLGNBQWMsRUFBRSxlQUFlLEVBQUUsR0FBRyxRQUFRLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQztRQUVyRSxRQUFRLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLENBQUMsV0FBVyxFQUFFLEVBQUU7WUFDMUQsTUFBTSxNQUFNLEdBQUcsV0FBVyxDQUFDLFNBQVMsQ0FBQyxrQ0FBa0MsQ0FBQyxDQUFDO1lBRXpFLFdBQVcsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FDeEM7Z0JBQ0UsSUFBSSxFQUFFLFdBQVc7Z0JBQ2pCLEtBQUssRUFBRSxRQUFRLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxrQ0FBa0M7YUFDdkUsRUFDRCxLQUFLLEVBQUUsaUJBQWlCLEVBQUUsRUFBRTtn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RUFBRSxDQUFDLEVBQUU7Z0JBQ3RGLElBQUEsZ0NBQVUsRUFBQyxXQUFXLEVBQUUsT0FBTyxDQUFDLENBQUM7YUFDbEM7U0FDRjtJQUNILENBQUM7Q0FDRjtBQXBJRCxnREFvSUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHR5cGUgeyBNZXNzYWdlLCBUcmFuc2Zvcm1SZXN1bHQgfSBmcm9tICdlc2J1aWxkJztcbmltcG9ydCB0eXBlIHsgQ29tcGlsYXRpb24sIENvbXBpbGVyLCBzb3VyY2VzIH0gZnJvbSAnd2VicGFjayc7XG5pbXBvcnQgeyB0cmFuc2Zvcm1TdXBwb3J0ZWRCcm93c2Vyc1RvVGFyZ2V0cyB9IGZyb20gJy4uLy4uL3V0aWxzL2VzYnVpbGQtdGFyZ2V0cyc7XG5pbXBvcnQgeyBhZGRXYXJuaW5nIH0gZnJvbSAnLi4vLi4vdXRpbHMvd2VicGFjay1kaWFnbm9zdGljcyc7XG5pbXBvcnQgeyBFc2J1aWxkRXhlY3V0b3IgfSBmcm9tICcuL2VzYnVpbGQtZXhlY3V0b3InO1xuXG4vKipcbiAqIFRoZSBuYW1lIG9mIHRoZSBwbHVnaW4gcHJvdmlkZWQgdG8gV2VicGFjayB3aGVuIHRhcHBpbmcgV2VicGFjayBjb21waWxlciBob29rcy5cbiAqL1xuY29uc3QgUExVR0lOX05BTUUgPSAnYW5ndWxhci1jc3Mtb3B0aW1pemVyJztcblxuZXhwb3J0IGludGVyZmFjZSBDc3NPcHRpbWl6ZXJQbHVnaW5PcHRpb25zIHtcbiAgc3VwcG9ydGVkQnJvd3NlcnM/OiBzdHJpbmdbXTtcbn1cblxuLyoqXG4gKiBBIFdlYnBhY2sgcGx1Z2luIHRoYXQgcHJvdmlkZXMgQ1NTIG9wdGltaXphdGlvbiBjYXBhYmlsaXRpZXMuXG4gKlxuICogVGhlIHBsdWdpbiB1c2VzIGJvdGggYGVzYnVpbGRgIHRvIHByb3ZpZGUgYm90aCBmYXN0IGFuZCBoaWdobHktb3B0aW1pemVkXG4gKiBjb2RlIG91dHB1dC5cbiAqL1xuZXhwb3J0IGNsYXNzIENzc09wdGltaXplclBsdWdpbiB7XG4gIHByaXZhdGUgdGFyZ2V0czogc3RyaW5nW10gfCB1bmRlZmluZWQ7XG4gIHByaXZhdGUgZXNidWlsZCA9IG5ldyBFc2J1aWxkRXhlY3V0b3IoKTtcblxuICBjb25zdHJ1Y3RvcihvcHRpb25zPzogQ3NzT3B0aW1pemVyUGx1Z2luT3B0aW9ucykge1xuICAgIGlmIChvcHRpb25zPy5zdXBwb3J0ZWRCcm93c2Vycykge1xuICAgICAgdGhpcy50YXJnZXRzID0gdHJhbnNmb3JtU3VwcG9ydGVkQnJvd3NlcnNUb1RhcmdldHMob3B0aW9ucy5zdXBwb3J0ZWRCcm93c2Vycyk7XG4gICAgfVxuICB9XG5cbiAgYXBwbHkoY29tcGlsZXI6IENvbXBpbGVyKSB7XG4gICAgY29uc3QgeyBPcmlnaW5hbFNvdXJjZSwgU291cmNlTWFwU291cmNlIH0gPSBjb21waWxlci53ZWJwYWNrLnNvdXJjZXM7XG5cbiAgICBjb21waWxlci5ob29rcy5jb21waWxhdGlvbi50YXAoUExVR0lOX05BTUUsIChjb21waWxhdGlvbikgPT4ge1xuICAgICAgY29uc3QgbG9nZ2VyID0gY29tcGlsYXRpb24uZ2V0TG9nZ2VyKCdidWlsZC1hbmd1bGFyLkNzc09wdGltaXplclBsdWdpbicpO1xuXG4gICAgICBjb21waWxhdGlvbi5ob29rcy5wcm9jZXNzQXNzZXRzLnRhcFByb21pc2UoXG4gICAgICAgIHtcbiAgICAgICAgICBuYW1lOiBQTFVHSU5fTkFNRSxcbiAgICAgICAgICBzdGFnZTogY29tcGlsZXIud2VicGFjay5Db21waWxhdGlvbi5QUk9DRVNTX0FTU0VUU19TVEFHRV9PUFRJTUlaRV9TSVpFLFxuICAgICAgICB9LFxuICAgICAgICBhc3luYyAoY29tcGlsYXRpb25Bc3NldHMpID0+IHtcbiAgICAgICAgICBjb25zdCBjYWNoZSA9IGNvbXBpbGF0aW9uLm9wdGlvbnMuY2FjaGUgJiYgY29tcGlsYXRpb24uZ2V0Q2FjaGUoUExVR0lOX05BTUUpO1xuXG4gICAgICAgICAgbG9nZ2VyLnRpbWUoJ29wdGltaXplIGNzcyBhc3NldHMnKTtcbiAgICAgICAgICBmb3IgKGNvbnN0IGFzc2V0TmFtZSBvZiBPYmplY3Qua2V5cyhjb21waWxhdGlvbkFzc2V0cykpIHtcbiAgICAgICAgICAgIGlmICghL1xcLig/OmNzc3xzY3NzfHNhc3N8bGVzcykkLy50ZXN0KGFzc2V0TmFtZSkpIHtcbiAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGFzc2V0ID0gY29tcGlsYXRpb24uZ2V0QXNzZXQoYXNzZXROYW1lKTtcbiAgICAgICAgICAgIC8vIFNraXAgYXNzZXRzIHRoYXQgaGF2ZSBhbHJlYWR5IGJlZW4gb3B0aW1pemVkIG9yIGFyZSB2ZXJiYXRpbSBjb3BpZXMgKHByb2plY3QgYXNzZXRzKVxuICAgICAgICAgICAgaWYgKCFhc3NldCB8fCBhc3NldC5pbmZvLm1pbmltaXplZCB8fCBhc3NldC5pbmZvLmNvcGllZCkge1xuICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgeyBzb3VyY2U6IHN0eWxlQXNzZXRTb3VyY2UsIG5hbWUgfSA9IGFzc2V0O1xuICAgICAgICAgICAgbGV0IGNhY2hlSXRlbTtcblxuICAgICAgICAgICAgaWYgKGNhY2hlKSB7XG4gICAgICAgICAgICAgIGNvbnN0IGVUYWcgPSBjYWNoZS5nZXRMYXp5SGFzaGVkRXRhZyhzdHlsZUFzc2V0U291cmNlKTtcbiAgICAgICAgICAgICAgY2FjaGVJdGVtID0gY2FjaGUuZ2V0SXRlbUNhY2hlKG5hbWUsIGVUYWcpO1xuICAgICAgICAgICAgICBjb25zdCBjYWNoZWRPdXRwdXQgPSBhd2FpdCBjYWNoZUl0ZW0uZ2V0UHJvbWlzZTxcbiAgICAgICAgICAgICAgICB7IHNvdXJjZTogc291cmNlcy5Tb3VyY2U7IHdhcm5pbmdzOiBNZXNzYWdlW10gfSB8IHVuZGVmaW5lZFxuICAgICAgICAgICAgICA+KCk7XG5cbiAgICAgICAgICAgICAgaWYgKGNhY2hlZE91dHB1dCkge1xuICAgICAgICAgICAgICAgIGxvZ2dlci5kZWJ1ZyhgJHtuYW1lfSByZXN0b3JlZCBmcm9tIGNhY2hlYCk7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5hZGRXYXJuaW5ncyhjb21waWxhdGlvbiwgY2FjaGVkT3V0cHV0Lndhcm5pbmdzKTtcbiAgICAgICAgICAgICAgICBjb21waWxhdGlvbi51cGRhdGVBc3NldChuYW1lLCBjYWNoZWRPdXRwdXQuc291cmNlLCAoYXNzZXRJbmZvKSA9PiAoe1xuICAgICAgICAgICAgICAgICAgLi4uYXNzZXRJbmZvLFxuICAgICAgICAgICAgICAgICAgbWluaW1pemVkOiB0cnVlLFxuICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCB7IHNvdXJjZSwgbWFwOiBpbnB1dE1hcCB9ID0gc3R5bGVBc3NldFNvdXJjZS5zb3VyY2VBbmRNYXAoKTtcbiAgICAgICAgICAgIGNvbnN0IGlucHV0ID0gdHlwZW9mIHNvdXJjZSA9PT0gJ3N0cmluZycgPyBzb3VyY2UgOiBzb3VyY2UudG9TdHJpbmcoKTtcblxuICAgICAgICAgICAgY29uc3Qgb3B0aW1pemVBc3NldExhYmVsID0gYG9wdGltaXplIGFzc2V0OiAke2Fzc2V0Lm5hbWV9YDtcbiAgICAgICAgICAgIGxvZ2dlci50aW1lKG9wdGltaXplQXNzZXRMYWJlbCk7XG4gICAgICAgICAgICBjb25zdCB7IGNvZGUsIHdhcm5pbmdzLCBtYXAgfSA9IGF3YWl0IHRoaXMub3B0aW1pemUoXG4gICAgICAgICAgICAgIGlucHV0LFxuICAgICAgICAgICAgICBhc3NldC5uYW1lLFxuICAgICAgICAgICAgICBpbnB1dE1hcCxcbiAgICAgICAgICAgICAgdGhpcy50YXJnZXRzLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIGxvZ2dlci50aW1lRW5kKG9wdGltaXplQXNzZXRMYWJlbCk7XG5cbiAgICAgICAgICAgIGF3YWl0IHRoaXMuYWRkV2FybmluZ3MoY29tcGlsYXRpb24sIHdhcm5pbmdzKTtcblxuICAgICAgICAgICAgY29uc3Qgb3B0aW1pemVkQXNzZXQgPSBtYXBcbiAgICAgICAgICAgICAgPyBuZXcgU291cmNlTWFwU291cmNlKGNvZGUsIG5hbWUsIG1hcClcbiAgICAgICAgICAgICAgOiBuZXcgT3JpZ2luYWxTb3VyY2UoY29kZSwgbmFtZSk7XG4gICAgICAgICAgICBjb21waWxhdGlvbi51cGRhdGVBc3NldChuYW1lLCBvcHRpbWl6ZWRBc3NldCwgKGFzc2V0SW5mbykgPT4gKHtcbiAgICAgICAgICAgICAgLi4uYXNzZXRJbmZvLFxuICAgICAgICAgICAgICBtaW5pbWl6ZWQ6IHRydWUsXG4gICAgICAgICAgICB9KSk7XG5cbiAgICAgICAgICAgIGF3YWl0IGNhY2hlSXRlbT8uc3RvcmVQcm9taXNlKHtcbiAgICAgICAgICAgICAgc291cmNlOiBvcHRpbWl6ZWRBc3NldCxcbiAgICAgICAgICAgICAgd2FybmluZ3MsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgbG9nZ2VyLnRpbWVFbmQoJ29wdGltaXplIGNzcyBhc3NldHMnKTtcbiAgICAgICAgfSxcbiAgICAgICk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogT3B0aW1pemVzIGEgQ1NTIGFzc2V0IHVzaW5nIGVzYnVpbGQuXG4gICAqXG4gICAqIEBwYXJhbSBpbnB1dCBUaGUgQ1NTIGFzc2V0IHNvdXJjZSBjb250ZW50IHRvIG9wdGltaXplLlxuICAgKiBAcGFyYW0gbmFtZSBUaGUgbmFtZSBvZiB0aGUgQ1NTIGFzc2V0LiBVc2VkIHRvIGdlbmVyYXRlIHNvdXJjZSBtYXBzLlxuICAgKiBAcGFyYW0gaW5wdXRNYXAgT3B0aW9uYWxseSBzcGVjaWZpZXMgdGhlIENTUyBhc3NldCdzIG9yaWdpbmFsIHNvdXJjZSBtYXAgdGhhdCB3aWxsXG4gICAqIGJlIG1lcmdlZCB3aXRoIHRoZSBpbnRlcm1lZGlhdGUgb3B0aW1pemVkIHNvdXJjZSBtYXAuXG4gICAqIEBwYXJhbSB0YXJnZXQgT3B0aW9uYWxseSBzcGVjaWZpZXMgdGhlIHRhcmdldCBicm93c2VycyBmb3IgdGhlIG91dHB1dCBjb2RlLlxuICAgKiBAcmV0dXJucyBBIHByb21pc2UgcmVzb2x2aW5nIHRvIHRoZSBvcHRpbWl6ZWQgQ1NTLCBzb3VyY2UgbWFwLCBhbmQgYW55IHdhcm5pbmdzLlxuICAgKi9cbiAgcHJpdmF0ZSBvcHRpbWl6ZShcbiAgICBpbnB1dDogc3RyaW5nLFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBpbnB1dE1hcDogb2JqZWN0LFxuICAgIHRhcmdldDogc3RyaW5nW10gfCB1bmRlZmluZWQsXG4gICk6IFByb21pc2U8VHJhbnNmb3JtUmVzdWx0PiB7XG4gICAgbGV0IHNvdXJjZU1hcExpbmU7XG4gICAgaWYgKGlucHV0TWFwKSB7XG4gICAgICAvLyBlc2J1aWxkIHdpbGwgYXV0b21hdGljYWxseSByZW1hcCB0aGUgc291cmNlbWFwIGlmIHByb3ZpZGVkXG4gICAgICBzb3VyY2VNYXBMaW5lID0gYFxcbi8qIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtjaGFyc2V0PXV0Zi04O2Jhc2U2NCwke0J1ZmZlci5mcm9tKFxuICAgICAgICBKU09OLnN0cmluZ2lmeShpbnB1dE1hcCksXG4gICAgICApLnRvU3RyaW5nKCdiYXNlNjQnKX0gKi9gO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmVzYnVpbGQudHJhbnNmb3JtKHNvdXJjZU1hcExpbmUgPyBpbnB1dCArIHNvdXJjZU1hcExpbmUgOiBpbnB1dCwge1xuICAgICAgbG9hZGVyOiAnY3NzJyxcbiAgICAgIGxlZ2FsQ29tbWVudHM6ICdpbmxpbmUnLFxuICAgICAgbWluaWZ5OiB0cnVlLFxuICAgICAgc291cmNlbWFwOiAhIWlucHV0TWFwICYmICdleHRlcm5hbCcsXG4gICAgICBzb3VyY2VmaWxlOiBuYW1lLFxuICAgICAgdGFyZ2V0LFxuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBhZGRXYXJuaW5ncyhjb21waWxhdGlvbjogQ29tcGlsYXRpb24sIHdhcm5pbmdzOiBNZXNzYWdlW10pIHtcbiAgICBpZiAod2FybmluZ3MubGVuZ3RoID4gMCkge1xuICAgICAgZm9yIChjb25zdCB3YXJuaW5nIG9mIGF3YWl0IHRoaXMuZXNidWlsZC5mb3JtYXRNZXNzYWdlcyh3YXJuaW5ncywgeyBraW5kOiAnd2FybmluZycgfSkpIHtcbiAgICAgICAgYWRkV2FybmluZyhjb21waWxhdGlvbiwgd2FybmluZyk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG4iXX0=