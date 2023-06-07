"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildWebpackBrowser = exports.BUILD_TIMEOUT = void 0;
const architect_1 = require("@angular-devkit/architect");
const build_webpack_1 = require("@angular-devkit/build-webpack");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const rxjs_1 = require("rxjs");
const utils_1 = require("../../utils");
const bundle_calculator_1 = require("../../utils/bundle-calculator");
const color_1 = require("../../utils/color");
const copy_assets_1 = require("../../utils/copy-assets");
const error_1 = require("../../utils/error");
const i18n_inlining_1 = require("../../utils/i18n-inlining");
const index_html_generator_1 = require("../../utils/index-file/index-html-generator");
const normalize_cache_1 = require("../../utils/normalize-cache");
const output_paths_1 = require("../../utils/output-paths");
const package_chunk_sort_1 = require("../../utils/package-chunk-sort");
const purge_cache_1 = require("../../utils/purge-cache");
const service_worker_1 = require("../../utils/service-worker");
const spinner_1 = require("../../utils/spinner");
const version_1 = require("../../utils/version");
const webpack_browser_config_1 = require("../../utils/webpack-browser-config");
const configs_1 = require("../../webpack/configs");
const async_chunks_1 = require("../../webpack/utils/async-chunks");
const helpers_1 = require("../../webpack/utils/helpers");
const stats_1 = require("../../webpack/utils/stats");
/**
 * Maximum time in milliseconds for single build/rebuild
 * This accounts for CI variability.
 */
exports.BUILD_TIMEOUT = 30000;
async function initialize(options, context, webpackConfigurationTransform) {
    const originalOutputPath = options.outputPath;
    // Assets are processed directly by the builder except when watching
    const adjustedOptions = options.watch ? options : { ...options, assets: [] };
    const { config, projectRoot, projectSourceRoot, i18n } = await (0, webpack_browser_config_1.generateI18nBrowserWebpackConfigFromContext)(adjustedOptions, context, (wco) => [
        (0, configs_1.getCommonConfig)(wco),
        (0, configs_1.getStylesConfig)(wco),
    ]);
    let transformedConfig;
    if (webpackConfigurationTransform) {
        transformedConfig = await webpackConfigurationTransform(config);
    }
    if (options.deleteOutputPath) {
        (0, utils_1.deleteOutputDir)(context.workspaceRoot, originalOutputPath);
    }
    return { config: transformedConfig || config, projectRoot, projectSourceRoot, i18n };
}
/**
 * @experimental Direct usage of this function is considered experimental.
 */
