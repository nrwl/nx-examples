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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCommonConfig = void 0;
const webpack_1 = require("@ngtools/webpack");
const copy_webpack_plugin_1 = __importDefault(require("copy-webpack-plugin"));
const path = __importStar(require("path"));
const webpack_2 = require("webpack");
const webpack_subresource_integrity_1 = require("webpack-subresource-integrity");
const environment_options_1 = require("../../utils/environment-options");
const load_esm_1 = require("../../utils/load-esm");
const plugins_1 = require("../plugins");
const devtools_ignore_plugin_1 = require("../plugins/devtools-ignore-plugin");
const named_chunks_plugin_1 = require("../plugins/named-chunks-plugin");
const occurrences_plugin_1 = require("../plugins/occurrences-plugin");
const progress_plugin_1 = require("../plugins/progress-plugin");
const progress_plugin_2 = require("../../builders/browser-rspack/plugins/progress-plugin");
const transfer_size_plugin_1 = require("../plugins/transfer-size-plugin");
const typescript_1 = require("../plugins/typescript");
const watch_files_logs_plugin_1 = require("../plugins/watch-files-logs-plugin");
const helpers_1 = require("../utils/helpers");
const VENDORS_TEST = /[\\/]node_modules[\\/]/;
// eslint-disable-next-line max-lines-per-function
async function getCommonConfig(wco) {
    const { root, projectRoot, buildOptions, tsConfig, projectName, sourceRoot, tsConfigPath } = wco;
    const { cache, codeCoverage, crossOrigin = 'none', platform = 'browser', aot = true, codeCoverageExclude = [], main, sourceMap: { styles: stylesSourceMap, scripts: scriptsSourceMap, vendor: vendorSourceMap, hidden: hiddenSourceMap, }, optimization: { styles: stylesOptimization, scripts: scriptsOptimization }, commonChunk, vendorChunk, subresourceIntegrity, verbose, poll, webWorkerTsConfig, externalDependencies = [], allowedCommonJsDependencies, } = buildOptions;
    const isPlatformServer = buildOptions.platform === 'server';
    const extraPlugins = [];
    const extraRules = [];
    const entryPoints = {};
    // Load ESM `@angular/compiler-cli` using the TypeScript dynamic import workaround.
    // Once TypeScript provides support for keeping the dynamic import this workaround can be
    // changed to a direct dynamic import.
    const { GLOBAL_DEFS_FOR_TERSER, GLOBAL_DEFS_FOR_TERSER_WITH_AOT, VERSION: NG_VERSION, } = await (0, load_esm_1.loadEsmModule)('@angular/compiler-cli');
    // determine hashing format
    const hashFormat = (0, helpers_1.getOutputHashFormat)(buildOptions.outputHashing);
    if (buildOptions.progress) {
        extraPlugins.push(wco.isRspack
            ? new progress_plugin_2.ProgressPlugin(platform)
            : new progress_plugin_1.ProgressPlugin(platform));
    }
    const localizePackageInitEntryPoint = '@angular/localize/init';
    const hasLocalizeType = tsConfig.options.types?.some((t) => t === '@angular/localize' || t === localizePackageInitEntryPoint);
    if (hasLocalizeType) {
        entryPoints['main'] = [localizePackageInitEntryPoint];
    }
    if (buildOptions.main) {
        const mainPath = path.resolve(root, buildOptions.main);
        if (Array.isArray(entryPoints['main'])) {
            entryPoints['main'].push(mainPath);
        }
        else {
            entryPoints['main'] = [mainPath];
        }
    }
    if (isPlatformServer) {
        // Fixes Critical dependency: the request of a dependency is an expression
        extraPlugins.push(new webpack_2.ContextReplacementPlugin(/@?hapi|express[\\/]/));
        if ((0, helpers_1.isPlatformServerInstalled)(wco.root) && Array.isArray(entryPoints['main'])) {
            // This import must come before any imports (direct or transitive) that rely on DOM built-ins being
            // available, such as `@angular/elements`.
            entryPoints['main'].unshift('@angular/platform-server/init');
        }
    }
    const polyfills = [...buildOptions.polyfills];
    if (!aot) {
        polyfills.push('@angular/compiler');
    }
    if (polyfills.length) {
        // `zone.js/testing` is a **special** polyfill because when not imported in the main it fails with the below errors:
        // `Error: Expected to be running in 'ProxyZone', but it was not found.`
        // This was also the reason why previously it was imported in `test.ts` as the first module.
        // From Jia li:
        // This is because the jasmine functions such as beforeEach/it will not be patched by zone.js since
        // jasmine will not be loaded yet, so the ProxyZone will not be there. We have to load zone-testing.js after
        // jasmine is ready.
        // We could force loading 'zone.js/testing' prior to jasmine by changing the order of scripts in 'karma-context.html'.
        // But this has it's own problems as zone.js needs to be loaded prior to jasmine due to patching of timing functions
        // See: https://github.com/jasmine/jasmine/issues/1944
        // Thus the correct order is zone.js -> jasmine -> zone.js/testing.
        const zoneTestingEntryPoint = 'zone.js/testing';
        const polyfillsExludingZoneTesting = polyfills.filter((p) => p !== zoneTestingEntryPoint);
        if (Array.isArray(entryPoints['polyfills'])) {
            entryPoints['polyfills'].push(...polyfillsExludingZoneTesting);
        }
        else {
            entryPoints['polyfills'] = polyfillsExludingZoneTesting;
        }
        if (polyfillsExludingZoneTesting.length !== polyfills.length) {
            if (Array.isArray(entryPoints['main'])) {
                entryPoints['main'].unshift(zoneTestingEntryPoint);
            }
            else {
                entryPoints['main'] = [zoneTestingEntryPoint];
            }
        }
    }
    if (allowedCommonJsDependencies) {
        // When this is not defined it means the builder doesn't support showing common js usages.
        // When it does it will be an array.
        extraPlugins.push(new plugins_1.CommonJsUsageWarnPlugin({
            allowedDependencies: allowedCommonJsDependencies,
        }));
    }
    // process global scripts
    // Add a new asset for each entry.
    for (const { bundleName, inject, paths } of (0, helpers_1.globalScriptsByBundleName)(buildOptions.scripts)) {
        // Lazy scripts don't get a hash, otherwise they can't be loaded by name.
        const hash = inject ? hashFormat.script : '';
        extraPlugins.push(new plugins_1.ScriptsWebpackPlugin({
            name: bundleName,
            sourceMap: scriptsSourceMap,
            scripts: paths,
            filename: `${path.basename(bundleName)}${hash}.js`,
            basePath: root,
        }));
    }
    // process asset entries
    if (buildOptions.assets.length) {
        extraPlugins.push(new copy_webpack_plugin_1.default({
            patterns: (0, helpers_1.assetPatterns)(root, buildOptions.assets),
        }));
    }
    if (buildOptions.extractLicenses) {
        const LicenseWebpackPlugin = require('license-webpack-plugin').LicenseWebpackPlugin;
        extraPlugins.push(new LicenseWebpackPlugin({
            stats: {
                warnings: false,
                errors: false,
            },
            perChunkOutput: false,
            outputFilename: '3rdpartylicenses.txt',
            skipChildCompilers: true,
        }));
    }
    if (scriptsSourceMap || stylesSourceMap) {
        const include = [];
        if (scriptsSourceMap) {
            include.push(/js$/);
        }
        if (stylesSourceMap) {
            include.push(/css$/);
        }
        extraPlugins.push(new devtools_ignore_plugin_1.DevToolsIgnorePlugin());
        extraPlugins.push(new webpack_2.SourceMapDevToolPlugin({
            filename: '[file].map',
            include,
            // We want to set sourceRoot to  `webpack:///` for non
            // inline sourcemaps as otherwise paths to sourcemaps will be broken in browser
            // `webpack:///` is needed for Visual Studio breakpoints to work properly as currently
            // there is no way to set the 'webRoot'
            sourceRoot: 'webpack:///',
            moduleFilenameTemplate: '[resource-path]',
            append: hiddenSourceMap ? false : undefined,
        }));
    }
    if (verbose) {
        extraPlugins.push(new watch_files_logs_plugin_1.WatchFilesLogsPlugin());
    }
    if (buildOptions.statsJson) {
        extraPlugins.push(new plugins_1.JsonStatsPlugin(path.resolve(root, buildOptions.outputPath, 'stats.json')));
    }
    if (subresourceIntegrity) {
        extraPlugins.push(new webpack_subresource_integrity_1.SubresourceIntegrityPlugin({
            hashFuncNames: ['sha384'],
        }));
    }
    if (scriptsSourceMap || stylesSourceMap) {
        extraRules.push({
            test: /\.[cm]?jsx?$/,
            enforce: 'pre',
            loader: require.resolve('source-map-loader'),
            options: {
                filterSourceMappingUrl: (_mapUri, resourcePath) => {
                    if (vendorSourceMap) {
                        // Consume all sourcemaps when vendor option is enabled.
                        return true;
                    }
                    // Don't consume sourcemaps in node_modules when vendor is disabled.
                    // But, do consume local libraries sourcemaps.
                    return !resourcePath.includes('node_modules');
                },
            },
        });
    }
    if (main || polyfills) {
        extraRules.push({
            test: tsConfig.options.allowJs ? /\.[cm]?[tj]sx?$/ : /\.[cm]?tsx?$/,
            loader: webpack_1.AngularWebpackLoaderPath,
            // The below are known paths that are not part of the TypeScript compilation even when allowJs is enabled.
            exclude: [
                /[\\/]node_modules[/\\](?:css-loader|mini-css-extract-plugin|webpack-dev-server|webpack)[/\\]/,
            ],
        });
        extraPlugins.push((0, typescript_1.createIvyPlugin)(wco, aot, tsConfigPath));
    }
    if (webWorkerTsConfig) {
        extraPlugins.push((0, typescript_1.createIvyPlugin)(wco, false, path.resolve(wco.root, webWorkerTsConfig)));
    }
    const extraMinimizers = [];
    if (scriptsOptimization) {
        extraMinimizers.push(new plugins_1.JavaScriptOptimizerPlugin({
            define: buildOptions.aot ? GLOBAL_DEFS_FOR_TERSER_WITH_AOT : GLOBAL_DEFS_FOR_TERSER,
            sourcemap: scriptsSourceMap,
            supportedBrowsers: buildOptions.supportedBrowsers,
            keepIdentifierNames: !environment_options_1.allowMangle || isPlatformServer,
            keepNames: isPlatformServer,
            removeLicenses: buildOptions.extractLicenses,
            advanced: buildOptions.buildOptimizer,
        }));
    }
    if (platform === 'browser' && (scriptsOptimization || stylesOptimization.minify)) {
        extraMinimizers.push(new transfer_size_plugin_1.TransferSizePlugin());
    }
    let crossOriginLoading = false;
    if (subresourceIntegrity && crossOrigin === 'none') {
        crossOriginLoading = 'anonymous';
    }
    else if (crossOrigin !== 'none') {
        crossOriginLoading = crossOrigin;
    }
    return {
        mode: scriptsOptimization || stylesOptimization.minify ? 'production' : 'development',
        devtool: false,
        target: [isPlatformServer ? 'node' : 'web', 'es2015'],
        profile: buildOptions.statsJson,
        resolve: {
            roots: [projectRoot],
            extensions: ['.ts', '.tsx', '.mjs', '.js'],
            symlinks: !buildOptions.preserveSymlinks,
            modules: [tsConfig.options.baseUrl || projectRoot, 'node_modules'],
            mainFields: isPlatformServer
                ? ['es2020', 'es2015', 'module', 'main']
                : ['es2020', 'es2015', 'browser', 'module', 'main'],
            conditionNames: ['es2020', 'es2015', '...'],
        },
        resolveLoader: {
            symlinks: !buildOptions.preserveSymlinks,
        },
        context: root,
        entry: entryPoints,
        externals: externalDependencies,
        output: {
            uniqueName: projectName,
            hashFunction: 'xxhash64',
            clean: buildOptions.deleteOutputPath ?? true,
            path: path.resolve(root, buildOptions.outputPath),
            publicPath: buildOptions.deployUrl ?? '',
            filename: `[name]${hashFormat.chunk}.js`,
            chunkFilename: `[name]${hashFormat.chunk}.js`,
            libraryTarget: isPlatformServer ? 'commonjs' : undefined,
            crossOriginLoading,
            trustedTypes: 'angular#bundler',
            scriptType: 'module',
        },
        watch: buildOptions.watch,
        watchOptions: {
            poll,
            // The below is needed as when preserveSymlinks is enabled we disable `resolve.symlinks`.
            followSymlinks: buildOptions.preserveSymlinks,
            ignored: poll === undefined ? undefined : '**/node_modules/**',
        },
        snapshot: {
            module: {
                // Use hash of content instead of timestamp because the timestamp of the symlink will be used
                // instead of the referenced files which causes changes in symlinks not to be picked up.
                hash: buildOptions.preserveSymlinks,
            },
        },
        performance: {
            hints: false,
        },
        ignoreWarnings: [
            // https://github.com/webpack-contrib/source-map-loader/blob/b2de4249c7431dd8432da607e08f0f65e9d64219/src/index.js#L83
            /Failed to parse source map from/,
            // https://github.com/webpack-contrib/postcss-loader/blob/bd261875fdf9c596af4ffb3a1a73fe3c549befda/src/index.js#L153-L158
            /Add postcss as project dependency/,
            // esbuild will issue a warning, while still hoists the @charset at the very top.
            // This is caused by a bug in css-loader https://github.com/webpack-contrib/css-loader/issues/1212
            /"@charset" must be the first rule in the file/,
        ],
        module: {
            // Show an error for missing exports instead of a warning.
            strictExportPresence: true,
            parser: {
                javascript: {
                    requireContext: false,
                    // Disable auto URL asset module creation. This doesn't effect `new Worker(new URL(...))`
                    // https://webpack.js.org/guides/asset-modules/#url-assets
                    url: false,
                    worker: !!webWorkerTsConfig,
                },
            },
            rules: [
                {
                    test: /\.?(svg|html)$/,
                    // Only process HTML and SVG which are known Angular component resources.
                    resourceQuery: /\?ngResource/,
                    type: 'asset/source',
                },
                {
                    // Mark files inside `rxjs/add` as containing side effects.
                    // If this is fixed upstream and the fixed version becomes the minimum
                    // supported version, this can be removed.
                    test: /[/\\]rxjs[/\\]add[/\\].+\.js$/,
                    sideEffects: true,
                },
                {
                    test: /\.[cm]?[tj]sx?$/,
                    // The below is needed due to a bug in `@babel/runtime`. See: https://github.com/babel/babel/issues/12824
                    resolve: { fullySpecified: false },
                    exclude: [
                        /[\\/]node_modules[/\\](?:core-js|@babel|tslib|web-animations-js|web-streams-polyfill|whatwg-url)[/\\]/,
                    ],
                    use: [
                        {
                            loader: require.resolve('../../babel/webpack-loader'),
                            options: {
                                cacheDirectory: (cache.enabled && path.join(cache.path, 'babel-webpack')) || false,
                                aot: buildOptions.aot,
                                optimize: buildOptions.buildOptimizer,
                                supportedBrowsers: buildOptions.supportedBrowsers,
                                instrumentCode: codeCoverage
                                    ? {
                                        includedBasePath: sourceRoot ?? projectRoot,
                                        excludedPaths: (0, helpers_1.getInstrumentationExcludedPaths)(root, codeCoverageExclude),
                                    }
                                    : undefined,
                            },
                        },
                    ],
                },
                ...extraRules,
            ],
        },
        experiments: {
            backCompat: false,
            syncWebAssembly: true,
            asyncWebAssembly: true,
        },
        infrastructureLogging: {
            debug: verbose,
            level: verbose ? 'verbose' : 'error',
        },
        stats: (0, helpers_1.getStatsOptions)(verbose),
        cache: (0, helpers_1.getCacheSettings)(wco, NG_VERSION.full),
        optimization: {
            minimizer: extraMinimizers,
            moduleIds: 'deterministic',
            chunkIds: buildOptions.namedChunks ? 'named' : 'deterministic',
            emitOnErrors: false,
            runtimeChunk: isPlatformServer ? false : 'single',
            splitChunks: {
                maxAsyncRequests: Infinity,
                cacheGroups: {
                    default: !!commonChunk && {
                        chunks: 'async',
                        minChunks: 2,
                        priority: 10,
                    },
                    common: !!commonChunk && {
                        name: 'common',
                        chunks: 'async',
                        minChunks: 2,
                        enforce: true,
                        priority: 5,
                    },
                    vendors: false,
                    defaultVendors: !!vendorChunk && {
                        name: 'vendor',
                        chunks: (chunk) => chunk.name === 'main',
                        enforce: true,
                        test: VENDORS_TEST,
                    },
                },
            },
        },
        plugins: [
            new named_chunks_plugin_1.NamedChunksPlugin(),
            new occurrences_plugin_1.OccurrencesPlugin({
                aot,
                scriptsOptimization,
            }),
            new plugins_1.DedupeModuleResolvePlugin({ verbose }),
            ...extraPlugins,
        ],
        node: false,
    };
}
exports.getCommonConfig = getCommonConfig;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvYnVpbGRfYW5ndWxhci9zcmMvd2VicGFjay9jb25maWdzL2NvbW1vbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVILDhDQUE0RDtBQUM1RCw4RUFBb0Q7QUFDcEQsMkNBQTZCO0FBQzdCLHFDQU1pQjtBQUNqQixpRkFBMkU7QUFHM0UseUVBQThEO0FBQzlELG1EQUFxRDtBQUNyRCx3Q0FNb0I7QUFDcEIsOEVBQXlFO0FBQ3pFLHdFQUFtRTtBQUNuRSxzRUFBa0U7QUFDbEUsZ0VBQXFGO0FBQ3JGLDJGQUF1RjtBQUN2RiwwRUFBcUU7QUFDckUsc0RBQXdEO0FBQ3hELGdGQUEwRTtBQUMxRSw4Q0FRMEI7QUFFMUIsTUFBTSxZQUFZLEdBQUcsd0JBQXdCLENBQUM7QUFFOUMsa0RBQWtEO0FBQzNDLEtBQUssVUFBVSxlQUFlLENBQUMsR0FBeUI7SUFDN0QsTUFBTSxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsWUFBWSxFQUFFLFFBQVEsRUFBRSxXQUFXLEVBQUUsVUFBVSxFQUFFLFlBQVksRUFBRSxHQUFHLEdBQUcsQ0FBQztJQUNqRyxNQUFNLEVBQ0osS0FBSyxFQUNMLFlBQVksRUFDWixXQUFXLEdBQUcsTUFBTSxFQUNwQixRQUFRLEdBQUcsU0FBUyxFQUNwQixHQUFHLEdBQUcsSUFBSSxFQUNWLG1CQUFtQixHQUFHLEVBQUUsRUFDeEIsSUFBSSxFQUNKLFNBQVMsRUFBRSxFQUNULE1BQU0sRUFBRSxlQUFlLEVBQ3ZCLE9BQU8sRUFBRSxnQkFBZ0IsRUFDekIsTUFBTSxFQUFFLGVBQWUsRUFDdkIsTUFBTSxFQUFFLGVBQWUsR0FDeEIsRUFDRCxZQUFZLEVBQUUsRUFBRSxNQUFNLEVBQUUsa0JBQWtCLEVBQUUsT0FB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Q0FBQyxDQUFDLENBQUMsUUFBUTtZQUNqRCxXQUFXLEVBQUU7Z0JBQ1gsZ0JBQWdCLEVBQUUsUUFBUTtnQkFDMUIsV0FBVyxFQUFFO29CQUNYLE9BQU8sRUFBRSxDQUFDLENBQUMsV0FBVyxJQUFJO3dCQUN4QixNQUFNLEVBQUUsT0FBTzt3QkFDZixTQUFTLEVBQUUsQ0FBQzt3QkFDWixRQUFRLEVBQUUsRUFBRTtxQkFDYjtvQkFDRCxNQUFNLEVBQUUsQ0FBQyxDQUFDLFdBQVcsSUFBSTt3QkFDdkIsSUFBSSxFQUFFLFFBQVE7d0JBQ2QsTUFBTSxFQUFFLE9BQU87d0JBQ2YsU0FBUyxFQUFFLENBQUM7d0JBQ1osT0FBTyxFQUFFLElBQUk7d0JBQ2IsUUFBUSxFQUFFLENBQUM7cUJBQ1o7b0JBQ0QsT0FBTyxFQUFFLEtBQUs7b0JBQ2QsY0FBYyxFQUFFLENBQUMsQ0FBQyxXQUFXLElBQUk7d0JBQy9CLElBQUksRUFBRSxRQUFRO3dCQUNkLE1BQU0sRUFBRSxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksS0FBSyxNQUFNO3dCQUN4QyxPQUFPLEVBQUUsSUFBSTt3QkFDYixJQUFJLEVBQUUsWUFBWTtxQkFDbkI7aUJBQ0Y7YUFDRjtTQUNGO1FBQ0QsT0FBTyxFQUFFO1lBQ1AsSUFBSSx1Q0FBaUIsRUFBRTtZQUN2QixJQUFJLHNDQUFpQixDQUFDO2dCQUNwQixHQUFHO2dCQUNILG1CQUFtQjthQUNwQixDQUFDO1lBQ0YsSUFBSSxtQ0FBeUIsQ0FBQyxFQUFFLE9BQU8sRUFBRSxDQUFDO1lBQzFDLEdBQUcsWUFBWTtTQUNoQjtRQUNELElBQUksRUFBRSxLQUFLO0tBQ1osQ0FBQztBQUNKLENBQUM7QUF6YkQsMENBeWJDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7IEFuZ3VsYXJXZWJwYWNrTG9hZGVyUGF0aCB9IGZyb20gJ0BuZ3Rvb2xzL3dlYnBhY2snO1xuaW1wb3J0IENvcHlXZWJwYWNrUGx1Z2luIGZyb20gJ2NvcHktd2VicGFjay1wbHVnaW4nO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7XG4gIENvbXBpbGVyLFxuICBDb25maWd1cmF0aW9uLFxuICBDb250ZXh0UmVwbGFjZW1lbnRQbHVnaW4sXG4gIFJ1bGVTZXRSdWxlLFxuICBTb3VyY2VNYXBEZXZUb29sUGx1Z2luLFxufSBmcm9tICd3ZWJwYWNrJztcbmltcG9ydCB7IFN1YnJlc291cmNlSW50ZWdyaXR5UGx1Z2luIH0gZnJvbSAnd2VicGFjay1zdWJyZXNvdXJjZS1pbnRlZ3JpdHknO1xuaW1wb3J0IHsgQW5ndWxhckJhYmVsTG9hZGVyT3B0aW9ucyB9IGZyb20gJy4uLy4uL2JhYmVsL3dlYnBhY2stbG9hZGVyJztcbmltcG9ydCB7IFdlYnBhY2tDb25maWdPcHRpb25zIH0gZnJvbSAnLi4vLi4vdXRpbHMvYnVpbGQtb3B0aW9ucyc7XG5pbXBvcnQgeyBhbGxvd01hbmdsZSB9IGZyb20gJy4uLy4uL3V0aWxzL2Vudmlyb25tZW50LW9wdGlvbnMnO1xuaW1wb3J0IHsgbG9hZEVzbU1vZHVsZSB9IGZyb20gJy4uLy4uL3V0aWxzL2xvYWQtZXNtJztcbmltcG9ydCB7XG4gIENvbW1vbkpzVXNhZ2VXYXJuUGx1Z2luLFxuICBEZWR1cGVNb2R1bGVSZXNvbHZlUGx1Z2luLFxuICBKYXZhU2NyaXB0T3B0aW1pemVyUGx1Z2luLFxuICBKc29uU3RhdHNQbHVnaW4sXG4gIFNjcmlwdHNXZWJwYWNrUGx1Z2luLFxufSBmcm9tICcuLi9wbHVnaW5zJztcbmltcG9ydCB7IERldlRvb2xzSWdub3JlUGx1Z2luIH0gZnJvbSAnLi4vcGx1Z2lucy9kZXZ0b29scy1pZ25vcmUtcGx1Z2luJztcbmltcG9ydCB7IE5hbWVkQ2h1bmtzUGx1Z2luIH0gZnJvbSAnLi4vcGx1Z2lucy9uYW1lZC1jaHVua3MtcGx1Z2luJztcbmltcG9ydCB7IE9jY3VycmVuY2VzUGx1Z2luIH0gZnJvbSAnLi4vcGx1Z2lucy9vY2N1cnJlbmNlcy1wbHVnaW4nO1xuaW1wb3J0IHsgUHJvZ3Jlc3NQbHVnaW4gYXMgV2VicGFja1Byb2dyZXNzUGx1Z2luIH0gZnJvbSAnLi4vcGx1Z2lucy9wcm9ncmVzcy1wbHVnaW4nO1xuaW1wb3J0IHsgUHJvZ3Jlc3NQbHVnaW4gfSBmcm9tICcuLi8uLi9idWlsZGVycy9icm93c2VyLXJzcGFjay9wbHVnaW5zL3Byb2dyZXNzLXBsdWdpbic7XG5pbXBvcnQgeyBUcmFuc2ZlclNpemVQbHVnaW4gfSBmcm9tICcuLi9wbHVnaW5zL3RyYW5zZmVyLXNpemUtcGx1Z2luJztcbmltcG9ydCB7IGNyZWF0ZUl2eVBsdWdpbiB9IGZyb20gJy4uL3BsdWdpbnMvdHlwZXNjcmlwdCc7XG5pbXBvcnQgeyBXYXRjaEZpbGVzTG9nc1BsdWdpbiB9IGZyb20gJy4uL3BsdWdpbnMvd2F0Y2gtZmlsZXMtbG9ncy1wbHVnaW4nO1xuaW1wb3J0IHtcbiAgYXNzZXRQYXR0ZXJucyxcbiAgZ2V0Q2FjaGVTZXR0aW5ncyxcbiAgZ2V0SW5zdHJ1bWVudGF0aW9uRXhjbHVkZWRQYXRocyxcbiAgZ2V0T3V0cHV0SGFzaEZvcm1hdCxcbiAgZ2V0U3RhdHNPcHRpb25zLFxuICBnbG9iYWxTY3JpcHRzQnlCdW5kbGVOYW1lLFxuICBpc1BsYXRmb3JtU2VydmVySW5zdGFsbGVkLFxufSBmcm9tICcuLi91dGlscy9oZWxwZXJzJztcblxuY29uc3QgVkVORE9SU19URVNUID0gL1tcXFxcL11ub2RlX21vZHVsZXNbXFxcXC9dLztcblxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG1heC1saW5lcy1wZXItZnVuY3Rpb25cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRDb21tb25Db25maWcod2NvOiBXZWJwYWNrQ29uZmlnT3B0aW9ucyk6IFByb21pc2U8Q29uZmlndXJhdGlvbj4ge1xuICBjb25zdCB7IHJvb3QsIHByb2plY3RSb290LCBidWlsZE9wdGlvbnMsIHRzQ29uZmlnLCBwcm9qZWN0TmFtZSwgc291cmNlUm9vdCwgdHNDb25maWdQYXRoIH0gPSB3Y287XG4gIGNvbnN0IHtcbiAgICBjYWNoZSxcbiAgICBjb2RlQ292ZXJhZ2UsXG4gICAgY3Jvc3NPcmlnaW4gPSAnbm9uZScsXG4gICAgcGxhdGZvcm0gPSAnYnJvd3NlcicsXG4gICAgYW90ID0gdHJ1ZSxcbiAgICBjb2RlQ292ZXJhZ2VFeGNsdWRlID0gW10sXG4gICAgbWFpbixcbiAgICBzb3VyY2VNYXA6IHtcbiAgICAgIHN0eWxlczogc3R5bGVzU291cmNlTWFwLFxuICAgICAgc2NyaXB0czogc2NyaXB0c1NvdXJjZU1hcCxcbiAgICAgIHZlbmRvcjogdmVuZG9yU291cmNlTWFwLFxuICAgICAgaGlkZGVuOiBoaWRkZW5Tb3VyY2VNYXAsXG4gICAgfSxcbiAgICBvcHRpbWl6YXRpb246IHsgc3R5bGVzOiBzdHlsZXNPcHRpbWl6YXRpb24sIHNjcmlwdHM6IHNjcmlwdHNPcHRpbWl6YXRpb24gfSxcbiAgICBjb21tb25DaHVuayxcbiAgICB2ZW5kb3JDaHVuayxcbiAgICBzdWJyZXNvdXJjZUludGVncml0eSxcbiAgICB2ZXJib3NlLFxuICAgIHBvbGwsXG4gICAgd2ViV29ya2VyVHNDb25maWcsXG4gICAgZXh0ZXJuYWxEZXBlbmRlbmNpZXMgPSBbXSxcbiAgICBhbGxvd2VkQ29tbW9uSnNEZXBlbmRlbmNpZXMsXG4gIH0gPSBidWlsZE9wdGlvbnM7XG5cbiAgY29uc3QgaXNQbGF0Zm9ybVNlcnZlciA9IGJ1aWxkT3B0aW9ucy5wbGF0Zm9ybSA9PT0gJ3NlcnZlcic7XG4gIGNvbnN0IGV4dHJhUGx1Z2luczogeyBhcHBseShjb21waWxlcjogQ29tcGlsZXIpOiB2b2lkIH1bXSA9IFtdO1xuICBjb25zdCBleHRyYVJ1bGVzOiBSdWxlU2V0UnVsZVtdID0gW107XG4gIGNvbnN0IGVudHJ5UG9pbnRzOiBDb25maWd1cmF0aW9uWydlbnRyeSddID0ge307XG5cbiAgLy8gTG9hZCBFU00gYEBhbmd1bGFyL2NvbXBpbGVyLWNsaWAgdXNpbmcgdGhlIFR5cGVTY3JpcHQgZHluYW1pYyBpbXBvcnQgd29ya2Fyb3VuZC5cbiAgLy8gT25jZSBUeXBlU2NyaXB0IHByb3ZpZGVzIHN1cHBvcnQgZm9yIGtlZXBpbmcgdGhlIGR5bmFtaWMgaW1wb3J0IHRoaXMgd29ya2Fyb3VuZCBjYW4gYmVcbiAgLy8gY2hhbmdlZCB0byBhIGRpcmVjdCBkeW5hbWljIGltcG9ydC5cbiAgY29uc3Qge1xuICAgIEdMT0JBTF9ERUZTX0ZPUl9URVJTRVIsXG4gICAgR0xPQkFMX0RFRlNfRk9SX1RFUlNFUl9XSVRIX0FPVCxcbiAgICBWRVJTSU9OOiBOR19WRVJTSU9OLFxuICB9ID0gYXdhaXQgbG9hZEVzbU1vZHVsZTx0eXBlb2YgaW1wb3J0KCdAYW5ndWxhci9jb21waWxlci1jbGknKT4oJ0Bhbmd1bGFyL2NvbXBpbGVyLWNsaScpO1xuXG4gIC8vIGRldGVybWluZSBoYXNoaW5nIGZvcm1hdFxuICBjb25zdCBoYXNoRm9ybWF0ID0gZ2V0T3V0cHV0SGFzaEZvcm1hdChidWlsZE9wdGlvbnMub3V0cHV0SGFzaGluZyk7XG5cbiAgaWYgKGJ1aWxkT3B0aW9ucy5wcm9ncmVzcykge1xuICAgIGV4dHJhUGx1Z2lucy5wdXNoKFxuICAgICAgKHdjbyBhcyB1bmtub3duIGFzIHsgaXNSc3BhY2s6IGJvb2xlYW4gfSkuaXNSc3BhY2tcbiAgICAgICAgPyBuZXcgUHJvZ3Jlc3NQbHVnaW4ocGxhdGZvcm0pXG4gICAgICAgIDogbmV3IFdlYnBhY2tQcm9ncmVzc1BsdWdpbihwbGF0Zm9ybSksXG4gICAgKTtcbiAgfVxuXG4gIGNvbnN0IGxvY2FsaXplUGFja2FnZUluaXRFbnRyeVBvaW50ID0gJ0Bhbmd1bGFyL2xvY2FsaXplL2luaXQnO1xuICBjb25zdCBoYXNMb2NhbGl6ZVR5cGUgPSB0c0NvbmZpZy5vcHRpb25zLnR5cGVzPy5zb21lKFxuICAgICh0KSA9PiB0ID09PSAnQGFuZ3VsYXIvbG9jYWxpemUnIHx8IHQgPT09IGxvY2FsaXplUGFja2FnZUluaXRFbnRyeVBvaW50LFxuICApO1xuXG4gIGlmIChoYXNMb2NhbGl6ZVR5cGUpIHtcbiAgICBlbnRyeVBvaW50c1snbWFpbiddID0gW2xvY2FsaXplUGFja2FnZUluaXRFbnRyeVBvaW50XTtcbiAgfVxuXG4gIGlmIChidWlsZE9wdGlvbnMubWFpbikge1xuICAgIGNvbnN0IG1haW5QYXRoID0gcGF0aC5yZXNvbHZlKHJvb3QsIGJ1aWxkT3B0aW9ucy5tYWluKTtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShlbnRyeVBvaW50c1snbWFpbiddKSkge1xuICAgICAgZW50cnlQb2ludHNbJ21haW4nXS5wdXNoKG1haW5QYXRoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZW50cnlQb2ludHNbJ21haW4nXSA9IFttYWluUGF0aF07XG4gICAgfVxuICB9XG5cbiAgaWYgKGlzUGxhdGZvcm1TZXJ2ZXIpIHtcbiAgICAvLyBGaXhlcyBDcml0aWNhbCBkZXBlbmRlbmN5OiB0aGUgcmVxdWVzdCBvZiBhIGRlcGVuZGVuY3kgaXMgYW4gZXhwcmVzc2lvblxuICAgIGV4dHJhUGx1Z2lucy5wdXNoKG5ldyBDb250ZXh0UmVwbGFjZW1lbnRQbHVnaW4oL0A/aGFwaXxleHByZXNzW1xcXFwvXS8pKTtcblxuICAgIGlmIChpc1BsYXRmb3JtU2VydmVySW5zdGFsbGVkKHdjby5yb290KSAmJiBBcnJheS5pc0FycmF5KGVudHJ5UG9pbnRzWydtYWluJ10pKSB7XG4gICAgICAvLyBUaGlzIGltcG9ydCBtdXN0IGNvbWUgYmVmb3JlIGFueSBpbXBvcnRzIChkaXJlY3Qgb3IgdHJhbnNpdGl2ZSkgdGhhdCByZWx5IG9uIERPTSBidWlsdC1pbnMgYmVpbmdcbiAgICAgIC8vIGF2YWlsYWJsZSwgc3VjaCBhcyBgQGFuZ3VsYXIvZWxlbWVudHNgLlxuICAgICAgZW50cnlQb2ludHNbJ21haW4nXS51bnNoaWZ0KCdAYW5ndWxhci9wbGF0Zm9ybS1zZXJ2ZXIvaW5pdCcpO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IHBvbHlmaWxscyA9IFsuLi5idWlsZE9wdGlvbnMucG9seWZpbGxzXTtcbiAgaWYgKCFhb3QpIHtcbiAgICBwb2x5ZmlsbHMucHVzaCgnQGFuZ3VsYXIvY29tcGlsZXInKTtcbiAgfVxuXG4gIGlmIChwb2x5ZmlsbHMubGVuZ3RoKSB7XG4gICAgLy8gYHpvbmUuanMvdGVzdGluZ2AgaXMgYSAqKnNwZWNpYWwqKiBwb2x5ZmlsbCBiZWNhdXNlIHdoZW4gbm90IGltcG9ydGVkIGluIHRoZSBtYWluIGl0IGZhaWxzIHdpdGggdGhlIGJlbG93IGVycm9yczpcbiAgICAvLyBgRXJyb3I6IEV4cGVjdGVkIHRvIGJlIHJ1bm5pbmcgaW4gJ1Byb3h5Wm9uZScsIGJ1dCBpdCB3YXMgbm90IGZvdW5kLmBcbiAgICAvLyBUaGlzIHdhcyBhbHNvIHRoZSByZWFzb24gd2h5IHByZXZpb3VzbHkgaXQgd2FzIGltcG9ydGVkIGluIGB0ZXN0LnRzYCBhcyB0aGUgZmlyc3QgbW9kdWxlLlxuICAgIC8vIEZyb20gSmlhIGxpOlxuICAgIC8vIFRoaXMgaXMgYmVjYXVzZSB0aGUgamFzbWluZSBmdW5jdGlvbnMgc3VjaCBhcyBiZWZvcmVFYWNoL2l0IHdpbGwgbm90IGJlIHBhdGNoZWQgYnkgem9uZS5qcyBzaW5jZVxuICAgIC8vIGphc21pbmUgd2lsbCBub3QgYmUgbG9hZGVkIHlldCwgc28gdGhlIFByb3h5Wm9uZSB3aWxsIG5vdCBiZSB0aGVyZS4gV2UgaGF2ZSB0byBsb2FkIHpvbmUtdGVzdGluZy5qcyBhZnRlclxuICAgIC8vIGphc21pbmUgaXMgcmVhZHkuXG4gICAgLy8gV2UgY291bGQgZm9yY2UgbG9hZGluZyAnem9uZS5qcy90ZXN0aW5nJyBwcmlvciB0byBqYXNtaW5lIGJ5IGNoYW5naW5nIHRoZSBvcmRlciBvZiBzY3JpcHRzIGluICdrYXJtYS1jb250ZXh0Lmh0bWwnLlxuICAgIC8vIEJ1dCB0aGlzIGhhcyBpdCdzIG93biBwcm9ibGVtcyBhcyB6b25lLmpzIG5lZWRzIHRvIGJlIGxvYWRlZCBwcmlvciB0byBqYXNtaW5lIGR1ZSB0byBwYXRjaGluZyBvZiB0aW1pbmcgZnVuY3Rpb25zXG4gICAgLy8gU2VlOiBodHRwczovL2dpdGh1Yi5jb20vamFzbWluZS9qYXNtaW5lL2lzc3Vlcy8xOTQ0XG4gICAgLy8gVGh1cyB0aGUgY29ycmVjdCBvcmRlciBpcyB6b25lLmpzIC0+IGphc21pbmUgLT4gem9uZS5qcy90ZXN0aW5nLlxuICAgIGNvbnN0IHpvbmVUZXN0aW5nRW50cnlQb2ludCA9ICd6b25lLmpzL3Rlc3RpbmcnO1xuICAgIGNvbnN0IHBvbHlmaWxsc0V4bHVkaW5nWm9uZVRlc3RpbmcgPSBwb2x5ZmlsbHMuZmlsdGVyKChwKSA9PiBwICE9PSB6b25lVGVzdGluZ0VudHJ5UG9pbnQpO1xuXG4gICAgaWYgKEFycmF5LmlzQXJyYXkoZW50cnlQb2ludHNbJ3BvbHlmaWxscyddKSkge1xuICAgICAgZW50cnlQb2ludHNbJ3BvbHlmaWxscyddLnB1c2goLi4ucG9seWZpbGxzRXhsdWRpbmdab25lVGVzdGluZyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVudHJ5UG9pbnRzWydwb2x5ZmlsbHMnXSA9IHBvbHlmaWxsc0V4bHVkaW5nWm9uZVRlc3Rpbmc7XG4gICAgfVxuXG4gICAgaWYgKHBvbHlmaWxsc0V4bHVkaW5nWm9uZVRlc3RpbmcubGVuZ3RoICE9PSBwb2x5ZmlsbHMubGVuZ3RoKSB7XG4gICAgICBpZiAoQXJyYXkuaXNBcnJheShlbnRyeVBvaW50c1snbWFpbiddKSkge1xuICAgICAgICBlbnRyeVBvaW50c1snbWFpbiddLnVuc2hpZnQoem9uZVRlc3RpbmdFbnRyeVBvaW50KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGVudHJ5UG9pbnRzWydtYWluJ10gPSBbem9uZVRlc3RpbmdFbnRyeVBvaW50XTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBpZiAoYWxsb3dlZENvbW1vbkpzRGVwZW5kZW5jaWVzKSB7XG4gICAgLy8gV2hlbiB0aGlzIGlzIG5vdCBkZWZpbmVkIGl0IG1lYW5zIHRoZSBidWlsZGVyIGRvZXNuJ3Qgc3VwcG9ydCBzaG93aW5nIGNvbW1vbiBqcyB1c2FnZXMuXG4gICAgLy8gV2hlbiBpdCBkb2VzIGl0IHdpbGwgYmUgYW4gYXJyYXkuXG4gICAgZXh0cmFQbHVnaW5zLnB1c2goXG4gICAgICBuZXcgQ29tbW9uSnNVc2FnZVdhcm5QbHVnaW4oe1xuICAgICAgICBhbGxvd2VkRGVwZW5kZW5jaWVzOiBhbGxvd2VkQ29tbW9uSnNEZXBlbmRlbmNpZXMsXG4gICAgICB9KSxcbiAgICApO1xuICB9XG5cbiAgLy8gcHJvY2VzcyBnbG9iYWwgc2NyaXB0c1xuICAvLyBBZGQgYSBuZXcgYXNzZXQgZm9yIGVhY2ggZW50cnkuXG4gIGZvciAoY29uc3QgeyBidW5kbGVOYW1lLCBpbmplY3QsIHBhdGhzIH0gb2YgZ2xvYmFsU2NyaXB0c0J5QnVuZGxlTmFtZShidWlsZE9wdGlvbnMuc2NyaXB0cykpIHtcbiAgICAvLyBMYXp5IHNjcmlwdHMgZG9uJ3QgZ2V0IGEgaGFzaCwgb3RoZXJ3aXNlIHRoZXkgY2FuJ3QgYmUgbG9hZGVkIGJ5IG5hbWUuXG4gICAgY29uc3QgaGFzaCA9IGluamVjdCA/IGhhc2hGb3JtYXQuc2NyaXB0IDogJyc7XG5cbiAgICBleHRyYVBsdWdpbnMucHVzaChcbiAgICAgIG5ldyBTY3JpcHRzV2VicGFja1BsdWdpbih7XG4gICAgICAgIG5hbWU6IGJ1bmRsZU5hbWUsXG4gICAgICAgIHNvdXJjZU1hcDogc2NyaXB0c1NvdXJjZU1hcCxcbiAgICAgICAgc2NyaXB0czogcGF0aHMsXG4gICAgICAgIGZpbGVuYW1lOiBgJHtwYXRoLmJhc2VuYW1lKGJ1bmRsZU5hbWUpfSR7aGFzaH0uanNgLFxuICAgICAgICBiYXNlUGF0aDogcm9vdCxcbiAgICAgIH0pLFxuICAgICk7XG4gIH1cblxuICAvLyBwcm9jZXNzIGFzc2V0IGVudHJpZXNcbiAgaWYgKGJ1aWxkT3B0aW9ucy5hc3NldHMubGVuZ3RoKSB7XG4gICAgZXh0cmFQbHVnaW5zLnB1c2goXG4gICAgICBuZXcgQ29weVdlYnBhY2tQbHVnaW4oe1xuICAgICAgICBwYXR0ZXJuczogYXNzZXRQYXR0ZXJucyhyb290LCBidWlsZE9wdGlvbnMuYXNzZXRzKSxcbiAgICAgIH0pLFxuICAgICk7XG4gIH1cblxuICBpZiAoYnVpbGRPcHRpb25zLmV4dHJhY3RMaWNlbnNlcykge1xuICAgIGNvbnN0IExpY2Vuc2VXZWJwYWNrUGx1Z2luID0gcmVxdWlyZSgnbGljZW5zZS13ZWJwYWNrLXBsdWdpbicpLkxpY2Vuc2VXZWJwYWNrUGx1Z2luO1xuICAgIGV4dHJhUGx1Z2lucy5wdXNoKFxuICAgICAgbmV3IExpY2Vuc2VXZWJwYWNrUGx1Z2luKHtcbiAgICAgICAgc3RhdHM6IHtcbiAgICAgICAgICB3YXJuaW5nczogZmFsc2UsXG4gICAgICAgICAgZXJyb3JzOiBmYWxzZSxcbiAgICAgICAgfSxcbiAgICAgICAgcGVyQ2h1bmtPdXRwdXQ6IGZhbHNlLFxuICAgICAgICBvdXRwdXRGaWxlbmFtZTogJzNyZHBhcnR5bGljZW5zZXMudHh0JyxcbiAgICAgICAgc2tpcENoaWxkQ29tcGlsZXJzOiB0cnVlLFxuICAgICAgfSksXG4gICAgKTtcbiAgfVxuXG4gIGlmIChzY3JpcHRzU291cmNlTWFwIHx8IHN0eWxlc1NvdXJjZU1hcCkge1xuICAgIGNvbnN0IGluY2x1ZGUgPSBbXTtcbiAgICBpZiAoc2NyaXB0c1NvdXJjZU1hcCkge1xuICAgICAgaW5jbHVkZS5wdXNoKC9qcyQvKTtcbiAgICB9XG5cbiAgICBpZiAoc3R5bGVzU291cmNlTWFwKSB7XG4gICAgICBpbmNsdWRlLnB1c2goL2NzcyQvKTtcbiAgICB9XG5cbiAgICBleHRyYVBsdWdpbnMucHVzaChuZXcgRGV2VG9vbHNJZ25vcmVQbHVnaW4oKSk7XG5cbiAgICBleHRyYVBsdWdpbnMucHVzaChcbiAgICAgIG5ldyBTb3VyY2VNYXBEZXZUb29sUGx1Z2luKHtcbiAgICAgICAgZmlsZW5hbWU6ICdbZmlsZV0ubWFwJyxcbiAgICAgICAgaW5jbHVkZSxcbiAgICAgICAgLy8gV2Ugd2FudCB0byBzZXQgc291cmNlUm9vdCB0byAgYHdlYnBhY2s6Ly8vYCBmb3Igbm9uXG4gICAgICAgIC8vIGlubGluZSBzb3VyY2VtYXBzIGFzIG90aGVyd2lzZSBwYXRocyB0byBzb3VyY2VtYXBzIHdpbGwgYmUgYnJva2VuIGluIGJyb3dzZXJcbiAgICAgICAgLy8gYHdlYnBhY2s6Ly8vYCBpcyBuZWVkZWQgZm9yIFZpc3VhbCBTdHVkaW8gYnJlYWtwb2ludHMgdG8gd29yayBwcm9wZXJseSBhcyBjdXJyZW50bHlcbiAgICAgICAgLy8gdGhlcmUgaXMgbm8gd2F5IHRvIHNldCB0aGUgJ3dlYlJvb3QnXG4gICAgICAgIHNvdXJjZVJvb3Q6ICd3ZWJwYWNrOi8vLycsXG4gICAgICAgIG1vZHVsZUZpbGVuYW1lVGVtcGxhdGU6ICdbcmVzb3VyY2UtcGF0aF0nLFxuICAgICAgICBhcHBlbmQ6IGhpZGRlblNvdXJjZU1hcCA/IGZhbHNlIDogdW5kZWZpbmVkLFxuICAgICAgfSksXG4gICAgKTtcbiAgfVxuXG4gIGlmICh2ZXJib3NlKSB7XG4gICAgZXh0cmFQbHVnaW5zLnB1c2gobmV3IFdhdGNoRmlsZXNMb2dzUGx1Z2luKCkpO1xuICB9XG5cbiAgaWYgKGJ1aWxkT3B0aW9ucy5zdGF0c0pzb24pIHtcbiAgICBleHRyYVBsdWdpbnMucHVzaChcbiAgICAgIG5ldyBKc29uU3RhdHNQbHVnaW4ocGF0aC5yZXNvbHZlKHJvb3QsIGJ1aWxkT3B0aW9ucy5vdXRwdXRQYXRoLCAnc3RhdHMuanNvbicpKSxcbiAgICApO1xuICB9XG5cbiAgaWYgKHN1YnJlc291cmNlSW50ZWdyaXR5KSB7XG4gICAgZXh0cmFQbHVnaW5zLnB1c2goXG4gICAgICBuZXcgU3VicmVzb3VyY2VJbnRlZ3JpdHlQbHVnaW4oe1xuICAgICAgICBoYXNoRnVuY05hbWVzOiBbJ3NoYTM4NCddLFxuICAgICAgfSksXG4gICAgKTtcbiAgfVxuXG4gIGlmIChzY3JpcHRzU291cmNlTWFwIHx8IHN0eWxlc1NvdXJjZU1hcCkge1xuICAgIGV4dHJhUnVsZXMucHVzaCh7XG4gICAgICB0ZXN0OiAvXFwuW2NtXT9qc3g/JC8sXG4gICAgICBlbmZvcmNlOiAncHJlJyxcbiAgICAgIGxvYWRlcjogcmVxdWlyZS5yZXNvbHZlKCdzb3VyY2UtbWFwLWxvYWRlcicpLFxuICAgICAgb3B0aW9uczoge1xuICAgICAgICBmaWx0ZXJTb3VyY2VNYXBwaW5nVXJsOiAoX21hcFVyaTogc3RyaW5nLCByZXNvdXJjZVBhdGg6IHN0cmluZykgPT4ge1xuICAgICAgICAgIGlmICh2ZW5kb3JTb3VyY2VNYXApIHtcbiAgICAgICAgICAgIC8vIENvbnN1bWUgYWxsIHNvdXJjZW1hcHMgd2hlbiB2ZW5kb3Igb3B0aW9uIGlzIGVuYWJsZWQuXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBEb24ndCBjb25zdW1lIHNvdXJjZW1hcHMgaW4gbm9kZV9tb2R1bGVzIHdoZW4gdmVuZG9yIGlzIGRpc2FibGVkLlxuICAgICAgICAgIC8vIEJ1dCwgZG8gY29uc3VtZSBsb2NhbCBsaWJyYXJpZXMgc291cmNlbWFwcy5cbiAgICAgICAgICByZXR1cm4gIXJlc291cmNlUGF0aC5pbmNsdWRlcygnbm9kZV9tb2R1bGVzJyk7XG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0pO1xuICB9XG5cbiAgaWYgKG1haW4gfHwgcG9seWZpbGxzKSB7XG4gICAgZXh0cmFSdWxlcy5wdXNoKHtcbiAgICAgIHRlc3Q6IHRzQ29uZmlnLm9wdGlvbnMuYWxsb3dKcyA/IC9cXC5bY21dP1t0al1zeD8kLyA6IC9cXC5bY21dP3RzeD8kLyxcbiAgICAgIGxvYWRlcjogQW5ndWxhcldlYnBhY2tMb2FkZXJQYXRoLFxuICAgICAgLy8gVGhlIGJlbG93IGFyZSBrbm93biBwYXRocyB0aGF0IGFyZSBub3QgcGFydCBvZiB0aGUgVHlwZVNjcmlwdCBjb21waWxhdGlvbiBldmVuIHdoZW4gYWxsb3dKcyBpcyBlbmFibGVkLlxuICAgICAgZXhjbHVkZTogW1xuICAgICAgICAvW1xcXFwvXW5vZGVfbW9kdWxlc1svXFxcXF0oPzpjc3MtbG9hZGVyfG1pbmktY3NzLWV4dHJhY3QtcGx1Z2lufHdlYnBhY2stZGV2LXNlcnZlcnx3ZWJwYWNrKVsvXFxcXF0vLFxuICAgICAgXSxcbiAgICB9KTtcbiAgICBleHRyYVBsdWdpbnMucHVzaChjcmVhdGVJdnlQbHVnaW4od2NvLCBhb3QsIHRzQ29uZmlnUGF0aCkpO1xuICB9XG5cbiAgaWYgKHdlYldvcmtlclRzQ29uZmlnKSB7XG4gICAgZXh0cmFQbHVnaW5zLnB1c2goY3JlYXRlSXZ5UGx1Z2luKHdjbywgZmFsc2UsIHBhdGgucmVzb2x2ZSh3Y28ucm9vdCwgd2ViV29ya2VyVHNDb25maWcpKSk7XG4gIH1cblxuICBjb25zdCBleHRyYU1pbmltaXplcnMgPSBbXTtcbiAgaWYgKHNjcmlwdHNPcHRpbWl6YXRpb24pIHtcbiAgICBleHRyYU1pbmltaXplcnMucHVzaChcbiAgICAgIG5ldyBKYXZhU2NyaXB0T3B0aW1pemVyUGx1Z2luKHtcbiAgICAgICAgZGVmaW5lOiBidWlsZE9wdGlvbnMuYW90ID8gR0xPQkFMX0RFRlNfRk9SX1RFUlNFUl9XSVRIX0FPVCA6IEdMT0JBTF9ERUZTX0ZPUl9URVJTRVIsXG4gICAgICAgIHNvdXJjZW1hcDogc2NyaXB0c1NvdXJjZU1hcCxcbiAgICAgICAgc3VwcG9ydGVkQnJvd3NlcnM6IGJ1aWxkT3B0aW9ucy5zdXBwb3J0ZWRCcm93c2VycyxcbiAgICAgICAga2VlcElkZW50aWZpZXJOYW1lczogIWFsbG93TWFuZ2xlIHx8IGlzUGxhdGZvcm1TZXJ2ZXIsXG4gICAgICAgIGtlZXBOYW1lczogaXNQbGF0Zm9ybVNlcnZlcixcbiAgICAgICAgcmVtb3ZlTGljZW5zZXM6IGJ1aWxkT3B0aW9ucy5leHRyYWN0TGljZW5zZXMsXG4gICAgICAgIGFkdmFuY2VkOiBidWlsZE9wdGlvbnMuYnVpbGRPcHRpbWl6ZXIsXG4gICAgICB9KSxcbiAgICApO1xuICB9XG5cbiAgaWYgKHBsYXRmb3JtID09PSAnYnJvd3NlcicgJiYgKHNjcmlwdHNPcHRpbWl6YXRpb24gfHwgc3R5bGVzT3B0aW1pemF0aW9uLm1pbmlmeSkpIHtcbiAgICBleHRyYU1pbmltaXplcnMucHVzaChuZXcgVHJhbnNmZXJTaXplUGx1Z2luKCkpO1xuICB9XG5cbiAgbGV0IGNyb3NzT3JpZ2luTG9hZGluZzogTm9uTnVsbGFibGU8Q29uZmlndXJhdGlvblsnb3V0cHV0J10+Wydjcm9zc09yaWdpbkxvYWRpbmcnXSA9IGZhbHNlO1xuICBpZiAoc3VicmVzb3VyY2VJbnRlZ3JpdHkgJiYgY3Jvc3NPcmlnaW4gPT09ICdub25lJykge1xuICAgIGNyb3NzT3JpZ2luTG9hZGluZyA9ICdhbm9ueW1vdXMnO1xuICB9IGVsc2UgaWYgKGNyb3NzT3JpZ2luICE9PSAnbm9uZScpIHtcbiAgICBjcm9zc09yaWdpbkxvYWRpbmcgPSBjcm9zc09yaWdpbjtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgbW9kZTogc2NyaXB0c09wdGltaXphdGlvbiB8fCBzdHlsZXNPcHRpbWl6YXRpb24ubWluaWZ5ID8gJ3Byb2R1Y3Rpb24nIDogJ2RldmVsb3BtZW50JyxcbiAgICBkZXZ0b29sOiBmYWxzZSxcbiAgICB0YXJnZXQ6IFtpc1BsYXRmb3JtU2VydmVyID8gJ25vZGUnIDogJ3dlYicsICdlczIwMTUnXSxcbiAgICBwcm9maWxlOiBidWlsZE9wdGlvbnMuc3RhdHNKc29uLFxuICAgIHJlc29sdmU6IHtcbiAgICAgIHJvb3RzOiBbcHJvamVjdFJvb3RdLFxuICAgICAgZXh0ZW5zaW9uczogWycudHMnLCAnLnRzeCcsICcubWpzJywgJy5qcyddLFxuICAgICAgc3ltbGlua3M6ICFidWlsZE9wdGlvbnMucHJlc2VydmVTeW1saW5rcyxcbiAgICAgIG1vZHVsZXM6IFt0c0NvbmZpZy5vcHRpb25zLmJhc2VVcmwgfHwgcHJvamVjdFJvb3QsICdub2RlX21vZHVsZXMnXSxcbiAgICAgIG1haW5GaWVsZHM6IGlzUGxhdGZvcm1TZXJ2ZXJcbiAgICAgICAgPyBbJ2VzMjAyMCcsICdlczIwMTUnLCAnbW9kdWxlJywgJ21haW4nXVxuICAgICAgICA6IFsnZXMyMDIwJywgJ2VzMjAxNScsICdicm93c2VyJywgJ21vZHVsZScsICdtYWluJ10sXG4gICAgICBjb25kaXRpb25OYW1lczogWydlczIwMjAnLCAnZXMyMDE1JywgJy4uLiddLFxuICAgIH0sXG4gICAgcmVzb2x2ZUxvYWRlcjoge1xuICAgICAgc3ltbGlua3M6ICFidWlsZE9wdGlvbnMucHJlc2VydmVTeW1saW5rcyxcbiAgICB9LFxuICAgIGNvbnRleHQ6IHJvb3QsXG4gICAgZW50cnk6IGVudHJ5UG9pbnRzLFxuICAgIGV4dGVybmFsczogZXh0ZXJuYWxEZXBlbmRlbmNpZXMsXG4gICAgb3V0cHV0OiB7XG4gICAgICB1bmlxdWVOYW1lOiBwcm9qZWN0TmFtZSxcbiAgICAgIGhhc2hGdW5jdGlvbjogJ3h4aGFzaDY0JywgLy8gdG9kbzogcmVtb3ZlIGluIHdlYnBhY2sgNi4gVGhpcyBpcyBwYXJ0IG9mIGBmdXR1cmVEZWZhdWx0c2AuXG4gICAgICBjbGVhbjogYnVpbGRPcHRpb25zLmRlbGV0ZU91dHB1dFBhdGggPz8gdHJ1ZSxcbiAgICAgIHBhdGg6IHBhdGgucmVzb2x2ZShyb290LCBidWlsZE9wdGlvbnMub3V0cHV0UGF0aCksXG4gICAgICBwdWJsaWNQYXRoOiBidWlsZE9wdGlvbnMuZGVwbG95VXJsID8/ICcnLFxuICAgICAgZmlsZW5hbWU6IGBbbmFtZV0ke2hhc2hGb3JtYXQuY2h1bmt9LmpzYCxcbiAgICAgIGNodW5rRmlsZW5hbWU6IGBbbmFtZV0ke2hhc2hGb3JtYXQuY2h1bmt9LmpzYCxcbiAgICAgIGxpYnJhcnlUYXJnZXQ6IGlzUGxhdGZvcm1TZXJ2ZXIgPyAnY29tbW9uanMnIDogdW5kZWZpbmVkLFxuICAgICAgY3Jvc3NPcmlnaW5Mb2FkaW5nLFxuICAgICAgdHJ1c3RlZFR5cGVzOiAnYW5ndWxhciNidW5kbGVyJyxcbiAgICAgIHNjcmlwdFR5cGU6ICdtb2R1bGUnLFxuICAgIH0sXG4gICAgd2F0Y2g6IGJ1aWxkT3B0aW9ucy53YXRjaCxcbiAgICB3YXRjaE9wdGlvbnM6IHtcbiAgICAgIHBvbGwsXG4gICAgICAvLyBUaGUgYmVsb3cgaXMgbmVlZGVkIGFzIHdoZW4gcHJlc2VydmVTeW1saW5rcyBpcyBlbmFibGVkIHdlIGRpc2FibGUgYHJlc29sdmUuc3ltbGlua3NgLlxuICAgICAgZm9sbG93U3ltbGlua3M6IGJ1aWxkT3B0aW9ucy5wcmVzZXJ2ZVN5bWxpbmtzLFxuICAgICAgaWdub3JlZDogcG9sbCA9PT0gdW5kZWZpbmVkID8gdW5kZWZpbmVkIDogJyoqL25vZGVfbW9kdWxlcy8qKicsXG4gICAgfSxcbiAgICBzbmFwc2hvdDoge1xuICAgICAgbW9kdWxlOiB7XG4gICAgICAgIC8vIFVzZSBoYXNoIG9mIGNvbnRlbnQgaW5zdGVhZCBvZiB0aW1lc3RhbXAgYmVjYXVzZSB0aGUgdGltZXN0YW1wIG9mIHRoZSBzeW1saW5rIHdpbGwgYmUgdXNlZFxuICAgICAgICAvLyBpbnN0ZWFkIG9mIHRoZSByZWZlcmVuY2VkIGZpbGVzIHdoaWNoIGNhdXNlcyBjaGFuZ2VzIGluIHN5bWxpbmtzIG5vdCB0byBiZSBwaWNrZWQgdXAuXG4gICAgICAgIGhhc2g6IGJ1aWxkT3B0aW9ucy5wcmVzZXJ2ZVN5bWxpbmtzLFxuICAgICAgfSxcbiAgICB9LFxuICAgIHBlcmZvcm1hbmNlOiB7XG4gICAgICBoaW50czogZmFsc2UsXG4gICAgfSxcbiAgICBpZ25vcmVXYXJuaW5nczogW1xuICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL3dlYnBhY2stY29udHJpYi9zb3VyY2UtbWFwLWxvYWRlci9ibG9iL2IyZGU0MjQ5Yzc0MzFkZDg0MzJkYTYwN2UwOGYwZjY1ZTlkNjQyMTkvc3JjL2luZGV4LmpzI0w4M1xuICAgICAgL0ZhaWxlZCB0byBwYXJzZSBzb3VyY2UgbWFwIGZyb20vLFxuICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL3dlYnBhY2stY29udHJpYi9wb3N0Y3NzLWxvYWRlci9ibG9iL2JkMjYxODc1ZmRmOWM1OTZhZjRmZmIzYTFhNzNmZTNjNTQ5YmVmZGEvc3JjL2luZGV4LmpzI0wxNTMtTDE1OFxuICAgICAgL0FkZCBwb3N0Y3NzIGFzIHByb2plY3QgZGVwZW5kZW5jeS8sXG4gICAgICAvLyBlc2J1aWxkIHdpbGwgaXNzdWUgYSB3YXJuaW5nLCB3aGlsZSBzdGlsbCBob2lzdHMgdGhlIEBjaGFyc2V0IGF0IHRoZSB2ZXJ5IHRvcC5cbiAgICAgIC8vIFRoaXMgaXMgY2F1c2VkIGJ5IGEgYnVnIGluIGNzcy1sb2FkZXIgaHR0cHM6Ly9naXRodWIuY29tL3dlYnBhY2stY29udHJpYi9jc3MtbG9hZGVyL2lzc3Vlcy8xMjEyXG4gICAgICAvXCJAY2hhcnNldFwiIG11c3QgYmUgdGhlIGZpcnN0IHJ1bGUgaW4gdGhlIGZpbGUvLFxuICAgIF0sXG4gICAgbW9kdWxlOiB7XG4gICAgICAvLyBTaG93IGFuIGVycm9yIGZvciBtaXNzaW5nIGV4cG9ydHMgaW5zdGVhZCBvZiBhIHdhcm5pbmcuXG4gICAgICBzdHJpY3RFeHBvcnRQcmVzZW5jZTogdHJ1ZSxcbiAgICAgIHBhcnNlcjoge1xuICAgICAgICBqYXZhc2NyaXB0OiB7XG4gICAgICAgICAgcmVxdWlyZUNvbnRleHQ6IGZhbHNlLFxuICAgICAgICAgIC8vIERpc2FibGUgYXV0byBVUkwgYXNzZXQgbW9kdWxlIGNyZWF0aW9uLiBUaGlzIGRvZXNuJ3QgZWZmZWN0IGBuZXcgV29ya2VyKG5ldyBVUkwoLi4uKSlgXG4gICAgICAgICAgLy8gaHR0cHM6Ly93ZWJwYWNrLmpzLm9yZy9ndWlkZXMvYXNzZXQtbW9kdWxlcy8jdXJsLWFzc2V0c1xuICAgICAgICAgIHVybDogZmFsc2UsXG4gICAgICAgICAgd29ya2VyOiAhIXdlYldvcmtlclRzQ29uZmlnLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHJ1bGVzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICB0ZXN0OiAvXFwuPyhzdmd8aHRtbCkkLyxcbiAgICAgICAgICAvLyBPbmx5IHByb2Nlc3MgSFRNTCBhbmQgU1ZHIHdoaWNoIGFyZSBrbm93biBBbmd1bGFyIGNvbXBvbmVudCByZXNvdXJjZXMuXG4gICAgICAgICAgcmVzb3VyY2VRdWVyeTogL1xcP25nUmVzb3VyY2UvLFxuICAgICAgICAgIHR5cGU6ICdhc3NldC9zb3VyY2UnLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgLy8gTWFyayBmaWxlcyBpbnNpZGUgYHJ4anMvYWRkYCBhcyBjb250YWluaW5nIHNpZGUgZWZmZWN0cy5cbiAgICAgICAgICAvLyBJZiB0aGlzIGlzIGZpeGVkIHVwc3RyZWFtIGFuZCB0aGUgZml4ZWQgdmVyc2lvbiBiZWNvbWVzIHRoZSBtaW5pbXVtXG4gICAgICAgICAgLy8gc3VwcG9ydGVkIHZlcnNpb24sIHRoaXMgY2FuIGJlIHJlbW92ZWQuXG4gICAgICAgICAgdGVzdDogL1svXFxcXF1yeGpzWy9cXFxcXWFkZFsvXFxcXF0uK1xcLmpzJC8sXG4gICAgICAgICAgc2lkZUVmZmVjdHM6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICB0ZXN0OiAvXFwuW2NtXT9bdGpdc3g/JC8sXG4gICAgICAgICAgLy8gVGhlIGJlbG93IGlzIG5lZWRlZCBkdWUgdG8gYSBidWcgaW4gYEBiYWJlbC9ydW50aW1lYC4gU2VlOiBodHRwczovL2dpdGh1Yi5jb20vYmFiZWwvYmFiZWwvaXNzdWVzLzEyODI0XG4gICAgICAgICAgcmVzb2x2ZTogeyBmdWxseVNwZWNpZmllZDogZmFsc2UgfSxcbiAgICAgICAgICBleGNsdWRlOiBbXG4gICAgICAgICAgICAvW1xcXFwvXW5vZGVfbW9kdWxlc1svXFxcXF0oPzpjb3JlLWpzfEBiYWJlbHx0c2xpYnx3ZWItYW5pbWF0aW9ucy1qc3x3ZWItc3RyZWFtcy1wb2x5ZmlsbHx3aGF0d2ctdXJsKVsvXFxcXF0vLFxuICAgICAgICAgIF0sXG4gICAgICAgICAgdXNlOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGxvYWRlcjogcmVxdWlyZS5yZXNvbHZlKCcuLi8uLi9iYWJlbC93ZWJwYWNrLWxvYWRlcicpLFxuICAgICAgICAgICAgICBvcHRpb25zOiB7XG4gICAgICAgICAgICAgICAgY2FjaGVEaXJlY3Rvcnk6IChjYWNoZS5lbmFibGVkICYmIHBhdGguam9pbihjYWNoZS5wYXRoLCAnYmFiZWwtd2VicGFjaycpKSB8fCBmYWxzZSxcbiAgICAgICAgICAgICAgICBhb3Q6IGJ1aWxkT3B0aW9ucy5hb3QsXG4gICAgICAgICAgICAgICAgb3B0aW1pemU6IGJ1aWxkT3B0aW9ucy5idWlsZE9wdGltaXplcixcbiAgICAgICAgICAgICAgICBzdXBwb3J0ZWRCcm93c2VyczogYnVpbGRPcHRpb25zLnN1cHBvcnRlZEJyb3dzZXJzLFxuICAgICAgICAgICAgICAgIGluc3RydW1lbnRDb2RlOiBjb2RlQ292ZXJhZ2VcbiAgICAgICAgICAgICAgICAgID8ge1xuICAgICAgICAgICAgICAgICAgICAgIGluY2x1ZGVkQmFzZVBhdGg6IHNvdXJjZVJvb3QgPz8gcHJvamVjdFJvb3QsXG4gICAgICAgICAgICAgICAgICAgICAgZXhjbHVkZWRQYXRoczogZ2V0SW5zdHJ1bWVudGF0aW9uRXhjbHVkZWRQYXRocyhyb290LCBjb2RlQ292ZXJhZ2VFeGNsdWRlKSxcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICAgIH0gYXMgQW5ndWxhckJhYmVsTG9hZGVyT3B0aW9ucyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgICAgLi4uZXh0cmFSdWxlcyxcbiAgICAgIF0sXG4gICAgfSxcbiAgICBleHBlcmltZW50czoge1xuICAgICAgYmFja0NvbXBhdDogZmFsc2UsXG4gICAgICBzeW5jV2ViQXNzZW1ibHk6IHRydWUsXG4gICAgICBhc3luY1dlYkFzc2VtYmx5OiB0cnVlLFxuICAgIH0sXG4gICAgaW5mcmFzdHJ1Y3R1cmVMb2dnaW5nOiB7XG4gICAgICBkZWJ1ZzogdmVyYm9zZSxcbiAgICAgIGxldmVsOiB2ZXJib3NlID8gJ3ZlcmJvc2UnIDogJ2Vycm9yJyxcbiAgICB9LFxuICAgIHN0YXRzOiBnZXRTdGF0c09wdGlvbnModmVyYm9zZSksXG4gICAgY2FjaGU6IGdldENhY2hlU2V0dGluZ3Mod2NvLCBOR19WRVJTSU9OLmZ1bGwpLFxuICAgIG9wdGltaXphdGlvbjoge1xuICAgICAgbWluaW1pemVyOiBleHRyYU1pbmltaXplcnMsXG4gICAgICBtb2R1bGVJZHM6ICdkZXRlcm1pbmlzdGljJyxcbiAgICAgIGNodW5rSWRzOiBidWlsZE9wdGlvbnMubmFtZWRDaHVua3MgPyAnbmFtZWQnIDogJ2RldGVybWluaXN0aWMnLFxuICAgICAgZW1pdE9uRXJyb3JzOiBmYWxzZSxcbiAgICAgIHJ1bnRpbWVDaHVuazogaXNQbGF0Zm9ybVNlcnZlciA/IGZhbHNlIDogJ3NpbmdsZScsXG4gICAgICBzcGxpdENodW5rczoge1xuICAgICAgICBtYXhBc3luY1JlcXVlc3RzOiBJbmZpbml0eSxcbiAgICAgICAgY2FjaGVHcm91cHM6IHtcbiAgICAgICAgICBkZWZhdWx0OiAhIWNvbW1vbkNodW5rICYmIHtcbiAgICAgICAgICAgIGNodW5rczogJ2FzeW5jJyxcbiAgICAgICAgICAgIG1pbkNodW5rczogMixcbiAgICAgICAgICAgIHByaW9yaXR5OiAxMCxcbiAgICAgICAgICB9LFxuICAgICAgICAgIGNvbW1vbjogISFjb21tb25DaHVuayAmJiB7XG4gICAgICAgICAgICBuYW1lOiAnY29tbW9uJyxcbiAgICAgICAgICAgIGNodW5rczogJ2FzeW5jJyxcbiAgICAgICAgICAgIG1pbkNodW5rczogMixcbiAgICAgICAgICAgIGVuZm9yY2U6IHRydWUsXG4gICAgICAgICAgICBwcmlvcml0eTogNSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHZlbmRvcnM6IGZhbHNlLFxuICAgICAgICAgIGRlZmF1bHRWZW5kb3JzOiAhIXZlbmRvckNodW5rICYmIHtcbiAgICAgICAgICAgIG5hbWU6ICd2ZW5kb3InLFxuICAgICAgICAgICAgY2h1bmtzOiAoY2h1bmspID0+IGNodW5rLm5hbWUgPT09ICdtYWluJyxcbiAgICAgICAgICAgIGVuZm9yY2U6IHRydWUsXG4gICAgICAgICAgICB0ZXN0OiBWRU5ET1JTX1RFU1QsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSxcbiAgICBwbHVnaW5zOiBbXG4gICAgICBuZXcgTmFtZWRDaHVua3NQbHVnaW4oKSxcbiAgICAgIG5ldyBPY2N1cnJlbmNlc1BsdWdpbih7XG4gICAgICAgIGFvdCxcbiAgICAgICAgc2NyaXB0c09wdGltaXphdGlvbixcbiAgICAgIH0pLFxuICAgICAgbmV3IERlZHVwZU1vZHVsZVJlc29sdmVQbHVnaW4oeyB2ZXJib3NlIH0pLFxuICAgICAgLi4uZXh0cmFQbHVnaW5zLFxuICAgIF0sXG4gICAgbm9kZTogZmFsc2UsXG4gIH07XG59XG4iXX0=