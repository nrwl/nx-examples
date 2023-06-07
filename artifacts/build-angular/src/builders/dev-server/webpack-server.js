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
exports.serveWebpackBrowser = void 0;
const build_webpack_1 = require("@angular-devkit/build-webpack");
const core_1 = require("@angular-devkit/core");
const path = __importStar(require("path"));
const rxjs_1 = require("rxjs");
const url = __importStar(require("url"));
const utils_1 = require("../../utils");
const color_1 = require("../../utils/color");
const i18n_options_1 = require("../../utils/i18n-options");
const load_translations_1 = require("../../utils/load-translations");
const package_chunk_sort_1 = require("../../utils/package-chunk-sort");
const version_1 = require("../../utils/version");
const webpack_browser_config_1 = require("../../utils/webpack-browser-config");
const webpack_diagnostics_1 = require("../../utils/webpack-diagnostics");
const configs_1 = require("../../webpack/configs");
const index_html_webpack_plugin_1 = require("../../webpack/plugins/index-html-webpack-plugin");
const service_worker_plugin_1 = require("../../webpack/plugins/service-worker-plugin");
const stats_1 = require("../../webpack/utils/stats");
const schema_1 = require("../browser/schema");
/**
 * Reusable implementation of the Angular Webpack development server builder.
 * @param options Dev Server options.
 * @param builderName The name of the builder used to build the application.
 * @param context The build context.
 * @param transforms A map of transforms that can be used to hook into some logic (such as
 *     transforming webpack configuration before passing it to webpack).
 */
