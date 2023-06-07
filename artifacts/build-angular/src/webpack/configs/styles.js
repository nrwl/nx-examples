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
exports.getStylesConfig = void 0;
const mini_css_extract_plugin_1 = __importDefault(require("mini-css-extract-plugin"));
const path = __importStar(require("node:path"));
const node_url_1 = require("node:url");
const sass_service_1 = require("../../sass/sass-service");
const sass_service_legacy_1 = require("../../sass/sass-service-legacy");
const environment_options_1 = require("../../utils/environment-options");
const tailwind_1 = require("../../utils/tailwind");
const plugins_1 = require("../plugins");
const css_optimizer_plugin_1 = require("../plugins/css-optimizer-plugin");
const styles_webpack_plugin_1 = require("../plugins/styles-webpack-plugin");
const helpers_1 = require("../utils/helpers");
// eslint-disable-next-line max-lines-per-function
async function getStylesConfig(wco) {
    const { root, buildOptions, logger, projectRoot } = wco;
    const extraPlugins = [];
    extraPlugins.push(new plugins_1.AnyComponentStyleBudgetChecker(buildOptions.budgets));
    const cssSourceMap = buildOptions.sourceMap.styles;
    // Determine hashing format.
    const hashFormat = (0, helpers_1.getOutputHashFormat)(buildOptions.outputHashing);
    // use includePaths from appConfig
    const includePaths = buildOptions.stylePreprocessorOptions?.includePaths?.map((p) => path.resolve(root, p)) ?? [];
    // Process global styles.
    if (buildOptions.styles.length > 0) {
        const { entryPoints, noInjectNames } = (0, helpers_1.normalizeGlobalStyles)(buildOptions.styles);
        extraPlugins.push(new styles_webpack_plugin_1.StylesWebpackPlugin({
            root,
            entryPoints,
            preserveSymlinks: buildOptions.preserveSymlinks,
        }));
        if (noInjectNames.length > 0) {
            // Add plugin to remove hashes from lazy styles.
            extraPlugins.push(new plugins_1.RemoveHashPlugin({ chunkNames: noInjectNames, hashFormat }));
        }
    }
    const sassImplementation = environment_options_1.useLegacySass
        ? new sass_service_legacy_1.SassLegacyWorkerImplementation()
        : new sass_service_1.SassWorkerImplementation();
    extraPlugins.push({
        apply(compiler) {
            compiler.hooks.shutdown.tap('sass-worker', () => {
                sassImplementation.close();
            });
        },
    });
    const assetNameTemplate = (0, helpers_1.assetNameTemplateFactory)(hashFormat);
    const extraPostcssPlugins = [];
    // Attempt to setup Tailwind CSS
    // Only load Tailwind CSS plugin if configuration file was found.
    // This acts as a guard to ensure the project actually wants to use Tailwind CSS.
    // The package may be unknowningly present due to a third-party transitive package dependency.
    const tailwindConfigPath = await (0, tailwind_1.findTailwindConfigurationFile)(root, projectRoot);
    if (tailwindConfigPath) {
        let tailwindPackagePath;
        try {
            tailwindPackagePath = require.resolve('tailwindcss', { paths: [root] });
        }
        catch {
            const relativeTailwindConfigPath = path.relative(root, tailwindConfigPath);
            logger.warn(`Tailwind CSS configuration file found (${relativeTailwindConfigPath})` +
                ` but the 'tailwindcss' package is not installed.` +
                ` To enable Tailwind CSS, please install the 'tailwindcss' package.`);
        }
        if (tailwindPackagePath) {
            extraPostcssPlugins.push(require(tailwindPackagePath)({ config: tailwindConfigPath }));
        }
    }
    const autoprefixer = require('autoprefixer');
    const postcssOptionsCreator = (inlineSourcemaps, extracted) => {
        const optionGenerator = (loader) => ({
            map: inlineSourcemaps
                ? {
                    inline: true,
                    annotation: false,
                }
                : undefined,
            plugins: [
                (0, plugins_1.PostcssCliResources)({
                    baseHref: buildOptions.baseHref,
                    deployUrl: buildOptions.deployUrl,
                    resourcesOutputPath: buildOptions.resourcesOutputPath,
                    loader,
                    filename: assetNameTemplate,
                    emitFile: buildOptions.platform !== 'server',
                    extracted,
                }),
                ...extraPostcssPlugins,
                autoprefixer({
                    ignoreUnknownVersions: true,
                    overrideBrowserslist: buildOptions.supportedBrowsers,
                }),
            ],
        });
        // postcss-loader fails when trying to determine configuration files for data URIs
        optionGenerator.config = false;
        return optionGenerator;
    };
    let componentsSourceMap = !!cssSourceMap;
    if (cssSourceMap) {
        if (buildOptions.optimization.styles.minify) {
            // Never use component css sourcemap when style optimizations are on.
            // It will just increase bundle size without offering good debug experience.
            logger.warn('Components styles sourcemaps are not generated when styles optimization is enabled.');
            componentsSourceMap = false;
        }
        else if (buildOptions.sourceMap.hidden) {
            // Inline all sourcemap types except hidden ones, which are the same as no sourcemaps
            // for component css.
            logger.warn('Components styles sourcemaps are not generated when sourcemaps are hidden.');
            componentsSourceMap = false;
        }
    }
    // extract global css from js files into own css file.
    extraPlugins.push(new mini_css_extract_plugin_1.default({ filename: `[name]${hashFormat.extract}.css` }));
    if (!buildOptions.hmr) {
        // don't remove `.js` files for `.css` when we are using HMR these contain HMR accept codes.
        // suppress empty .js files in css only entry points.
        extraPlugins.push(new plugins_1.SuppressExtractedTextChunksWebpackPlugin());
    }
    const postCss = require('postcss');
    const postCssLoaderPath = require.resolve('postcss-loader');
    const componentStyleLoaders = [
        {
            loader: require.resolve('css-loader'),
            options: {
                url: false,
                sourceMap: componentsSourceMap,
                importLoaders: 1,
                exportType: 'string',
                esModule: false,
            },
        },
        {
            loader: postCssLoaderPath,
            options: {
                implementation: postCss,
                postcssOptions: postcssOptionsCreator(componentsSourceMap, false),
            },
        },
    ];
    const globalStyleLoaders = [
        {
            loader: mini_css_extract_plugin_1.default.loader,
        },
        {
            loader: require.resolve('css-loader'),
            options: {
                url: false,
                sourceMap: !!cssSourceMap,
                importLoaders: 1,
            },
        },
        {
            loader: postCssLoaderPath,
            options: {
                implementation: postCss,
                postcssOptions: postcssOptionsCreator(false, true),
                sourceMap: !!cssSourceMap,
            },
        },
    ];
    const styleLanguages = [
        {
            extensions: ['css'],
            use: [],
        },
        {
            extensions: ['scss'],
            use: [
                {
                    loader: require.resolve('resolve-url-loader'),
                    options: {
                        sourceMap: cssSourceMap,
                    },
                },
                {
                    loader: require.resolve('sass-loader'),
                    options: getSassLoaderOptions(root, sassImplementation, includePaths, false, !!buildOptions.verbose, !!buildOptions.preserveSymlinks),
                },
            ],
        },
        {
            extensions: ['sass'],
            use: [
                {
                    loader: require.resolve('resolve-url-loader'),
                    options: {
                        sourceMap: cssSourceMap,
                    },
                },
                {
                    loader: require.resolve('sass-loader'),
                    options: getSassLoaderOptions(root, sassImplementation, includePaths, true, !!buildOptions.verbose, !!buildOptions.preserveSymlinks),
                },
            ],
        },
        {
            extensions: ['less'],
            use: [
                {
                    loader: require.resolve('less-loader'),
                    options: {
                        implementation: require('less'),
                        sourceMap: cssSourceMap,
                        lessOptions: {
                            javascriptEnabled: true,
                            paths: includePaths,
                        },
                    },
                },
            ],
        },
    ];
    return {
        module: {
            rules: styleLanguages.map(({ extensions, use }) => ({
                test: new RegExp(`\\.(?:${extensions.join('|')})$`, 'i'),
                rules: [
                    // Setup processing rules for global and component styles
                    {
                        oneOf: [
                            // Global styles are only defined global styles
                            {
                                use: globalStyleLoaders,
                                resourceQuery: /\?ngGlobalStyle/,
                            },
                            // Component styles are all styles except defined global styles
                            {
                                use: componentStyleLoaders,
                                resourceQuery: /\?ngResource/,
                            },
                        ],
                    },
                    { use },
                ],
            })),
        },
        optimization: {
            minimizer: buildOptions.optimization.styles.minify
                ? [
                    new css_optimizer_plugin_1.CssOptimizerPlugin({
                        supportedBrowsers: buildOptions.supportedBrowsers,
                    }),
                ]
                : undefined,
        },
        plugins: extraPlugins,
    };
}
exports.getStylesConfig = getStylesConfig;
function getSassLoaderOptions(root, implementation, includePaths, indentedSyntax, verbose, preserveSymlinks) {
    return implementation instanceof sass_service_1.SassWorkerImplementation
        ? {
            sourceMap: true,
            api: 'modern',
            implementation,
            // Webpack importer is only implemented in the legacy API and we have our own custom Webpack importer.
            // See: https://github.com/webpack-contrib/sass-loader/blob/997f3eb41d86dd00d5fa49c395a1aeb41573108c/src/utils.js#L642-L651
            webpackImporter: false,
            sassOptions: (loaderContext) => ({
                importers: [getSassResolutionImporter(loaderContext, root, preserveSymlinks)],
                loadPaths: includePaths,
                // Use expanded as otherwise sass will remove comments that are needed for autoprefixer
                // Ex: /* autoprefixer grid: autoplace */
                // See: https://github.com/webpack-contrib/sass-loader/blob/45ad0be17264ceada5f0b4fb87e9357abe85c4ff/src/getSassOptions.js#L68-L70
                style: 'expanded',
                // Silences compiler warnings from 3rd party stylesheets
                quietDeps: !verbose,
                verbose,
                syntax: indentedSyntax ? 'indented' : 'scss',
                sourceMapIncludeSources: true,
            }),
        }
        : {
            sourceMap: true,
            api: 'legacy',
            implementation,
            sassOptions: {
                importer: (url, from) => {
                    if (url.charAt(0) === '~') {
                        throw new Error(`'${from}' imports '${url}' with a tilde. Usage of '~' in imports is no longer supported.`);
                    }
                    return null;
                },
                // Prevent use of `fibers` package as it no longer works in newer Node.js versions
                fiber: false,
                indentedSyntax,
                // bootstrap-sass requires a minimum precision of 8
                precision: 8,
                includePaths,
                // Use expanded as otherwise sass will remove comments that are needed for autoprefixer
                // Ex: /* autoprefixer grid: autoplace */
                // See: https://github.com/webpack-contrib/sass-loader/blob/45ad0be17264ceada5f0b4fb87e9357abe85c4ff/src/getSassOptions.js#L68-L70
                outputStyle: 'expanded',
                // Silences compiler warnings from 3rd party stylesheets
                quietDeps: !verbose,
                verbose,
            },
        };
}
function getSassResolutionImporter(loaderContext, root, preserveSymlinks) {
    const commonResolverOptions = {
        conditionNames: ['sass', 'style'],
        mainFields: ['sass', 'style', 'main', '...'],
        extensions: ['.scss', '.sass', '.css'],
        restrictions: [/\.((sa|sc|c)ss)$/i],
        preferRelative: true,
        symlinks: !preserveSymlinks,
    };
    // Sass also supports import-only files. If you name a file <name>.import.scss, it will only be loaded for imports, not for @uses.
    // See: https://sass-lang.com/documentation/at-rules/import#import-only-files
    const resolveImport = loaderContext.getResolve({
        ...commonResolverOptions,
        dependencyType: 'sass-import',
        mainFiles: ['_index.import', '_index', 'index.import', 'index', '...'],
    });
    const resolveModule = loaderContext.getResolve({
        ...commonResolverOptions,
        dependencyType: 'sass-module',
        mainFiles: ['_index', 'index', '...'],
    });
    return {
        findFileUrl: async (url, { fromImport, previousResolvedModules }) => {
            if (url.charAt(0) === '.') {
                // Let Sass handle relative imports.
                return null;
            }
            const resolve = fromImport ? resolveImport : resolveModule;
            // Try to resolve from root of workspace
            let result = await tryResolve(resolve, root, url);
            // Try to resolve from previously resolved modules.
            if (!result && previousResolvedModules) {
                for (const path of previousResolvedModules) {
                    result = await tryResolve(resolve, path, url);
                    if (result) {
                        break;
                    }
                }
            }
            return result ? (0, node_url_1.pathToFileURL)(result) : null;
        },
    };
}
async function tryResolve(resolve, root, url) {
    try {
        return await resolve(root, url);
    }
    catch {
        // Try to resolve a partial file
        // @use '@material/button/button' as mdc-button;
        // `@material/button/button` -> `@material/button/_button`
        const lastSlashIndex = url.lastIndexOf('/');
        const underscoreIndex = lastSlashIndex + 1;
        if (underscoreIndex > 0 && url.charAt(underscoreIndex) !== '_') {
            const partialFileUrl = `${url.slice(0, underscoreIndex)}_${url.slice(underscoreIndex)}`;
            return resolve(root, partialFileUrl).catch(() => undefined);
        }
    }
    return undefined;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvYnVpbGRfYW5ndWxhci9zcmMvd2VicGFjay9jb25maWdzL3N0eWxlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVILHNGQUEyRDtBQUMzRCxnREFBa0M7QUFDbEMsdUNBQXlDO0FBR3pDLDBEQUdpQztBQUNqQyx3RUFBZ0Y7QUFFaEYseUVBQWdFO0FBQ2hFLG1EQUFxRTtBQUNyRSx3Q0FLb0I7QUFDcEIsMEVBQXFFO0FBQ3JFLDRFQUF1RTtBQUN2RSw4Q0FJMEI7QUFFMUIsa0RBQWtEO0FBQzNDLEtBQUssVUFBVSxlQUFlLENBQUMsR0FBeUI7SUFDN0QsTUFBTSxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsTUFBTSxFQUFFLFdBQVcsRUFBRSxHQUFHLEdBQUcsQ0FBQztJQUN4RCxNQUFNLFlBQVksR0FBNkIsRUFBRSxDQUFDO0lBRWxELFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSx3Q0FBOEIsQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztJQUU1RSxNQUFNLFlBQVksR0FBRyxZQUFZLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQztJQUVuRCw0QkFBNEI7SUFDNUIsTUFBTSxVQUFVLEdBQUcsSUFBQSw2QkFBbUIsRUFBQyxZQUFZLENBQUMsYUFBYSxDQUFDLENBQUM7SUFFbkUsa0NBQWtDO0lBQ2xDLE1BQU0sWUFBWSxHQUNoQixZQUFZLENBQUMsd0JBQXdCLEVBQUUsWUFBWSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7SUFFL0YseUJBQXlCO0lBQ3pCLElBQUks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LENBQUMsSUFBSSxHQUFHLENBQUMsS0FBSyxDQUFDLGVBQWUsQ0FBQyxFQUFFLENBQUM7WUFFeEYsT0FBTyxPQUFPLENBQUMsSUFBSSxFQUFFLGNBQWMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxTQUFTLENBQUMsQ0FBQztTQUM3RDtLQUNGO0lBRUQsT0FBTyxTQUFTLENBQUM7QUFDbkIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgTWluaUNzc0V4dHJhY3RQbHVnaW4gZnJvbSAnbWluaS1jc3MtZXh0cmFjdC1wbHVnaW4nO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdub2RlOnBhdGgnO1xuaW1wb3J0IHsgcGF0aFRvRmlsZVVSTCB9IGZyb20gJ25vZGU6dXJsJztcbmltcG9ydCB0eXBlIHsgRmlsZUltcG9ydGVyIH0gZnJvbSAnc2Fzcyc7XG5pbXBvcnQgdHlwZSB7IENvbmZpZ3VyYXRpb24sIExvYWRlckNvbnRleHQsIFJ1bGVTZXRVc2VJdGVtIH0gZnJvbSAnd2VicGFjayc7XG5pbXBvcnQge1xuICBGaWxlSW1wb3J0ZXJXaXRoUmVxdWVzdENvbnRleHRPcHRpb25zLFxuICBTYXNzV29ya2VySW1wbGVtZW50YXRpb24sXG59IGZyb20gJy4uLy4uL3Nhc3Mvc2Fzcy1zZXJ2aWNlJztcbmltcG9ydCB7IFNhc3NMZWdhY3lXb3JrZXJJbXBsZW1lbnRhdGlvbiB9IGZyb20gJy4uLy4uL3Nhc3Mvc2Fzcy1zZXJ2aWNlLWxlZ2FjeSc7XG5pbXBvcnQgeyBXZWJwYWNrQ29uZmlnT3B0aW9ucyB9IGZyb20gJy4uLy4uL3V0aWxzL2J1aWxkLW9wdGlvbnMnO1xuaW1wb3J0IHsgdXNlTGVnYWN5U2FzcyB9IGZyb20gJy4uLy4uL3V0aWxzL2Vudmlyb25tZW50LW9wdGlvbnMnO1xuaW1wb3J0IHsgZmluZFRhaWx3aW5kQ29uZmlndXJhdGlvbkZpbGUgfSBmcm9tICcuLi8uLi91dGlscy90YWlsd2luZCc7XG5pbXBvcnQge1xuICBBbnlDb21wb25lbnRTdHlsZUJ1ZGdldENoZWNrZXIsXG4gIFBvc3Rjc3NDbGlSZXNvdXJjZXMsXG4gIFJlbW92ZUhhc2hQbHVnaW4sXG4gIFN1cHByZXNzRXh0cmFjdGVkVGV4dENodW5rc1dlYnBhY2tQbHVnaW4sXG59IGZyb20gJy4uL3BsdWdpbnMnO1xuaW1wb3J0IHsgQ3NzT3B0aW1pemVyUGx1Z2luIH0gZnJvbSAnLi4vcGx1Z2lucy9jc3Mtb3B0aW1pemVyLXBsdWdpbic7XG5pbXBvcnQgeyBTdHlsZXNXZWJwYWNrUGx1Z2luIH0gZnJvbSAnLi4vcGx1Z2lucy9zdHlsZXMtd2VicGFjay1wbHVnaW4nO1xuaW1wb3J0IHtcbiAgYXNzZXROYW1lVGVtcGxhdGVGYWN0b3J5LFxuICBnZXRPdXRwdXRIYXNoRm9ybWF0LFxuICBub3JtYWxpemVHbG9iYWxTdHlsZXMsXG59IGZyb20gJy4uL3V0aWxzL2hlbHBlcnMnO1xuXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbWF4LWxpbmVzLXBlci1mdW5jdGlvblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldFN0eWxlc0NvbmZpZyh3Y286IFdlYnBhY2tDb25maWdPcHRpb25zKTogUHJvbWlzZTxDb25maWd1cmF0aW9uPiB7XG4gIGNvbnN0IHsgcm9vdCwgYnVpbGRPcHRpb25zLCBsb2dnZXIsIHByb2plY3RSb290IH0gPSB3Y287XG4gIGNvbnN0IGV4dHJhUGx1Z2luczogQ29uZmlndXJhdGlvblsncGx1Z2lucyddID0gW107XG5cbiAgZXh0cmFQbHVnaW5zLnB1c2gobmV3IEFueUNvbXBvbmVudFN0eWxlQnVkZ2V0Q2hlY2tlcihidWlsZE9wdGlvbnMuYnVkZ2V0cykpO1xuXG4gIGNvbnN0IGNzc1NvdXJjZU1hcCA9IGJ1aWxkT3B0aW9ucy5zb3VyY2VNYXAuc3R5bGVzO1xuXG4gIC8vIERldGVybWluZSBoYXNoaW5nIGZvcm1hdC5cbiAgY29uc3QgaGFzaEZvcm1hdCA9IGdldE91dHB1dEhhc2hGb3JtYXQoYnVpbGRPcHRpb25zLm91dHB1dEhhc2hpbmcpO1xuXG4gIC8vIHVzZSBpbmNsdWRlUGF0aHMgZnJvbSBhcHBDb25maWdcbiAgY29uc3QgaW5jbHVkZVBhdGhzID1cbiAgICBidWlsZE9wdGlvbnMuc3R5bGVQcmVwcm9jZXNzb3JPcHRpb25zPy5pbmNsdWRlUGF0aHM/Lm1hcCgocCkgPT4gcGF0aC5yZXNvbHZlKHJvb3QsIHApKSA/PyBbXTtcblxuICAvLyBQcm9jZXNzIGdsb2JhbCBzdHlsZXMuXG4gIGlmIChidWlsZE9wdGlvbnMuc3R5bGVzLmxlbmd0aCA+IDApIHtcbiAgICBjb25zdCB7IGVudHJ5UG9pbnRzLCBub0luamVjdE5hbWVzIH0gPSBub3JtYWxpemVHbG9iYWxTdHlsZXMoYnVpbGRPcHRpb25zLnN0eWxlcyk7XG4gICAgZXh0cmFQbHVnaW5zLnB1c2goXG4gICAgICBuZXcgU3R5bGVzV2VicGFja1BsdWdpbih7XG4gICAgICAgIHJvb3QsXG4gICAgICAgIGVudHJ5UG9pbnRzLFxuICAgICAgICBwcmVzZXJ2ZVN5bWxpbmtzOiBidWlsZE9wdGlvbnMucHJlc2VydmVTeW1saW5rcyxcbiAgICAgIH0pLFxuICAgICk7XG5cbiAgICBpZiAobm9JbmplY3ROYW1lcy5sZW5ndGggPiAwKSB7XG4gICAgICAvLyBBZGQgcGx1Z2luIHRvIHJlbW92ZSBoYXNoZXMgZnJvbSBsYXp5IHN0eWxlcy5cbiAgICAgIGV4dHJhUGx1Z2lucy5wdXNoKG5ldyBSZW1vdmVIYXNoUGx1Z2luKHsgY2h1bmtOYW1lczogbm9JbmplY3ROYW1lcywgaGFzaEZvcm1hdCB9KSk7XG4gICAgfVxuICB9XG5cbiAgY29uc3Qgc2Fzc0ltcGxlbWVudGF0aW9uID0gdXNlTGVnYWN5U2Fzc1xuICAgID8gbmV3IFNhc3NMZWdhY3lXb3JrZXJJbXBsZW1lbnRhdGlvbigpXG4gICAgOiBuZXcgU2Fzc1dvcmtlckltcGxlbWVudGF0aW9uKCk7XG5cbiAgZXh0cmFQbHVnaW5zLnB1c2goe1xuICAgIGFwcGx5KGNvbXBpbGVyKSB7XG4gICAgICBjb21waWxlci5ob29rcy5zaHV0ZG93bi50YXAoJ3Nhc3Mtd29ya2VyJywgKCkgPT4ge1xuICAgICAgICBzYXNzSW1wbGVtZW50YXRpb24uY2xvc2UoKTtcbiAgICAgIH0pO1xuICAgIH0sXG4gIH0pO1xuXG4gIGNvbnN0IGFzc2V0TmFtZVRlbXBsYXRlID0gYXNzZXROYW1lVGVtcGxhdGVGYWN0b3J5KGhhc2hGb3JtYXQpO1xuXG4gIGNvbnN0IGV4dHJhUG9zdGNzc1BsdWdpbnM6IGltcG9ydCgncG9zdGNzcycpLlBsdWdpbltdID0gW107XG5cbiAgLy8gQXR0ZW1wdCB0byBzZXR1cCBUYWlsd2luZCBDU1NcbiAgLy8gT25seSBsb2FkIFRhaWx3aW5kIENTUyBwbHVnaW4gaWYgY29uZmlndXJhdGlvbiBmaWxlIHdhcyBmb3VuZC5cbiAgLy8gVGhpcyBhY3RzIGFzIGEgZ3VhcmQgdG8gZW5zdXJlIHRoZSBwcm9qZWN0IGFjdHVhbGx5IHdhbnRzIHRvIHVzZSBUYWlsd2luZCBDU1MuXG4gIC8vIFRoZSBwYWNrYWdlIG1heSBiZSB1bmtub3duaW5nbHkgcHJlc2VudCBkdWUgdG8gYSB0aGlyZC1wYXJ0eSB0cmFuc2l0aXZlIHBhY2thZ2UgZGVwZW5kZW5jeS5cbiAgY29uc3QgdGFpbHdpbmRDb25maWdQYXRoID0gYXdhaXQgZmluZFRhaWx3aW5kQ29uZmlndXJhdGlvbkZpbGUocm9vdCwgcHJvamVjdFJvb3QpO1xuICBpZiAodGFpbHdpbmRDb25maWdQYXRoKSB7XG4gICAgbGV0IHRhaWx3aW5kUGFja2FnZVBhdGg7XG4gICAgdHJ5IHtcbiAgICAgIHRhaWx3aW5kUGFja2FnZVBhdGggPSByZXF1aXJlLnJlc29sdmUoJ3RhaWx3aW5kY3NzJywgeyBwYXRoczogW3Jvb3RdIH0pO1xuICAgIH0gY2F0Y2gge1xuICAgICAgY29uc3QgcmVsYXRpdmVUYWlsd2luZENvbmZpZ1BhdGggPSBwYXRoLnJlbGF0aXZlKHJvb3QsIHRhaWx3aW5kQ29uZmlnUGF0aCk7XG4gICAgICBsb2dnZXIud2FybihcbiAgICAgICAgYFRhaWx3aW5kIENTUyBjb25maWd1cmF0aW9uIGZpbGUgZm91bmQgKCR7cmVsYXRpdmVUYWlsd2luZENvbmZpZ1BhdGh9KWAgK1xuICAgICAgICAgIGAgYnV0IHRoZSAndGFpbHdpbmRjc3MnIHBhY2thZ2UgaXMgbm90IGluc3RhbGxlZC5gICtcbiAgICAgICAgICBgIFRvIGVuYWJsZSBUYWlsd2luZCBDU1MsIHBsZWFzZSBpbnN0YWxsIHRoZSAndGFpbHdpbmRjc3MnIHBhY2thZ2UuYCxcbiAgICAgICk7XG4gICAgfVxuICAgIGlmICh0YWlsd2luZFBhY2thZ2VQYXRoKSB7XG4gICAgICBleHRyYVBvc3Rjc3NQbHVnaW5zLnB1c2gocmVxdWlyZSh0YWlsd2luZFBhY2thZ2VQYXRoKSh7IGNvbmZpZzogdGFpbHdpbmRDb25maWdQYXRoIH0pKTtcbiAgICB9XG4gIH1cblxuICBjb25zdCBhdXRvcHJlZml4ZXI6IHR5cGVvZiBpbXBvcnQoJ2F1dG9wcmVmaXhlcicpID0gcmVxdWlyZSgnYXV0b3ByZWZpeGVyJyk7XG5cbiAgY29uc3QgcG9zdGNzc09wdGlvbnNDcmVhdG9yID0gKGlubGluZVNvdXJjZW1hcHM6IGJvb2xlYW4sIGV4dHJhY3RlZDogYm9vbGVhbikgPT4ge1xuICAgIGNvbnN0IG9wdGlvbkdlbmVyYXRvciA9IChsb2FkZXI6IExvYWRlckNvbnRleHQ8dW5rbm93bj4pID0+ICh7XG4gICAgICBtYXA6IGlubGluZVNvdXJjZW1hcHNcbiAgICAgICAgPyB7XG4gICAgICAgICAgICBpbmxpbmU6IHRydWUsXG4gICAgICAgICAgICBhbm5vdGF0aW9uOiBmYWxzZSxcbiAgICAgICAgICB9XG4gICAgICAgIDogdW5kZWZpbmVkLFxuICAgICAgcGx1Z2luczogW1xuICAgICAgICBQb3N0Y3NzQ2xpUmVzb3VyY2VzKHtcbiAgICAgICAgICBiYXNlSHJlZjogYnVpbGRPcHRpb25zLmJhc2VIcmVmLFxuICAgICAgICAgIGRlcGxveVVybDogYnVpbGRPcHRpb25zLmRlcGxveVVybCxcbiAgICAgICAgICByZXNvdXJjZXNPdXRwdXRQYXRoOiBidWlsZE9wdGlvbnMucmVzb3VyY2VzT3V0cHV0UGF0aCxcbiAgICAgICAgICBsb2FkZXIsXG4gICAgICAgICAgZmlsZW5hbWU6IGFzc2V0TmFtZVRlbXBsYXRlLFxuICAgICAgICAgIGVtaXRGaWxlOiBidWlsZE9wdGlvbnMucGxhdGZvcm0gIT09ICdzZXJ2ZXInLFxuICAgICAgICAgIGV4dHJhY3RlZCxcbiAgICAgICAgfSksXG4gICAgICAgIC4uLmV4dHJhUG9zdGNzc1BsdWdpbnMsXG4gICAgICAgIGF1dG9wcmVmaXhlcih7XG4gICAgICAgICAgaWdub3JlVW5rbm93blZlcnNpb25zOiB0cnVlLFxuICAgICAgICAgIG92ZXJyaWRlQnJvd3NlcnNsaXN0OiBidWlsZE9wdGlvbnMuc3VwcG9ydGVkQnJvd3NlcnMsXG4gICAgICAgIH0pLFxuICAgICAgXSxcbiAgICB9KTtcbiAgICAvLyBwb3N0Y3NzLWxvYWRlciBmYWlscyB3aGVuIHRyeWluZyB0byBkZXRlcm1pbmUgY29uZmlndXJhdGlvbiBmaWxlcyBmb3IgZGF0YSBVUklzXG4gICAgb3B0aW9uR2VuZXJhdG9yLmNvbmZpZyA9IGZhbHNlO1xuXG4gICAgcmV0dXJuIG9wdGlvbkdlbmVyYXRvcjtcbiAgfTtcblxuICBsZXQgY29tcG9uZW50c1NvdXJjZU1hcCA9ICEhY3NzU291cmNlTWFwO1xuICBpZiAoY3NzU291cmNlTWFwKSB7XG4gICAgaWYgKGJ1aWxkT3B0aW9ucy5vcHRpbWl6YXRpb24uc3R5bGVzLm1pbmlmeSkge1xuICAgICAgLy8gTmV2ZXIgdXNlIGNvbXBvbmVudCBjc3Mgc291cmNlbWFwIHdoZW4gc3R5bGUgb3B0aW1pemF0aW9ucyBhcmUgb24uXG4gICAgICAvLyBJdCB3aWxsIGp1c3QgaW5jcmVhc2UgYnVuZGxlIHNpemUgd2l0aG91dCBvZmZlcmluZyBnb29kIGRlYnVnIGV4cGVyaWVuY2UuXG4gICAgICBsb2dnZXIud2FybihcbiAgICAgICAgJ0NvbXBvbmVudHMgc3R5bGVzIHNvdXJjZW1hcHMgYXJlIG5vdCBnZW5lcmF0ZWQgd2hlbiBzdHlsZXMgb3B0aW1pemF0aW9uIGlzIGVuYWJsZWQuJyxcbiAgICAgICk7XG4gICAgICBjb21wb25lbnRzU291cmNlTWFwID0gZmFsc2U7XG4gICAgfSBlbHNlIGlmIChidWlsZE9wdGlvbnMuc291cmNlTWFwLmhpZGRlbikge1xuICAgICAgLy8gSW5saW5lIGFsbCBzb3VyY2VtYXAgdHlwZXMgZXhjZXB0IGhpZGRlbiBvbmVzLCB3aGljaCBhcmUgdGhlIHNhbWUgYXMgbm8gc291cmNlbWFwc1xuICAgICAgLy8gZm9yIGNvbXBvbmVudCBjc3MuXG4gICAgICBsb2dnZXIud2FybignQ29tcG9uZW50cyBzdHlsZXMgc291cmNlbWFwcyBhcmUgbm90IGdlbmVyYXRlZCB3aGVuIHNvdXJjZW1hcHMgYXJlIGhpZGRlbi4nKTtcbiAgICAgIGNvbXBvbmVudHNTb3VyY2VNYXAgPSBmYWxzZTtcbiAgICB9XG4gIH1cblxuICAvLyBleHRyYWN0IGdsb2JhbCBjc3MgZnJvbSBqcyBmaWxlcyBpbnRvIG93biBjc3MgZmlsZS5cbiAgZXh0cmFQbHVnaW5zLnB1c2gobmV3IE1pbmlDc3NFeHRyYWN0UGx1Z2luKHsgZmlsZW5hbWU6IGBbbmFtZV0ke2hhc2hGb3JtYXQuZXh0cmFjdH0uY3NzYCB9KSk7XG5cbiAgaWYgKCFidWlsZE9wdGlvbnMuaG1yKSB7XG4gICAgLy8gZG9uJ3QgcmVtb3ZlIGAuanNgIGZpbGVzIGZvciBgLmNzc2Agd2hlbiB3ZSBhcmUgdXNpbmcgSE1SIHRoZXNlIGNvbnRhaW4gSE1SIGFjY2VwdCBjb2Rlcy5cbiAgICAvLyBzdXBwcmVzcyBlbXB0eSAuanMgZmlsZXMgaW4gY3NzIG9ubHkgZW50cnkgcG9pbnRzLlxuICAgIGV4dHJhUGx1Z2lucy5wdXNoKG5ldyBTdXBwcmVzc0V4dHJhY3RlZFRleHRDaHVua3NXZWJwYWNrUGx1Z2luKCkpO1xuICB9XG5cbiAgY29uc3QgcG9zdENzcyA9IHJlcXVpcmUoJ3Bvc3Rjc3MnKTtcbiAgY29uc3QgcG9zdENzc0xvYWRlclBhdGggPSByZXF1aXJlLnJlc29sdmUoJ3Bvc3Rjc3MtbG9hZGVyJyk7XG5cbiAgY29uc3QgY29tcG9uZW50U3R5bGVMb2FkZXJzOiBSdWxlU2V0VXNlSXRlbVtdID0gW1xuICAgIHtcbiAgICAgIGxvYWRlcjogcmVxdWlyZS5yZXNvbHZlKCdjc3MtbG9hZGVyJyksXG4gICAgICBvcHRpb25zOiB7XG4gICAgICAgIHVybDogZmFsc2UsXG4gICAgICAgIHNvdXJjZU1hcDogY29tcG9uZW50c1NvdXJjZU1hcCxcbiAgICAgICAgaW1wb3J0TG9hZGVyczogMSxcbiAgICAgICAgZXhwb3J0VHlwZTogJ3N0cmluZycsXG4gICAgICAgIGVzTW9kdWxlOiBmYWxzZSxcbiAgICAgIH0sXG4gICAgfSxcbiAgICB7XG4gICAgICBsb2FkZXI6IHBvc3RDc3NMb2FkZXJQYXRoLFxuICAgICAgb3B0aW9uczoge1xuICAgICAgICBpbXBsZW1lbnRhdGlvbjogcG9zdENzcyxcbiAgICAgICAgcG9zdGNzc09wdGlvbnM6IHBvc3Rjc3NPcHRpb25zQ3JlYXRvcihjb21wb25lbnRzU291cmNlTWFwLCBmYWxzZSksXG4gICAgICB9LFxuICAgIH0sXG4gIF07XG5cbiAgY29uc3QgZ2xvYmFsU3R5bGVMb2FkZXJzOiBSdWxlU2V0VXNlSXRlbVtdID0gW1xuICAgIHtcbiAgICAgIGxvYWRlcjogTWluaUNzc0V4dHJhY3RQbHVnaW4ubG9hZGVyLFxuICAgIH0sXG4gICAge1xuICAgICAgbG9hZGVyOiByZXF1aXJlLnJlc29sdmUoJ2Nzcy1sb2FkZXInKSxcbiAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgdXJsOiBmYWxzZSxcbiAgICAgICAgc291cmNlTWFwOiAhIWNzc1NvdXJjZU1hcCxcbiAgICAgICAgaW1wb3J0TG9hZGVyczogMSxcbiAgICAgIH0sXG4gICAgfSxcbiAgICB7XG4gICAgICBsb2FkZXI6IHBvc3RDc3NMb2FkZXJQYXRoLFxuICAgICAgb3B0aW9uczoge1xuICAgICAgICBpbXBsZW1lbnRhdGlvbjogcG9zdENzcyxcbiAgICAgICAgcG9zdGNzc09wdGlvbnM6IHBvc3Rjc3NPcHRpb25zQ3JlYXRvcihmYWxzZSwgdHJ1ZSksXG4gICAgICAgIHNvdXJjZU1hcDogISFjc3NTb3VyY2VNYXAsXG4gICAgICB9LFxuICAgIH0sXG4gIF07XG5cbiAgY29uc3Qgc3R5bGVMYW5ndWFnZXM6IHtcbiAgICBleHRlbnNpb25zOiBzdHJpbmdbXTtcbiAgICB1c2U6IFJ1bGVTZXRVc2VJdGVtW107XG4gIH1bXSA9IFtcbiAgICB7XG4gICAgICBleHRlbnNpb25zOiBbJ2NzcyddLFxuICAgICAgdXNlOiBbXSxcbiAgICB9LFxuICAgIHtcbiAgICAgIGV4dGVuc2lvbnM6IFsnc2NzcyddLFxuICAgICAgdXNlOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBsb2FkZXI6IHJlcXVpcmUucmVzb2x2ZSgncmVzb2x2ZS11cmwtbG9hZGVyJyksXG4gICAgICAgICAgb3B0aW9uczoge1xuICAgICAgICAgICAgc291cmNlTWFwOiBjc3NTb3VyY2VNYXAsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGxvYWRlcjogcmVxdWlyZS5yZXNvbHZlKCdzYXNzLWxvYWRlcicpLFxuICAgICAgICAgIG9wdGlvbnM6IGdldFNhc3NMb2FkZXJPcHRpb25zKFxuICAgICAgICAgICAgcm9vdCxcbiAgICAgICAgICAgIHNhc3NJbXBsZW1lbnRhdGlvbixcbiAgICAgICAgICAgIGluY2x1ZGVQYXRocyxcbiAgICAgICAgICAgIGZhbHNlLFxuICAgICAgICAgICAgISFidWlsZE9wdGlvbnMudmVyYm9zZSxcbiAgICAgICAgICAgICEhYnVpbGRPcHRpb25zLnByZXNlcnZlU3ltbGlua3MsXG4gICAgICAgICAgKSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSxcbiAgICB7XG4gICAgICBleHRlbnNpb25zOiBbJ3Nhc3MnXSxcbiAgICAgIHVzZTogW1xuICAgICAgICB7XG4gICAgICAgICAgbG9hZGVyOiByZXF1aXJlLnJlc29sdmUoJ3Jlc29sdmUtdXJsLWxvYWRlcicpLFxuICAgICAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgICAgIHNvdXJjZU1hcDogY3NzU291cmNlTWFwLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBsb2FkZXI6IHJlcXVpcmUucmVzb2x2ZSgnc2Fzcy1sb2FkZXInKSxcbiAgICAgICAgICBvcHRpb25zOiBnZXRTYXNzTG9hZGVyT3B0aW9ucyhcbiAgICAgICAgICAgIHJvb3QsXG4gICAgICAgICAgICBzYXNzSW1wbGVtZW50YXRpb24sXG4gICAgICAgICAgICBpbmNsdWRlUGF0aHMsXG4gICAgICAgICAgICB0cnVlLFxuICAgICAgICAgICAgISFidWlsZE9wdGlvbnMudmVyYm9zZSxcbiAgICAgICAgICAgICEhYnVpbGRPcHRpb25zLnByZXNlcnZlU3ltbGlua3MsXG4gICAgICAgICAgKSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSxcbiAgICB7XG4gICAgICBleHRlbnNpb25zOiBbJ2xlc3MnXSxcbiAgICAgIHVzZTogW1xuICAgICAgICB7XG4gICAgICAgICAgbG9hZGVyOiByZXF1aXJlLnJlc29sdmUoJ2xlc3MtbG9hZGVyJyksXG4gICAgICAgICAgb3B0aW9uczoge1xuICAgICAgICAgICAgaW1wbGVtZW50YXRpb246IHJlcXVpcmUoJ2xlc3MnKSxcbiAgICAgICAgICAgIHNvdXJjZU1hcDogY3NzU291cmNlTWFwLFxuICAgICAgICAgICAgbGVzc09wdGlvbnM6IHtcbiAgICAgICAgICAgICAgamF2YXNjcmlwdEVuYWJsZWQ6IHRydWUsXG4gICAgICAgICAgICAgIHBhdGhzOiBpbmNsdWRlUGF0aHMsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH0sXG4gIF07XG5cbiAgcmV0dXJuIHtcbiAgICBtb2R1bGU6IHtcbiAgICAgIHJ1bGVzOiBzdHlsZUxhbmd1YWdlcy5tYXAoKHsgZXh0ZW5zaW9ucywgdXNlIH0pID0+ICh7XG4gICAgICAgIHRlc3Q6IG5ldyBSZWdFeHAoYFxcXFwuKD86JHtleHRlbnNpb25zLmpvaW4oJ3wnKX0pJGAsICdpJyksXG4gICAgICAgIHJ1bGVzOiBbXG4gICAgICAgICAgLy8gU2V0dXAgcHJvY2Vzc2luZyBydWxlcyBmb3IgZ2xvYmFsIGFuZCBjb21wb25lbnQgc3R5bGVzXG4gICAgICAgICAge1xuICAgICAgICAgICAgb25lT2Y6IFtcbiAgICAgICAgICAgICAgLy8gR2xvYmFsIHN0eWxlcyBhcmUgb25seSBkZWZpbmVkIGdsb2JhbCBzdHlsZXNcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHVzZTogZ2xvYmFsU3R5bGVMb2FkZXJzLFxuICAgICAgICAgICAgICAgIHJlc291cmNlUXVlcnk6IC9cXD9uZ0dsb2JhbFN0eWxlLyxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgLy8gQ29tcG9uZW50IHN0eWxlcyBhcmUgYWxsIHN0eWxlcyBleGNlcHQgZGVmaW5lZCBnbG9iYWwgc3R5bGVzXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB1c2U6IGNvbXBvbmVudFN0eWxlTG9hZGVycyxcbiAgICAgICAgICAgICAgICByZXNvdXJjZVF1ZXJ5OiAvXFw/bmdSZXNvdXJjZS8sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgeyB1c2UgfSxcbiAgICAgICAgXSxcbiAgICAgIH0pKSxcbiAgICB9LFxuICAgIG9wdGltaXphdGlvbjoge1xuICAgICAgbWluaW1pemVyOiBidWlsZE9wdGlvbnMub3B0aW1pemF0aW9uLnN0eWxlcy5taW5pZnlcbiAgICAgICAgPyBbXG4gICAgICAgICAgICBuZXcgQ3NzT3B0aW1pemVyUGx1Z2luKHtcbiAgICAgICAgICAgICAgc3VwcG9ydGVkQnJvd3NlcnM6IGJ1aWxkT3B0aW9ucy5zdXBwb3J0ZWRCcm93c2VycyxcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgIF1cbiAgICAgICAgOiB1bmRlZmluZWQsXG4gICAgfSxcbiAgICBwbHVnaW5zOiBleHRyYVBsdWdpbnMsXG4gIH07XG59XG5cbmZ1bmN0aW9uIGdldFNhc3NMb2FkZXJPcHRpb25zKFxuICByb290OiBzdHJpbmcsXG4gIGltcGxlbWVudGF0aW9uOiBTYXNzV29ya2VySW1wbGVtZW50YXRpb24gfCBTYXNzTGVnYWN5V29ya2VySW1wbGVtZW50YXRpb24sXG4gIGluY2x1ZGVQYXRoczogc3RyaW5nW10sXG4gIGluZGVudGVkU3ludGF4OiBib29sZWFuLFxuICB2ZXJib3NlOiBib29sZWFuLFxuICBwcmVzZXJ2ZVN5bWxpbmtzOiBib29sZWFuLFxuKTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4ge1xuICByZXR1cm4gaW1wbGVtZW50YXRpb24gaW5zdGFuY2VvZiBTYXNzV29ya2VySW1wbGVtZW50YXRpb25cbiAgICA/IHtcbiAgICAgICAgc291cmNlTWFwOiB0cnVlLFxuICAgICAgICBhcGk6ICdtb2Rlcm4nLFxuICAgICAgICBpbXBsZW1lbnRhdGlvbixcbiAgICAgICAgLy8gV2VicGFjayBpbXBvcnRlciBpcyBvbmx5IGltcGxlbWVudGVkIGluIHRoZSBsZWdhY3kgQVBJIGFuZCB3ZSBoYXZlIG91ciBvd24gY3VzdG9tIFdlYnBhY2sgaW1wb3J0ZXIuXG4gICAgICAgIC8vIFNlZTogaHR0cHM6Ly9naXRodWIuY29tL3dlYnBhY2stY29udHJpYi9zYXNzLWxvYWRlci9ibG9iLzk5N2YzZWI0MWQ4NmRkMDBkNWZhNDljMzk1YTFhZWI0MTU3MzEwOGMvc3JjL3V0aWxzLmpzI0w2NDItTDY1MVxuICAgICAgICB3ZWJwYWNrSW1wb3J0ZXI6IGZhbHNlLFxuICAgICAgICBzYXNzT3B0aW9uczogKGxvYWRlckNvbnRleHQ6IExvYWRlckNvbnRleHQ8e30+KSA9PiAoe1xuICAgICAgICAgIGltcG9ydGVyczogW2dldFNhc3NSZXNvbHV0aW9uSW1wb3J0ZXIobG9hZGVyQ29udGV4dCwgcm9vdCwgcHJlc2VydmVTeW1saW5rcyldLFxuICAgICAgICAgIGxvYWRQYXRoczogaW5jbHVkZVBhdGhzLFxuICAgICAgICAgIC8vIFVzZSBleHBhbmRlZCBhcyBvdGhlcndpc2Ugc2FzcyB3aWxsIHJlbW92ZSBjb21tZW50cyB0aGF0IGFyZSBuZWVkZWQgZm9yIGF1dG9wcmVmaXhlclxuICAgICAgICAgIC8vIEV4OiAvKiBhdXRvcHJlZml4ZXIgZ3JpZDogYXV0b3BsYWNlICovXG4gICAgICAgICAgLy8gU2VlOiBodHRwczovL2dpdGh1Yi5jb20vd2VicGFjay1jb250cmliL3Nhc3MtbG9hZGVyL2Jsb2IvNDVhZDBiZTE3MjY0Y2VhZGE1ZjBiNGZiODdlOTM1N2FiZTg1YzRmZi9zcmMvZ2V0U2Fzc09wdGlvbnMuanMjTDY4LUw3MFxuICAgICAgICAgIHN0eWxlOiAnZXhwYW5kZWQnLFxuICAgICAgICAgIC8vIFNpbGVuY2VzIGNvbXBpbGVyIHdhcm5pbmdzIGZyb20gM3JkIHBhcnR5IHN0eWxlc2hlZXRzXG4gICAgICAgICAgcXVpZXREZXBzOiAhdmVyYm9zZSxcbiAgICAgICAgICB2ZXJib3NlLFxuICAgICAgICAgIHN5bnRheDogaW5kZW50ZWRTeW50YXggPyAnaW5kZW50ZWQnIDogJ3Njc3MnLFxuICAgICAgICAgIHNvdXJjZU1hcEluY2x1ZGVTb3VyY2VzOiB0cnVlLFxuICAgICAgICB9KSxcbiAgICAgIH1cbiAgICA6IHtcbiAgICAgICAgc291cmNlTWFwOiB0cnVlLFxuICAgICAgICBhcGk6ICdsZWdhY3knLFxuICAgICAgICBpbXBsZW1lbnRhdGlvbixcbiAgICAgICAgc2Fzc09wdGlvbnM6IHtcbiAgICAgICAgICBpbXBvcnRlcjogKHVybDogc3RyaW5nLCBmcm9tOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIGlmICh1cmwuY2hhckF0KDApID09PSAnficpIHtcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgICAgIGAnJHtmcm9tfScgaW1wb3J0cyAnJHt1cmx9JyB3aXRoIGEgdGlsZGUuIFVzYWdlIG9mICd+JyBpbiBpbXBvcnRzIGlzIG5vIGxvbmdlciBzdXBwb3J0ZWQuYCxcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgfSxcbiAgICAgICAgICAvLyBQcmV2ZW50IHVzZSBvZiBgZmliZXJzYCBwYWNrYWdlIGFzIGl0IG5vIGxvbmdlciB3b3JrcyBpbiBuZXdlciBOb2RlLmpzIHZlcnNpb25zXG4gICAgICAgICAgZmliZXI6IGZhbHNlLFxuICAgICAgICAgIGluZGVudGVkU3ludGF4LFxuICAgICAgICAgIC8vIGJvb3RzdHJhcC1zYXNzIHJlcXVpcmVzIGEgbWluaW11bSBwcmVjaXNpb24gb2YgOFxuICAgICAgICAgIHByZWNpc2lvbjogOCxcbiAgICAgICAgICBpbmNsdWRlUGF0aHMsXG4gICAgICAgICAgLy8gVXNlIGV4cGFuZGVkIGFzIG90aGVyd2lzZSBzYXNzIHdpbGwgcmVtb3ZlIGNvbW1lbnRzIHRoYXQgYXJlIG5lZWRlZCBmb3IgYXV0b3ByZWZpeGVyXG4gICAgICAgICAgLy8gRXg6IC8qIGF1dG9wcmVmaXhlciBncmlkOiBhdXRvcGxhY2UgKi9cbiAgICAgICAgICAvLyBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS93ZWJwYWNrLWNvbnRyaWIvc2Fzcy1sb2FkZXIvYmxvYi80NWFkMGJlMTcyNjRjZWFkYTVmMGI0ZmI4N2U5MzU3YWJlODVjNGZmL3NyYy9nZXRTYXNzT3B0aW9ucy5qcyNMNjgtTDcwXG4gICAgICAgICAgb3V0cHV0U3R5bGU6ICdleHBhbmRlZCcsXG4gICAgICAgICAgLy8gU2lsZW5jZXMgY29tcGlsZXIgd2FybmluZ3MgZnJvbSAzcmQgcGFydHkgc3R5bGVzaGVldHNcbiAgICAgICAgICBxdWlldERlcHM6ICF2ZXJib3NlLFxuICAgICAgICAgIHZlcmJvc2UsXG4gICAgICAgIH0sXG4gICAgICB9O1xufVxuXG5mdW5jdGlvbiBnZXRTYXNzUmVzb2x1dGlvbkltcG9ydGVyKFxuICBsb2FkZXJDb250ZXh0OiBMb2FkZXJDb250ZXh0PHt9PixcbiAgcm9vdDogc3RyaW5nLFxuICBwcmVzZXJ2ZVN5bWxpbmtzOiBib29sZWFuLFxuKTogRmlsZUltcG9ydGVyPCdhc3luYyc+IHtcbiAgY29uc3QgY29tbW9uUmVzb2x2ZXJPcHRpb25zOiBQYXJhbWV0ZXJzPCh0eXBlb2YgbG9hZGVyQ29udGV4dClbJ2dldFJlc29sdmUnXT5bMF0gPSB7XG4gICAgY29uZGl0aW9uTmFtZXM6IFsnc2FzcycsICdzdHlsZSddLFxuICAgIG1haW5GaWVsZHM6IFsnc2FzcycsICdzdHlsZScsICdtYWluJywgJy4uLiddLFxuICAgIGV4dGVuc2lvbnM6IFsnLnNjc3MnLCAnLnNhc3MnLCAnLmNzcyddLFxuICAgIHJlc3RyaWN0aW9uczogWy9cXC4oKHNhfHNjfGMpc3MpJC9pXSxcbiAgICBwcmVmZXJSZWxhdGl2ZTogdHJ1ZSxcbiAgICBzeW1saW5rczogIXByZXNlcnZlU3ltbGlua3MsXG4gIH07XG5cbiAgLy8gU2FzcyBhbHNvIHN1cHBvcnRzIGltcG9ydC1vbmx5IGZpbGVzLiBJZiB5b3UgbmFtZSBhIGZpbGUgPG5hbWU+LmltcG9ydC5zY3NzLCBpdCB3aWxsIG9ubHkgYmUgbG9hZGVkIGZvciBpbXBvcnRzLCBub3QgZm9yIEB1c2VzLlxuICAvLyBTZWU6IGh0dHBzOi8vc2Fzcy1sYW5nLmNvbS9kb2N1bWVudGF0aW9uL2F0LXJ1bGVzL2ltcG9ydCNpbXBvcnQtb25seS1maWxlc1xuICBjb25zdCByZXNvbHZlSW1wb3J0ID0gbG9hZGVyQ29udGV4dC5nZXRSZXNvbHZlKHtcbiAgICAuLi5jb21tb25SZXNvbHZlck9wdGlvbnMsXG4gICAgZGVwZW5kZW5jeVR5cGU6ICdzYXNzLWltcG9ydCcsXG4gICAgbWFpbkZpbGVzOiBbJ19pbmRleC5pbXBvcnQnLCAnX2luZGV4JywgJ2luZGV4LmltcG9ydCcsICdpbmRleCcsICcuLi4nXSxcbiAgfSk7XG5cbiAgY29uc3QgcmVzb2x2ZU1vZHVsZSA9IGxvYWRlckNvbnRleHQuZ2V0UmVzb2x2ZSh7XG4gICAgLi4uY29tbW9uUmVzb2x2ZXJPcHRpb25zLFxuICAgIGRlcGVuZGVuY3lUeXBlOiAnc2Fzcy1tb2R1bGUnLFxuICAgIG1haW5GaWxlczogWydfaW5kZXgnLCAnaW5kZXgnLCAnLi4uJ10sXG4gIH0pO1xuXG4gIHJldHVybiB7XG4gICAgZmluZEZpbGVVcmw6IGFzeW5jIChcbiAgICAgIHVybCxcbiAgICAgIHsgZnJvbUltcG9ydCwgcHJldmlvdXNSZXNvbHZlZE1vZHVsZXMgfTogRmlsZUltcG9ydGVyV2l0aFJlcXVlc3RDb250ZXh0T3B0aW9ucyxcbiAgICApOiBQcm9taXNlPFVSTCB8IG51bGw+ID0+IHtcbiAgICAgIGlmICh1cmwuY2hhckF0KDApID09PSAnLicpIHtcbiAgICAgICAgLy8gTGV0IFNhc3MgaGFuZGxlIHJlbGF0aXZlIGltcG9ydHMuXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuXG4gICAgICBjb25zdCByZXNvbHZlID0gZnJvbUltcG9ydCA/IHJlc29sdmVJbXBvcnQgOiByZXNvbHZlTW9kdWxlO1xuICAgICAgLy8gVHJ5IHRvIHJlc29sdmUgZnJvbSByb290IG9mIHdvcmtzcGFjZVxuICAgICAgbGV0IHJlc3VsdCA9IGF3YWl0IHRyeVJlc29sdmUocmVzb2x2ZSwgcm9vdCwgdXJsKTtcblxuICAgICAgLy8gVHJ5IHRvIHJlc29sdmUgZnJvbSBwcmV2aW91c2x5IHJlc29sdmVkIG1vZHVsZXMuXG4gICAgICBpZiAoIXJlc3VsdCAmJiBwcmV2aW91c1Jlc29sdmVkTW9kdWxlcykge1xuICAgICAgICBmb3IgKGNvbnN0IHBhdGggb2YgcHJldmlvdXNSZXNvbHZlZE1vZHVsZXMpIHtcbiAgICAgICAgICByZXN1bHQgPSBhd2FpdCB0cnlSZXNvbHZlKHJlc29sdmUsIHBhdGgsIHVybCk7XG4gICAgICAgICAgaWYgKHJlc3VsdCkge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByZXN1bHQgPyBwYXRoVG9GaWxlVVJMKHJlc3VsdCkgOiBudWxsO1xuICAgIH0sXG4gIH07XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHRyeVJlc29sdmUoXG4gIHJlc29sdmU6IFJldHVyblR5cGU8TG9hZGVyQ29udGV4dDx7fT5bJ2dldFJlc29sdmUnXT4sXG4gIHJvb3Q6IHN0cmluZyxcbiAgdXJsOiBzdHJpbmcsXG4pOiBQcm9taXNlPHN0cmluZyB8IHVuZGVmaW5lZD4ge1xuICB0cnkge1xuICAgIHJldHVybiBhd2FpdCByZXNvbHZlKHJvb3QsIHVybCk7XG4gIH0gY2F0Y2gge1xuICAgIC8vIFRyeSB0byByZXNvbHZlIGEgcGFydGlhbCBmaWxlXG4gICAgLy8gQHVzZSAnQG1hdGVyaWFsL2J1dHRvbi9idXR0b24nIGFzIG1kYy1idXR0b247XG4gICAgLy8gYEBtYXRlcmlhbC9idXR0b24vYnV0dG9uYCAtPiBgQG1hdGVyaWFsL2J1dHRvbi9fYnV0dG9uYFxuICAgIGNvbnN0IGxhc3RTbGFzaEluZGV4ID0gdXJsLmxhc3RJbmRleE9mKCcvJyk7XG4gICAgY29uc3QgdW5kZXJzY29yZUluZGV4ID0gbGFzdFNsYXNoSW5kZXggKyAxO1xuICAgIGlmICh1bmRlcnNjb3JlSW5kZXggPiAwICYmIHVybC5jaGFyQXQodW5kZXJzY29yZUluZGV4KSAhPT0gJ18nKSB7XG4gICAgICBjb25zdCBwYXJ0aWFsRmlsZVVybCA9IGAke3VybC5zbGljZSgwLCB1bmRlcnNjb3JlSW5kZXgpfV8ke3VybC5zbGljZSh1bmRlcnNjb3JlSW5kZXgpfWA7XG5cbiAgICAgIHJldHVybiByZXNvbHZlKHJvb3QsIHBhcnRpYWxGaWxlVXJsKS5jYXRjaCgoKSA9PiB1bmRlZmluZWQpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB1bmRlZmluZWQ7XG59XG4iXX0=