// eslint-disable-next-line max-lines-per-function
function buildWebpackBrowser(options, context, transforms = {}) {
    const projectName = context.target?.project;
    if (!projectName) {
        throw new Error('The builder requires a target.');
    }
    const baseOutputPath = path.resolve(context.workspaceRoot, options.outputPath);
    let outputPaths;
    // Check Angular version.
    (0, version_1.assertCompatibleAngularVersion)(context.workspaceRoot);
    return (0, rxjs_1.from)(context.getProjectMetadata(projectName)).pipe((0, rxjs_1.switchMap)(async (projectMetadata) => {
        var _a;
        // Purge old build disk cache.
        await (0, purge_cache_1.purgeStaleBuildCache)(context);
        // Initialize builder
        const initialization = await initialize(options, context, transforms.webpackConfiguration);
        // Add index file to watched files.
        if (options.watch) {
            const indexInputFile = path.join(context.workspaceRoot, (0, webpack_browser_config_1.getIndexInputFile)(options.index));
            (_a = initialization.config).plugins ?? (_a.plugins = []);
            initialization.config.plugins.push({
                apply: (compiler) => {
                    compiler.hooks.thisCompilation.tap('build-angular', (compilation) => {
                        compilation.fileDependencies.add(indexInputFile);
                    });
                },
            });
        }
        return {
            ...initialization,
            cacheOptions: (0, normalize_cache_1.normalizeCacheOptions)(projectMetadata, context.workspaceRoot),
        };
    }), (0, rxjs_1.switchMap)(
    // eslint-disable-next-line max-lines-per-function
    ({ config, projectRoot, projectSourceRoot, i18n, cacheOptions }) => {
        const normalizedOptimization = (0, utils_1.normalizeOptimization)(options.optimization);
        return (0, build_webpack_1.runWebpack)(config, context, {
            webpackFactory: require('webpack'),
            logging: transforms.logging ||
                ((stats, config) => {
                    if (options.verbose) {
                        context.logger.info(stats.toString(config.stats));
                    }
                }),
        }).pipe((0, rxjs_1.concatMap)(
        // eslint-disable-next-line max-lines-per-function
        async (buildEvent) => {
            const spinner = new spinner_1.Spinner();
            spinner.enabled = options.progress !== false;
            const { success, emittedFiles = [], outputPath: webpackOutputPath } = buildEvent;
            const webpackRawStats = buildEvent.webpackStats;
            if (!webpackRawStats) {
                throw new Error('Webpack stats build result is required.');
            }
            // Fix incorrectly set `initial` value on chunks.
            const extraEntryPoints = [
                ...(0, helpers_1.normalizeExtraEntryPoints)(options.styles || [], 'styles'),
                ...(0, helpers_1.normalizeExtraEntryPoints)(options.scripts || [], 'scripts'),
            ];
            const webpackStats = {
                ...webpackRawStats,
                chunks: (0, async_chunks_1.markAsyncChunksNonInitial)(webpackRawStats, extraEntryPoints),
            };
            if (!success) {
                // If using bundle downleveling then there is only one build
                // If it fails show any diagnostic messages and bail
                if ((0, stats_1.statsHasWarnings)(webpackStats)) {
                    context.logger.warn((0, stats_1.statsWarningsToString)(webpackStats, { colors: true }));
                }
                if ((0, stats_1.statsHasErrors)(webpackStats)) {
                    context.logger.error((0, stats_1.statsErrorsToString)(webpackStats, { colors: true }));
                }
                return {
                    webpackStats: webpackRawStats,
                    output: { success: false },
                };
            }
            else {
                outputPaths = (0, output_paths_1.ensureOutputPaths)(baseOutputPath, i18n);
                const scriptsEntryPointName = (0, helpers_1.normalizeExtraEntryPoints)(options.scripts || [], 'scripts').map((x) => x.bundleName);
                if (i18n.shouldInline) {
                    const success = await (0, i18n_inlining_1.i18nInlineEmittedFiles)(context, emittedFiles, i18n, baseOutputPath, Array.from(outputPaths.values()), scriptsEntryPointName, webpackOutputPath, options.i18nMissingTranslation);
                    if (!success) {
                        return {
                            webpackStats: webpackRawStats,
                            output: { success: false },
                        };
                    }
                }
                // Check for budget errors and display them to the user.
                const budgets = options.budgets;
                let budgetFailures;
                if (budgets?.length) {
                    budgetFailures = [...(0, bundle_calculator_1.checkBudgets)(budgets, webpackStats)];
                    for (const { severity, message } of budgetFailures) {
                        switch (severity) {
                            case bundle_calculator_1.ThresholdSeverity.Warning:
                                webpackStats.warnings?.push({ message });
                                break;
                            case bundle_calculator_1.ThresholdSeverity.Error:
                                webpackStats.errors?.push({ message });
                                break;
                            default:
                                assertNever(severity);
                        }
                    }
                }
                const buildSuccess = success && !(0, stats_1.statsHasErrors)(webpackStats);
                if (buildSuccess) {
                    // Copy assets
                    if (!options.watch && options.assets?.length) {
                        spinner.start('Copying assets...');
                        try {
                            await (0, copy_assets_1.copyAssets)((0, utils_1.normalizeAssetPatterns)(options.assets, context.workspaceRoot, projectRoot, projectSourceRoot), Array.from(outputPaths.values()), context.workspaceRoot);
                            spinner.succeed('Copying assets complete.');
                        }
                        catch (err) {
                            spinner.fail(color_1.colors.redBright('Copying of assets failed.'));
                            (0, error_1.assertIsError)(err);
                            return {
                                output: {
                                    success: false,
                                    error: 'Unable to copy assets: ' + err.message,
                                },
                                webpackStats: webpackRawStats,
                            };
                        }
                    }
                    if (options.index) {
                        spinner.start('Generating index html...');
                        const entrypoints = (0, package_chunk_sort_1.generateEntryPoints)({
                            scripts: options.scripts ?? [],
                            styles: options.styles ?? [],
                        });
                        const indexHtmlGenerator = new index_html_generator_1.IndexHtmlGenerator({
                            cache: cacheOptions,
                            indexPath: path.join(context.workspaceRoot, (0, webpack_browser_config_1.getIndexInputFile)(options.index)),
                            entrypoints,
                            deployUrl: options.deployUrl,
                            sri: options.subresourceIntegrity,
                            optimization: normalizedOptimization,
                            crossOrigin: options.crossOrigin,
                            postTransform: transforms.indexHtml,
                        });
                        let hasErrors = false;
                        for (const [locale, outputPath] of outputPaths.entries()) {
                            try {
                                const { content, warnings, errors } = await indexHtmlGenerator.process({
                                    baseHref: getLocaleBaseHref(i18n, locale) ?? options.baseHref,
                                    // i18nLocale is used when Ivy is disabled
                                    lang: locale || undefined,
                                    outputPath,
                                    files: mapEmittedFilesToFileInfo(emittedFiles),
                                });
                                if (warnings.length || errors.length) {
                                    spinner.stop();
                                    warnings.forEach((m) => context.logger.warn(m));
                                    errors.forEach((m) => {
                                        context.logger.error(m);
                                        hasErrors = true;
                                    });
                                    spinner.start();
                                }
                                const indexOutput = path.join(outputPath, (0, webpack_browser_config_1.getIndexOutputFile)(options.index));
                                await fs.promises.mkdir(path.dirname(indexOutput), { recursive: true });
                                await fs.promises.writeFile(indexOutput, content);
                            }
                            catch (error) {
                                spinner.fail('Index html generation failed.');
                                (0, error_1.assertIsError)(error);
                                return {
                                    webpackStats: webpackRawStats,
                                    output: { success: false, error: error.message },
                                };
                            }
                        }
                        if (hasErrors) {
                            spinner.fail('Index html generation failed.');
                            return {
                                webpackStats: webpackRawStats,
                                output: { success: false },
                            };
                        }
                        else {
                            spinner.succeed('Index html generation complete.');
                        }
                    }
                    if (options.serviceWorker) {
                        spinner.start('Generating service worker...');
                        for (const [locale, outputPath] of outputPaths.entries()) {
                            try {
                                await (0, service_worker_1.augmentAppWithServiceWorker)(projectRoot, context.workspaceRoot, outputPath, getLocaleBaseHref(i18n, locale) ?? options.baseHref ?? '/', options.ngswConfigPath);
                            }
                            catch (error) {
                                spinner.fail('Service worker generation failed.');
                                (0, error_1.assertIsError)(error);
                                return {
                                    webpackStats: webpackRawStats,
                                    output: { success: false, error: error.message },
                                };
                            }
                        }
                        spinner.succeed('Service worker generation complete.');
                    }
                }
                (0, stats_1.webpackStatsLogger)(context.logger, webpackStats, config, budgetFailures);
                return {
                    webpackStats: webpackRawStats,
                    output: { success: buildSuccess },
                };
            }
        }), (0, rxjs_1.map)(({ output: event, webpackStats }) => ({
            ...event,
            stats: (0, stats_1.generateBuildEventStats)(webpackStats, options),
            baseOutputPath,
            outputs: (outputPaths &&
                [...outputPaths.entries()].map(([locale, path]) => ({
                    locale,
                    path,
                    baseHref: getLocaleBaseHref(i18n, locale) ?? options.baseHref,
                }))) || {
                path: baseOutputPath,
                baseHref: options.baseHref,
            },
        })));
    }));
    function getLocaleBaseHref(i18n, locale) {
        if (i18n.locales[locale] && i18n.locales[locale]?.baseHref !== '') {
            return (0, utils_1.urlJoin)(options.baseHref || '', i18n.locales[locale].baseHref ?? `/${locale}/`);
        }
        return undefined;
    }
}
exports.buildWebpackBrowser = buildWebpackBrowser;
function assertNever(input) {
    throw new Error(`Unexpected call to assertNever() with input: ${JSON.stringify(input, null /* replacer */, 4 /* tabSize */)}`);
}
function mapEmittedFilesToFileInfo(files = []) {
    const filteredFiles = [];
    for (const { file, name, extension, initial } of files) {
        if (name && initial) {
            filteredFiles.push({ file, extension, name });
        }
    }
    return filteredFiles;
}
exports.default = (0, architect_1.createBuilder)(buildWebpackBrowser);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy9idWlsZGVycy9icm93c2VyL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUgseURBQXlGO0FBQ3pGLGlFQUFpRztBQUNqRyx1Q0FBeUI7QUFDekIsMkNBQTZCO0FBQzdCLCtCQUFtRTtBQUduRSx1Q0FLcUI7QUFDckIscUVBSXVDO0FBQ3ZDLDZDQUEyQztBQUMzQyx5REFBcUQ7QUFDckQsNkNBQWtEO0FBQ2xELDZEQUFtRTtBQUduRSxzRkFHcUQ7QUFDckQsaUVBQW9FO0FBQ3BFLDJEQUE2RDtBQUM3RCx1RUFBcUU7QUFDckUseURBQStEO0FBQy9ELCtEQUF5RTtBQUN6RSxpREFBOEM7QUFDOUMsaURBQXFFO0FBQ3JFLCtFQUk0QztBQUM1QyxtREFBeUU7QUFDekUsbUVBQTZFO0FBQzdFLHlEQUF3RTtBQUN4RSxxREFRbUM7QUFnQm5DOzs7R0FHRztBQUNVLFFBQUEsYUFBYSxHQUFHLEtBQU0sQ0FBQztBQUVwQyxLQUFLLFVBQVUsVUFBVSxDQUN2QixPQUE2QixFQUM3QixPQUF1QixFQUN2Qiw2QkFBMkU7SUFPM0UsTUFBTSxrQkFBa0IsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDO0lBRTlDLG9FQUFvRTtJQUNwRSxNQUFNLGVBQWUsR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUUsRUFBRSxDQUFDO0lBRTdFLE1BQU0sRUFBRSxNQUFNLEVBQUUsV0FBVyxFQUFFLGlCQUFpQixFQUFFLElBQUksRUFBRSxHQUNwRCxNQUFNLElBQUEsb0VBQTJDLEVBQUMsZUFBZSxFQUFF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U0FBUyxFQUFFLE9BQU8sRUFBRSxJQUFJLEtBQUssRUFBRTtRQUN0RCxJQUFJLElBQUksSUFBSSxPQUFPLEVBQUU7WUFDbkIsYUFBYSxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztTQUMvQztLQUNGO0lBRUQsT0FBTyxhQUFhLENBQUM7QUFDdkIsQ0FBQztBQUVELGtCQUFlLElBQUEseUJBQWEsRUFBdUIsbUJBQW1CLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBCdWlsZGVyQ29udGV4dCwgQnVpbGRlck91dHB1dCwgY3JlYXRlQnVpbGRlciB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9hcmNoaXRlY3QnO1xuaW1wb3J0IHsgRW1pdHRlZEZpbGVzLCBXZWJwYWNrTG9nZ2luZ0NhbGxiYWNrLCBydW5XZWJwYWNrIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2J1aWxkLXdlYnBhY2snO1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IE9ic2VydmFibGUsIGNvbmNhdE1hcCwgZnJvbSwgbWFwLCBzd2l0Y2hNYXAgfSBmcm9tICdyeGpzJztcbmltcG9ydCB3ZWJwYWNrLCB7IFN0YXRzQ29tcGlsYXRpb24gfSBmcm9tICd3ZWJwYWNrJztcbmltcG9ydCB7IEV4ZWN1dGlvblRyYW5zZm9ybWVyIH0gZnJvbSAnLi4vLi4vdHJhbnNmb3Jtcyc7XG5pbXBvcnQge1xuICBkZWxldGVPdXRwdXREaXIsXG4gIG5vcm1hbGl6ZUFzc2V0UGF0dGVybnMsXG4gIG5vcm1hbGl6ZU9wdGltaXphdGlvbixcbiAgdXJsSm9pbixcbn0gZnJvbSAnLi4vLi4vdXRpbHMnO1xuaW1wb3J0IHtcbiAgQnVkZ2V0Q2FsY3VsYXRvclJlc3VsdCxcbiAgVGhyZXNob2xkU2V2ZXJpdHksXG4gIGNoZWNrQnVkZ2V0cyxcbn0gZnJvbSAnLi4vLi4vdXRpbHMvYnVuZGxlLWNhbGN1bGF0b3InO1xuaW1wb3J0IHsgY29sb3JzIH0gZnJvbSAnLi4vLi4vdXRpbHMvY29sb3InO1xuaW1wb3J0IHsgY29weUFzc2V0cyB9IGZyb20gJy4uLy4uL3V0aWxzL2NvcHktYXNzZXRzJztcbmltcG9ydCB7IGFzc2VydElzRXJyb3IgfSBmcm9tICcuLi8uLi91dGlscy9lcnJvcic7XG5pbXBvcnQgeyBpMThuSW5saW5lRW1pdHRlZEZpbGVzIH0gZnJvbSAnLi4vLi4vdXRpbHMvaTE4bi1pbmxpbmluZyc7XG5pbXBvcnQgeyBJMThuT3B0aW9ucyB9IGZyb20gJy4uLy4uL3V0aWxzL2kxOG4tb3B0aW9ucyc7XG5pbXBvcnQgeyBGaWxlSW5mbyB9IGZyb20gJy4uLy4uL3V0aWxzL2luZGV4LWZpbGUvYXVnbWVudC1pbmRleC1odG1sJztcbmltcG9ydCB7XG4gIEluZGV4SHRtbEdlbmVyYXRvcixcbiAgSW5kZXhIdG1sVHJhbnNmb3JtLFxufSBmcm9tICcuLi8uLi91dGlscy9pbmRleC1maWxlL2luZGV4LWh0bWwtZ2VuZXJhdG9yJztcbmltcG9ydCB7IG5vcm1hbGl6ZUNhY2hlT3B0aW9ucyB9IGZyb20gJy4uLy4uL3V0aWxzL25vcm1hbGl6ZS1jYWNoZSc7XG5pbXBvcnQgeyBlbnN1cmVPdXRwdXRQYXRocyB9IGZyb20gJy4uLy4uL3V0aWxzL291dHB1dC1wYXRocyc7XG5pbXBvcnQgeyBnZW5lcmF0ZUVudHJ5UG9pbnRzIH0gZnJvbSAnLi4vLi4vdXRpbHMvcGFja2FnZS1jaHVuay1zb3J0JztcbmltcG9ydCB7IHB1cmdlU3RhbGVCdWlsZENhY2hlIH0gZnJvbSAnLi4vLi4vdXRpbHMvcHVyZ2UtY2FjaGUnO1xuaW1wb3J0IHsgYXVnbWVudEFwcFdpdGhTZXJ2aWNlV29ya2VyIH0gZnJvbSAnLi4vLi4vdXRpbHMvc2VydmljZS13b3JrZXInO1xuaW1wb3J0IHsgU3Bpbm5lciB9IGZyb20gJy4uLy4uL3V0aWxzL3NwaW5uZXInO1xuaW1wb3J0IHsgYXNzZXJ0Q29tcGF0aWJsZUFuZ3VsYXJWZXJzaW9uIH0gZnJvbSAnLi4vLi4vdXRpbHMvdmVyc2lvbic7XG5pbXBvcnQge1xuICBnZW5lcmF0ZUkxOG5Ccm93c2VyV2VicGFja0NvbmZpZ0Zyb21Db250ZXh0LFxuICBnZXRJbmRleElucHV0RmlsZSxcbiAgZ2V0SW5kZXhPdXRwdXRGaWxlLFxufSBmcm9tICcuLi8uLi91dGlscy93ZWJwYWNrLWJyb3dzZXItY29uZmlnJztcbmltcG9ydCB7IGdldENvbW1vbkNvbmZpZywgZ2V0U3R5bGVzQ29uZmlnIH0gZnJvbSAnLi4vLi4vd2VicGFjay9jb25maWdzJztcbmltcG9ydCB7IG1hcmtBc3luY0NodW5rc05vbkluaXRpYWwgfSBmcm9tICcuLi8uLi93ZWJwYWNrL3V0aWxzL2FzeW5jLWNodW5rcyc7XG5pbXBvcnQgeyBub3JtYWxpemVFeHRyYUVudHJ5UG9pbnRzIH0gZnJvbSAnLi4vLi4vd2VicGFjay91dGlscy9oZWxwZXJzJztcbmltcG9ydCB7XG4gIEJ1aWxkRXZlbnRTdGF0cyxcbiAgZ2VuZXJhdGVCdWlsZEV2ZW50U3RhdHMsXG4gIHN0YXRzRXJyb3JzVG9TdHJpbmcsXG4gIHN0YXRzSGFzRXJyb3JzLFxuICBzdGF0c0hhc1dhcm5pbmdzLFxuICBzdGF0c1dhcm5pbmdzVG9TdHJpbmcsXG4gIHdlYnBhY2tTdGF0c0xvZ2dlcixcbn0gZnJvbSAnLi4vLi4vd2VicGFjay91dGlscy9zdGF0cyc7XG5pbXBvcnQgeyBTY2hlbWEgYXMgQnJvd3NlckJ1aWxkZXJTY2hlbWEgfSBmcm9tICcuL3NjaGVtYSc7XG5cbi8qKlxuICogQGV4cGVyaW1lbnRhbCBEaXJlY3QgdXNhZ2Ugb2YgdGhpcyB0eXBlIGlzIGNvbnNpZGVyZWQgZXhwZXJpbWVudGFsLlxuICovXG5leHBvcnQgdHlwZSBCcm93c2VyQnVpbGRlck91dHB1dCA9IEJ1aWxkZXJPdXRwdXQgJiB7XG4gIHN0YXRzOiBCdWlsZEV2ZW50U3RhdHM7XG4gIGJhc2VPdXRwdXRQYXRoOiBzdHJpbmc7XG4gIG91dHB1dHM6IHtcbiAgICBsb2NhbGU/OiBzdHJpbmc7XG4gICAgcGF0aDogc3RyaW5nO1xuICAgIGJhc2VIcmVmPzogc3RyaW5nO1xuICB9W107XG59O1xuXG4vKipcbiAqIE1heGltdW0gdGltZSBpbiBtaWxsaXNlY29uZHMgZm9yIHNpbmdsZSBidWlsZC9yZWJ1aWxkXG4gKiBUaGlzIGFjY291bnRzIGZvciBDSSB2YXJpYWJpbGl0eS5cbiAqL1xuZXhwb3J0IGNvbnN0IEJVSUxEX1RJTUVPVVQgPSAzMF8wMDA7XG5cbmFzeW5jIGZ1bmN0aW9uIGluaXRpYWxpemUoXG4gIG9wdGlvbnM6IEJyb3dzZXJCdWlsZGVyU2NoZW1hLFxuICBjb250ZXh0OiBCdWlsZGVyQ29udGV4dCxcbiAgd2VicGFja0NvbmZpZ3VyYXRpb25UcmFuc2Zvcm0/OiBFeGVjdXRpb25UcmFuc2Zvcm1lcjx3ZWJwYWNrLkNvbmZpZ3VyYXRpb24+LFxuKTogUHJvbWlzZTx7XG4gIGNvbmZpZzogd2VicGFjay5Db25maWd1cmF0aW9uO1xuICBwcm9qZWN0Um9vdDogc3RyaW5nO1xuICBwcm9qZWN0U291cmNlUm9vdD86IHN0cmluZztcbiAgaTE4bjogSTE4bk9wdGlvbnM7XG59PiB7XG4gIGNvbnN0IG9yaWdpbmFsT3V0cHV0UGF0aCA9IG9wdGlvbnMub3V0cHV0UGF0aDtcblxuICAvLyBBc3NldHMgYXJlIHByb2Nlc3NlZCBkaXJlY3RseSBieSB0aGUgYnVpbGRlciBleGNlcHQgd2hlbiB3YXRjaGluZ1xuICBjb25zdCBhZGp1c3RlZE9wdGlvbnMgPSBvcHRpb25zLndhdGNoID8gb3B0aW9ucyA6IHsgLi4ub3B0aW9ucywgYXNzZXRzOiBbXSB9O1xuXG4gIGNvbnN0IHsgY29uZmlnLCBwcm9qZWN0Um9vdCwgcHJvamVjdFNvdXJjZVJvb3QsIGkxOG4gfSA9XG4gICAgYXdhaXQgZ2VuZXJhdGVJMThuQnJvd3NlcldlYnBhY2tDb25maWdGcm9tQ29udGV4dChhZGp1c3RlZE9wdGlvbnMsIGNvbnRleHQsICh3Y28pID0+IFtcbiAgICAgIGdldENvbW1vbkNvbmZpZyh3Y28pLFxuICAgICAgZ2V0U3R5bGVzQ29uZmlnKHdjbyksXG4gICAgXSk7XG5cbiAgbGV0IHRyYW5zZm9ybWVkQ29uZmlnO1xuICBpZiAod2VicGFja0NvbmZpZ3VyYXRpb25UcmFuc2Zvcm0pIHtcbiAgICB0cmFuc2Zvcm1lZENvbmZpZyA9IGF3YWl0IHdlYnBhY2tDb25maWd1cmF0aW9uVHJhbnNmb3JtKGNvbmZpZyk7XG4gIH1cblxuICBpZiAob3B0aW9ucy5kZWxldGVPdXRwdXRQYXRoKSB7XG4gICAgZGVsZXRlT3V0cHV0RGlyKGNvbnRleHQud29ya3NwYWNlUm9vdCwgb3JpZ2luYWxPdXRwdXRQYXRoKTtcbiAgfVxuXG4gIHJldHVybiB7IGNvbmZpZzogdHJhbnNmb3JtZWRDb25maWcgfHwgY29uZmlnLCBwcm9qZWN0Um9vdCwgcHJvamVjdFNvdXJjZVJvb3QsIGkxOG4gfTtcbn1cblxuLyoqXG4gKiBAZXhwZXJpbWVudGFsIERpcmVjdCB1c2FnZSBvZiB0aGlzIGZ1bmN0aW9uIGlzIGNvbnNpZGVyZWQgZXhwZXJpbWVudGFsLlxuICovXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbWF4LWxpbmVzLXBlci1mdW5jdGlvblxuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkV2VicGFja0Jyb3dzZXIoXG4gIG9wdGlvbnM6IEJyb3dzZXJCdWlsZGVyU2NoZW1hLFxuICBjb250ZXh0OiBCdWlsZGVyQ29udGV4dCxcbiAgdHJhbnNmb3Jtczoge1xuICAgIHdlYnBhY2tDb25maWd1cmF0aW9uPzogRXhlY3V0aW9uVHJhbnNmb3JtZXI8d2VicGFjay5Db25maWd1cmF0aW9uPjtcbiAgICBsb2dnaW5nPzogV2VicGFja0xvZ2dpbmdDYWxsYmFjaztcbiAgICBpbmRleEh0bWw/OiBJbmRleEh0bWxUcmFuc2Zvcm07XG4gIH0gPSB7fSxcbik6IE9ic2VydmFibGU8QnJvd3NlckJ1aWxkZXJPdXRwdXQ+IHtcbiAgY29uc3QgcHJvamVjdE5hbWUgPSBjb250ZXh0LnRhcmdldD8ucHJvamVjdDtcbiAgaWYgKCFwcm9qZWN0TmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcignVGhlIGJ1aWxkZXIgcmVxdWlyZXMgYSB0YXJnZXQuJyk7XG4gIH1cblxuICBjb25zdCBiYXNlT3V0cHV0UGF0aCA9IHBhdGgucmVzb2x2ZShjb250ZXh0LndvcmtzcGFjZVJvb3QsIG9wdGlvbnMub3V0cHV0UGF0aCk7XG4gIGxldCBvdXRwdXRQYXRoczogdW5kZWZpbmVkIHwgTWFwPHN0cmluZywgc3RyaW5nPjtcblxuICAvLyBDaGVjayBBbmd1bGFyIHZlcnNpb24uXG4gIGFzc2VydENvbXBhdGlibGVBbmd1bGFyVmVyc2lvbihjb250ZXh0LndvcmtzcGFjZVJvb3QpO1xuXG4gIHJldHVybiBmcm9tKGNvbnRleHQuZ2V0UHJvamVjdE1ldGFkYXRhKHByb2plY3ROYW1lKSkucGlwZShcbiAgICBzd2l0Y2hNYXAoYXN5bmMgKHByb2plY3RNZXRhZGF0YSkgPT4ge1xuICAgICAgLy8gUHVyZ2Ugb2xkIGJ1aWxkIGRpc2sgY2FjaGUuXG4gICAgICBhd2FpdCBwdXJnZVN0YWxlQnVpbGRDYWNoZShjb250ZXh0KTtcblxuICAgICAgLy8gSW5pdGlhbGl6ZSBidWlsZGVyXG4gICAgICBjb25zdCBpbml0aWFsaXphdGlvbiA9IGF3YWl0IGluaXRpYWxpemUob3B0aW9ucywgY29udGV4dCwgdHJhbnNmb3Jtcy53ZWJwYWNrQ29uZmlndXJhdGlvbik7XG5cbiAgICAgIC8vIEFkZCBpbmRleCBmaWxlIHRvIHdhdGNoZWQgZmlsZXMuXG4gICAgICBpZiAob3B0aW9ucy53YXRjaCkge1xuICAgICAgICBjb25zdCBpbmRleElucHV0RmlsZSA9IHBhdGguam9pbihjb250ZXh0LndvcmtzcGFjZVJvb3QsIGdldEluZGV4SW5wdXRGaWxlKG9wdGlvbnMuaW5kZXgpKTtcbiAgICAgICAgaW5pdGlhbGl6YXRpb24uY29uZmlnLnBsdWdpbnMgPz89IFtdO1xuICAgICAgICBpbml0aWFsaXphdGlvbi5jb25maWcucGx1Z2lucy5wdXNoKHtcbiAgICAgICAgICBhcHBseTogKGNvbXBpbGVyOiB3ZWJwYWNrLkNvbXBpbGVyKSA9PiB7XG4gICAgICAgICAgICBjb21waWxlci5ob29rcy50aGlzQ29tcGlsYXRpb24udGFwKCdidWlsZC1hbmd1bGFyJywgKGNvbXBpbGF0aW9uKSA9PiB7XG4gICAgICAgICAgICAgIGNvbXBpbGF0aW9uLmZpbGVEZXBlbmRlbmNpZXMuYWRkKGluZGV4SW5wdXRGaWxlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4ge1xuICAgICAgICAuLi5pbml0aWFsaXphdGlvbixcbiAgICAgICAgY2FjaGVPcHRpb25zOiBub3JtYWxpemVDYWNoZU9wdGlvbnMocHJvamVjdE1ldGFkYXRhLCBjb250ZXh0LndvcmtzcGFjZVJvb3QpLFxuICAgICAgfTtcbiAgICB9KSxcbiAgICBzd2l0Y2hNYXAoXG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbWF4LWxpbmVzLXBlci1mdW5jdGlvblxuICAgICAgKHsgY29uZmlnLCBwcm9qZWN0Um9vdCwgcHJvamVjdFNvdXJjZVJvb3QsIGkxOG4sIGNhY2hlT3B0aW9ucyB9KSA9PiB7XG4gICAgICAgIGNvbnN0IG5vcm1hbGl6ZWRPcHRpbWl6YXRpb24gPSBub3JtYWxpemVPcHRpbWl6YXRpb24ob3B0aW9ucy5vcHRpbWl6YXRpb24pO1xuXG4gICAgICAgIHJldHVybiBydW5XZWJwYWNrKGNvbmZpZywgY29udGV4dCwge1xuICAgICAgICAgIHdlYnBhY2tGYWN0b3J5OiByZXF1aXJlKCd3ZWJwYWNrJykgYXMgdHlwZW9mIHdlYnBhY2ssXG4gICAgICAgICAgbG9nZ2luZzpcbiAgICAgICAgICAgIHRyYW5zZm9ybXMubG9nZ2luZyB8fFxuICAgICAgICAgICAgKChzdGF0cywgY29uZmlnKSA9PiB7XG4gICAgICAgICAgICAgIGlmIChvcHRpb25zLnZlcmJvc2UpIHtcbiAgICAgICAgICAgICAgICBjb250ZXh0LmxvZ2dlci5pbmZvKHN0YXRzLnRvU3RyaW5nKGNvbmZpZy5zdGF0cykpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgfSkucGlwZShcbiAgICAgICAgICBjb25jYXRNYXAoXG4gICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbWF4LWxpbmVzLXBlci1mdW5jdGlvblxuICAgICAgICAgICAgYXN5bmMgKFxuICAgICAgICAgICAgICBidWlsZEV2ZW50LFxuICAgICAgICAgICAgKTogUHJvbWlzZTx7IG91dHB1dDogQnVpbGRlck91dHB1dDsgd2VicGFja1N0YXRzOiBTdGF0c0NvbXBpbGF0aW9uIH0+ID0+IHtcbiAgICAgICAgICAgICAgY29uc3Qgc3Bpbm5lciA9IG5ldyBTcGlubmVyKCk7XG4gICAgICAgICAgICAgIHNwaW5uZXIuZW5hYmxlZCA9IG9wdGlvbnMucHJvZ3Jlc3MgIT09IGZhbHNlO1xuXG4gICAgICAgICAgICAgIGNvbnN0IHsgc3VjY2VzcywgZW1pdHRlZEZpbGVzID0gW10sIG91dHB1dFBhdGg6IHdlYnBhY2tPdXRwdXRQYXRoIH0gPSBidWlsZEV2ZW50O1xuICAgICAgICAgICAgICBjb25zdCB3ZWJwYWNrUmF3U3RhdHMgPSBidWlsZEV2ZW50LndlYnBhY2tTdGF0cztcbiAgICAgICAgICAgICAgaWYgKCF3ZWJwYWNrUmF3U3RhdHMpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1dlYnBhY2sgc3RhdHMgYnVpbGQgcmVzdWx0IGlzIHJlcXVpcmVkLicpO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgLy8gRml4IGluY29ycmVjdGx5IHNldCBgaW5pdGlhbGAgdmFsdWUgb24gY2h1bmtzLlxuICAgICAgICAgICAgICBjb25zdCBleHRyYUVudHJ5UG9pbnRzID0gW1xuICAgICAgICAgICAgICAgIC4uLm5vcm1hbGl6ZUV4dHJhRW50cnlQb2ludHMob3B0aW9ucy5zdHlsZXMgfHwgW10sICdzdHlsZXMnKSxcbiAgICAgICAgICAgICAgICAuLi5ub3JtYWxpemVFeHRyYUVudHJ5UG9pbnRzKG9wdGlvbnMuc2NyaXB0cyB8fCBbXSwgJ3NjcmlwdHMnKSxcbiAgICAgICAgICAgICAgXTtcblxuICAgICAgICAgICAgICBjb25zdCB3ZWJwYWNrU3RhdHMgPSB7XG4gICAgICAgICAgICAgICAgLi4ud2VicGFja1Jhd1N0YXRzLFxuICAgICAgICAgICAgICAgIGNodW5rczogbWFya0FzeW5jQ2h1bmtzTm9uSW5pdGlhbCh3ZWJwYWNrUmF3U3RhdHMsIGV4dHJhRW50cnlQb2ludHMpLFxuICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgIGlmICghc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgIC8vIElmIHVzaW5nIGJ1bmRsZSBkb3dubGV2ZWxpbmcgdGhlbiB0aGVyZSBpcyBvbmx5IG9uZSBidWlsZFxuICAgICAgICAgICAgICAgIC8vIElmIGl0IGZhaWxzIHNob3cgYW55IGRpYWdub3N0aWMgbWVzc2FnZXMgYW5kIGJhaWxcbiAgICAgICAgICAgICAgICBpZiAoc3RhdHNIYXNXYXJuaW5ncyh3ZWJwYWNrU3RhdHMpKSB7XG4gICAgICAgICAgICAgICAgICBjb250ZXh0LmxvZ2dlci53YXJuKHN0YXRzV2FybmluZ3NUb1N0cmluZyh3ZWJwYWNrU3RhdHMsIHsgY29sb3JzOiB0cnVlIH0pKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHN0YXRzSGFzRXJyb3JzKHdlYnBhY2tTdGF0cykpIHtcbiAgICAgICAgICAgICAgICAgIGNvbnRleHQubG9nZ2VyLmVycm9yKHN0YXRzRXJyb3JzVG9TdHJpbmcod2VicGFja1N0YXRzLCB7IGNvbG9yczogdHJ1ZSB9KSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgIHdlYnBhY2tTdGF0czogd2VicGFja1Jhd1N0YXRzLFxuICAgICAgICAgICAgICAgICAgb3V0cHV0OiB7IHN1Y2Nlc3M6IGZhbHNlIH0sXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBvdXRwdXRQYXRocyA9IGVuc3VyZU91dHB1dFBhdGhzKGJhc2VPdXRwdXRQYXRoLCBpMThuKTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHNjcmlwdHNFbnRyeVBvaW50TmFtZSA9IG5vcm1hbGl6ZUV4dHJhRW50cnlQb2ludHMoXG4gICAgICAgICAgICAgICAgICBvcHRpb25zLnNjcmlwdHMgfHwgW10sXG4gICAgICAgICAgICAgICAgICAnc2NyaXB0cycsXG4gICAgICAgICAgICAgICAgKS5tYXAoKHgpID0+IHguYnVuZGxlTmFtZSk7XG5cbiAgICAgICAgICAgICAgICBpZiAoaTE4bi5zaG91bGRJbmxpbmUpIHtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IHN1Y2Nlc3MgPSBhd2FpdCBpMThuSW5saW5lRW1pdHRlZEZpbGVzKFxuICAgICAgICAgICAgICAgICAgICBjb250ZXh0LFxuICAgICAgICAgICAgICAgICAgICBlbWl0dGVkRmlsZXMsXG4gICAgICAgICAgICAgICAgICAgIGkxOG4sXG4gICAgICAgICAgICAgICAgICAgIGJhc2VPdXRwdXRQYXRoLFxuICAgICAgICAgICAgICAgICAgICBBcnJheS5mcm9tKG91dHB1dFBhdGhzLnZhbHVlcygpKSxcbiAgICAgICAgICAgICAgICAgICAgc2NyaXB0c0VudHJ5UG9pbnROYW1lLFxuICAgICAgICAgICAgICAgICAgICB3ZWJwYWNrT3V0cHV0UGF0aCxcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5pMThuTWlzc2luZ1RyYW5zbGF0aW9uLFxuICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgIGlmICghc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgIHdlYnBhY2tTdGF0czogd2VicGFja1Jhd1N0YXRzLFxuICAgICAgICAgICAgICAgICAgICAgIG91dHB1dDogeyBzdWNjZXNzOiBmYWxzZSB9LFxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIENoZWNrIGZvciBidWRnZXQgZXJyb3JzIGFuZCBkaXNwbGF5IHRoZW0gdG8gdGhlIHVzZXIuXG4gICAgICAgICAgICAgICAgY29uc3QgYnVkZ2V0cyA9IG9wdGlvbnMuYnVkZ2V0cztcbiAgICAgICAgICAgICAgICBsZXQgYnVkZ2V0RmFpbHVyZXM6IEJ1ZGdldENhbGN1bGF0b3JSZXN1bHRbXSB8IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICBpZiAoYnVkZ2V0cz8ubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICBidWRnZXRGYWlsdXJlcyA9IFsuLi5jaGVja0J1ZGdldHMoYnVkZ2V0cywgd2VicGFja1N0YXRzKV07XG4gICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHsgc2V2ZXJpdHksIG1lc3NhZ2UgfSBvZiBidWRnZXRGYWlsdXJlcykge1xuICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKHNldmVyaXR5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgY2FzZSBUaHJlc2hvbGRTZXZlcml0eS5XYXJuaW5nOlxuICAgICAgICAgICAgICAgICAgICAgICAgd2VicGFja1N0YXRzLndhcm5pbmdzPy5wdXNoKHsgbWVzc2FnZSB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgIGNhc2UgVGhyZXNob2xkU2V2ZXJpdHkuRXJyb3I6XG4gICAgICAgICAgICAgICAgICAgICAgICB3ZWJwYWNrU3RhdHMuZXJyb3JzPy5wdXNoKHsgbWVzc2FnZSB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICBhc3NlcnROZXZlcihzZXZlcml0eSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb25zdCBidWlsZFN1Y2Nlc3MgPSBzdWNjZXNzICYmICFzdGF0c0hhc0Vycm9ycyh3ZWJwYWNrU3RhdHMpO1xuICAgICAgICAgICAgICAgIGlmIChidWlsZFN1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgICAgIC8vIENvcHkgYXNzZXRzXG4gICAgICAgICAgICAgICAgICBpZiAoIW9wdGlvbnMud2F0Y2ggJiYgb3B0aW9ucy5hc3NldHM/Lmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICBzcGlubmVyLnN0YXJ0KCdDb3B5aW5nIGFzc2V0cy4uLicpO1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IGNvcHlBc3NldHMoXG4gICAgICAgICAgICAgICAgICAgICAgICBub3JtYWxpemVBc3NldFBhdHRlcm5zKFxuICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25zLmFzc2V0cyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGV4dC53b3Jrc3BhY2VSb290LFxuICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9qZWN0Um9vdCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvamVjdFNvdXJjZVJvb3QsXG4gICAgICAgICAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgICAgICAgICAgICAgQXJyYXkuZnJvbShvdXRwdXRQYXRocy52YWx1ZXMoKSksXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZXh0LndvcmtzcGFjZVJvb3QsXG4gICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICBzcGlubmVyLnN1Y2NlZWQoJ0NvcHlpbmcgYXNzZXRzIGNvbXBsZXRlLicpO1xuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICBzcGlubmVyLmZhaWwoY29sb3JzLnJlZEJyaWdodCgnQ29weWluZyBvZiBhc3NldHMgZmFpbGVkLicpKTtcbiAgICAgICAgICAgICAgICAgICAgICBhc3NlcnRJc0Vycm9yKGVycik7XG5cbiAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogJ1VuYWJsZSB0byBjb3B5IGFzc2V0czogJyArIGVyci5tZXNzYWdlLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHdlYnBhY2tTdGF0czogd2VicGFja1Jhd1N0YXRzLFxuICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMuaW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgc3Bpbm5lci5zdGFydCgnR2VuZXJhdGluZyBpbmRleCBodG1sLi4uJyk7XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZW50cnlwb2ludHMgPSBnZW5lcmF0ZUVudHJ5UG9pbnRzKHtcbiAgICAgICAgICAgICAgICAgICAgICBzY3JpcHRzOiBvcHRpb25zLnNjcmlwdHMgPz8gW10sXG4gICAgICAgICAgICAgICAgICAgICAgc3R5bGVzOiBvcHRpb25zLnN0eWxlcyA/PyBbXSxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaW5kZXhIdG1sR2VuZXJhdG9yID0gbmV3IEluZGV4SHRtbEdlbmVyYXRvcih7XG4gICAgICAgICAgICAgICAgICAgICAgY2FjaGU6IGNhY2hlT3B0aW9ucyxcbiAgICAgICAgICAgICAgICAgICAgICBpbmRleFBhdGg6IHBhdGguam9pbihjb250ZXh0LndvcmtzcGFjZVJvb3QsIGdldEluZGV4SW5wdXRGaWxlKG9wdGlvbnMuaW5kZXgpKSxcbiAgICAgICAgICAgICAgICAgICAgICBlbnRyeXBvaW50cyxcbiAgICAgICAgICAgICAgICAgICAgICBkZXBsb3lVcmw6IG9wdGlvbnMuZGVwbG95VXJsLFxuICAgICAgICAgICAgICAgICAgICAgIHNyaTogb3B0aW9ucy5zdWJyZXNvdXJjZUludGVncml0eSxcbiAgICAgICAgICAgICAgICAgICAgICBvcHRpbWl6YXRpb246IG5vcm1hbGl6ZWRPcHRpbWl6YXRpb24sXG4gICAgICAgICAgICAgICAgICAgICAgY3Jvc3NPcmlnaW46IG9wdGlvbnMuY3Jvc3NPcmlnaW4sXG4gICAgICAgICAgICAgICAgICAgICAgcG9zdFRyYW5zZm9ybTogdHJhbnNmb3Jtcy5pbmRleEh0bWwsXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIGxldCBoYXNFcnJvcnMgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBbbG9jYWxlLCBvdXRwdXRQYXRoXSBvZiBvdXRwdXRQYXRocy5lbnRyaWVzKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgeyBjb250ZW50LCB3YXJuaW5ncywgZXJyb3JzIH0gPSBhd2FpdCBpbmRleEh0bWxHZW5lcmF0b3IucHJvY2Vzcyh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGJhc2VIcmVmOiBnZXRMb2NhbGVCYXNlSHJlZihpMThuLCBsb2NhbGUpID8/IG9wdGlvbnMuYmFzZUhyZWYsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGkxOG5Mb2NhbGUgaXMgdXNlZCB3aGVuIEl2eSBpcyBkaXNhYmxlZFxuICAgICAgICAgICAgICAgICAgICAgICAgICBsYW5nOiBsb2NhbGUgfHwgdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBvdXRwdXRQYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlczogbWFwRW1pdHRlZEZpbGVzVG9GaWxlSW5mbyhlbWl0dGVkRmlsZXMpLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh3YXJuaW5ncy5sZW5ndGggfHwgZXJyb3JzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBzcGlubmVyLnN0b3AoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgd2FybmluZ3MuZm9yRWFjaCgobSkgPT4gY29udGV4dC5sb2dnZXIud2FybihtKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9ycy5mb3JFYWNoKChtKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGV4dC5sb2dnZXIuZXJyb3IobSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGFzRXJyb3JzID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHNwaW5uZXIuc3RhcnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaW5kZXhPdXRwdXQgPSBwYXRoLmpvaW4oXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dFBhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGdldEluZGV4T3V0cHV0RmlsZShvcHRpb25zLmluZGV4KSxcbiAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBmcy5wcm9taXNlcy5ta2RpcihwYXRoLmRpcm5hbWUoaW5kZXhPdXRwdXQpLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IGZzLnByb21pc2VzLndyaXRlRmlsZShpbmRleE91dHB1dCwgY29udGVudCk7XG4gICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNwaW5uZXIuZmFpbCgnSW5kZXggaHRtbCBnZW5lcmF0aW9uIGZhaWxlZC4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFzc2VydElzRXJyb3IoZXJyb3IpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICB3ZWJwYWNrU3RhdHM6IHdlYnBhY2tSYXdTdGF0cyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0OiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyb3IubWVzc2FnZSB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAoaGFzRXJyb3JzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgc3Bpbm5lci5mYWlsKCdJbmRleCBodG1sIGdlbmVyYXRpb24gZmFpbGVkLicpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdlYnBhY2tTdGF0czogd2VicGFja1Jhd1N0YXRzLFxuICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0OiB7IHN1Y2Nlc3M6IGZhbHNlIH0sXG4gICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICBzcGlubmVyLnN1Y2NlZWQoJ0luZGV4IGh0bWwgZ2VuZXJhdGlvbiBjb21wbGV0ZS4nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5zZXJ2aWNlV29ya2VyKSB7XG4gICAgICAgICAgICAgICAgICAgIHNwaW5uZXIuc3RhcnQoJ0dlbmVyYXRpbmcgc2VydmljZSB3b3JrZXIuLi4nKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBbbG9jYWxlLCBvdXRwdXRQYXRoXSBvZiBvdXRwdXRQYXRocy5lbnRyaWVzKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgYXVnbWVudEFwcFdpdGhTZXJ2aWNlV29ya2VyKFxuICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9qZWN0Um9vdCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGV4dC53b3Jrc3BhY2VSb290LFxuICAgICAgICAgICAgICAgICAgICAgICAgICBvdXRwdXRQYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBnZXRMb2NhbGVCYXNlSHJlZihpMThuLCBsb2NhbGUpID8/IG9wdGlvbnMuYmFzZUhyZWYgPz8gJy8nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25zLm5nc3dDb25maWdQYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3Bpbm5lci5mYWlsKCdTZXJ2aWNlIHdvcmtlciBnZW5lcmF0aW9uIGZhaWxlZC4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFzc2VydElzRXJyb3IoZXJyb3IpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICB3ZWJwYWNrU3RhdHM6IHdlYnBhY2tSYXdTdGF0cyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0OiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyb3IubWVzc2FnZSB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBzcGlubmVyLnN1Y2NlZWQoJ1NlcnZpY2Ugd29ya2VyIGdlbmVyYXRpb24gY29tcGxldGUuJyk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgd2VicGFja1N0YXRzTG9nZ2VyKGNvbnRleHQubG9nZ2VyLCB3ZWJwYWNrU3RhdHMsIGNvbmZpZywgYnVkZ2V0RmFpbHVyZXMpO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgIHdlYnBhY2tTdGF0czogd2VicGFja1Jhd1N0YXRzLFxuICAgICAgICAgICAgICAgICAgb3V0cHV0OiB7IHN1Y2Nlc3M6IGJ1aWxkU3VjY2VzcyB9LFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgKSxcbiAgICAgICAgICBtYXAoXG4gICAgICAgICAgICAoeyBvdXRwdXQ6IGV2ZW50LCB3ZWJwYWNrU3RhdHMgfSkgPT5cbiAgICAgICAgICAgICAgKHtcbiAgICAgICAgICAgICAgICAuLi5ldmVudCxcbiAgICAgICAgICAgICAgICBzdGF0czogZ2VuZXJhdGVCdWlsZEV2ZW50U3RhdHMod2VicGFja1N0YXRzLCBvcHRpb25zKSxcbiAgICAgICAgICAgICAgICBiYXNlT3V0cHV0UGF0aCxcbiAgICAgICAgICAgICAgICBvdXRwdXRzOiAob3V0cHV0UGF0aHMgJiZcbiAgICAgICAgICAgICAgICAgIFsuLi5vdXRwdXRQYXRocy5lbnRyaWVzKCldLm1hcCgoW2xvY2FsZSwgcGF0aF0pID0+ICh7XG4gICAgICAgICAgICAgICAgICAgIGxvY2FsZSxcbiAgICAgICAgICAgICAgICAgICAgcGF0aCxcbiAgICAgICAgICAgICAgICAgICAgYmFzZUhyZWY6IGdldExvY2FsZUJhc2VIcmVmKGkxOG4sIGxvY2FsZSkgPz8gb3B0aW9ucy5iYXNlSHJlZixcbiAgICAgICAgICAgICAgICAgIH0pKSkgfHwge1xuICAgICAgICAgICAgICAgICAgcGF0aDogYmFzZU91dHB1dFBhdGgsXG4gICAgICAgICAgICAgICAgICBiYXNlSHJlZjogb3B0aW9ucy5iYXNlSHJlZixcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB9IGFzIEJyb3dzZXJCdWlsZGVyT3V0cHV0KSxcbiAgICAgICAgICApLFxuICAgICAgICApO1xuICAgICAgfSxcbiAgICApLFxuICApO1xuXG4gIGZ1bmN0aW9uIGdldExvY2FsZUJhc2VIcmVmKGkxOG46IEkxOG5PcHRpb25zLCBsb2NhbGU6IHN0cmluZyk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gICAgaWYgKGkxOG4ubG9jYWxlc1tsb2NhbGVdICYmIGkxOG4ubG9jYWxlc1tsb2NhbGVdPy5iYXNlSHJlZiAhPT0gJycpIHtcbiAgICAgIHJldHVybiB1cmxKb2luKG9wdGlvbnMuYmFzZUhyZWYgfHwgJycsIGkxOG4ubG9jYWxlc1tsb2NhbGVdLmJhc2VIcmVmID8/IGAvJHtsb2NhbGV9L2ApO1xuICAgIH1cblxuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cbn1cblxuZnVuY3Rpb24gYXNzZXJ0TmV2ZXIoaW5wdXQ6IG5ldmVyKTogbmV2ZXIge1xuICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgYFVuZXhwZWN0ZWQgY2FsbCB0byBhc3NlcnROZXZlcigpIHdpdGggaW5wdXQ6ICR7SlNPTi5zdHJpbmdpZnkoXG4gICAgICBpbnB1dCxcbiAgICAgIG51bGwgLyogcmVwbGFjZXIgKi8sXG4gICAgICA0IC8qIHRhYlNpemUgKi8sXG4gICAgKX1gLFxuICApO1xufVxuXG5mdW5jdGlvbiBtYXBFbWl0dGVkRmlsZXNUb0ZpbGVJbmZvKGZpbGVzOiBFbWl0dGVkRmlsZXNbXSA9IFtdKTogRmlsZUluZm9bXSB7XG4gIGNvbnN0IGZpbHRlcmVkRmlsZXM6IEZpbGVJbmZvW10gPSBbXTtcbiAgZm9yIChjb25zdCB7IGZpbGUsIG5hbWUsIGV4dGVuc2lvbiwgaW5pdGlhbCB9IG9mIGZpbGVzKSB7XG4gICAgaWYgKG5hbWUgJiYgaW5pdGlhbCkge1xuICAgICAgZmlsdGVyZWRGaWxlcy5wdXNoKHsgZmlsZSwgZXh0ZW5zaW9uLCBuYW1lIH0pO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBmaWx0ZXJlZEZpbGVzO1xufVxuXG5leHBvcnQgZGVmYXVsdCBjcmVhdGVCdWlsZGVyPEJyb3dzZXJCdWlsZGVyU2NoZW1hPihidWlsZFdlYnBhY2tCcm93c2VyKTtcbiJdfQ==