// eslint-disable-next-line max-lines-per-function
function serveWebpackBrowser(options, builderName, context, transforms = {}) {
    // Check Angular version.
    const { logger, workspaceRoot } = context;
    (0, version_1.assertCompatibleAngularVersion)(workspaceRoot);
    async function setup() {
        if (options.hmr) {
            logger.warn(core_1.tags.stripIndents `NOTICE: Hot Module Replacement (HMR) is enabled for the dev server.
      See https://webpack.js.org/guides/hot-module-replacement for information on working with HMR for Webpack.`);
        }
        // Get the browser configuration from the target name.
        const rawBrowserOptions = (await context.getTargetOptions(options.browserTarget));
        if (rawBrowserOptions.outputHashing && rawBrowserOptions.outputHashing !== schema_1.OutputHashing.None) {
            // Disable output hashing for dev build as this can cause memory leaks
            // See: https://github.com/webpack/webpack-dev-server/issues/377#issuecomment-241258405
            rawBrowserOptions.outputHashing = schema_1.OutputHashing.None;
            logger.warn(`Warning: 'outputHashing' option is disabled when using the dev-server.`);
        }
        const browserOptions = (await context.validateOptions({
            ...rawBrowserOptions,
            watch: options.watch,
            verbose: options.verbose,
            // In dev server we should not have budgets because of extra libs such as socks-js
            budgets: undefined,
        }, builderName));
        const { styles, scripts } = (0, utils_1.normalizeOptimization)(browserOptions.optimization);
        if (scripts || styles.minify) {
            logger.error(core_1.tags.stripIndents `
        ****************************************************************************************
        This is a simple server for use in testing or debugging Angular applications locally.
        It hasn't been reviewed for security issues.

        DON'T USE IT FOR PRODUCTION!
        ****************************************************************************************
      `);
        }
        const { config, i18n } = await (0, webpack_browser_config_1.generateI18nBrowserWebpackConfigFromContext)(browserOptions, context, (wco) => [(0, configs_1.getDevServerConfig)(wco), (0, configs_1.getCommonConfig)(wco), (0, configs_1.getStylesConfig)(wco)], options);
        if (!config.devServer) {
            throw new Error('Webpack Dev Server configuration was not set.');
        }
        let locale;
        if (i18n.shouldInline) {
            // Dev-server only supports one locale
            locale = [...i18n.inlineLocales][0];
        }
        else if (i18n.hasDefinedSourceLocale) {
            // use source locale if not localizing
            locale = i18n.sourceLocale;
        }
        let webpackConfig = config;
        // If a locale is defined, setup localization
        if (locale) {
            if (i18n.inlineLocales.size > 1) {
                throw new Error('The development server only supports localizing a single locale per build.');
            }
            await setupLocalize(locale, i18n, browserOptions, webpackConfig, options.cacheOptions, context);
        }
        if (transforms.webpackConfiguration) {
            webpackConfig = await transforms.webpackConfiguration(webpackConfig);
        }
        webpackConfig.plugins ?? (webpackConfig.plugins = []);
        if (browserOptions.index) {
            const { scripts = [], styles = [], baseHref } = browserOptions;
            const entrypoints = (0, package_chunk_sort_1.generateEntryPoints)({
                scripts,
                styles,
                // The below is needed as otherwise HMR for CSS will break.
                // styles.js and runtime.js needs to be loaded as a non-module scripts as otherwise `document.currentScript` will be null.
                // https://github.com/webpack-contrib/mini-css-extract-plugin/blob/90445dd1d81da0c10b9b0e8a17b417d0651816b8/src/hmr/hotModuleReplacement.js#L39
                isHMREnabled: !!webpackConfig.devServer?.hot,
            });
            webpackConfig.plugins.push(new index_html_webpack_plugin_1.IndexHtmlWebpackPlugin({
                indexPath: path.resolve(workspaceRoot, (0, webpack_browser_config_1.getIndexInputFile)(browserOptions.index)),
                outputPath: (0, webpack_browser_config_1.getIndexOutputFile)(browserOptions.index),
                baseHref,
                entrypoints,
                deployUrl: browserOptions.deployUrl,
                sri: browserOptions.subresourceIntegrity,
                cache: options.cacheOptions,
                postTransform: transforms.indexHtml,
                optimization: (0, utils_1.normalizeOptimization)(browserOptions.optimization),
                crossOrigin: browserOptions.crossOrigin,
                lang: locale,
            }));
        }
        if (browserOptions.serviceWorker) {
            webpackConfig.plugins.push(new service_worker_plugin_1.ServiceWorkerPlugin({
                baseHref: browserOptions.baseHref,
                root: context.workspaceRoot,
                projectRoot: options.projectRoot,
                ngswConfigPath: browserOptions.ngswConfigPath,
            }));
        }
        return {
            browserOptions,
            webpackConfig,
        };
    }
    return (0, rxjs_1.from)(setup()).pipe((0, rxjs_1.switchMap)(({ browserOptions, webpackConfig }) => {
        return (0, build_webpack_1.runWebpackDevServer)(webpackConfig, context, {
            logging: transforms.logging || (0, stats_1.createWebpackLoggingCallback)(browserOptions, logger),
            webpackFactory: require('webpack'),
            webpackDevServerFactory: require('webpack-dev-server'),
        }).pipe((0, rxjs_1.concatMap)(async (buildEvent, index) => {
            const webpackRawStats = buildEvent.webpackStats;
            if (!webpackRawStats) {
                throw new Error('Webpack stats build result is required.');
            }
            // Resolve serve address.
            const publicPath = webpackConfig.devServer?.devMiddleware?.publicPath;
            const serverAddress = url.format({
                protocol: options.ssl ? 'https' : 'http',
                hostname: options.host === '0.0.0.0' ? 'localhost' : options.host,
                port: buildEvent.port,
                pathname: typeof publicPath === 'string' ? publicPath : undefined,
            });
            if (index === 0) {
                logger.info('\n' +
                    core_1.tags.oneLine `
              **
              Angular Live Development Server is listening on ${options.host}:${buildEvent.port},
              open your browser on ${serverAddress}
              **
            ` +
                    '\n');
                if (options.open) {
                    const open = (await Promise.resolve().then(() => __importStar(require('open')))).default;
                    await open(serverAddress);
                }
            }
            if (buildEvent.success) {
                logger.info(`\n${color_1.colors.greenBright(color_1.colors.symbols.check)} Compiled successfully.`);
            }
            else {
                logger.info(`\n${color_1.colors.redBright(color_1.colors.symbols.cross)} Failed to compile.`);
            }
            return {
                ...buildEvent,
                baseUrl: serverAddress,
                stats: (0, stats_1.generateBuildEventStats)(webpackRawStats, browserOptions),
            };
        }));
    }));
}
exports.serveWebpackBrowser = serveWebpackBrowser;
async function setupLocalize(locale, i18n, browserOptions, webpackConfig, cacheOptions, context) {
    const localeDescription = i18n.locales[locale];
    // Modify main entrypoint to include locale data
    if (localeDescription?.dataPath &&
        typeof webpackConfig.entry === 'object' &&
        !Array.isArray(webpackConfig.entry) &&
        webpackConfig.entry['main']) {
        if (Array.isArray(webpackConfig.entry['main'])) {
            webpackConfig.entry['main'].unshift(localeDescription.dataPath);
        }
        else {
            webpackConfig.entry['main'] = [
                localeDescription.dataPath,
                webpackConfig.entry['main'],
            ];
        }
    }
    let missingTranslationBehavior = browserOptions.i18nMissingTranslation || 'ignore';
    let translation = localeDescription?.translation || {};
    if (locale === i18n.sourceLocale) {
        missingTranslationBehavior = 'ignore';
        translation = {};
    }
    const i18nLoaderOptions = {
        locale,
        missingTranslationBehavior,
        translation: i18n.shouldInline ? translation : undefined,
        translationFiles: localeDescription?.files.map((file) => path.resolve(context.workspaceRoot, file.path)),
    };
    const i18nRule = {
        test: /\.[cm]?[tj]sx?$/,
        enforce: 'post',
        use: [
            {
                loader: require.resolve('../../babel/webpack-loader'),
                options: {
                    cacheDirectory: (cacheOptions.enabled && path.join(cacheOptions.path, 'babel-dev-server-i18n')) ||
                        false,
                    cacheIdentifier: JSON.stringify({
                        locale,
                        translationIntegrity: localeDescription?.files.map((file) => file.integrity),
                    }),
                    i18n: i18nLoaderOptions,
                },
            },
        ],
    };
    // Get the rules and ensure the Webpack configuration is setup properly
    const rules = webpackConfig.module?.rules || [];
    if (!webpackConfig.module) {
        webpackConfig.module = { rules };
    }
    else if (!webpackConfig.module.rules) {
        webpackConfig.module.rules = rules;
    }
    rules.push(i18nRule);
    // Add a plugin to reload translation files on rebuilds
    const loader = await (0, load_translations_1.createTranslationLoader)();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    webpackConfig.plugins.push({
        apply: (compiler) => {
            compiler.hooks.thisCompilation.tap('build-angular', (compilation) => {
                if (i18n.shouldInline && i18nLoaderOptions.translation === undefined) {
                    // Reload translations
                    (0, i18n_options_1.loadTranslations)(locale, localeDescription, context.workspaceRoot, loader, {
                        warn(message) {
                            (0, webpack_diagnostics_1.addWarning)(compilation, message);
                        },
                        error(message) {
                            (0, webpack_diagnostics_1.addError)(compilation, message);
                        },
                    }, undefined, browserOptions.i18nDuplicateTranslation);
                    i18nLoaderOptions.translation = localeDescription.translation ?? {};
                }
                compilation.hooks.finishModules.tap('build-angular', () => {
                    // After loaders are finished, clear out the now unneeded translations
                    i18nLoaderOptions.translation = undefined;
                });
            });
        },
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2VicGFjay1zZXJ2ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy9idWlsZGVycy9kZXYtc2VydmVyL3dlYnBhY2stc2VydmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBR0gsaUVBSXVDO0FBQ3ZDLCtDQUFrRDtBQUNsRCwyQ0FBNkI7QUFDN0IsK0JBQThEO0FBQzlELHlDQUEyQjtBQUkzQix1Q0FBb0Q7QUFDcEQsNkNBQTJDO0FBQzNDLDJEQUF5RTtBQUV6RSxxRUFBd0U7QUFFeEUsdUVBQXFFO0FBQ3JFLGlEQUFxRTtBQUNyRSwrRUFJNEM7QUFDNUMseUVBQXVFO0FBQ3ZFLG1EQUE2RjtBQUM3RiwrRkFBeUY7QUFDekYsdUZBQWtGO0FBQ2xGLHFEQUltQztBQUNuQyw4Q0FBa0Y7QUFXbEY7Ozs7Ozs7R0FPRztBQUNILGtEQUFrRDtBQUNsRCxTQUFnQixtQkFBbUIsQ0FDakMsT0FBbUMsRUFDbkMsV0FBbUIsRUFDbkIsT0FBdUIsRUFDdkIsYUFJSSxFQUFFO0lBRU4seUJBQXlCO0lBQ3pCLE1BQU0sRUFBRSxNQUFNLEVBQUUsYUFBYSxFQUFFLEdBQUcsT0FBTyxDQUFDO0lBQzFDLElBQUEsd0NBQThCLEVBQUMsYUFBYSxDQUFDLENBQUM7SUFFOUMsS0FBSyxVQUFVLEtBQUs7UUFJbEIsSUFBSSxPQUFPLENBQUMsR0FBRyxFQUFFO1lBQ2YsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFJLENBQUMsWUFBWSxDQUFBO2dIQUM2RSxDQUFDLENBQUM7U0FDN0c7UUFFRCxzREFBc0Q7UUFDdEQsTUFBTSxpQkFBaUIsR0FBRyxDQUFDLE1BQU0sT0FBTyxDQUFDLGdCQUFnQixDQUN2RCxPQUFPLENBQUMsYUFBYSxDQUN0QixDQUEyQyxDQUFDO1FBRTdD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RSxFQUFFO2dCQUNsRSxJQUFJLElBQUksQ0FBQyxZQUFZLElBQUksaUJBQWlCLENBQUMsV0FBVyxLQUFLLFNBQVMsRUFBRTtvQkFDcEUsc0JBQXNCO29CQUN0QixJQUFBLCtCQUFnQixFQUNkLE1BQU0sRUFDTixpQkFBaUIsRUFDakIsT0FBTyxDQUFDLGFBQWEsRUFDckIsTUFBTSxFQUNOO3dCQUNFLElBQUksQ0FBQyxPQUFPOzRCQUNWLElBQUEsZ0NBQVUsRUFBQyxXQUFXLEVBQUUsT0FBTyxDQUFDLENBQUM7d0JBQ25DLENBQUM7d0JBQ0QsS0FBSyxDQUFDLE9BQU87NEJBQ1gsSUFBQSw4QkFBUSxFQUFDLFdBQVcsRUFBRSxPQUFPLENBQUMsQ0FBQzt3QkFDakMsQ0FBQztxQkFDRixFQUNELFNBQVMsRUFDVCxjQUFjLENBQUMsd0JBQXdCLENBQ3hDLENBQUM7b0JBRUYsaUJBQWlCLENBQUMsV0FBVyxHQUFHLGlCQUFpQixDQUFDLFdBQVcsSUFBSSxFQUFFLENBQUM7aUJBQ3JFO2dCQUVELFdBQVcsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxlQUFlLEVBQUUsR0FBRyxFQUFFO29CQUN4RCxzRUFBc0U7b0JBQ3RFLGlCQUFpQixDQUFDLFdBQVcsR0FBRyxTQUFTLENBQUM7Z0JBQzVDLENBQUMsQ0FBQyxDQUFDO1lBQ0wsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO0tBQ0YsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBCdWlsZGVyQ29udGV4dCB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9hcmNoaXRlY3QnO1xuaW1wb3J0IHtcbiAgRGV2U2VydmVyQnVpbGRPdXRwdXQsXG4gIFdlYnBhY2tMb2dnaW5nQ2FsbGJhY2ssXG4gIHJ1bldlYnBhY2tEZXZTZXJ2ZXIsXG59IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9idWlsZC13ZWJwYWNrJztcbmltcG9ydCB7IGpzb24sIHRhZ3MgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZSwgY29uY2F0TWFwLCBmcm9tLCBzd2l0Y2hNYXAgfSBmcm9tICdyeGpzJztcbmltcG9ydCAqIGFzIHVybCBmcm9tICd1cmwnO1xuaW1wb3J0IHdlYnBhY2sgZnJvbSAnd2VicGFjayc7XG5pbXBvcnQgd2VicGFja0RldlNlcnZlciBmcm9tICd3ZWJwYWNrLWRldi1zZXJ2ZXInO1xuaW1wb3J0IHsgRXhlY3V0aW9uVHJhbnNmb3JtZXIgfSBmcm9tICcuLi8uLi90cmFuc2Zvcm1zJztcbmltcG9ydCB7IG5vcm1hbGl6ZU9wdGltaXphdGlvbiB9IGZyb20gJy4uLy4uL3V0aWxzJztcbmltcG9ydCB7IGNvbG9ycyB9IGZyb20gJy4uLy4uL3V0aWxzL2NvbG9yJztcbmltcG9ydCB7IEkxOG5PcHRpb25zLCBsb2FkVHJhbnNsYXRpb25zIH0gZnJvbSAnLi4vLi4vdXRpbHMvaTE4bi1vcHRpb25zJztcbmltcG9ydCB7IEluZGV4SHRtbFRyYW5zZm9ybSB9IGZyb20gJy4uLy4uL3V0aWxzL2luZGV4LWZpbGUvaW5kZXgtaHRtbC1nZW5lcmF0b3InO1xuaW1wb3J0IHsgY3JlYXRlVHJhbnNsYXRpb25Mb2FkZXIgfSBmcm9tICcuLi8uLi91dGlscy9sb2FkLXRyYW5zbGF0aW9ucyc7XG5pbXBvcnQgeyBOb3JtYWxpemVkQ2FjaGVkT3B0aW9ucyB9IGZyb20gJy4uLy4uL3V0aWxzL25vcm1hbGl6ZS1jYWNoZSc7XG5pbXBvcnQgeyBnZW5lcmF0ZUVudHJ5UG9pbnRzIH0gZnJvbSAnLi4vLi4vdXRpbHMvcGFja2FnZS1jaHVuay1zb3J0JztcbmltcG9ydCB7IGFzc2VydENvbXBhdGlibGVBbmd1bGFyVmVyc2lvbiB9IGZyb20gJy4uLy4uL3V0aWxzL3ZlcnNpb24nO1xuaW1wb3J0IHtcbiAgZ2VuZXJhdGVJMThuQnJvd3NlcldlYnBhY2tDb25maWdGcm9tQ29udGV4dCxcbiAgZ2V0SW5kZXhJbnB1dEZpbGUsXG4gIGdldEluZGV4T3V0cHV0RmlsZSxcbn0gZnJvbSAnLi4vLi4vdXRpbHMvd2VicGFjay1icm93c2VyLWNvbmZpZyc7XG5pbXBvcnQgeyBhZGRFcnJvciwgYWRkV2FybmluZyB9IGZyb20gJy4uLy4uL3V0aWxzL3dlYnBhY2stZGlhZ25vc3RpY3MnO1xuaW1wb3J0IHsgZ2V0Q29tbW9uQ29uZmlnLCBnZXREZXZTZXJ2ZXJDb25maWcsIGdldFN0eWxlc0NvbmZpZyB9IGZyb20gJy4uLy4uL3dlYnBhY2svY29uZmlncyc7XG5pbXBvcnQgeyBJbmRleEh0bWxXZWJwYWNrUGx1Z2luIH0gZnJvbSAnLi4vLi4vd2VicGFjay9wbHVnaW5zL2luZGV4LWh0bWwtd2VicGFjay1wbHVnaW4nO1xuaW1wb3J0IHsgU2VydmljZVdvcmtlclBsdWdpbiB9IGZyb20gJy4uLy4uL3dlYnBhY2svcGx1Z2lucy9zZXJ2aWNlLXdvcmtlci1wbHVnaW4nO1xuaW1wb3J0IHtcbiAgQnVpbGRFdmVudFN0YXRzLFxuICBjcmVhdGVXZWJwYWNrTG9nZ2luZ0NhbGxiYWNrLFxuICBnZW5lcmF0ZUJ1aWxkRXZlbnRTdGF0cyxcbn0gZnJvbSAnLi4vLi4vd2VicGFjay91dGlscy9zdGF0cyc7XG5pbXBvcnQgeyBTY2hlbWEgYXMgQnJvd3NlckJ1aWxkZXJTY2hlbWEsIE91dHB1dEhhc2hpbmcgfSBmcm9tICcuLi9icm93c2VyL3NjaGVtYSc7XG5pbXBvcnQgeyBOb3JtYWxpemVkRGV2U2VydmVyT3B0aW9ucyB9IGZyb20gJy4vb3B0aW9ucyc7XG5cbi8qKlxuICogQGV4cGVyaW1lbnRhbCBEaXJlY3QgdXNhZ2Ugb2YgdGhpcyB0eXBlIGlzIGNvbnNpZGVyZWQgZXhwZXJpbWVudGFsLlxuICovXG5leHBvcnQgdHlwZSBEZXZTZXJ2ZXJCdWlsZGVyT3V0cHV0ID0gRGV2U2VydmVyQnVpbGRPdXRwdXQgJiB7XG4gIGJhc2VVcmw6IHN0cmluZztcbiAgc3RhdHM6IEJ1aWxkRXZlbnRTdGF0cztcbn07XG5cbi8qKlxuICogUmV1c2FibGUgaW1wbGVtZW50YXRpb24gb2YgdGhlIEFuZ3VsYXIgV2VicGFjayBkZXZlbG9wbWVudCBzZXJ2ZXIgYnVpbGRlci5cbiAqIEBwYXJhbSBvcHRpb25zIERldiBTZXJ2ZXIgb3B0aW9ucy5cbiAqIEBwYXJhbSBidWlsZGVyTmFtZSBUaGUgbmFtZSBvZiB0aGUgYnVpbGRlciB1c2VkIHRvIGJ1aWxkIHRoZSBhcHBsaWNhdGlvbi5cbiAqIEBwYXJhbSBjb250ZXh0IFRoZSBidWlsZCBjb250ZXh0LlxuICogQHBhcmFtIHRyYW5zZm9ybXMgQSBtYXAgb2YgdHJhbnNmb3JtcyB0aGF0IGNhbiBiZSB1c2VkIHRvIGhvb2sgaW50byBzb21lIGxvZ2ljIChzdWNoIGFzXG4gKiAgICAgdHJhbnNmb3JtaW5nIHdlYnBhY2sgY29uZmlndXJhdGlvbiBiZWZvcmUgcGFzc2luZyBpdCB0byB3ZWJwYWNrKS5cbiAqL1xuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG1heC1saW5lcy1wZXItZnVuY3Rpb25cbmV4cG9ydCBmdW5jdGlvbiBzZXJ2ZVdlYnBhY2tCcm93c2VyKFxuICBvcHRpb25zOiBOb3JtYWxpemVkRGV2U2VydmVyT3B0aW9ucyxcbiAgYnVpbGRlck5hbWU6IHN0cmluZyxcbiAgY29udGV4dDogQnVpbGRlckNvbnRleHQsXG4gIHRyYW5zZm9ybXM6IHtcbiAgICB3ZWJwYWNrQ29uZmlndXJhdGlvbj86IEV4ZWN1dGlvblRyYW5zZm9ybWVyPHdlYnBhY2suQ29uZmlndXJhdGlvbj47XG4gICAgbG9nZ2luZz86IFdlYnBhY2tMb2dnaW5nQ2FsbGJhY2s7XG4gICAgaW5kZXhIdG1sPzogSW5kZXhIdG1sVHJhbnNmb3JtO1xuICB9ID0ge30sXG4pOiBPYnNlcnZhYmxlPERldlNlcnZlckJ1aWxkZXJPdXRwdXQ+IHtcbiAgLy8gQ2hlY2sgQW5ndWxhciB2ZXJzaW9uLlxuICBjb25zdCB7IGxvZ2dlciwgd29ya3NwYWNlUm9vdCB9ID0gY29udGV4dDtcbiAgYXNzZXJ0Q29tcGF0aWJsZUFuZ3VsYXJWZXJzaW9uKHdvcmtzcGFjZVJvb3QpO1xuXG4gIGFzeW5jIGZ1bmN0aW9uIHNldHVwKCk6IFByb21pc2U8e1xuICAgIGJyb3dzZXJPcHRpb25zOiBCcm93c2VyQnVpbGRlclNjaGVtYTtcbiAgICB3ZWJwYWNrQ29uZmlnOiB3ZWJwYWNrLkNvbmZpZ3VyYXRpb247XG4gIH0+IHtcbiAgICBpZiAob3B0aW9ucy5obXIpIHtcbiAgICAgIGxvZ2dlci53YXJuKHRhZ3Muc3RyaXBJbmRlbnRzYE5PVElDRTogSG90IE1vZHVsZSBSZXBsYWNlbWVudCAoSE1SKSBpcyBlbmFibGVkIGZvciB0aGUgZGV2IHNlcnZlci5cbiAgICAgIFNlZSBodHRwczovL3dlYnBhY2suanMub3JnL2d1aWRlcy9ob3QtbW9kdWxlLXJlcGxhY2VtZW50IGZvciBpbmZvcm1hdGlvbiBvbiB3b3JraW5nIHdpdGggSE1SIGZvciBXZWJwYWNrLmApO1xuICAgIH1cblxuICAgIC8vIEdldCB0aGUgYnJvd3NlciBjb25maWd1cmF0aW9uIGZyb20gdGhlIHRhcmdldCBuYW1lLlxuICAgIGNvbnN0IHJhd0Jyb3dzZXJPcHRpb25zID0gKGF3YWl0IGNvbnRleHQuZ2V0VGFyZ2V0T3B0aW9ucyhcbiAgICAgIG9wdGlvbnMuYnJvd3NlclRhcmdldCxcbiAgICApKSBhcyBqc29uLkpzb25PYmplY3QgJiBCcm93c2VyQnVpbGRlclNjaGVtYTtcblxuICAgIGlmIChyYXdCcm93c2VyT3B0aW9ucy5vdXRwdXRIYXNoaW5nICYmIHJhd0Jyb3dzZXJPcHRpb25zLm91dHB1dEhhc2hpbmcgIT09IE91dHB1dEhhc2hpbmcuTm9uZSkge1xuICAgICAgLy8gRGlzYWJsZSBvdXRwdXQgaGFzaGluZyBmb3IgZGV2IGJ1aWxkIGFzIHRoaXMgY2FuIGNhdXNlIG1lbW9yeSBsZWFrc1xuICAgICAgLy8gU2VlOiBodHRwczovL2dpdGh1Yi5jb20vd2VicGFjay93ZWJwYWNrLWRldi1zZXJ2ZXIvaXNzdWVzLzM3NyNpc3N1ZWNvbW1lbnQtMjQxMjU4NDA1XG4gICAgICByYXdCcm93c2VyT3B0aW9ucy5vdXRwdXRIYXNoaW5nID0gT3V0cHV0SGFzaGluZy5Ob25lO1xuICAgICAgbG9nZ2VyLndhcm4oYFdhcm5pbmc6ICdvdXRwdXRIYXNoaW5nJyBvcHRpb24gaXMgZGlzYWJsZWQgd2hlbiB1c2luZyB0aGUgZGV2LXNlcnZlci5gKTtcbiAgICB9XG5cbiAgICBjb25zdCBicm93c2VyT3B0aW9ucyA9IChhd2FpdCBjb250ZXh0LnZhbGlkYXRlT3B0aW9ucyhcbiAgICAgIHtcbiAgICAgICAgLi4ucmF3QnJvd3Nlck9wdGlvbnMsXG4gICAgICAgIHdhdGNoOiBvcHRpb25zLndhdGNoLFxuICAgICAgICB2ZXJib3NlOiBvcHRpb25zLnZlcmJvc2UsXG4gICAgICAgIC8vIEluIGRldiBzZXJ2ZXIgd2Ugc2hvdWxkIG5vdCBoYXZlIGJ1ZGdldHMgYmVjYXVzZSBvZiBleHRyYSBsaWJzIHN1Y2ggYXMgc29ja3MtanNcbiAgICAgICAgYnVkZ2V0czogdW5kZWZpbmVkLFxuICAgICAgfSBhcyBqc29uLkpzb25PYmplY3QgJiBCcm93c2VyQnVpbGRlclNjaGVtYSxcbiAgICAgIGJ1aWxkZXJOYW1lLFxuICAgICkpIGFzIGpzb24uSnNvbk9iamVjdCAmIEJyb3dzZXJCdWlsZGVyU2NoZW1hO1xuXG4gICAgY29uc3QgeyBzdHlsZXMsIHNjcmlwdHMgfSA9IG5vcm1hbGl6ZU9wdGltaXphdGlvbihicm93c2VyT3B0aW9ucy5vcHRpbWl6YXRpb24pO1xuICAgIGlmIChzY3JpcHRzIHx8IHN0eWxlcy5taW5pZnkpIHtcbiAgICAgIGxvZ2dlci5lcnJvcih0YWdzLnN0cmlwSW5kZW50c2BcbiAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICBUaGlzIGlzIGEgc2ltcGxlIHNlcnZlciBmb3IgdXNlIGluIHRlc3Rpbmcgb3IgZGVidWdnaW5nIEFuZ3VsYXIgYXBwbGljYXRpb25zIGxvY2FsbHkuXG4gICAgICAgIEl0IGhhc24ndCBiZWVuIHJldmlld2VkIGZvciBzZWN1cml0eSBpc3N1ZXMuXG5cbiAgICAgICAgRE9OJ1QgVVNFIElUIEZPUiBQUk9EVUNUSU9OIVxuICAgICAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICBgKTtcbiAgICB9XG5cbiAgICBjb25zdCB7IGNvbmZpZywgaTE4biB9ID0gYXdhaXQgZ2VuZXJhdGVJMThuQnJvd3NlcldlYnBhY2tDb25maWdGcm9tQ29udGV4dChcbiAgICAgIGJyb3dzZXJPcHRpb25zLFxuICAgICAgY29udGV4dCxcbiAgICAgICh3Y28pID0+IFtnZXREZXZTZXJ2ZXJDb25maWcod2NvKSwgZ2V0Q29tbW9uQ29uZmlnKHdjbyksIGdldFN0eWxlc0NvbmZpZyh3Y28pXSxcbiAgICAgIG9wdGlvbnMsXG4gICAgKTtcblxuICAgIGlmICghY29uZmlnLmRldlNlcnZlcikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdXZWJwYWNrIERldiBTZXJ2ZXIgY29uZmlndXJhdGlvbiB3YXMgbm90IHNldC4nKTtcbiAgICB9XG5cbiAgICBsZXQgbG9jYWxlOiBzdHJpbmcgfCB1bmRlZmluZWQ7XG4gICAgaWYgKGkxOG4uc2hvdWxkSW5saW5lKSB7XG4gICAgICAvLyBEZXYtc2VydmVyIG9ubHkgc3VwcG9ydHMgb25lIGxvY2FsZVxuICAgICAgbG9jYWxlID0gWy4uLmkxOG4uaW5saW5lTG9jYWxlc11bMF07XG4gICAgfSBlbHNlIGlmIChpMThuLmhhc0RlZmluZWRTb3VyY2VMb2NhbGUpIHtcbiAgICAgIC8vIHVzZSBzb3VyY2UgbG9jYWxlIGlmIG5vdCBsb2NhbGl6aW5nXG4gICAgICBsb2NhbGUgPSBpMThuLnNvdXJjZUxvY2FsZTtcbiAgICB9XG5cbiAgICBsZXQgd2VicGFja0NvbmZpZyA9IGNvbmZpZztcblxuICAgIC8vIElmIGEgbG9jYWxlIGlzIGRlZmluZWQsIHNldHVwIGxvY2FsaXphdGlvblxuICAgIGlmIChsb2NhbGUpIHtcbiAgICAgIGlmIChpMThuLmlubGluZUxvY2FsZXMuc2l6ZSA+IDEpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICdUaGUgZGV2ZWxvcG1lbnQgc2VydmVyIG9ubHkgc3VwcG9ydHMgbG9jYWxpemluZyBhIHNpbmdsZSBsb2NhbGUgcGVyIGJ1aWxkLicsXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIGF3YWl0IHNldHVwTG9jYWxpemUoXG4gICAgICAgIGxvY2FsZSxcbiAgICAgICAgaTE4bixcbiAgICAgICAgYnJvd3Nlck9wdGlvbnMsXG4gICAgICAgIHdlYnBhY2tDb25maWcsXG4gICAgICAgIG9wdGlvbnMuY2FjaGVPcHRpb25zLFxuICAgICAgICBjb250ZXh0LFxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZiAodHJhbnNmb3Jtcy53ZWJwYWNrQ29uZmlndXJhdGlvbikge1xuICAgICAgd2VicGFja0NvbmZpZyA9IGF3YWl0IHRyYW5zZm9ybXMud2VicGFja0NvbmZpZ3VyYXRpb24od2VicGFja0NvbmZpZyk7XG4gICAgfVxuXG4gICAgd2VicGFja0NvbmZpZy5wbHVnaW5zID8/PSBbXTtcblxuICAgIGlmIChicm93c2VyT3B0aW9ucy5pbmRleCkge1xuICAgICAgY29uc3QgeyBzY3JpcHRzID0gW10sIHN0eWxlcyA9IFtdLCBiYXNlSHJlZiB9ID0gYnJvd3Nlck9wdGlvbnM7XG4gICAgICBjb25zdCBlbnRyeXBvaW50cyA9IGdlbmVyYXRlRW50cnlQb2ludHMoe1xuICAgICAgICBzY3JpcHRzLFxuICAgICAgICBzdHlsZXMsXG4gICAgICAgIC8vIFRoZSBiZWxvdyBpcyBuZWVkZWQgYXMgb3RoZXJ3aXNlIEhNUiBmb3IgQ1NTIHdpbGwgYnJlYWsuXG4gICAgICAgIC8vIHN0eWxlcy5qcyBhbmQgcnVudGltZS5qcyBuZWVkcyB0byBiZSBsb2FkZWQgYXMgYSBub24tbW9kdWxlIHNjcmlwdHMgYXMgb3RoZXJ3aXNlIGBkb2N1bWVudC5jdXJyZW50U2NyaXB0YCB3aWxsIGJlIG51bGwuXG4gICAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS93ZWJwYWNrLWNvbnRyaWIvbWluaS1jc3MtZXh0cmFjdC1wbHVnaW4vYmxvYi85MDQ0NWRkMWQ4MWRhMGMxMGI5YjBlOGExN2I0MTdkMDY1MTgxNmI4L3NyYy9obXIvaG90TW9kdWxlUmVwbGFjZW1lbnQuanMjTDM5XG4gICAgICAgIGlzSE1SRW5hYmxlZDogISF3ZWJwYWNrQ29uZmlnLmRldlNlcnZlcj8uaG90LFxuICAgICAgfSk7XG5cbiAgICAgIHdlYnBhY2tDb25maWcucGx1Z2lucy5wdXNoKFxuICAgICAgICBuZXcgSW5kZXhIdG1sV2VicGFja1BsdWdpbih7XG4gICAgICAgICAgaW5kZXhQYXRoOiBwYXRoLnJlc29sdmUod29ya3NwYWNlUm9vdCwgZ2V0SW5kZXhJbnB1dEZpbGUoYnJvd3Nlck9wdGlvbnMuaW5kZXgpKSxcbiAgICAgICAgICBvdXRwdXRQYXRoOiBnZXRJbmRleE91dHB1dEZpbGUoYnJvd3Nlck9wdGlvbnMuaW5kZXgpLFxuICAgICAgICAgIGJhc2VIcmVmLFxuICAgICAgICAgIGVudHJ5cG9pbnRzLFxuICAgICAgICAgIGRlcGxveVVybDogYnJvd3Nlck9wdGlvbnMuZGVwbG95VXJsLFxuICAgICAgICAgIHNyaTogYnJvd3Nlck9wdGlvbnMuc3VicmVzb3VyY2VJbnRlZ3JpdHksXG4gICAgICAgICAgY2FjaGU6IG9wdGlvbnMuY2FjaGVPcHRpb25zLFxuICAgICAgICAgIHBvc3RUcmFuc2Zvcm06IHRyYW5zZm9ybXMuaW5kZXhIdG1sLFxuICAgICAgICAgIG9wdGltaXphdGlvbjogbm9ybWFsaXplT3B0aW1pemF0aW9uKGJyb3dzZXJPcHRpb25zLm9wdGltaXphdGlvbiksXG4gICAgICAgICAgY3Jvc3NPcmlnaW46IGJyb3dzZXJPcHRpb25zLmNyb3NzT3JpZ2luLFxuICAgICAgICAgIGxhbmc6IGxvY2FsZSxcbiAgICAgICAgfSksXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmIChicm93c2VyT3B0aW9ucy5zZXJ2aWNlV29ya2VyKSB7XG4gICAgICB3ZWJwYWNrQ29uZmlnLnBsdWdpbnMucHVzaChcbiAgICAgICAgbmV3IFNlcnZpY2VXb3JrZXJQbHVnaW4oe1xuICAgICAgICAgIGJhc2VIcmVmOiBicm93c2VyT3B0aW9ucy5iYXNlSHJlZixcbiAgICAgICAgICByb290OiBjb250ZXh0LndvcmtzcGFjZVJvb3QsXG4gICAgICAgICAgcHJvamVjdFJvb3Q6IG9wdGlvbnMucHJvamVjdFJvb3QsXG4gICAgICAgICAgbmdzd0NvbmZpZ1BhdGg6IGJyb3dzZXJPcHRpb25zLm5nc3dDb25maWdQYXRoLFxuICAgICAgICB9KSxcbiAgICAgICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGJyb3dzZXJPcHRpb25zLFxuICAgICAgd2VicGFja0NvbmZpZyxcbiAgICB9O1xuICB9XG5cbiAgcmV0dXJuIGZyb20oc2V0dXAoKSkucGlwZShcbiAgICBzd2l0Y2hNYXAoKHsgYnJvd3Nlck9wdGlvbnMsIHdlYnBhY2tDb25maWcgfSkgPT4ge1xuICAgICAgcmV0dXJuIHJ1bldlYnBhY2tEZXZTZXJ2ZXIod2VicGFja0NvbmZpZywgY29udGV4dCwge1xuICAgICAgICBsb2dnaW5nOiB0cmFuc2Zvcm1zLmxvZ2dpbmcgfHwgY3JlYXRlV2VicGFja0xvZ2dpbmdDYWxsYmFjayhicm93c2VyT3B0aW9ucywgbG9nZ2VyKSxcbiAgICAgICAgd2VicGFja0ZhY3Rvcnk6IHJlcXVpcmUoJ3dlYnBhY2snKSBhcyB0eXBlb2Ygd2VicGFjayxcbiAgICAgICAgd2VicGFja0RldlNlcnZlckZhY3Rvcnk6IHJlcXVpcmUoJ3dlYnBhY2stZGV2LXNlcnZlcicpIGFzIHR5cGVvZiB3ZWJwYWNrRGV2U2VydmVyLFxuICAgICAgfSkucGlwZShcbiAgICAgICAgY29uY2F0TWFwKGFzeW5jIChidWlsZEV2ZW50LCBpbmRleCkgPT4ge1xuICAgICAgICAgIGNvbnN0IHdlYnBhY2tSYXdTdGF0cyA9IGJ1aWxkRXZlbnQud2VicGFja1N0YXRzO1xuICAgICAgICAgIGlmICghd2VicGFja1Jhd1N0YXRzKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1dlYnBhY2sgc3RhdHMgYnVpbGQgcmVzdWx0IGlzIHJlcXVpcmVkLicpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIFJlc29sdmUgc2VydmUgYWRkcmVzcy5cbiAgICAgICAgICBjb25zdCBwdWJsaWNQYXRoID0gd2VicGFja0NvbmZpZy5kZXZTZXJ2ZXI/LmRldk1pZGRsZXdhcmU/LnB1YmxpY1BhdGg7XG5cbiAgICAgICAgICBjb25zdCBzZXJ2ZXJBZGRyZXNzID0gdXJsLmZvcm1hdCh7XG4gICAgICAgICAgICBwcm90b2NvbDogb3B0aW9ucy5zc2wgPyAnaHR0cHMnIDogJ2h0dHAnLFxuICAgICAgICAgICAgaG9zdG5hbWU6IG9wdGlvbnMuaG9zdCA9PT0gJzAuMC4wLjAnID8gJ2xvY2FsaG9zdCcgOiBvcHRpb25zLmhvc3QsXG4gICAgICAgICAgICBwb3J0OiBidWlsZEV2ZW50LnBvcnQsXG4gICAgICAgICAgICBwYXRobmFtZTogdHlwZW9mIHB1YmxpY1BhdGggPT09ICdzdHJpbmcnID8gcHVibGljUGF0aCA6IHVuZGVmaW5lZCxcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIGlmIChpbmRleCA9PT0gMCkge1xuICAgICAgICAgICAgbG9nZ2VyLmluZm8oXG4gICAgICAgICAgICAgICdcXG4nICtcbiAgICAgICAgICAgICAgICB0YWdzLm9uZUxpbmVgXG4gICAgICAgICAgICAgICoqXG4gICAgICAgICAgICAgIEFuZ3VsYXIgTGl2ZSBEZXZlbG9wbWVudCBTZXJ2ZXIgaXMgbGlzdGVuaW5nIG9uICR7b3B0aW9ucy5ob3N0fToke2J1aWxkRXZlbnQucG9ydH0sXG4gICAgICAgICAgICAgIG9wZW4geW91ciBicm93c2VyIG9uICR7c2VydmVyQWRkcmVzc31cbiAgICAgICAgICAgICAgKipcbiAgICAgICAgICAgIGAgK1xuICAgICAgICAgICAgICAgICdcXG4nLFxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgaWYgKG9wdGlvbnMub3Blbikge1xuICAgICAgICAgICAgICBjb25zdCBvcGVuID0gKGF3YWl0IGltcG9ydCgnb3BlbicpKS5kZWZhdWx0O1xuICAgICAgICAgICAgICBhd2FpdCBvcGVuKHNlcnZlckFkZHJlc3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChidWlsZEV2ZW50LnN1Y2Nlc3MpIHtcbiAgICAgICAgICAgIGxvZ2dlci5pbmZvKGBcXG4ke2NvbG9ycy5ncmVlbkJyaWdodChjb2xvcnMuc3ltYm9scy5jaGVjayl9IENvbXBpbGVkIHN1Y2Nlc3NmdWxseS5gKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbG9nZ2VyLmluZm8oYFxcbiR7Y29sb3JzLnJlZEJyaWdodChjb2xvcnMuc3ltYm9scy5jcm9zcyl9IEZhaWxlZCB0byBjb21waWxlLmApO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAuLi5idWlsZEV2ZW50LFxuICAgICAgICAgICAgYmFzZVVybDogc2VydmVyQWRkcmVzcyxcbiAgICAgICAgICAgIHN0YXRzOiBnZW5lcmF0ZUJ1aWxkRXZlbnRTdGF0cyh3ZWJwYWNrUmF3U3RhdHMsIGJyb3dzZXJPcHRpb25zKSxcbiAgICAgICAgICB9IGFzIERldlNlcnZlckJ1aWxkZXJPdXRwdXQ7XG4gICAgICAgIH0pLFxuICAgICAgKTtcbiAgICB9KSxcbiAgKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gc2V0dXBMb2NhbGl6ZShcbiAgbG9jYWxlOiBzdHJpbmcsXG4gIGkxOG46IEkxOG5PcHRpb25zLFxuICBicm93c2VyT3B0aW9uczogQnJvd3NlckJ1aWxkZXJTY2hlbWEsXG4gIHdlYnBhY2tDb25maWc6IHdlYnBhY2suQ29uZmlndXJhdGlvbixcbiAgY2FjaGVPcHRpb25zOiBOb3JtYWxpemVkQ2FjaGVkT3B0aW9ucyxcbiAgY29udGV4dDogQnVpbGRlckNvbnRleHQsXG4pIHtcbiAgY29uc3QgbG9jYWxlRGVzY3JpcHRpb24gPSBpMThuLmxvY2FsZXNbbG9jYWxlXTtcblxuICAvLyBNb2RpZnkgbWFpbiBlbnRyeXBvaW50IHRvIGluY2x1ZGUgbG9jYWxlIGRhdGFcbiAgaWYgKFxuICAgIGxvY2FsZURlc2NyaXB0aW9uPy5kYXRhUGF0aCAmJlxuICAgIHR5cGVvZiB3ZWJwYWNrQ29uZmlnLmVudHJ5ID09PSAnb2JqZWN0JyAmJlxuICAgICFBcnJheS5pc0FycmF5KHdlYnBhY2tDb25maWcuZW50cnkpICYmXG4gICAgd2VicGFja0NvbmZpZy5lbnRyeVsnbWFpbiddXG4gICkge1xuICAgIGlmIChBcnJheS5pc0FycmF5KHdlYnBhY2tDb25maWcuZW50cnlbJ21haW4nXSkpIHtcbiAgICAgIHdlYnBhY2tDb25maWcuZW50cnlbJ21haW4nXS51bnNoaWZ0KGxvY2FsZURlc2NyaXB0aW9uLmRhdGFQYXRoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgd2VicGFja0NvbmZpZy5lbnRyeVsnbWFpbiddID0gW1xuICAgICAgICBsb2NhbGVEZXNjcmlwdGlvbi5kYXRhUGF0aCxcbiAgICAgICAgd2VicGFja0NvbmZpZy5lbnRyeVsnbWFpbiddIGFzIHN0cmluZyxcbiAgICAgIF07XG4gICAgfVxuICB9XG5cbiAgbGV0IG1pc3NpbmdUcmFuc2xhdGlvbkJlaGF2aW9yID0gYnJvd3Nlck9wdGlvbnMuaTE4bk1pc3NpbmdUcmFuc2xhdGlvbiB8fCAnaWdub3JlJztcbiAgbGV0IHRyYW5zbGF0aW9uID0gbG9jYWxlRGVzY3JpcHRpb24/LnRyYW5zbGF0aW9uIHx8IHt9O1xuXG4gIGlmIChsb2NhbGUgPT09IGkxOG4uc291cmNlTG9jYWxlKSB7XG4gICAgbWlzc2luZ1RyYW5zbGF0aW9uQmVoYXZpb3IgPSAnaWdub3JlJztcbiAgICB0cmFuc2xhdGlvbiA9IHt9O1xuICB9XG5cbiAgY29uc3QgaTE4bkxvYWRlck9wdGlvbnMgPSB7XG4gICAgbG9jYWxlLFxuICAgIG1pc3NpbmdUcmFuc2xhdGlvbkJlaGF2aW9yLFxuICAgIHRyYW5zbGF0aW9uOiBpMThuLnNob3VsZElubGluZSA/IHRyYW5zbGF0aW9uIDogdW5kZWZpbmVkLFxuICAgIHRyYW5zbGF0aW9uRmlsZXM6IGxvY2FsZURlc2NyaXB0aW9uPy5maWxlcy5tYXAoKGZpbGUpID0+XG4gICAgICBwYXRoLnJlc29sdmUoY29udGV4dC53b3Jrc3BhY2VSb290LCBmaWxlLnBhdGgpLFxuICAgICksXG4gIH07XG5cbiAgY29uc3QgaTE4blJ1bGU6IHdlYnBhY2suUnVsZVNldFJ1bGUgPSB7XG4gICAgdGVzdDogL1xcLltjbV0/W3RqXXN4PyQvLFxuICAgIGVuZm9yY2U6ICdwb3N0JyxcbiAgICB1c2U6IFtcbiAgICAgIHtcbiAgICAgICAgbG9hZGVyOiByZXF1aXJlLnJlc29sdmUoJy4uLy4uL2JhYmVsL3dlYnBhY2stbG9hZGVyJyksXG4gICAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgICBjYWNoZURpcmVjdG9yeTpcbiAgICAgICAgICAgIChjYWNoZU9wdGlvbnMuZW5hYmxlZCAmJiBwYXRoLmpvaW4oY2FjaGVPcHRpb25zLnBhdGgsICdiYWJlbC1kZXYtc2VydmVyLWkxOG4nKSkgfHxcbiAgICAgICAgICAgIGZhbHNlLFxuICAgICAgICAgIGNhY2hlSWRlbnRpZmllcjogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgbG9jYWxlLFxuICAgICAgICAgICAgdHJhbnNsYXRpb25JbnRlZ3JpdHk6IGxvY2FsZURlc2NyaXB0aW9uPy5maWxlcy5tYXAoKGZpbGUpID0+IGZpbGUuaW50ZWdyaXR5KSxcbiAgICAgICAgICB9KSxcbiAgICAgICAgICBpMThuOiBpMThuTG9hZGVyT3B0aW9ucyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgXSxcbiAgfTtcblxuICAvLyBHZXQgdGhlIHJ1bGVzIGFuZCBlbnN1cmUgdGhlIFdlYnBhY2sgY29uZmlndXJhdGlvbiBpcyBzZXR1cCBwcm9wZXJseVxuICBjb25zdCBydWxlcyA9IHdlYnBhY2tDb25maWcubW9kdWxlPy5ydWxlcyB8fCBbXTtcbiAgaWYgKCF3ZWJwYWNrQ29uZmlnLm1vZHVsZSkge1xuICAgIHdlYnBhY2tDb25maWcubW9kdWxlID0geyBydWxlcyB9O1xuICB9IGVsc2UgaWYgKCF3ZWJwYWNrQ29uZmlnLm1vZHVsZS5ydWxlcykge1xuICAgIHdlYnBhY2tDb25maWcubW9kdWxlLnJ1bGVzID0gcnVsZXM7XG4gIH1cblxuICBydWxlcy5wdXNoKGkxOG5SdWxlKTtcblxuICAvLyBBZGQgYSBwbHVnaW4gdG8gcmVsb2FkIHRyYW5zbGF0aW9uIGZpbGVzIG9uIHJlYnVpbGRzXG4gIGNvbnN0IGxvYWRlciA9IGF3YWl0IGNyZWF0ZVRyYW5zbGF0aW9uTG9hZGVyKCk7XG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tbm9uLW51bGwtYXNzZXJ0aW9uXG4gIHdlYnBhY2tDb25maWcucGx1Z2lucyEucHVzaCh7XG4gICAgYXBwbHk6IChjb21waWxlcjogd2VicGFjay5Db21waWxlcikgPT4ge1xuICAgICAgY29tcGlsZXIuaG9va3MudGhpc0NvbXBpbGF0aW9uLnRhcCgnYnVpbGQtYW5ndWxhcicsIChjb21waWxhdGlvbikgPT4ge1xuICAgICAgICBpZiAoaTE4bi5zaG91bGRJbmxpbmUgJiYgaTE4bkxvYWRlck9wdGlvbnMudHJhbnNsYXRpb24gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIC8vIFJlbG9hZCB0cmFuc2xhdGlvbnNcbiAgICAgICAgICBsb2FkVHJhbnNsYXRpb25zKFxuICAgICAgICAgICAgbG9jYWxlLFxuICAgICAgICAgICAgbG9jYWxlRGVzY3JpcHRpb24sXG4gICAgICAgICAgICBjb250ZXh0LndvcmtzcGFjZVJvb3QsXG4gICAgICAgICAgICBsb2FkZXIsXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIHdhcm4obWVzc2FnZSkge1xuICAgICAgICAgICAgICAgIGFkZFdhcm5pbmcoY29tcGlsYXRpb24sIG1lc3NhZ2UpO1xuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBlcnJvcihtZXNzYWdlKSB7XG4gICAgICAgICAgICAgICAgYWRkRXJyb3IoY29tcGlsYXRpb24sIG1lc3NhZ2UpO1xuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHVuZGVmaW5lZCxcbiAgICAgICAgICAgIGJyb3dzZXJPcHRpb25zLmkxOG5EdXBsaWNhdGVUcmFuc2xhdGlvbixcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgaTE4bkxvYWRlck9wdGlvbnMudHJhbnNsYXRpb24gPSBsb2NhbGVEZXNjcmlwdGlvbi50cmFuc2xhdGlvbiA/PyB7fTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbXBpbGF0aW9uLmhvb2tzLmZpbmlzaE1vZHVsZXMudGFwKCdidWlsZC1hbmd1bGFyJywgKCkgPT4ge1xuICAgICAgICAgIC8vIEFmdGVyIGxvYWRlcnMgYXJlIGZpbmlzaGVkLCBjbGVhciBvdXQgdGhlIG5vdyB1bm5lZWRlZCB0cmFuc2xhdGlvbnNcbiAgICAgICAgICBpMThuTG9hZGVyT3B0aW9ucy50cmFuc2xhdGlvbiA9IHVuZGVmaW5lZDtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9LFxuICB9KTtcbn1cbiJdfQ==