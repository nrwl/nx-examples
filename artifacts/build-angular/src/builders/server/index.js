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
exports.execute = void 0;
const architect_1 = require("@angular-devkit/architect");
const build_webpack_1 = require("@angular-devkit/build-webpack");
const promises_1 = require("node:fs/promises");
const path = __importStar(require("node:path"));
const rxjs_1 = require("rxjs");
const utils_1 = require("../../utils");
const color_1 = require("../../utils/color");
const copy_assets_1 = require("../../utils/copy-assets");
const error_1 = require("../../utils/error");
const i18n_inlining_1 = require("../../utils/i18n-inlining");
const output_paths_1 = require("../../utils/output-paths");
const purge_cache_1 = require("../../utils/purge-cache");
const spinner_1 = require("../../utils/spinner");
const version_1 = require("../../utils/version");
const webpack_browser_config_1 = require("../../utils/webpack-browser-config");
const configs_1 = require("../../webpack/configs");
const helpers_1 = require("../../webpack/utils/helpers");
const stats_1 = require("../../webpack/utils/stats");
/**
 * @experimental Direct usage of this function is considered experimental.
 */
function execute(options, context, transforms = {}) {
    const root = context.workspaceRoot;
    // Check Angular version.
    (0, version_1.assertCompatibleAngularVersion)(root);
    const baseOutputPath = path.resolve(root, options.outputPath);
    let outputPaths;
    return (0, rxjs_1.from)(initialize(options, context, transforms.webpackConfiguration)).pipe((0, rxjs_1.concatMap)(({ config, i18n, projectRoot, projectSourceRoot }) => {
        return (0, build_webpack_1.runWebpack)(config, context, {
            webpackFactory: require('webpack'),
            logging: (stats, config) => {
                if (options.verbose) {
                    context.logger.info(stats.toString(config.stats));
                }
            },
        }).pipe((0, rxjs_1.concatMap)(async (output) => {
            const { emittedFiles = [], outputPath, webpackStats, success } = output;
            if (!webpackStats) {
                throw new Error('Webpack stats build result is required.');
            }
            if (!success) {
                if ((0, stats_1.statsHasWarnings)(webpackStats)) {
                    context.logger.warn((0, stats_1.statsWarningsToString)(webpackStats, { colors: true }));
                }
                if ((0, stats_1.statsHasErrors)(webpackStats)) {
                    context.logger.error((0, stats_1.statsErrorsToString)(webpackStats, { colors: true }));
                }
                return output;
            }
            const spinner = new spinner_1.Spinner();
            spinner.enabled = options.progress !== false;
            outputPaths = (0, output_paths_1.ensureOutputPaths)(baseOutputPath, i18n);
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
                        ...output,
                        success: false,
                        error: 'Unable to copy assets: ' + err.message,
                    };
                }
            }
            if (i18n.shouldInline) {
                const success = await (0, i18n_inlining_1.i18nInlineEmittedFiles)(context, emittedFiles, i18n, baseOutputPath, Array.from(outputPaths.values()), [], outputPath, options.i18nMissingTranslation);
                if (!success) {
                    return {
                        ...output,
                        success: false,
                    };
                }
            }
            (0, stats_1.webpackStatsLogger)(context.logger, webpackStats, config);
            return output;
        }));
    }), (0, rxjs_1.concatMap)(async (output) => {
        if (!output.success) {
            return output;
        }
        return {
            ...output,
            baseOutputPath,
            outputs: (outputPaths &&
                [...outputPaths.entries()].map(([locale, path]) => ({
                    locale,
                    path,
                }))) || {
                path: baseOutputPath,
            },
        };
    }));
}
exports.execute = execute;
exports.default = (0, architect_1.createBuilder)(execute);
async function initialize(options, context, webpackConfigurationTransform) {
    // Purge old build disk cache.
    await (0, purge_cache_1.purgeStaleBuildCache)(context);
    await checkTsConfigForPreserveWhitespacesSetting(context, options.tsConfig);
    const browserslist = (await Promise.resolve().then(() => __importStar(require('browserslist')))).default;
    const originalOutputPath = options.outputPath;
    // Assets are processed directly by the builder except when watching
    const adjustedOptions = options.watch ? options : { ...options, assets: [] };
    const { config, projectRoot, projectSourceRoot, i18n } = await (0, webpack_browser_config_1.generateI18nBrowserWebpackConfigFromContext)({
        ...adjustedOptions,
        aot: true,
        platform: 'server',
    }, context, (wco) => {
        var _a;
        // We use the platform to determine the JavaScript syntax output.
        (_a = wco.buildOptions).supportedBrowsers ?? (_a.supportedBrowsers = []);
        wco.buildOptions.supportedBrowsers.push(...browserslist('maintained node versions'));
        return [getPlatformServerExportsConfig(wco), (0, configs_1.getCommonConfig)(wco), (0, configs_1.getStylesConfig)(wco)];
    });
    if (options.deleteOutputPath) {
        (0, utils_1.deleteOutputDir)(context.workspaceRoot, originalOutputPath);
    }
    const transformedConfig = (await webpackConfigurationTransform?.(config)) ?? config;
    return { config: transformedConfig, i18n, projectRoot, projectSourceRoot };
}
async function checkTsConfigForPreserveWhitespacesSetting(context, tsConfigPath) {
    // We don't use the `readTsConfig` method on purpose here.
    // To only catch cases were `preserveWhitespaces` is set directly in the `tsconfig.server.json`,
    // which in the majority of cases will cause a mistmatch between client and server builds.
    // Technically we should check if `tsconfig.server.json` and `tsconfig.app.json` values match.
    // But:
    // 1. It is not guaranteed that `tsconfig.app.json` is used to build the client side of this app.
    // 2. There is no easy way to access the build build config from the server builder.
    // 4. This will no longer be an issue with a single compilation model were the same tsconfig is used for both browser and server builds.
    const content = await (0, promises_1.readFile)(path.join(context.workspaceRoot, tsConfigPath), 'utf-8');
    const { parse } = await Promise.resolve().then(() => __importStar(require('jsonc-parser')));
    const tsConfig = parse(content, [], { allowTrailingComma: true });
    if (tsConfig.angularCompilerOptions?.preserveWhitespaces !== undefined) {
        context.logger.warn(`"preserveWhitespaces" was set in "${tsConfigPath}". ` +
            'Make sure that this setting is set consistently in both "tsconfig.server.json" for your server side ' +
            'and "tsconfig.app.json" for your client side. A mismatched value will cause hydration to break.\n' +
            'For more information see: https://angular.io/guide/hydration#preserve-whitespaces');
    }
}
/**
 * Add `@angular/platform-server` exports.
 * This is needed so that DI tokens can be referenced and set at runtime outside of the bundle.
 */
