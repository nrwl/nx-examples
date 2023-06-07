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
const webpack_factory_adapter_1 = require("./webpack-factory-adapter");
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
        (0, configs_1.getCommonConfig)(Object.assign(wco, { isRsPack: true })),
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
            // webpackFactory: require('webpack') as typeof webpack,
            webpackFactory: webpack_factory_adapter_1.webpackFactory,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy9idWlsZGVycy9icm93c2VyLXJzcGFjay9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVILHlEQUF5RjtBQUN6RixpRUFBaUc7QUFDakcsdUNBQXlCO0FBQ3pCLDJDQUE2QjtBQUM3QiwrQkFBbUU7QUFHbkUsdUNBS3FCO0FBQ3JCLHFFQUl1QztBQUN2Qyw2Q0FBMkM7QUFDM0MseURBQXFEO0FBQ3JELDZDQUFrRDtBQUNsRCw2REFBbUU7QUFHbkUsc0ZBR3FEO0FBQ3JELGlFQUFvRTtBQUNwRSwyREFBNkQ7QUFDN0QsdUVBQXFFO0FBQ3JFLHlEQUErRDtBQUMvRCwrREFBeUU7QUFDekUsaURBQThDO0FBQzlDLGlEQUFxRTtBQUNyRSwrRUFJNEM7QUFDNUMsbURBQXlFO0FBQ3pFLG1FQUE2RTtBQUM3RSx5REFBd0U7QUFDeEUscURBUW1DO0FBR25DLHVFQUEyRDtBQWUzRDs7O0dBR0c7QUFDVSxRQUFBLGFBQWEsR0FBRyxLQUFNLENBQUM7QUFFcEMsS0FBSyxVQUFVLFVBQVUsQ0FDdkIsT0FBNkIsRUFDN0IsT0FBdUIsRUFDdkIsNkJBQTJFO0lBTzNFLE1BQU0sa0JBQWtCLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQztJQUU5QyxvRUFBb0U7SUFDcEUsTUFBTSxlQUFlLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUUsQ0FBQztJQUU3RSxNQUFNLEVBQUUsTUFBTSxFQUFFLFdBQVcsRUFBRSxpQkFBaUIsRUFBRSxJQUFJLEVBQUUsR0FDcEQsTUFBTSxJQUFBLG9F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O0lBQzNELE1BQU0sYUFBYSxHQUFlLEVBQUUsQ0FBQztJQUNyQyxLQUFLLE1BQU0sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsSUFBSSxLQUFLLEVBQUU7UUFDdEQsSUFBSSxJQUFJLElBQUksT0FBTyxFQUFFO1lBQ25CLGFBQWEsQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7U0FDL0M7S0FDRjtJQUVELE9BQU8sYUFBYSxDQUFDO0FBQ3ZCLENBQUM7QUFFRCxrQkFBZSxJQUFBLHlCQUFhLEVBQXVCLG1CQUFtQixDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsgQnVpbGRlckNvbnRleHQsIEJ1aWxkZXJPdXRwdXQsIGNyZWF0ZUJ1aWxkZXIgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvYXJjaGl0ZWN0JztcbmltcG9ydCB7IEVtaXR0ZWRGaWxlcywgV2VicGFja0xvZ2dpbmdDYWxsYmFjaywgcnVuV2VicGFjayB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9idWlsZC13ZWJwYWNrJztcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBPYnNlcnZhYmxlLCBjb25jYXRNYXAsIGZyb20sIG1hcCwgc3dpdGNoTWFwIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgd2VicGFjaywgeyBTdGF0c0NvbXBpbGF0aW9uIH0gZnJvbSAnd2VicGFjayc7XG5pbXBvcnQgeyBFeGVjdXRpb25UcmFuc2Zvcm1lciB9IGZyb20gJy4uLy4uL3RyYW5zZm9ybXMnO1xuaW1wb3J0IHtcbiAgZGVsZXRlT3V0cHV0RGlyLFxuICBub3JtYWxpemVBc3NldFBhdHRlcm5zLFxuICBub3JtYWxpemVPcHRpbWl6YXRpb24sXG4gIHVybEpvaW4sXG59IGZyb20gJy4uLy4uL3V0aWxzJztcbmltcG9ydCB7XG4gIEJ1ZGdldENhbGN1bGF0b3JSZXN1bHQsXG4gIFRocmVzaG9sZFNldmVyaXR5LFxuICBjaGVja0J1ZGdldHMsXG59IGZyb20gJy4uLy4uL3V0aWxzL2J1bmRsZS1jYWxjdWxhdG9yJztcbmltcG9ydCB7IGNvbG9ycyB9IGZyb20gJy4uLy4uL3V0aWxzL2NvbG9yJztcbmltcG9ydCB7IGNvcHlBc3NldHMgfSBmcm9tICcuLi8uLi91dGlscy9jb3B5LWFzc2V0cyc7XG5pbXBvcnQgeyBhc3NlcnRJc0Vycm9yIH0gZnJvbSAnLi4vLi4vdXRpbHMvZXJyb3InO1xuaW1wb3J0IHsgaTE4bklubGluZUVtaXR0ZWRGaWxlcyB9IGZyb20gJy4uLy4uL3V0aWxzL2kxOG4taW5saW5pbmcnO1xuaW1wb3J0IHsgSTE4bk9wdGlvbnMgfSBmcm9tICcuLi8uLi91dGlscy9pMThuLW9wdGlvbnMnO1xuaW1wb3J0IHsgRmlsZUluZm8gfSBmcm9tICcuLi8uLi91dGlscy9pbmRleC1maWxlL2F1Z21lbnQtaW5kZXgtaHRtbCc7XG5pbXBvcnQge1xuICBJbmRleEh0bWxHZW5lcmF0b3IsXG4gIEluZGV4SHRtbFRyYW5zZm9ybSxcbn0gZnJvbSAnLi4vLi4vdXRpbHMvaW5kZXgtZmlsZS9pbmRleC1odG1sLWdlbmVyYXRvcic7XG5pbXBvcnQgeyBub3JtYWxpemVDYWNoZU9wdGlvbnMgfSBmcm9tICcuLi8uLi91dGlscy9ub3JtYWxpemUtY2FjaGUnO1xuaW1wb3J0IHsgZW5zdXJlT3V0cHV0UGF0aHMgfSBmcm9tICcuLi8uLi91dGlscy9vdXRwdXQtcGF0aHMnO1xuaW1wb3J0IHsgZ2VuZXJhdGVFbnRyeVBvaW50cyB9IGZyb20gJy4uLy4uL3V0aWxzL3BhY2thZ2UtY2h1bmstc29ydCc7XG5pbXBvcnQgeyBwdXJnZVN0YWxlQnVpbGRDYWNoZSB9IGZyb20gJy4uLy4uL3V0aWxzL3B1cmdlLWNhY2hlJztcbmltcG9ydCB7IGF1Z21lbnRBcHBXaXRoU2VydmljZVdvcmtlciB9IGZyb20gJy4uLy4uL3V0aWxzL3NlcnZpY2Utd29ya2VyJztcbmltcG9ydCB7IFNwaW5uZXIgfSBmcm9tICcuLi8uLi91dGlscy9zcGlubmVyJztcbmltcG9ydCB7IGFzc2VydENvbXBhdGlibGVBbmd1bGFyVmVyc2lvbiB9IGZyb20gJy4uLy4uL3V0aWxzL3ZlcnNpb24nO1xuaW1wb3J0IHtcbiAgZ2VuZXJhdGVJMThuQnJvd3NlcldlYnBhY2tDb25maWdGcm9tQ29udGV4dCxcbiAgZ2V0SW5kZXhJbnB1dEZpbGUsXG4gIGdldEluZGV4T3V0cHV0RmlsZSxcbn0gZnJvbSAnLi4vLi4vdXRpbHMvd2VicGFjay1icm93c2VyLWNvbmZpZyc7XG5pbXBvcnQgeyBnZXRDb21tb25Db25maWcsIGdldFN0eWxlc0NvbmZpZyB9IGZyb20gJy4uLy4uL3dlYnBhY2svY29uZmlncyc7XG5pbXBvcnQgeyBtYXJrQXN5bmNDaHVua3NOb25Jbml0aWFsIH0gZnJvbSAnLi4vLi4vd2VicGFjay91dGlscy9hc3luYy1jaHVua3MnO1xuaW1wb3J0IHsgbm9ybWFsaXplRXh0cmFFbnRyeVBvaW50cyB9IGZyb20gJy4uLy4uL3dlYnBhY2svdXRpbHMvaGVscGVycyc7XG5pbXBvcnQge1xuICBCdWlsZEV2ZW50U3RhdHMsXG4gIGdlbmVyYXRlQnVpbGRFdmVudFN0YXRzLFxuICBzdGF0c0Vycm9yc1RvU3RyaW5nLFxuICBzdGF0c0hhc0Vycm9ycyxcbiAgc3RhdHNIYXNXYXJuaW5ncyxcbiAgc3RhdHNXYXJuaW5nc1RvU3RyaW5nLFxuICB3ZWJwYWNrU3RhdHNMb2dnZXIsXG59IGZyb20gJy4uLy4uL3dlYnBhY2svdXRpbHMvc3RhdHMnO1xuaW1wb3J0IHsgU2NoZW1hIGFzIEJyb3dzZXJCdWlsZGVyU2NoZW1hIH0gZnJvbSAnLi9zY2hlbWEnO1xuXG5pbXBvcnQgeyB3ZWJwYWNrRmFjdG9yeSB9IGZyb20gJy4vd2VicGFjay1mYWN0b3J5LWFkYXB0ZXInO1xuXG4vKipcbiAqIEBleHBlcmltZW50YWwgRGlyZWN0IHVzYWdlIG9mIHRoaXMgdHlwZSBpcyBjb25zaWRlcmVkIGV4cGVyaW1lbnRhbC5cbiAqL1xuZXhwb3J0IHR5cGUgQnJvd3NlckJ1aWxkZXJPdXRwdXQgPSBCdWlsZGVyT3V0cHV0ICYge1xuICBzdGF0czogQnVpbGRFdmVudFN0YXRzO1xuICBiYXNlT3V0cHV0UGF0aDogc3RyaW5nO1xuICBvdXRwdXRzOiB7XG4gICAgbG9jYWxlPzogc3RyaW5nO1xuICAgIHBhdGg6IHN0cmluZztcbiAgICBiYXNlSHJlZj86IHN0cmluZztcbiAgfVtdO1xufTtcblxuLyoqXG4gKiBNYXhpbXVtIHRpbWUgaW4gbWlsbGlzZWNvbmRzIGZvciBzaW5nbGUgYnVpbGQvcmVidWlsZFxuICogVGhpcyBhY2NvdW50cyBmb3IgQ0kgdmFyaWFiaWxpdHkuXG4gKi9cbmV4cG9ydCBjb25zdCBCVUlMRF9USU1FT1VUID0gMzBfMDAwO1xuXG5hc3luYyBmdW5jdGlvbiBpbml0aWFsaXplKFxuICBvcHRpb25zOiBCcm93c2VyQnVpbGRlclNjaGVtYSxcbiAgY29udGV4dDogQnVpbGRlckNvbnRleHQsXG4gIHdlYnBhY2tDb25maWd1cmF0aW9uVHJhbnNmb3JtPzogRXhlY3V0aW9uVHJhbnNmb3JtZXI8d2VicGFjay5Db25maWd1cmF0aW9uPixcbik6IFByb21pc2U8e1xuICBjb25maWc6IHdlYnBhY2suQ29uZmlndXJhdGlvbjtcbiAgcHJvamVjdFJvb3Q6IHN0cmluZztcbiAgcHJvamVjdFNvdXJjZVJvb3Q/OiBzdHJpbmc7XG4gIGkxOG46IEkxOG5PcHRpb25zO1xufT4ge1xuICBjb25zdCBvcmlnaW5hbE91dHB1dFBhdGggPSBvcHRpb25zLm91dHB1dFBhdGg7XG5cbiAgLy8gQXNzZXRzIGFyZSBwcm9jZXNzZWQgZGlyZWN0bHkgYnkgdGhlIGJ1aWxkZXIgZXhjZXB0IHdoZW4gd2F0Y2hpbmdcbiAgY29uc3QgYWRqdXN0ZWRPcHRpb25zID0gb3B0aW9ucy53YXRjaCA/IG9wdGlvbnMgOiB7IC4uLm9wdGlvbnMsIGFzc2V0czogW10gfTtcblxuICBjb25zdCB7IGNvbmZpZywgcHJvamVjdFJvb3QsIHByb2plY3RTb3VyY2VSb290LCBpMThuIH0gPVxuICAgIGF3YWl0IGdlbmVyYXRlSTE4bkJyb3dzZXJXZWJwYWNrQ29uZmlnRnJvbUNvbnRleHQoYWRqdXN0ZWRPcHRpb25zLCBjb250ZXh0LCAod2NvKSA9PiBbXG4gICAgICBnZXRDb21tb25Db25maWcoT2JqZWN0LmFzc2lnbih3Y28sIHsgaXNSc1BhY2s6IHRydWUgfSkpLFxuICAgICAgZ2V0U3R5bGVzQ29uZmlnKHdjbyksXG4gICAgXSk7XG5cbiAgbGV0IHRyYW5zZm9ybWVkQ29uZmlnO1xuICBpZiAod2VicGFja0NvbmZpZ3VyYXRpb25UcmFuc2Zvcm0pIHtcbiAgICB0cmFuc2Zvcm1lZENvbmZpZyA9IGF3YWl0IHdlYnBhY2tDb25maWd1cmF0aW9uVHJhbnNmb3JtKGNvbmZpZyk7XG4gIH1cblxuICBpZiAob3B0aW9ucy5kZWxldGVPdXRwdXRQYXRoKSB7XG4gICAgZGVsZXRlT3V0cHV0RGlyKGNvbnRleHQud29ya3NwYWNlUm9vdCwgb3JpZ2luYWxPdXRwdXRQYXRoKTtcbiAgfVxuXG4gIHJldHVybiB7IGNvbmZpZzogdHJhbnNmb3JtZWRDb25maWcgfHwgY29uZmlnLCBwcm9qZWN0Um9vdCwgcHJvamVjdFNvdXJjZVJvb3QsIGkxOG4gfTtcbn1cblxuLyoqXG4gKiBAZXhwZXJpbWVudGFsIERpcmVjdCB1c2FnZSBvZiB0aGlzIGZ1bmN0aW9uIGlzIGNvbnNpZGVyZWQgZXhwZXJpbWVudGFsLlxuICovXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbWF4LWxpbmVzLXBlci1mdW5jdGlvblxuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkV2VicGFja0Jyb3dzZXIoXG4gIG9wdGlvbnM6IEJyb3dzZXJCdWlsZGVyU2NoZW1hLFxuICBjb250ZXh0OiBCdWlsZGVyQ29udGV4dCxcbiAgdHJhbnNmb3Jtczoge1xuICAgIHdlYnBhY2tDb25maWd1cmF0aW9uPzogRXhlY3V0aW9uVHJhbnNmb3JtZXI8d2VicGFjay5Db25maWd1cmF0aW9uPjtcbiAgICBsb2dnaW5nPzogV2VicGFja0xvZ2dpbmdDYWxsYmFjaztcbiAgICBpbmRleEh0bWw/OiBJbmRleEh0bWxUcmFuc2Zvcm07XG4gIH0gPSB7fSxcbik6IE9ic2VydmFibGU8QnJvd3NlckJ1aWxkZXJPdXRwdXQ+IHtcbiAgY29uc3QgcHJvamVjdE5hbWUgPSBjb250ZXh0LnRhcmdldD8ucHJvamVjdDtcbiAgaWYgKCFwcm9qZWN0TmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcignVGhlIGJ1aWxkZXIgcmVxdWlyZXMgYSB0YXJnZXQuJyk7XG4gIH1cblxuICBjb25zdCBiYXNlT3V0cHV0UGF0aCA9IHBhdGgucmVzb2x2ZShjb250ZXh0LndvcmtzcGFjZVJvb3QsIG9wdGlvbnMub3V0cHV0UGF0aCk7XG4gIGxldCBvdXRwdXRQYXRoczogdW5kZWZpbmVkIHwgTWFwPHN0cmluZywgc3RyaW5nPjtcblxuICAvLyBDaGVjayBBbmd1bGFyIHZlcnNpb24uXG4gIGFzc2VydENvbXBhdGlibGVBbmd1bGFyVmVyc2lvbihjb250ZXh0LndvcmtzcGFjZVJvb3QpO1xuXG4gIHJldHVybiBmcm9tKGNvbnRleHQuZ2V0UHJvamVjdE1ldGFkYXRhKHByb2plY3ROYW1lKSkucGlwZShcbiAgICBzd2l0Y2hNYXAoYXN5bmMgKHByb2plY3RNZXRhZGF0YSkgPT4ge1xuICAgICAgLy8gUHVyZ2Ugb2xkIGJ1aWxkIGRpc2sgY2FjaGUuXG4gICAgICBhd2FpdCBwdXJnZVN0YWxlQnVpbGRDYWNoZShjb250ZXh0KTtcblxuICAgICAgLy8gSW5pdGlhbGl6ZSBidWlsZGVyXG4gICAgICBjb25zdCBpbml0aWFsaXphdGlvbiA9IGF3YWl0IGluaXRpYWxpemUob3B0aW9ucywgY29udGV4dCwgdHJhbnNmb3Jtcy53ZWJwYWNrQ29uZmlndXJhdGlvbik7XG5cbiAgICAgIC8vIEFkZCBpbmRleCBmaWxlIHRvIHdhdGNoZWQgZmlsZXMuXG4gICAgICBpZiAob3B0aW9ucy53YXRjaCkge1xuICAgICAgICBjb25zdCBpbmRleElucHV0RmlsZSA9IHBhdGguam9pbihjb250ZXh0LndvcmtzcGFjZVJvb3QsIGdldEluZGV4SW5wdXRGaWxlKG9wdGlvbnMuaW5kZXgpKTtcbiAgICAgICAgaW5pdGlhbGl6YXRpb24uY29uZmlnLnBsdWdpbnMgPz89IFtdO1xuICAgICAgICBpbml0aWFsaXphdGlvbi5jb25maWcucGx1Z2lucy5wdXNoKHtcbiAgICAgICAgICBhcHBseTogKGNvbXBpbGVyOiB3ZWJwYWNrLkNvbXBpbGVyKSA9PiB7XG4gICAgICAgICAgICBjb21waWxlci5ob29rcy50aGlzQ29tcGlsYXRpb24udGFwKCdidWlsZC1hbmd1bGFyJywgKGNvbXBpbGF0aW9uKSA9PiB7XG4gICAgICAgICAgICAgIGNvbXBpbGF0aW9uLmZpbGVEZXBlbmRlbmNpZXMuYWRkKGluZGV4SW5wdXRGaWxlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4ge1xuICAgICAgICAuLi5pbml0aWFsaXphdGlvbixcbiAgICAgICAgY2FjaGVPcHRpb25zOiBub3JtYWxpemVDYWNoZU9wdGlvbnMocHJvamVjdE1ldGFkYXRhLCBjb250ZXh0LndvcmtzcGFjZVJvb3QpLFxuICAgICAgfTtcbiAgICB9KSxcbiAgICBzd2l0Y2hNYXAoXG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbWF4LWxpbmVzLXBlci1mdW5jdGlvblxuICAgICAgKHsgY29uZmlnLCBwcm9qZWN0Um9vdCwgcHJvamVjdFNvdXJjZVJvb3QsIGkxOG4sIGNhY2hlT3B0aW9ucyB9KSA9PiB7XG4gICAgICAgIGNvbnN0IG5vcm1hbGl6ZWRPcHRpbWl6YXRpb24gPSBub3JtYWxpemVPcHRpbWl6YXRpb24ob3B0aW9ucy5vcHRpbWl6YXRpb24pO1xuXG4gICAgICAgIHJldHVybiBydW5XZWJwYWNrKGNvbmZpZywgY29udGV4dCwge1xuICAgICAgICAgIC8vIHdlYnBhY2tGYWN0b3J5OiByZXF1aXJlKCd3ZWJwYWNrJykgYXMgdHlwZW9mIHdlYnBhY2ssXG4gICAgICAgICAgd2VicGFja0ZhY3Rvcnk6IHdlYnBhY2tGYWN0b3J5IGFzIHVua25vd24gYXMgdHlwZW9mIHdlYnBhY2ssXG4gICAgICAgICAgbG9nZ2luZzpcbiAgICAgICAgICAgIHRyYW5zZm9ybXMubG9nZ2luZyB8fFxuICAgICAgICAgICAgKChzdGF0cywgY29uZmlnKSA9PiB7XG4gICAgICAgICAgICAgIGlmIChvcHRpb25zLnZlcmJvc2UpIHtcbiAgICAgICAgICAgICAgICBjb250ZXh0LmxvZ2dlci5pbmZvKHN0YXRzLnRvU3RyaW5nKGNvbmZpZy5zdGF0cykpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgfSkucGlwZShcbiAgICAgICAgICBjb25jYXRNYXAoXG4gICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbWF4LWxpbmVzLXBlci1mdW5jdGlvblxuICAgICAgICAgICAgYXN5bmMgKFxuICAgICAgICAgICAgICBidWlsZEV2ZW50LFxuICAgICAgICAgICAgKTogUHJvbWlzZTx7IG91dHB1dDogQnVpbGRlck91dHB1dDsgd2VicGFja1N0YXRzOiBTdGF0c0NvbXBpbGF0aW9uIH0+ID0+IHtcbiAgICAgICAgICAgICAgY29uc3Qgc3Bpbm5lciA9IG5ldyBTcGlubmVyKCk7XG4gICAgICAgICAgICAgIHNwaW5uZXIuZW5hYmxlZCA9IG9wdGlvbnMucHJvZ3Jlc3MgIT09IGZhbHNlO1xuXG4gICAgICAgICAgICAgIGNvbnN0IHsgc3VjY2VzcywgZW1pdHRlZEZpbGVzID0gW10sIG91dHB1dFBhdGg6IHdlYnBhY2tPdXRwdXRQYXRoIH0gPSBidWlsZEV2ZW50O1xuICAgICAgICAgICAgICBjb25zdCB3ZWJwYWNrUmF3U3RhdHMgPSBidWlsZEV2ZW50LndlYnBhY2tTdGF0cztcbiAgICAgICAgICAgICAgaWYgKCF3ZWJwYWNrUmF3U3RhdHMpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1dlYnBhY2sgc3RhdHMgYnVpbGQgcmVzdWx0IGlzIHJlcXVpcmVkLicpO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgLy8gRml4IGluY29ycmVjdGx5IHNldCBgaW5pdGlhbGAgdmFsdWUgb24gY2h1bmtzLlxuICAgICAgICAgICAgICBjb25zdCBleHRyYUVudHJ5UG9pbnRzID0gW1xuICAgICAgICAgICAgICAgIC4uLm5vcm1hbGl6ZUV4dHJhRW50cnlQb2ludHMob3B0aW9ucy5zdHlsZXMgfHwgW10sICdzdHlsZXMnKSxcbiAgICAgICAgICAgICAgICAuLi5ub3JtYWxpemVFeHRyYUVudHJ5UG9pbnRzKG9wdGlvbnMuc2NyaXB0cyB8fCBbXSwgJ3NjcmlwdHMnKSxcbiAgICAgICAgICAgICAgXTtcblxuICAgICAgICAgICAgICBjb25zdCB3ZWJwYWNrU3RhdHMgPSB7XG4gICAgICAgICAgICAgICAgLi4ud2VicGFja1Jhd1N0YXRzLFxuICAgICAgICAgICAgICAgIGNodW5rczogbWFya0FzeW5jQ2h1bmtzTm9uSW5pdGlhbCh3ZWJwYWNrUmF3U3RhdHMsIGV4dHJhRW50cnlQb2ludHMpLFxuICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgIGlmICghc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgIC8vIElmIHVzaW5nIGJ1bmRsZSBkb3dubGV2ZWxpbmcgdGhlbiB0aGVyZSBpcyBvbmx5IG9uZSBidWlsZFxuICAgICAgICAgICAgICAgIC8vIElmIGl0IGZhaWxzIHNob3cgYW55IGRpYWdub3N0aWMgbWVzc2FnZXMgYW5kIGJhaWxcbiAgICAgICAgICAgICAgICBpZiAoc3RhdHNIYXNXYXJuaW5ncyh3ZWJwYWNrU3RhdHMpKSB7XG4gICAgICAgICAgICAgICAgICBjb250ZXh0LmxvZ2dlci53YXJuKHN0YXRzV2FybmluZ3NUb1N0cmluZyh3ZWJwYWNrU3RhdHMsIHsgY29sb3JzOiB0cnVlIH0pKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHN0YXRzSGFzRXJyb3JzKHdlYnBhY2tTdGF0cykpIHtcbiAgICAgICAgICAgICAgICAgIGNvbnRleHQubG9nZ2VyLmVycm9yKHN0YXRzRXJyb3JzVG9TdHJpbmcod2VicGFja1N0YXRzLCB7IGNvbG9yczogdHJ1ZSB9KSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgIHdlYnBhY2tTdGF0czogd2VicGFja1Jhd1N0YXRzLFxuICAgICAgICAgICAgICAgICAgb3V0cHV0OiB7IHN1Y2Nlc3M6IGZhbHNlIH0sXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBvdXRwdXRQYXRocyA9IGVuc3VyZU91dHB1dFBhdGhzKGJhc2VPdXRwdXRQYXRoLCBpMThuKTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHNjcmlwdHNFbnRyeVBvaW50TmFtZSA9IG5vcm1hbGl6ZUV4dHJhRW50cnlQb2ludHMoXG4gICAgICAgICAgICAgICAgICBvcHRpb25zLnNjcmlwdHMgfHwgW10sXG4gICAgICAgICAgICAgICAgICAnc2NyaXB0cycsXG4gICAgICAgICAgICAgICAgKS5tYXAoKHgpID0+IHguYnVuZGxlTmFtZSk7XG5cbiAgICAgICAgICAgICAgICBpZiAoaTE4bi5zaG91bGRJbmxpbmUpIHtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IHN1Y2Nlc3MgPSBhd2FpdCBpMThuSW5saW5lRW1pdHRlZEZpbGVzKFxuICAgICAgICAgICAgICAgICAgICBjb250ZXh0LFxuICAgICAgICAgICAgICAgICAgICBlbWl0dGVkRmlsZXMsXG4gICAgICAgICAgICAgICAgICAgIGkxOG4sXG4gICAgICAgICAgICAgICAgICAgIGJhc2VPdXRwdXRQYXRoLFxuICAgICAgICAgICAgICAgICAgICBBcnJheS5mcm9tKG91dHB1dFBhdGhzLnZhbHVlcygpKSxcbiAgICAgICAgICAgICAgICAgICAgc2NyaXB0c0VudHJ5UG9pbnROYW1lLFxuICAgICAgICAgICAgICAgICAgICB3ZWJwYWNrT3V0cHV0UGF0aCxcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5pMThuTWlzc2luZ1RyYW5zbGF0aW9uLFxuICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgIGlmICghc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgIHdlYnBhY2tTdGF0czogd2VicGFja1Jhd1N0YXRzLFxuICAgICAgICAgICAgICAgICAgICAgIG91dHB1dDogeyBzdWNjZXNzOiBmYWxzZSB9LFxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIENoZWNrIGZvciBidWRnZXQgZXJyb3JzIGFuZCBkaXNwbGF5IHRoZW0gdG8gdGhlIHVzZXIuXG4gICAgICAgICAgICAgICAgY29uc3QgYnVkZ2V0cyA9IG9wdGlvbnMuYnVkZ2V0cztcbiAgICAgICAgICAgICAgICBsZXQgYnVkZ2V0RmFpbHVyZXM6IEJ1ZGdldENhbGN1bGF0b3JSZXN1bHRbXSB8IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICBpZiAoYnVkZ2V0cz8ubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICBidWRnZXRGYWlsdXJlcyA9IFsuLi5jaGVja0J1ZGdldHMoYnVkZ2V0cywgd2VicGFja1N0YXRzKV07XG4gICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHsgc2V2ZXJpdHksIG1lc3NhZ2UgfSBvZiBidWRnZXRGYWlsdXJlcykge1xuICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKHNldmVyaXR5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgY2FzZSBUaHJlc2hvbGRTZXZlcml0eS5XYXJuaW5nOlxuICAgICAgICAgICAgICAgICAgICAgICAgd2VicGFja1N0YXRzLndhcm5pbmdzPy5wdXNoKHsgbWVzc2FnZSB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgIGNhc2UgVGhyZXNob2xkU2V2ZXJpdHkuRXJyb3I6XG4gICAgICAgICAgICAgICAgICAgICAgICB3ZWJwYWNrU3RhdHMuZXJyb3JzPy5wdXNoKHsgbWVzc2FnZSB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICBhc3NlcnROZXZlcihzZXZlcml0eSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb25zdCBidWlsZFN1Y2Nlc3MgPSBzdWNjZXNzICYmICFzdGF0c0hhc0Vycm9ycyh3ZWJwYWNrU3RhdHMpO1xuICAgICAgICAgICAgICAgIGlmIChidWlsZFN1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgICAgIC8vIENvcHkgYXNzZXRzXG4gICAgICAgICAgICAgICAgICBpZiAoIW9wdGlvbnMud2F0Y2ggJiYgb3B0aW9ucy5hc3NldHM/Lmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICBzcGlubmVyLnN0YXJ0KCdDb3B5aW5nIGFzc2V0cy4uLicpO1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IGNvcHlBc3NldHMoXG4gICAgICAgICAgICAgICAgICAgICAgICBub3JtYWxpemVBc3NldFBhdHRlcm5zKFxuICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25zLmFzc2V0cyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGV4dC53b3Jrc3BhY2VSb290LFxuICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9qZWN0Um9vdCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvamVjdFNvdXJjZVJvb3QsXG4gICAgICAgICAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgICAgICAgICAgICAgQXJyYXkuZnJvbShvdXRwdXRQYXRocy52YWx1ZXMoKSksXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZXh0LndvcmtzcGFjZVJvb3QsXG4gICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICBzcGlubmVyLnN1Y2NlZWQoJ0NvcHlpbmcgYXNzZXRzIGNvbXBsZXRlLicpO1xuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICBzcGlubmVyLmZhaWwoY29sb3JzLnJlZEJyaWdodCgnQ29weWluZyBvZiBhc3NldHMgZmFpbGVkLicpKTtcbiAgICAgICAgICAgICAgICAgICAgICBhc3NlcnRJc0Vycm9yKGVycik7XG5cbiAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogJ1VuYWJsZSB0byBjb3B5IGFzc2V0czogJyArIGVyci5tZXNzYWdlLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHdlYnBhY2tTdGF0czogd2VicGFja1Jhd1N0YXRzLFxuICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMuaW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgc3Bpbm5lci5zdGFydCgnR2VuZXJhdGluZyBpbmRleCBodG1sLi4uJyk7XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZW50cnlwb2ludHMgPSBnZW5lcmF0ZUVudHJ5UG9pbnRzKHtcbiAgICAgICAgICAgICAgICAgICAgICBzY3JpcHRzOiBvcHRpb25zLnNjcmlwdHMgPz8gW10sXG4gICAgICAgICAgICAgICAgICAgICAgc3R5bGVzOiBvcHRpb25zLnN0eWxlcyA/PyBbXSxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaW5kZXhIdG1sR2VuZXJhdG9yID0gbmV3IEluZGV4SHRtbEdlbmVyYXRvcih7XG4gICAgICAgICAgICAgICAgICAgICAgY2FjaGU6IGNhY2hlT3B0aW9ucyxcbiAgICAgICAgICAgICAgICAgICAgICBpbmRleFBhdGg6IHBhdGguam9pbihjb250ZXh0LndvcmtzcGFjZVJvb3QsIGdldEluZGV4SW5wdXRGaWxlKG9wdGlvbnMuaW5kZXgpKSxcbiAgICAgICAgICAgICAgICAgICAgICBlbnRyeXBvaW50cyxcbiAgICAgICAgICAgICAgICAgICAgICBkZXBsb3lVcmw6IG9wdGlvbnMuZGVwbG95VXJsLFxuICAgICAgICAgICAgICAgICAgICAgIHNyaTogb3B0aW9ucy5zdWJyZXNvdXJjZUludGVncml0eSxcbiAgICAgICAgICAgICAgICAgICAgICBvcHRpbWl6YXRpb246IG5vcm1hbGl6ZWRPcHRpbWl6YXRpb24sXG4gICAgICAgICAgICAgICAgICAgICAgY3Jvc3NPcmlnaW46IG9wdGlvbnMuY3Jvc3NPcmlnaW4sXG4gICAgICAgICAgICAgICAgICAgICAgcG9zdFRyYW5zZm9ybTogdHJhbnNmb3Jtcy5pbmRleEh0bWwsXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIGxldCBoYXNFcnJvcnMgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBbbG9jYWxlLCBvdXRwdXRQYXRoXSBvZiBvdXRwdXRQYXRocy5lbnRyaWVzKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgeyBjb250ZW50LCB3YXJuaW5ncywgZXJyb3JzIH0gPSBhd2FpdCBpbmRleEh0bWxHZW5lcmF0b3IucHJvY2Vzcyh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGJhc2VIcmVmOiBnZXRMb2NhbGVCYXNlSHJlZihpMThuLCBsb2NhbGUpID8/IG9wdGlvbnMuYmFzZUhyZWYsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGkxOG5Mb2NhbGUgaXMgdXNlZCB3aGVuIEl2eSBpcyBkaXNhYmxlZFxuICAgICAgICAgICAgICAgICAgICAgICAgICBsYW5nOiBsb2NhbGUgfHwgdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBvdXRwdXRQYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlczogbWFwRW1pdHRlZEZpbGVzVG9GaWxlSW5mbyhlbWl0dGVkRmlsZXMpLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh3YXJuaW5ncy5sZW5ndGggfHwgZXJyb3JzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBzcGlubmVyLnN0b3AoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgd2FybmluZ3MuZm9yRWFjaCgobSkgPT4gY29udGV4dC5sb2dnZXIud2FybihtKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9ycy5mb3JFYWNoKChtKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGV4dC5sb2dnZXIuZXJyb3IobSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGFzRXJyb3JzID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHNwaW5uZXIuc3RhcnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaW5kZXhPdXRwdXQgPSBwYXRoLmpvaW4oXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dFBhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGdldEluZGV4T3V0cHV0RmlsZShvcHRpb25zLmluZGV4KSxcbiAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBmcy5wcm9taXNlcy5ta2RpcihwYXRoLmRpcm5hbWUoaW5kZXhPdXRwdXQpLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IGZzLnByb21pc2VzLndyaXRlRmlsZShpbmRleE91dHB1dCwgY29udGVudCk7XG4gICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNwaW5uZXIuZmFpbCgnSW5kZXggaHRtbCBnZW5lcmF0aW9uIGZhaWxlZC4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFzc2VydElzRXJyb3IoZXJyb3IpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICB3ZWJwYWNrU3RhdHM6IHdlYnBhY2tSYXdTdGF0cyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0OiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyb3IubWVzc2FnZSB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAoaGFzRXJyb3JzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgc3Bpbm5lci5mYWlsKCdJbmRleCBodG1sIGdlbmVyYXRpb24gZmFpbGVkLicpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdlYnBhY2tTdGF0czogd2VicGFja1Jhd1N0YXRzLFxuICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0OiB7IHN1Y2Nlc3M6IGZhbHNlIH0sXG4gICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICBzcGlubmVyLnN1Y2NlZWQoJ0luZGV4IGh0bWwgZ2VuZXJhdGlvbiBjb21wbGV0ZS4nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5zZXJ2aWNlV29ya2VyKSB7XG4gICAgICAgICAgICAgICAgICAgIHNwaW5uZXIuc3RhcnQoJ0dlbmVyYXRpbmcgc2VydmljZSB3b3JrZXIuLi4nKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBbbG9jYWxlLCBvdXRwdXRQYXRoXSBvZiBvdXRwdXRQYXRocy5lbnRyaWVzKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgYXVnbWVudEFwcFdpdGhTZXJ2aWNlV29ya2VyKFxuICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9qZWN0Um9vdCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGV4dC53b3Jrc3BhY2VSb290LFxuICAgICAgICAgICAgICAgICAgICAgICAgICBvdXRwdXRQYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBnZXRMb2NhbGVCYXNlSHJlZihpMThuLCBsb2NhbGUpID8/IG9wdGlvbnMuYmFzZUhyZWYgPz8gJy8nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25zLm5nc3dDb25maWdQYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3Bpbm5lci5mYWlsKCdTZXJ2aWNlIHdvcmtlciBnZW5lcmF0aW9uIGZhaWxlZC4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFzc2VydElzRXJyb3IoZXJyb3IpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICB3ZWJwYWNrU3RhdHM6IHdlYnBhY2tSYXdTdGF0cyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0OiB7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyb3IubWVzc2FnZSB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBzcGlubmVyLnN1Y2NlZWQoJ1NlcnZpY2Ugd29ya2VyIGdlbmVyYXRpb24gY29tcGxldGUuJyk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgd2VicGFja1N0YXRzTG9nZ2VyKGNvbnRleHQubG9nZ2VyLCB3ZWJwYWNrU3RhdHMsIGNvbmZpZywgYnVkZ2V0RmFpbHVyZXMpO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgIHdlYnBhY2tTdGF0czogd2VicGFja1Jhd1N0YXRzLFxuICAgICAgICAgICAgICAgICAgb3V0cHV0OiB7IHN1Y2Nlc3M6IGJ1aWxkU3VjY2VzcyB9LFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgKSxcbiAgICAgICAgICBtYXAoXG4gICAgICAgICAgICAoeyBvdXRwdXQ6IGV2ZW50LCB3ZWJwYWNrU3RhdHMgfSkgPT5cbiAgICAgICAgICAgICAgKHtcbiAgICAgICAgICAgICAgICAuLi5ldmVudCxcbiAgICAgICAgICAgICAgICBzdGF0czogZ2VuZXJhdGVCdWlsZEV2ZW50U3RhdHMod2VicGFja1N0YXRzLCBvcHRpb25zKSxcbiAgICAgICAgICAgICAgICBiYXNlT3V0cHV0UGF0aCxcbiAgICAgICAgICAgICAgICBvdXRwdXRzOiAob3V0cHV0UGF0aHMgJiZcbiAgICAgICAgICAgICAgICAgIFsuLi5vdXRwdXRQYXRocy5lbnRyaWVzKCldLm1hcCgoW2xvY2FsZSwgcGF0aF0pID0+ICh7XG4gICAgICAgICAgICAgICAgICAgIGxvY2FsZSxcbiAgICAgICAgICAgICAgICAgICAgcGF0aCxcbiAgICAgICAgICAgICAgICAgICAgYmFzZUhyZWY6IGdldExvY2FsZUJhc2VIcmVmKGkxOG4sIGxvY2FsZSkgPz8gb3B0aW9ucy5iYXNlSHJlZixcbiAgICAgICAgICAgICAgICAgIH0pKSkgfHwge1xuICAgICAgICAgICAgICAgICAgcGF0aDogYmFzZU91dHB1dFBhdGgsXG4gICAgICAgICAgICAgICAgICBiYXNlSHJlZjogb3B0aW9ucy5iYXNlSHJlZixcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB9IGFzIEJyb3dzZXJCdWlsZGVyT3V0cHV0KSxcbiAgICAgICAgICApLFxuICAgICAgICApO1xuICAgICAgfSxcbiAgICApLFxuICApO1xuXG4gIGZ1bmN0aW9uIGdldExvY2FsZUJhc2VIcmVmKGkxOG46IEkxOG5PcHRpb25zLCBsb2NhbGU6IHN0cmluZyk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gICAgaWYgKGkxOG4ubG9jYWxlc1tsb2NhbGVdICYmIGkxOG4ubG9jYWxlc1tsb2NhbGVdPy5iYXNlSHJlZiAhPT0gJycpIHtcbiAgICAgIHJldHVybiB1cmxKb2luKG9wdGlvbnMuYmFzZUhyZWYgfHwgJycsIGkxOG4ubG9jYWxlc1tsb2NhbGVdLmJhc2VIcmVmID8/IGAvJHtsb2NhbGV9L2ApO1xuICAgIH1cblxuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cbn1cblxuZnVuY3Rpb24gYXNzZXJ0TmV2ZXIoaW5wdXQ6IG5ldmVyKTogbmV2ZXIge1xuICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgYFVuZXhwZWN0ZWQgY2FsbCB0byBhc3NlcnROZXZlcigpIHdpdGggaW5wdXQ6ICR7SlNPTi5zdHJpbmdpZnkoXG4gICAgICBpbnB1dCxcbiAgICAgIG51bGwgLyogcmVwbGFjZXIgKi8sXG4gICAgICA0IC8qIHRhYlNpemUgKi8sXG4gICAgKX1gLFxuICApO1xufVxuXG5mdW5jdGlvbiBtYXBFbWl0dGVkRmlsZXNUb0ZpbGVJbmZvKGZpbGVzOiBFbWl0dGVkRmlsZXNbXSA9IFtdKTogRmlsZUluZm9bXSB7XG4gIGNvbnN0IGZpbHRlcmVkRmlsZXM6IEZpbGVJbmZvW10gPSBbXTtcbiAgZm9yIChjb25zdCB7IGZpbGUsIG5hbWUsIGV4dGVuc2lvbiwgaW5pdGlhbCB9IG9mIGZpbGVzKSB7XG4gICAgaWYgKG5hbWUgJiYgaW5pdGlhbCkge1xuICAgICAgZmlsdGVyZWRGaWxlcy5wdXNoKHsgZmlsZSwgZXh0ZW5zaW9uLCBuYW1lIH0pO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBmaWx0ZXJlZEZpbGVzO1xufVxuXG5leHBvcnQgZGVmYXVsdCBjcmVhdGVCdWlsZGVyPEJyb3dzZXJCdWlsZGVyU2NoZW1hPihidWlsZFdlYnBhY2tCcm93c2VyKTtcbiJdfQ==
