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
exports.getIndexInputFile = exports.getIndexOutputFile = exports.generateBrowserWebpackConfigFromContext = exports.generateI18nBrowserWebpackConfigFromContext = exports.generateWebpackConfig = void 0;
const path = __importStar(require("path"));
const webpack_1 = require("webpack");
const webpack_merge_1 = require("webpack-merge");
const utils_1 = require("../utils");
const read_tsconfig_1 = require("../utils/read-tsconfig");
const builder_watch_plugin_1 = require("../webpack/plugins/builder-watch-plugin");
const i18n_options_1 = require("./i18n-options");
async function generateWebpackConfig(workspaceRoot, projectRoot, sourceRoot, projectName, options, webpackPartialGenerator, logger, extraBuildOptions) {
    // Ensure Build Optimizer is only used with AOT.
    if (options.buildOptimizer && !options.aot) {
        throw new Error(`The 'buildOptimizer' option cannot be used without 'aot'.`);
    }
    const tsConfigPath = path.resolve(workspaceRoot, options.tsConfig);
    const tsConfig = await (0, read_tsconfig_1.readTsconfig)(tsConfigPath);
    const buildOptions = { ...options, ...extraBuildOptions };
    const wco = {
        root: workspaceRoot,
        logger: logger.createChild('webpackConfigOptions'),
        projectRoot,
        sourceRoot,
        buildOptions,
        tsConfig,
        tsConfigPath,
        projectName,
    };
    wco.buildOptions.progress = (0, utils_1.defaultProgress)(wco.buildOptions.progress);
    const partials = await Promise.all(webpackPartialGenerator(wco));
    const webpackConfig = (0, webpack_merge_1.merge)(partials);
    return webpackConfig;
}
exports.generateWebpackConfig = generateWebpackConfig;
async function generateI18nBrowserWebpackConfigFromContext(options, context, webpackPartialGenerator, extraBuildOptions = {}) {
    const { buildOptions, i18n } = await (0, i18n_options_1.configureI18nBuild)(context, options);
    const result = await generateBrowserWebpackConfigFromContext(buildOptions, context, (wco) => {
        return webpackPartialGenerator(wco);
    }, extraBuildOptions);
    const config = result.config;
    if (i18n.shouldInline) {
        // Remove localize "polyfill" if in AOT mode
        if (buildOptions.aot) {
            if (!config.resolve) {
                config.resolve = {};
            }
            if (Array.isArray(config.resolve.alias)) {
                config.resolve.alias.push({
                    name: '@angular/localize/init',
                    alias: false,
                });
            }
            else {
                if (!config.resolve.alias) {
                    config.resolve.alias = {};
                }
                config.resolve.alias['@angular/localize/init'] = false;
            }
        }
        // Update file hashes to include translation file content
        const i18nHash = Object.values(i18n.locales).reduce((data, locale) => data + locale.files.map((file) => file.integrity || '').join('|'), '');
        config.plugins ?? (config.plugins = []);
        config.plugins.push({
            apply(compiler) {
                compiler.hooks.compilation.tap('build-angular', (compilation) => {
                    webpack_1.javascript.JavascriptModulesPlugin.getCompilationHooks(compilation).chunkHash.tap('build-angular', (_, hash) => {
                        hash.update('$localize' + i18nHash);
                    });
                });
            },
        });
    }
    return { ...result, i18n };
}
exports.generateI18nBrowserWebpackConfigFromContext = generateI18nBrowserWebpackConfigFromContext;
async function generateBrowserWebpackConfigFromContext(options, context, webpackPartialGenerator, extraBuildOptions = {}) {
    const projectName = context.target && context.target.project;
    if (!projectName) {
        throw new Error('The builder requires a target.');
    }
    const workspaceRoot = context.workspaceRoot;
    const projectMetadata = await context.getProjectMetadata(projectName);
    const projectRoot = path.join(workspaceRoot, projectMetadata.root ?? '');
    const sourceRoot = projectMetadata.sourceRoot;
    const projectSourceRoot = sourceRoot ? path.join(workspaceRoot, sourceRoot) : undefined;
    const normalizedOptions = (0, utils_1.normalizeBrowserSchema)(workspaceRoot, projectRoot, projectSourceRoot, options, projectMetadata, context.logger);
    const config = await generateWebpackConfig(workspaceRoot, projectRoot, projectSourceRoot, projectName, normalizedOptions, webpackPartialGenerator, context.logger, extraBuildOptions);
    // If builder watch support is present in the context, add watch plugin
    // This is internal only and currently only used for testing
    const watcherFactory = context.watcherFactory;
    if (watcherFactory) {
        if (!config.plugins) {
            config.plugins = [];
        }
        config.plugins.push(new builder_watch_plugin_1.BuilderWatchPlugin(watcherFactory));
    }
    return {
        config,
        projectRoot,
        projectSourceRoot,
    };
}
exports.generateBrowserWebpackConfigFromContext = generateBrowserWebpackConfigFromContext;
function getIndexOutputFile(index) {
    if (typeof index === 'string') {
        return path.basename(index);
    }
    else {
        return index.output || 'index.html';
    }
}
exports.getIndexOutputFile = getIndexOutputFile;
function getIndexInputFile(index) {
    if (typeof index === 'string') {
        return index;
    }
    else {
        return index.input;
    }
}
exports.getIndexInputFile = getIndexInputFile;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2VicGFjay1icm93c2VyLWNvbmZpZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2J1aWxkX2FuZ3VsYXIvc3JjL3V0aWxzL3dlYnBhY2stYnJvd3Nlci1jb25maWcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFJSCwyQ0FBNkI7QUFDN0IscUNBQW9EO0FBQ3BELGlEQUFzRDtBQUV0RCxvQ0FBbUc7QUFFbkcsMERBQXNEO0FBQ3RELGtGQUFvRztBQUNwRyxpREFBaUU7QUFRMUQsS0FBSyxVQUFVLHFCQUFxQixDQUN6QyxhQUFxQixFQUNyQixXQUFtQixFQUNuQixVQUE4QixFQUM5QixXQUFtQixFQUNuQixPQUF1QyxFQUN2Qyx1QkFBZ0QsRUFDaEQsTUFBeUIsRUFDekIsaUJBQTBEO0lBRTFELGdEQUFnRDtJQUNoRCxJQUFJLE9BQU8sQ0FBQyxjQUFjLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFO1FBQzFDLE1BQU0sSUFBSSxLQUFLLENBQUMsMkRBQTJELENBQUMsQ0FBQztLQUM5RTtJQUVELE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUNuRSxNQUFNLFFBQVEsR0FBRyxNQUFNLElBQUEsNEJBQVksRUFBQyxZQUFZLENBQUMsQ0FBQztJQUVsRCxNQUFNLFlBQVksR0FBbUMsRUFBRSxHQUFHLE9BQU8sRUFBRSxHQUFHLGlCQUFpQixFQUFFLENBQUM7SUFDMUYsTUFBTSxHQUFHLEdBQWdDO1FBQ3ZDLElBQUksRUFBRSxhQUFhO1FBQ25CLE1BQU0sRUFBRSxNQUFNLENBQUMsV0FBVyxDQUFDLHNCQUFzQixDQUFDO1FBQ2xELFdBQVc7UUFDWCxVQUFVO1FBQ1YsWUFBWTtRQUNaLFFBQVE7UUFD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dUIsRUFDdkIsT0FBTyxDQUFDLE1BQU0sRUFDZCxpQkFBaUIsQ0FDbEIsQ0FBQztJQUVGLHVFQUF1RTtJQUN2RSw0REFBNEQ7SUFDNUQsTUFBTSxjQUFjLEdBQ2xCLE9BR0QsQ0FBQyxjQUFjLENBQUM7SUFDakIsSUFBSSxjQUFjLEVBQUU7UUFDbEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUU7WUFDbkIsTUFBTSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7U0FDckI7UUFDRCxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLHlDQUFrQixDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7S0FDN0Q7SUFFRCxPQUFPO1FBQ0wsTUFBTTtRQUNOLFdBQVc7UUFDWCxpQkFBaUI7S0FDbEIsQ0FBQztBQUNKLENBQUM7QUF4REQsMEZBd0RDO0FBRUQsU0FBZ0Isa0JBQWtCLENBQUMsS0FBb0M7SUFDckUsSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLEVBQUU7UUFDN0IsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO0tBQzdCO1NBQU07UUFDTCxPQUFPLEtBQUssQ0FBQyxNQUFNLElBQUksWUFBWSxDQUFDO0tBQ3JDO0FBQ0gsQ0FBQztBQU5ELGdEQU1DO0FBRUQsU0FBZ0IsaUJBQWlCLENBQUMsS0FBb0M7SUFDcEUsSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLEVBQUU7UUFDN0IsT0FBTyxLQUFLLENBQUM7S0FDZDtTQUFNO1FBQ0wsT0FBTyxLQUFLLENBQUMsS0FBSyxDQUFDO0tBQ3BCO0FBQ0gsQ0FBQztBQU5ELDhDQU1DIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7IEJ1aWxkZXJDb250ZXh0IH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2FyY2hpdGVjdCc7XG5pbXBvcnQgeyBsb2dnaW5nIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IENvbmZpZ3VyYXRpb24sIGphdmFzY3JpcHQgfSBmcm9tICd3ZWJwYWNrJztcbmltcG9ydCB7IG1lcmdlIGFzIHdlYnBhY2tNZXJnZSB9IGZyb20gJ3dlYnBhY2stbWVyZ2UnO1xuaW1wb3J0IHsgU2NoZW1hIGFzIEJyb3dzZXJCdWlsZGVyU2NoZW1hIH0gZnJvbSAnLi4vYnVpbGRlcnMvYnJvd3Nlci9zY2hlbWEnO1xuaW1wb3J0IHsgTm9ybWFsaXplZEJyb3dzZXJCdWlsZGVyU2NoZW1hLCBkZWZhdWx0UHJvZ3Jlc3MsIG5vcm1hbGl6ZUJyb3dzZXJTY2hlbWEgfSBmcm9tICcuLi91dGlscyc7XG5pbXBvcnQgeyBXZWJwYWNrQ29uZmlnT3B0aW9ucyB9IGZyb20gJy4uL3V0aWxzL2J1aWxkLW9wdGlvbnMnO1xuaW1wb3J0IHsgcmVhZFRzY29uZmlnIH0gZnJvbSAnLi4vdXRpbHMvcmVhZC10c2NvbmZpZyc7XG5pbXBvcnQgeyBCdWlsZGVyV2F0Y2hQbHVnaW4sIEJ1aWxkZXJXYXRjaGVyRmFjdG9yeSB9IGZyb20gJy4uL3dlYnBhY2svcGx1Z2lucy9idWlsZGVyLXdhdGNoLXBsdWdpbic7XG5pbXBvcnQgeyBJMThuT3B0aW9ucywgY29uZmlndXJlSTE4bkJ1aWxkIH0gZnJvbSAnLi9pMThuLW9wdGlvbnMnO1xuXG5leHBvcnQgdHlwZSBCcm93c2VyV2VicGFja0NvbmZpZ09wdGlvbnMgPSBXZWJwYWNrQ29uZmlnT3B0aW9uczxOb3JtYWxpemVkQnJvd3NlckJ1aWxkZXJTY2hlbWE+O1xuXG5leHBvcnQgdHlwZSBXZWJwYWNrUGFydGlhbEdlbmVyYXRvciA9IChcbiAgY29uZmlndXJhdGlvbk9wdGlvbnM6IEJyb3dzZXJXZWJwYWNrQ29uZmlnT3B0aW9ucyxcbikgPT4gKFByb21pc2U8Q29uZmlndXJhdGlvbj4gfCBDb25maWd1cmF0aW9uKVtdO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2VuZXJhdGVXZWJwYWNrQ29uZmlnKFxuICB3b3Jrc3BhY2VSb290OiBzdHJpbmcsXG4gIHByb2plY3RSb290OiBzdHJpbmcsXG4gIHNvdXJjZVJvb3Q6IHN0cmluZyB8IHVuZGVmaW5lZCxcbiAgcHJvamVjdE5hbWU6IHN0cmluZyxcbiAgb3B0aW9uczogTm9ybWFsaXplZEJyb3dzZXJCdWlsZGVyU2NoZW1hLFxuICB3ZWJwYWNrUGFydGlhbEdlbmVyYXRvcjogV2VicGFja1BhcnRpYWxHZW5lcmF0b3IsXG4gIGxvZ2dlcjogbG9nZ2luZy5Mb2dnZXJBcGksXG4gIGV4dHJhQnVpbGRPcHRpb25zOiBQYXJ0aWFsPE5vcm1hbGl6ZWRCcm93c2VyQnVpbGRlclNjaGVtYT4sXG4pOiBQcm9taXNlPENvbmZpZ3VyYXRpb24+IHtcbiAgLy8gRW5zdXJlIEJ1aWxkIE9wdGltaXplciBpcyBvbmx5IHVzZWQgd2l0aCBBT1QuXG4gIGlmIChvcHRpb25zLmJ1aWxkT3B0aW1pemVyICYmICFvcHRpb25zLmFvdCkge1xuICAgIHRocm93IG5ldyBFcnJvcihgVGhlICdidWlsZE9wdGltaXplcicgb3B0aW9uIGNhbm5vdCBiZSB1c2VkIHdpdGhvdXQgJ2FvdCcuYCk7XG4gIH1cblxuICBjb25zdCB0c0NvbmZpZ1BhdGggPSBwYXRoLnJlc29sdmUod29ya3NwYWNlUm9vdCwgb3B0aW9ucy50c0NvbmZpZyk7XG4gIGNvbnN0IHRzQ29uZmlnID0gYXdhaXQgcmVhZFRzY29uZmlnKHRzQ29uZmlnUGF0aCk7XG5cbiAgY29uc3QgYnVpbGRPcHRpb25zOiBOb3JtYWxpemVkQnJvd3NlckJ1aWxkZXJTY2hlbWEgPSB7IC4uLm9wdGlvbnMsIC4uLmV4dHJhQnVpbGRPcHRpb25zIH07XG4gIGNvbnN0IHdjbzogQnJvd3NlcldlYnBhY2tDb25maWdPcHRpb25zID0ge1xuICAgIHJvb3Q6IHdvcmtzcGFjZVJvb3QsXG4gICAgbG9nZ2VyOiBsb2dnZXIuY3JlYXRlQ2hpbGQoJ3dlYnBhY2tDb25maWdPcHRpb25zJyksXG4gICAgcHJvamVjdFJvb3QsXG4gICAgc291cmNlUm9vdCxcbiAgICBidWlsZE9wdGlvbnMsXG4gICAgdHNDb25maWcsXG4gICAgdHNDb25maWdQYXRoLFxuICAgIHByb2plY3ROYW1lLFxuICB9O1xuXG4gIHdjby5idWlsZE9wdGlvbnMucHJvZ3Jlc3MgPSBkZWZhdWx0UHJvZ3Jlc3Mod2NvLmJ1aWxkT3B0aW9ucy5wcm9ncmVzcyk7XG5cbiAgY29uc3QgcGFydGlhbHMgPSBhd2FpdCBQcm9taXNlLmFsbCh3ZWJwYWNrUGFydGlhbEdlbmVyYXRvcih3Y28pKTtcbiAgY29uc3Qgd2VicGFja0NvbmZpZyA9IHdlYnBhY2tNZXJnZShwYXJ0aWFscyk7XG5cbiAgcmV0dXJuIHdlYnBhY2tDb25maWc7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZW5lcmF0ZUkxOG5Ccm93c2VyV2VicGFja0NvbmZpZ0Zyb21Db250ZXh0KFxuICBvcHRpb25zOiBCcm93c2VyQnVpbGRlclNjaGVtYSxcbiAgY29udGV4dDogQnVpbGRlckNvbnRleHQsXG4gIHdlYnBhY2tQYXJ0aWFsR2VuZXJhdG9yOiBXZWJwYWNrUGFydGlhbEdlbmVyYXRvcixcbiAgZXh0cmFCdWlsZE9wdGlvbnM6IFBhcnRpYWw8Tm9ybWFsaXplZEJyb3dzZXJCdWlsZGVyU2NoZW1hPiA9IHt9LFxuKTogUHJvbWlzZTx7XG4gIGNvbmZpZzogQ29uZmlndXJhdGlvbjtcbiAgcHJvamVjdFJvb3Q6IHN0cmluZztcbiAgcHJvamVjdFNvdXJjZVJvb3Q/OiBzdHJpbmc7XG4gIGkxOG46IEkxOG5PcHRpb25zO1xufT4ge1xuICBjb25zdCB7IGJ1aWxkT3B0aW9ucywgaTE4biB9ID0gYXdhaXQgY29uZmlndXJlSTE4bkJ1aWxkKGNvbnRleHQsIG9wdGlvbnMpO1xuICBjb25zdCByZXN1bHQgPSBhd2FpdCBnZW5lcmF0ZUJyb3dzZXJXZWJwYWNrQ29uZmlnRnJvbUNvbnRleHQoXG4gICAgYnVpbGRPcHRpb25zLFxuICAgIGNvbnRleHQsXG4gICAgKHdjbykgPT4ge1xuICAgICAgcmV0dXJuIHdlYnBhY2tQYXJ0aWFsR2VuZXJhdG9yKHdjbyk7XG4gICAgfSxcbiAgICBleHRyYUJ1aWxkT3B0aW9ucyxcbiAgKTtcbiAgY29uc3QgY29uZmlnID0gcmVzdWx0LmNvbmZpZztcblxuICBpZiAoaTE4bi5zaG91bGRJbmxpbmUpIHtcbiAgICAvLyBSZW1vdmUgbG9jYWxpemUgXCJwb2x5ZmlsbFwiIGlmIGluIEFPVCBtb2RlXG4gICAgaWYgKGJ1aWxkT3B0aW9ucy5hb3QpIHtcbiAgICAgIGlmICghY29uZmlnLnJlc29sdmUpIHtcbiAgICAgICAgY29uZmlnLnJlc29sdmUgPSB7fTtcbiAgICAgIH1cbiAgICAgIGlmIChBcnJheS5pc0FycmF5KGNvbmZpZy5yZXNvbHZlLmFsaWFzKSkge1xuICAgICAgICBjb25maWcucmVzb2x2ZS5hbGlhcy5wdXNoKHtcbiAgICAgICAgICBuYW1lOiAnQGFuZ3VsYXIvbG9jYWxpemUvaW5pdCcsXG4gICAgICAgICAgYWxpYXM6IGZhbHNlLFxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICghY29uZmlnLnJlc29sdmUuYWxpYXMpIHtcbiAgICAgICAgICBjb25maWcucmVzb2x2ZS5hbGlhcyA9IHt9O1xuICAgICAgICB9XG4gICAgICAgIGNvbmZpZy5yZXNvbHZlLmFsaWFzWydAYW5ndWxhci9sb2NhbGl6ZS9pbml0J10gPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBVcGRhdGUgZmlsZSBoYXNoZXMgdG8gaW5jbHVkZSB0cmFuc2xhdGlvbiBmaWxlIGNvbnRlbnRcbiAgICBjb25zdCBpMThuSGFzaCA9IE9iamVjdC52YWx1ZXMoaTE4bi5sb2NhbGVzKS5yZWR1Y2UoXG4gICAgICAoZGF0YSwgbG9jYWxlKSA9PiBkYXRhICsgbG9jYWxlLmZpbGVzLm1hcCgoZmlsZSkgPT4gZmlsZS5pbnRlZ3JpdHkgfHwgJycpLmpvaW4oJ3wnKSxcbiAgICAgICcnLFxuICAgICk7XG5cbiAgICBjb25maWcucGx1Z2lucyA/Pz0gW107XG4gICAgY29uZmlnLnBsdWdpbnMucHVzaCh7XG4gICAgICBhcHBseShjb21waWxlcikge1xuICAgICAgICBjb21waWxlci5ob29rcy5jb21waWxhdGlvbi50YXAoJ2J1aWxkLWFuZ3VsYXInLCAoY29tcGlsYXRpb24pID0+IHtcbiAgICAgICAgICBqYXZhc2NyaXB0LkphdmFzY3JpcHRNb2R1bGVzUGx1Z2luLmdldENvbXBpbGF0aW9uSG9va3MoY29tcGlsYXRpb24pLmNodW5rSGFzaC50YXAoXG4gICAgICAgICAgICAnYnVpbGQtYW5ndWxhcicsXG4gICAgICAgICAgICAoXywgaGFzaCkgPT4ge1xuICAgICAgICAgICAgICBoYXNoLnVwZGF0ZSgnJGxvY2FsaXplJyArIGkxOG5IYXNoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgKTtcbiAgICAgICAgfSk7XG4gICAgICB9LFxuICAgIH0pO1xuICB9XG5cbiAgcmV0dXJuIHsgLi4ucmVzdWx0LCBpMThuIH07XG59XG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2VuZXJhdGVCcm93c2VyV2VicGFja0NvbmZpZ0Zyb21Db250ZXh0KFxuICBvcHRpb25zOiBCcm93c2VyQnVpbGRlclNjaGVtYSxcbiAgY29udGV4dDogQnVpbGRlckNvbnRleHQsXG4gIHdlYnBhY2tQYXJ0aWFsR2VuZXJhdG9yOiBXZWJwYWNrUGFydGlhbEdlbmVyYXRvcixcbiAgZXh0cmFCdWlsZE9wdGlvbnM6IFBhcnRpYWw8Tm9ybWFsaXplZEJyb3dzZXJCdWlsZGVyU2NoZW1hPiA9IHt9LFxuKTogUHJvbWlzZTx7IGNvbmZpZzogQ29uZmlndXJhdGlvbjsgcHJvamVjdFJvb3Q6IHN0cmluZzsgcHJvamVjdFNvdXJjZVJvb3Q/OiBzdHJpbmcgfT4ge1xuICBjb25zdCBwcm9qZWN0TmFtZSA9IGNvbnRleHQudGFyZ2V0ICYmIGNvbnRleHQudGFyZ2V0LnByb2plY3Q7XG4gIGlmICghcHJvamVjdE5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZSBidWlsZGVyIHJlcXVpcmVzIGEgdGFyZ2V0LicpO1xuICB9XG5cbiAgY29uc3Qgd29ya3NwYWNlUm9vdCA9IGNvbnRleHQud29ya3NwYWNlUm9vdDtcbiAgY29uc3QgcHJvamVjdE1ldGFkYXRhID0gYXdhaXQgY29udGV4dC5nZXRQcm9qZWN0TWV0YWRhdGEocHJvamVjdE5hbWUpO1xuICBjb25zdCBwcm9qZWN0Um9vdCA9IHBhdGguam9pbih3b3Jrc3BhY2VSb290LCAocHJvamVjdE1ldGFkYXRhLnJvb3QgYXMgc3RyaW5nIHwgdW5kZWZpbmVkKSA/PyAnJyk7XG4gIGNvbnN0IHNvdXJjZVJvb3QgPSBwcm9qZWN0TWV0YWRhdGEuc291cmNlUm9vdCBhcyBzdHJpbmcgfCB1bmRlZmluZWQ7XG4gIGNvbnN0IHByb2plY3RTb3VyY2VSb290ID0gc291cmNlUm9vdCA/IHBhdGguam9pbih3b3Jrc3BhY2VSb290LCBzb3VyY2VSb290KSA6IHVuZGVmaW5lZDtcblxuICBjb25zdCBub3JtYWxpemVkT3B0aW9ucyA9IG5vcm1hbGl6ZUJyb3dzZXJTY2hlbWEoXG4gICAgd29ya3NwYWNlUm9vdCxcbiAgICBwcm9qZWN0Um9vdCxcbiAgICBwcm9qZWN0U291cmNlUm9vdCxcbiAgICBvcHRpb25zLFxuICAgIHByb2plY3RNZXRhZGF0YSxcbiAgICBjb250ZXh0LmxvZ2dlcixcbiAgKTtcblxuICBjb25zdCBjb25maWcgPSBhd2FpdCBnZW5lcmF0ZVdlYnBhY2tDb25maWcoXG4gICAgd29ya3NwYWNlUm9vdCxcbiAgICBwcm9qZWN0Um9vdCxcbiAgICBwcm9qZWN0U291cmNlUm9vdCxcbiAgICBwcm9qZWN0TmFtZSxcbiAgICBub3JtYWxpemVkT3B0aW9ucyxcbiAgICB3ZWJwYWNrUGFydGlhbEdlbmVyYXRvcixcbiAgICBjb250ZXh0LmxvZ2dlcixcbiAgICBleHRyYUJ1aWxkT3B0aW9ucyxcbiAgKTtcblxuICAvLyBJZiBidWlsZGVyIHdhdGNoIHN1cHBvcnQgaXMgcHJlc2VudCBpbiB0aGUgY29udGV4dCwgYWRkIHdhdGNoIHBsdWdpblxuICAvLyBUaGlzIGlzIGludGVybmFsIG9ubHkgYW5kIGN1cnJlbnRseSBvbmx5IHVzZWQgZm9yIHRlc3RpbmdcbiAgY29uc3Qgd2F0Y2hlckZhY3RvcnkgPSAoXG4gICAgY29udGV4dCBhcyB7XG4gICAgICB3YXRjaGVyRmFjdG9yeT86IEJ1aWxkZXJXYXRjaGVyRmFjdG9yeTtcbiAgICB9XG4gICkud2F0Y2hlckZhY3Rvcnk7XG4gIGlmICh3YXRjaGVyRmFjdG9yeSkge1xuICAgIGlmICghY29uZmlnLnBsdWdpbnMpIHtcbiAgICAgIGNvbmZpZy5wbHVnaW5zID0gW107XG4gICAgfVxuICAgIGNvbmZpZy5wbHVnaW5zLnB1c2gobmV3IEJ1aWxkZXJXYXRjaFBsdWdpbih3YXRjaGVyRmFjdG9yeSkpO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBjb25maWcsXG4gICAgcHJvamVjdFJvb3QsXG4gICAgcHJvamVjdFNvdXJjZVJvb3QsXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRJbmRleE91dHB1dEZpbGUoaW5kZXg6IEJyb3dzZXJCdWlsZGVyU2NoZW1hWydpbmRleCddKTogc3RyaW5nIHtcbiAgaWYgKHR5cGVvZiBpbmRleCA9PT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gcGF0aC5iYXNlbmFtZShpbmRleCk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGluZGV4Lm91dHB1dCB8fCAnaW5kZXguaHRtbCc7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEluZGV4SW5wdXRGaWxlKGluZGV4OiBCcm93c2VyQnVpbGRlclNjaGVtYVsnaW5kZXgnXSk6IHN0cmluZyB7XG4gIGlmICh0eXBlb2YgaW5kZXggPT09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIGluZGV4O1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBpbmRleC5pbnB1dDtcbiAgfVxufVxuIl19