function getPlatformServerExportsConfig(wco) {
    // Add `@angular/platform-server` exports.
    // This is needed so that DI tokens can be referenced and set at runtime outside of the bundle.
    // Only add `@angular/platform-server` exports when it is installed.
    // In some cases this builder is used when `@angular/platform-server` is not installed.
    // Example: when using `@nguniversal/common/clover` which does not need `@angular/platform-server`.
    return (0, helpers_1.isPlatformServerInstalled)(wco.root)
        ? {
            module: {
                rules: [
                    {
                        loader: require.resolve('./platform-server-exports-loader'),
                        include: [path.resolve(wco.root, wco.buildOptions.main)],
                    },
                ],
            },
        }
        : {};
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy9idWlsZGVycy9zZXJ2ZXIvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFSCx5REFBeUY7QUFDekYsaUVBQTJEO0FBQzNELCtDQUE0QztBQUM1QyxnREFBa0M7QUFDbEMsK0JBQW1EO0FBR25ELHVDQUlxQjtBQUNyQiw2Q0FBMkM7QUFDM0MseURBQXFEO0FBQ3JELDZDQUFrRDtBQUNsRCw2REFBbUU7QUFFbkUsMkRBQTZEO0FBQzdELHlEQUErRDtBQUMvRCxpREFBOEM7QUFDOUMsaURBQXFFO0FBQ3JFLCtFQUc0QztBQUM1QyxtREFBeUU7QUFDekUseURBQXdFO0FBQ3hFLHFEQU1tQztBQWlCbkM7O0dBRUc7QUFDSCxTQUFnQixPQUFPLENBQ3JCLE9BQTZCLEVBQzdCLE9BQXVCLEVBQ3ZCLGFBRUksRUFBRTtJQUVOLE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxhQUFhLENBQUM7SUFFbkMseUJBQXlCO0lBQ3pCLElBQUEsd0NBQThCLEVBQUMsSUFBSSxDQUFDLENBQUM7SUFFckMsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQzlELElBQUksV0FBNEMsQ0FBQztJQUVqRCxPQUFPLElBQUEsV0FBSSxFQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLFVBQVUsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUM3RSxJQUFBLGdCQUFTLEVBQUMsQ0FBQyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLGlCQUFpQixFQUFFLEVBQUUsRUFBRTtRQUM3RCxPQUFPLElB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Q0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDO3FCQUN6RDtpQkFDRjthQUNGO1NBQ0Y7UUFDSCxDQUFDLENBQUMsRUFBRSxDQUFDO0FBQ1QsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBCdWlsZGVyQ29udGV4dCwgQnVpbGRlck91dHB1dCwgY3JlYXRlQnVpbGRlciB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9hcmNoaXRlY3QnO1xuaW1wb3J0IHsgcnVuV2VicGFjayB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9idWlsZC13ZWJwYWNrJztcbmltcG9ydCB7IHJlYWRGaWxlIH0gZnJvbSAnbm9kZTpmcy9wcm9taXNlcyc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ25vZGU6cGF0aCc7XG5pbXBvcnQgeyBPYnNlcnZhYmxlLCBjb25jYXRNYXAsIGZyb20gfSBmcm9tICdyeGpzJztcbmltcG9ydCB3ZWJwYWNrLCB7IENvbmZpZ3VyYXRpb24gfSBmcm9tICd3ZWJwYWNrJztcbmltcG9ydCB7IEV4ZWN1dGlvblRyYW5zZm9ybWVyIH0gZnJvbSAnLi4vLi4vdHJhbnNmb3Jtcyc7XG5pbXBvcnQge1xuICBOb3JtYWxpemVkQnJvd3NlckJ1aWxkZXJTY2hlbWEsXG4gIGRlbGV0ZU91dHB1dERpcixcbiAgbm9ybWFsaXplQXNzZXRQYXR0ZXJucyxcbn0gZnJvbSAnLi4vLi4vdXRpbHMnO1xuaW1wb3J0IHsgY29sb3JzIH0gZnJvbSAnLi4vLi4vdXRpbHMvY29sb3InO1xuaW1wb3J0IHsgY29weUFzc2V0cyB9IGZyb20gJy4uLy4uL3V0aWxzL2NvcHktYXNzZXRzJztcbmltcG9ydCB7IGFzc2VydElzRXJyb3IgfSBmcm9tICcuLi8uLi91dGlscy9lcnJvcic7XG5pbXBvcnQgeyBpMThuSW5saW5lRW1pdHRlZEZpbGVzIH0gZnJvbSAnLi4vLi4vdXRpbHMvaTE4bi1pbmxpbmluZyc7XG5pbXBvcnQgeyBJMThuT3B0aW9ucyB9IGZyb20gJy4uLy4uL3V0aWxzL2kxOG4tb3B0aW9ucyc7XG5pbXBvcnQgeyBlbnN1cmVPdXRwdXRQYXRocyB9IGZyb20gJy4uLy4uL3V0aWxzL291dHB1dC1wYXRocyc7XG5pbXBvcnQgeyBwdXJnZVN0YWxlQnVpbGRDYWNoZSB9IGZyb20gJy4uLy4uL3V0aWxzL3B1cmdlLWNhY2hlJztcbmltcG9ydCB7IFNwaW5uZXIgfSBmcm9tICcuLi8uLi91dGlscy9zcGlubmVyJztcbmltcG9ydCB7IGFzc2VydENvbXBhdGlibGVBbmd1bGFyVmVyc2lvbiB9IGZyb20gJy4uLy4uL3V0aWxzL3ZlcnNpb24nO1xuaW1wb3J0IHtcbiAgQnJvd3NlcldlYnBhY2tDb25maWdPcHRpb25zLFxuICBnZW5lcmF0ZUkxOG5Ccm93c2VyV2VicGFja0NvbmZpZ0Zyb21Db250ZXh0LFxufSBmcm9tICcuLi8uLi91dGlscy93ZWJwYWNrLWJyb3dzZXItY29uZmlnJztcbmltcG9ydCB7IGdldENvbW1vbkNvbmZpZywgZ2V0U3R5bGVzQ29uZmlnIH0gZnJvbSAnLi4vLi4vd2VicGFjay9jb25maWdzJztcbmltcG9ydCB7IGlzUGxhdGZvcm1TZXJ2ZXJJbnN0YWxsZWQgfSBmcm9tICcuLi8uLi93ZWJwYWNrL3V0aWxzL2hlbHBlcnMnO1xuaW1wb3J0IHtcbiAgc3RhdHNFcnJvcnNUb1N0cmluZyxcbiAgc3RhdHNIYXNFcnJvcnMsXG4gIHN0YXRzSGFzV2FybmluZ3MsXG4gIHN0YXRzV2FybmluZ3NUb1N0cmluZyxcbiAgd2VicGFja1N0YXRzTG9nZ2VyLFxufSBmcm9tICcuLi8uLi93ZWJwYWNrL3V0aWxzL3N0YXRzJztcbmltcG9ydCB7IFNjaGVtYSBhcyBTZXJ2ZXJCdWlsZGVyT3B0aW9ucyB9IGZyb20gJy4vc2NoZW1hJztcblxuLyoqXG4gKiBAZXhwZXJpbWVudGFsIERpcmVjdCB1c2FnZSBvZiB0aGlzIHR5cGUgaXMgY29uc2lkZXJlZCBleHBlcmltZW50YWwuXG4gKi9cbmV4cG9ydCB0eXBlIFNlcnZlckJ1aWxkZXJPdXRwdXQgPSBCdWlsZGVyT3V0cHV0ICYge1xuICBiYXNlT3V0cHV0UGF0aDogc3RyaW5nO1xuICBvdXRwdXRQYXRoOiBzdHJpbmc7XG4gIG91dHB1dHM6IHtcbiAgICBsb2NhbGU/OiBzdHJpbmc7XG4gICAgcGF0aDogc3RyaW5nO1xuICB9W107XG59O1xuXG5leHBvcnQgeyBTZXJ2ZXJCdWlsZGVyT3B0aW9ucyB9O1xuXG4vKipcbiAqIEBleHBlcmltZW50YWwgRGlyZWN0IHVzYWdlIG9mIHRoaXMgZnVuY3Rpb24gaXMgY29uc2lkZXJlZCBleHBlcmltZW50YWwuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBleGVjdXRlKFxuICBvcHRpb25zOiBTZXJ2ZXJCdWlsZGVyT3B0aW9ucyxcbiAgY29udGV4dDogQnVpbGRlckNvbnRleHQsXG4gIHRyYW5zZm9ybXM6IHtcbiAgICB3ZWJwYWNrQ29uZmlndXJhdGlvbj86IEV4ZWN1dGlvblRyYW5zZm9ybWVyPHdlYnBhY2suQ29uZmlndXJhdGlvbj47XG4gIH0gPSB7fSxcbik6IE9ic2VydmFibGU8U2VydmVyQnVpbGRlck91dHB1dD4ge1xuICBjb25zdCByb290ID0gY29udGV4dC53b3Jrc3BhY2VSb290O1xuXG4gIC8vIENoZWNrIEFuZ3VsYXIgdmVyc2lvbi5cbiAgYXNzZXJ0Q29tcGF0aWJsZUFuZ3VsYXJWZXJzaW9uKHJvb3QpO1xuXG4gIGNvbnN0IGJhc2VPdXRwdXRQYXRoID0gcGF0aC5yZXNvbHZlKHJvb3QsIG9wdGlvbnMub3V0cHV0UGF0aCk7XG4gIGxldCBvdXRwdXRQYXRoczogdW5kZWZpbmVkIHwgTWFwPHN0cmluZywgc3RyaW5nPjtcblxuICByZXR1cm4gZnJvbShpbml0aWFsaXplKG9wdGlvbnMsIGNvbnRleHQsIHRyYW5zZm9ybXMud2VicGFja0NvbmZpZ3VyYXRpb24pKS5waXBlKFxuICAgIGNvbmNhdE1hcCgoeyBjb25maWcsIGkxOG4sIHByb2plY3RSb290LCBwcm9qZWN0U291cmNlUm9vdCB9KSA9PiB7XG4gICAgICByZXR1cm4gcnVuV2VicGFjayhjb25maWcsIGNvbnRleHQsIHtcbiAgICAgICAgd2VicGFja0ZhY3Rvcnk6IHJlcXVpcmUoJ3dlYnBhY2snKSBhcyB0eXBlb2Ygd2VicGFjayxcbiAgICAgICAgbG9nZ2luZzogKHN0YXRzLCBjb25maWcpID0+IHtcbiAgICAgICAgICBpZiAob3B0aW9ucy52ZXJib3NlKSB7XG4gICAgICAgICAgICBjb250ZXh0LmxvZ2dlci5pbmZvKHN0YXRzLnRvU3RyaW5nKGNvbmZpZy5zdGF0cykpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgIH0pLnBpcGUoXG4gICAgICAgIGNvbmNhdE1hcChhc3luYyAob3V0cHV0KSA9PiB7XG4gICAgICAgICAgY29uc3QgeyBlbWl0dGVkRmlsZXMgPSBbXSwgb3V0cHV0UGF0aCwgd2VicGFja1N0YXRzLCBzdWNjZXNzIH0gPSBvdXRwdXQ7XG4gICAgICAgICAgaWYgKCF3ZWJwYWNrU3RhdHMpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignV2VicGFjayBzdGF0cyBidWlsZCByZXN1bHQgaXMgcmVxdWlyZWQuJyk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCFzdWNjZXNzKSB7XG4gICAgICAgICAgICBpZiAoc3RhdHNIYXNXYXJuaW5ncyh3ZWJwYWNrU3RhdHMpKSB7XG4gICAgICAgICAgICAgIGNvbnRleHQubG9nZ2VyLndhcm4oc3RhdHNXYXJuaW5nc1RvU3RyaW5nKHdlYnBhY2tTdGF0cywgeyBjb2xvcnM6IHRydWUgfSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHN0YXRzSGFzRXJyb3JzKHdlYnBhY2tTdGF0cykpIHtcbiAgICAgICAgICAgICAgY29udGV4dC5sb2dnZXIuZXJyb3Ioc3RhdHNFcnJvcnNUb1N0cmluZyh3ZWJwYWNrU3RhdHMsIHsgY29sb3JzOiB0cnVlIH0pKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIG91dHB1dDtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCBzcGlubmVyID0gbmV3IFNwaW5uZXIoKTtcbiAgICAgICAgICBzcGlubmVyLmVuYWJsZWQgPSBvcHRpb25zLnByb2dyZXNzICE9PSBmYWxzZTtcbiAgICAgICAgICBvdXRwdXRQYXRocyA9IGVuc3VyZU91dHB1dFBhdGhzKGJhc2VPdXRwdXRQYXRoLCBpMThuKTtcblxuICAgICAgICAgIC8vIENvcHkgYXNzZXRzXG4gICAgICAgICAgaWYgKCFvcHRpb25zLndhdGNoICYmIG9wdGlvbnMuYXNzZXRzPy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHNwaW5uZXIuc3RhcnQoJ0NvcHlpbmcgYXNzZXRzLi4uJyk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBhd2FpdCBjb3B5QXNzZXRzKFxuICAgICAgICAgICAgICAgIG5vcm1hbGl6ZUFzc2V0UGF0dGVybnMoXG4gICAgICAgICAgICAgICAgICBvcHRpb25zLmFzc2V0cyxcbiAgICAgICAgICAgICAgICAgIGNvbnRleHQud29ya3NwYWNlUm9vdCxcbiAgICAgICAgICAgICAgICAgIHByb2plY3RSb290LFxuICAgICAgICAgICAgICAgICAgcHJvamVjdFNvdXJjZVJvb3QsXG4gICAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgICAgICBBcnJheS5mcm9tKG91dHB1dFBhdGhzLnZhbHVlcygpKSxcbiAgICAgICAgICAgICAgICBjb250ZXh0LndvcmtzcGFjZVJvb3QsXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgIHNwaW5uZXIuc3VjY2VlZCgnQ29weWluZyBhc3NldHMgY29tcGxldGUuJyk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgc3Bpbm5lci5mYWlsKGNvbG9ycy5yZWRCcmlnaHQoJ0NvcHlpbmcgb2YgYXNzZXRzIGZhaWxlZC4nKSk7XG4gICAgICAgICAgICAgIGFzc2VydElzRXJyb3IoZXJyKTtcblxuICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIC4uLm91dHB1dCxcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBlcnJvcjogJ1VuYWJsZSB0byBjb3B5IGFzc2V0czogJyArIGVyci5tZXNzYWdlLFxuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChpMThuLnNob3VsZElubGluZSkge1xuICAgICAgICAgICAgY29uc3Qgc3VjY2VzcyA9IGF3YWl0IGkxOG5JbmxpbmVFbWl0dGVkRmlsZXMoXG4gICAgICAgICAgICAgIGNvbnRleHQsXG4gICAgICAgICAgICAgIGVtaXR0ZWRGaWxlcyxcbiAgICAgICAgICAgICAgaTE4bixcbiAgICAgICAgICAgICAgYmFzZU91dHB1dFBhdGgsXG4gICAgICAgICAgICAgIEFycmF5LmZyb20ob3V0cHV0UGF0aHMudmFsdWVzKCkpLFxuICAgICAgICAgICAgICBbXSxcbiAgICAgICAgICAgICAgb3V0cHV0UGF0aCxcbiAgICAgICAgICAgICAgb3B0aW9ucy5pMThuTWlzc2luZ1RyYW5zbGF0aW9uLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIGlmICghc3VjY2Vzcykge1xuICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIC4uLm91dHB1dCxcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICB3ZWJwYWNrU3RhdHNMb2dnZXIoY29udGV4dC5sb2dnZXIsIHdlYnBhY2tTdGF0cywgY29uZmlnKTtcblxuICAgICAgICAgIHJldHVybiBvdXRwdXQ7XG4gICAgICAgIH0pLFxuICAgICAgKTtcbiAgICB9KSxcbiAgICBjb25jYXRNYXAoYXN5bmMgKG91dHB1dCkgPT4ge1xuICAgICAgaWYgKCFvdXRwdXQuc3VjY2Vzcykge1xuICAgICAgICByZXR1cm4gb3V0cHV0IGFzIFNlcnZlckJ1aWxkZXJPdXRwdXQ7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIC4uLm91dHB1dCxcbiAgICAgICAgYmFzZU91dHB1dFBhdGgsXG4gICAgICAgIG91dHB1dHM6IChvdXRwdXRQYXRocyAmJlxuICAgICAgICAgIFsuLi5vdXRwdXRQYXRocy5lbnRyaWVzKCldLm1hcCgoW2xvY2FsZSwgcGF0aF0pID0+ICh7XG4gICAgICAgICAgICBsb2NhbGUsXG4gICAgICAgICAgICBwYXRoLFxuICAgICAgICAgIH0pKSkgfHwge1xuICAgICAgICAgIHBhdGg6IGJhc2VPdXRwdXRQYXRoLFxuICAgICAgICB9LFxuICAgICAgfSBhcyBTZXJ2ZXJCdWlsZGVyT3V0cHV0O1xuICAgIH0pLFxuICApO1xufVxuXG5leHBvcnQgZGVmYXVsdCBjcmVhdGVCdWlsZGVyPFNlcnZlckJ1aWxkZXJPcHRpb25zLCBTZXJ2ZXJCdWlsZGVyT3V0cHV0PihleGVjdXRlKTtcblxuYXN5bmMgZnVuY3Rpb24gaW5pdGlhbGl6ZShcbiAgb3B0aW9uczogU2VydmVyQnVpbGRlck9wdGlvbnMsXG4gIGNvbnRleHQ6IEJ1aWxkZXJDb250ZXh0LFxuICB3ZWJwYWNrQ29uZmlndXJhdGlvblRyYW5zZm9ybT86IEV4ZWN1dGlvblRyYW5zZm9ybWVyPHdlYnBhY2suQ29uZmlndXJhdGlvbj4sXG4pOiBQcm9taXNlPHtcbiAgY29uZmlnOiB3ZWJwYWNrLkNvbmZpZ3VyYXRpb247XG4gIGkxOG46IEkxOG5PcHRpb25zO1xuICBwcm9qZWN0Um9vdDogc3RyaW5nO1xuICBwcm9qZWN0U291cmNlUm9vdD86IHN0cmluZztcbn0+IHtcbiAgLy8gUHVyZ2Ugb2xkIGJ1aWxkIGRpc2sgY2FjaGUuXG4gIGF3YWl0IHB1cmdlU3RhbGVCdWlsZENhY2hlKGNvbnRleHQpO1xuXG4gIGF3YWl0IGNoZWNrVHNDb25maWdGb3JQcmVzZXJ2ZVdoaXRlc3BhY2VzU2V0dGluZyhjb250ZXh0LCBvcHRpb25zLnRzQ29uZmlnKTtcblxuICBjb25zdCBicm93c2Vyc2xpc3QgPSAoYXdhaXQgaW1wb3J0KCdicm93c2Vyc2xpc3QnKSkuZGVmYXVsdDtcbiAgY29uc3Qgb3JpZ2luYWxPdXRwdXRQYXRoID0gb3B0aW9ucy5vdXRwdXRQYXRoO1xuICAvLyBBc3NldHMgYXJlIHByb2Nlc3NlZCBkaXJlY3RseSBieSB0aGUgYnVpbGRlciBleGNlcHQgd2hlbiB3YXRjaGluZ1xuICBjb25zdCBhZGp1c3RlZE9wdGlvbnMgPSBvcHRpb25zLndhdGNoID8gb3B0aW9ucyA6IHsgLi4ub3B0aW9ucywgYXNzZXRzOiBbXSB9O1xuXG4gIGNvbnN0IHsgY29uZmlnLCBwcm9qZWN0Um9vdCwgcHJvamVjdFNvdXJjZVJvb3QsIGkxOG4gfSA9XG4gICAgYXdhaXQgZ2VuZXJhdGVJMThuQnJvd3NlcldlYnBhY2tDb25maWdGcm9tQ29udGV4dChcbiAgICAgIHtcbiAgICAgICAgLi4uYWRqdXN0ZWRPcHRpb25zLFxuICAgICAgICBhb3Q6IHRydWUsXG4gICAgICAgIHBsYXRmb3JtOiAnc2VydmVyJyxcbiAgICAgIH0gYXMgTm9ybWFsaXplZEJyb3dzZXJCdWlsZGVyU2NoZW1hLFxuICAgICAgY29udGV4dCxcbiAgICAgICh3Y28pID0+IHtcbiAgICAgICAgLy8gV2UgdXNlIHRoZSBwbGF0Zm9ybSB0byBkZXRlcm1pbmUgdGhlIEphdmFTY3JpcHQgc3ludGF4IG91dHB1dC5cbiAgICAgICAgd2NvLmJ1aWxkT3B0aW9ucy5zdXBwb3J0ZWRCcm93c2VycyA/Pz0gW107XG4gICAgICAgIHdjby5idWlsZE9wdGlvbnMuc3VwcG9ydGVkQnJvd3NlcnMucHVzaCguLi5icm93c2Vyc2xpc3QoJ21haW50YWluZWQgbm9kZSB2ZXJzaW9ucycpKTtcblxuICAgICAgICByZXR1cm4gW2dldFBsYXRmb3JtU2VydmVyRXhwb3J0c0NvbmZpZyh3Y28pLCBnZXRDb21tb25Db25maWcod2NvKSwgZ2V0U3R5bGVzQ29uZmlnKHdjbyldO1xuICAgICAgfSxcbiAgICApO1xuXG4gIGlmIChvcHRpb25zLmRlbGV0ZU91dHB1dFBhdGgpIHtcbiAgICBkZWxldGVPdXRwdXREaXIoY29udGV4dC53b3Jrc3BhY2VSb290LCBvcmlnaW5hbE91dHB1dFBhdGgpO1xuICB9XG5cbiAgY29uc3QgdHJhbnNmb3JtZWRDb25maWcgPSAoYXdhaXQgd2VicGFja0NvbmZpZ3VyYXRpb25UcmFuc2Zvcm0/Lihjb25maWcpKSA/PyBjb25maWc7XG5cbiAgcmV0dXJuIHsgY29uZmlnOiB0cmFuc2Zvcm1lZENvbmZpZywgaTE4biwgcHJvamVjdFJvb3QsIHByb2plY3RTb3VyY2VSb290IH07XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNoZWNrVHNDb25maWdGb3JQcmVzZXJ2ZVdoaXRlc3BhY2VzU2V0dGluZyhcbiAgY29udGV4dDogQnVpbGRlckNvbnRleHQsXG4gIHRzQ29uZmlnUGF0aDogc3RyaW5nLFxuKTogUHJvbWlzZTx2b2lkPiB7XG4gIC8vIFdlIGRvbid0IHVzZSB0aGUgYHJlYWRUc0NvbmZpZ2AgbWV0aG9kIG9uIHB1cnBvc2UgaGVyZS5cbiAgLy8gVG8gb25seSBjYXRjaCBjYXNlcyB3ZXJlIGBwcmVzZXJ2ZVdoaXRlc3BhY2VzYCBpcyBzZXQgZGlyZWN0bHkgaW4gdGhlIGB0c2NvbmZpZy5zZXJ2ZXIuanNvbmAsXG4gIC8vIHdoaWNoIGluIHRoZSBtYWpvcml0eSBvZiBjYXNlcyB3aWxsIGNhdXNlIGEgbWlzdG1hdGNoIGJldHdlZW4gY2xpZW50IGFuZCBzZXJ2ZXIgYnVpbGRzLlxuICAvLyBUZWNobmljYWxseSB3ZSBzaG91bGQgY2hlY2sgaWYgYHRzY29uZmlnLnNlcnZlci5qc29uYCBhbmQgYHRzY29uZmlnLmFwcC5qc29uYCB2YWx1ZXMgbWF0Y2guXG5cbiAgLy8gQnV0OlxuICAvLyAxLiBJdCBpcyBub3QgZ3VhcmFudGVlZCB0aGF0IGB0c2NvbmZpZy5hcHAuanNvbmAgaXMgdXNlZCB0byBidWlsZCB0aGUgY2xpZW50IHNpZGUgb2YgdGhpcyBhcHAuXG4gIC8vIDIuIFRoZXJlIGlzIG5vIGVhc3kgd2F5IHRvIGFjY2VzcyB0aGUgYnVpbGQgYnVpbGQgY29uZmlnIGZyb20gdGhlIHNlcnZlciBidWlsZGVyLlxuICAvLyA0LiBUaGlzIHdpbGwgbm8gbG9uZ2VyIGJlIGFuIGlzc3VlIHdpdGggYSBzaW5nbGUgY29tcGlsYXRpb24gbW9kZWwgd2VyZSB0aGUgc2FtZSB0c2NvbmZpZyBpcyB1c2VkIGZvciBib3RoIGJyb3dzZXIgYW5kIHNlcnZlciBidWlsZHMuXG4gIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCByZWFkRmlsZShwYXRoLmpvaW4oY29udGV4dC53b3Jrc3BhY2VSb290LCB0c0NvbmZpZ1BhdGgpLCAndXRmLTgnKTtcbiAgY29uc3QgeyBwYXJzZSB9ID0gYXdhaXQgaW1wb3J0KCdqc29uYy1wYXJzZXInKTtcbiAgY29uc3QgdHNDb25maWcgPSBwYXJzZShjb250ZW50LCBbXSwgeyBhbGxvd1RyYWlsaW5nQ29tbWE6IHRydWUgfSk7XG4gIGlmICh0c0NvbmZpZy5hbmd1bGFyQ29tcGlsZXJPcHRpb25zPy5wcmVzZXJ2ZVdoaXRlc3BhY2VzICE9PSB1bmRlZmluZWQpIHtcbiAgICBjb250ZXh0LmxvZ2dlci53YXJuKFxuICAgICAgYFwicHJlc2VydmVXaGl0ZXNwYWNlc1wiIHdhcyBzZXQgaW4gXCIke3RzQ29uZmlnUGF0aH1cIi4gYCArXG4gICAgICAgICdNYWtlIHN1cmUgdGhhdCB0aGlzIHNldHRpbmcgaXMgc2V0IGNvbnNpc3RlbnRseSBpbiBib3RoIFwidHNjb25maWcuc2VydmVyLmpzb25cIiBmb3IgeW91ciBzZXJ2ZXIgc2lkZSAnICtcbiAgICAgICAgJ2FuZCBcInRzY29uZmlnLmFwcC5qc29uXCIgZm9yIHlvdXIgY2xpZW50IHNpZGUuIEEgbWlzbWF0Y2hlZCB2YWx1ZSB3aWxsIGNhdXNlIGh5ZHJhdGlvbiB0byBicmVhay5cXG4nICtcbiAgICAgICAgJ0ZvciBtb3JlIGluZm9ybWF0aW9uIHNlZTogaHR0cHM6Ly9hbmd1bGFyLmlvL2d1aWRlL2h5ZHJhdGlvbiNwcmVzZXJ2ZS13aGl0ZXNwYWNlcycsXG4gICAgKTtcbiAgfVxufVxuXG4vKipcbiAqIEFkZCBgQGFuZ3VsYXIvcGxhdGZvcm0tc2VydmVyYCBleHBvcnRzLlxuICogVGhpcyBpcyBuZWVkZWQgc28gdGhhdCBESSB0b2tlbnMgY2FuIGJlIHJlZmVyZW5jZWQgYW5kIHNldCBhdCBydW50aW1lIG91dHNpZGUgb2YgdGhlIGJ1bmRsZS5cbiAqL1xuZnVuY3Rpb24gZ2V0UGxhdGZvcm1TZXJ2ZXJFeHBvcnRzQ29uZmlnKHdjbzogQnJvd3NlcldlYnBhY2tDb25maWdPcHRpb25zKTogUGFydGlhbDxDb25maWd1cmF0aW9uPiB7XG4gIC8vIEFkZCBgQGFuZ3VsYXIvcGxhdGZvcm0tc2VydmVyYCBleHBvcnRzLlxuICAvLyBUaGlzIGlzIG5lZWRlZCBzbyB0aGF0IERJIHRva2VucyBjYW4gYmUgcmVmZXJlbmNlZCBhbmQgc2V0IGF0IHJ1bnRpbWUgb3V0c2lkZSBvZiB0aGUgYnVuZGxlLlxuXG4gIC8vIE9ubHkgYWRkIGBAYW5ndWxhci9wbGF0Zm9ybS1zZXJ2ZXJgIGV4cG9ydHMgd2hlbiBpdCBpcyBpbnN0YWxsZWQuXG4gIC8vIEluIHNvbWUgY2FzZXMgdGhpcyBidWlsZGVyIGlzIHVzZWQgd2hlbiBgQGFuZ3VsYXIvcGxhdGZvcm0tc2VydmVyYCBpcyBub3QgaW5zdGFsbGVkLlxuICAvLyBFeGFtcGxlOiB3aGVuIHVzaW5nIGBAbmd1bml2ZXJzYWwvY29tbW9uL2Nsb3ZlcmAgd2hpY2ggZG9lcyBub3QgbmVlZCBgQGFuZ3VsYXIvcGxhdGZvcm0tc2VydmVyYC5cblxuICByZXR1cm4gaXNQbGF0Zm9ybVNlcnZlckluc3RhbGxlZCh3Y28ucm9vdClcbiAgICA/IHtcbiAgICAgICAgbW9kdWxlOiB7XG4gICAgICAgICAgcnVsZXM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgbG9hZGVyOiByZXF1aXJlLnJlc29sdmUoJy4vcGxhdGZvcm0tc2VydmVyLWV4cG9ydHMtbG9hZGVyJyksXG4gICAgICAgICAgICAgIGluY2x1ZGU6IFtwYXRoLnJlc29sdmUod2NvLnJvb3QsIHdjby5idWlsZE9wdGlvbnMubWFpbildLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgfVxuICAgIDoge307XG59XG4iXX0=