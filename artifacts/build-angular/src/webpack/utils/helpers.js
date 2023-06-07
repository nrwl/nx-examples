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
exports.isPlatformServerInstalled = exports.getStatsOptions = exports.assetPatterns = exports.globalScriptsByBundleName = exports.getCacheSettings = exports.normalizeGlobalStyles = exports.getInstrumentationExcludedPaths = exports.assetNameTemplateFactory = exports.normalizeExtraEntryPoints = exports.getOutputHashFormat = void 0;
const crypto_1 = require("crypto");
const glob_1 = __importDefault(require("glob"));
const path = __importStar(require("path"));
const schema_1 = require("../../builders/browser/schema");
const package_version_1 = require("../../utils/package-version");
function getOutputHashFormat(outputHashing = schema_1.OutputHashing.None, length = 20) {
    const hashTemplate = `.[contenthash:${length}]`;
    switch (outputHashing) {
        case 'media':
            return {
                chunk: '',
                extract: '',
                file: hashTemplate,
                script: '',
            };
        case 'bundles':
            return {
                chunk: hashTemplate,
                extract: hashTemplate,
                file: '',
                script: hashTemplate,
            };
        case 'all':
            return {
                chunk: hashTemplate,
                extract: hashTemplate,
                file: hashTemplate,
                script: hashTemplate,
            };
        case 'none':
        default:
            return {
                chunk: '',
                extract: '',
                file: '',
                script: '',
            };
    }
}
exports.getOutputHashFormat = getOutputHashFormat;
function normalizeExtraEntryPoints(extraEntryPoints, defaultBundleName) {
    return extraEntryPoints.map((entry) => {
        if (typeof entry === 'string') {
            return { input: entry, inject: true, bundleName: defaultBundleName };
        }
        const { inject = true, ...newEntry } = entry;
        let bundleName;
        if (entry.bundleName) {
            bundleName = entry.bundleName;
        }
        else if (!inject) {
            // Lazy entry points use the file name as bundle name.
            bundleName = path.parse(entry.input).name;
        }
        else {
            bundleName = defaultBundleName;
        }
        return { ...newEntry, inject, bundleName };
    });
}
exports.normalizeExtraEntryPoints = normalizeExtraEntryPoints;
function assetNameTemplateFactory(hashFormat) {
    const visitedFiles = new Map();
    return (resourcePath) => {
        if (hashFormat.file) {
            // File names are hashed therefore we don't need to handle files with the same file name.
            return `[name]${hashFormat.file}.[ext]`;
        }
        const filename = path.basename(resourcePath);
        // Check if the file with the same name has already been processed.
        const visited = visitedFiles.get(filename);
        if (!visited) {
            // Not visited.
            visitedFiles.set(filename, resourcePath);
            return filename;
        }
        else if (visited === resourcePath) {
            // Same file.
            return filename;
        }
        // File has the same name but it's in a different location.
        return '[path][name].[ext]';
    };
}
exports.assetNameTemplateFactory = assetNameTemplateFactory;
function getInstrumentationExcludedPaths(root, excludedPaths) {
    const excluded = new Set();
    for (const excludeGlob of excludedPaths) {
        glob_1.default
            .sync(excludeGlob, { nodir: true, cwd: root, root, nomount: true })
            .forEach((p) => excluded.add(path.join(root, p)));
    }
    return excluded;
}
exports.getInstrumentationExcludedPaths = getInstrumentationExcludedPaths;
function normalizeGlobalStyles(styleEntrypoints) {
    var _a;
    const entryPoints = {};
    const noInjectNames = [];
    if (styleEntrypoints.length === 0) {
        return { entryPoints, noInjectNames };
    }
    for (const style of normalizeExtraEntryPoints(styleEntrypoints, 'styles')) {
        // Add style entry points.
        entryPoints[_a = style.bundleName] ?? (entryPoints[_a] = []);
        entryPoints[style.bundleName].push(style.input);
        // Add non injected styles to the list.
        if (!style.inject) {
            noInjectNames.push(style.bundleName);
        }
    }
    return { entryPoints, noInjectNames };
}
exports.normalizeGlobalStyles = normalizeGlobalStyles;
function getCacheSettings(wco, angularVersion) {
    const { enabled, path: cacheDirectory } = wco.buildOptions.cache;
    if (enabled) {
        return {
            type: 'filesystem',
            profile: wco.buildOptions.verbose,
            cacheDirectory: path.join(cacheDirectory, 'angular-webpack'),
            maxMemoryGenerations: 1,
            // We use the versions and build options as the cache name. The Webpack configurations are too
            // dynamic and shared among different build types: test, build and serve.
            // None of which are "named".
            name: (0, crypto_1.createHash)('sha1')
                .update(angularVersion)
                .update(package_version_1.VERSION)
                .update(wco.projectRoot)
                .update(JSON.stringify(wco.tsConfig))
                .update(JSON.stringify({
                ...wco.buildOptions,
                // Needed because outputPath changes on every build when using i18n extraction
                // https://github.com/angular/angular-cli/blob/736a5f89deaca85f487b78aec9ff66d4118ceb6a/packages/angular_devkit/build_angular/src/utils/i18n-options.ts#L264-L265
                outputPath: undefined,
            }))
                .digest('hex'),
        };
    }
    if (wco.buildOptions.watch) {
        return {
            type: 'memory',
            maxGenerations: 1,
        };
    }
    return false;
}
exports.getCacheSettings = getCacheSettings;
function globalScriptsByBundleName(scripts) {
    return normalizeExtraEntryPoints(scripts, 'scripts').reduce((prev, curr) => {
        const { bundleName, inject, input } = curr;
        const existingEntry = prev.find((el) => el.bundleName === bundleName);
        if (existingEntry) {
            if (existingEntry.inject && !inject) {
                // All entries have to be lazy for the bundle to be lazy.
                throw new Error(`The ${bundleName} bundle is mixing injected and non-injected scripts.`);
            }
            existingEntry.paths.push(input);
        }
        else {
            prev.push({
                bundleName,
                inject,
                paths: [input],
            });
        }
        return prev;
    }, []);
}
exports.globalScriptsByBundleName = globalScriptsByBundleName;
function assetPatterns(root, assets) {
    return assets.map((asset, index) => {
        // Resolve input paths relative to workspace root and add slash at the end.
        // eslint-disable-next-line prefer-const
        let { input, output, ignore = [], glob } = asset;
        input = path.resolve(root, input).replace(/\\/g, '/');
        input = input.endsWith('/') ? input : input + '/';
        output = output.endsWith('/') ? output : output + '/';
        if (output.startsWith('..')) {
            throw new Error('An asset cannot be written to a location outside of the output path.');
        }
        return {
            context: input,
            // Now we remove starting slash to make Webpack place it from the output root.
            to: output.replace(/^\//, ''),
            from: glob,
            noErrorOnMissing: true,
            force: true,
            globOptions: {
                dot: true,
                followSymbolicLinks: !!asset.followSymlinks,
                ignore: [
                    '.gitkeep',
                    '**/.DS_Store',
                    '**/Thumbs.db',
                    // Negate patterns needs to be absolute because copy-webpack-plugin uses absolute globs which
                    // causes negate patterns not to match.
                    // See: https://github.com/webpack-contrib/copy-webpack-plugin/issues/498#issuecomment-639327909
                    ...ignore,
                ].map((i) => path.posix.join(input, i)),
            },
            priority: index,
        };
    });
}
exports.assetPatterns = assetPatterns;
function getStatsOptions(verbose = false) {
    const webpackOutputOptions = {
        all: false,
        colors: true,
        hash: true,
        timings: true,
        chunks: true,
        builtAt: true,
        warnings: true,
        errors: true,
        assets: true,
        cachedAssets: true,
        // Needed for markAsyncChunksNonInitial.
        ids: true,
        entrypoints: true,
    };
    const verboseWebpackOutputOptions = {
        // The verbose output will most likely be piped to a file, so colors just mess it up.
        colors: false,
        usedExports: true,
        optimizationBailout: true,
        reasons: true,
        children: true,
        assets: true,
        version: true,
        chunkModules: true,
        errorDetails: true,
        errorStack: true,
        moduleTrace: true,
        logging: 'verbose',
        modulesSpace: Infinity,
    };
    return verbose
        ? { ...webpackOutputOptions, ...verboseWebpackOutputOptions }
        : webpackOutputOptions;
}
exports.getStatsOptions = getStatsOptions;
/**
 * @param root the workspace root
 * @returns `true` when `@angular/platform-server` is installed.
 */
function isPlatformServerInstalled(root) {
    try {
        require.resolve('@angular/platform-server', { paths: [root] });
        return true;
    }
    catch {
        return false;
    }
}
exports.isPlatformServerInstalled = isPlatformServerInstalled;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGVscGVycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2J1aWxkX2FuZ3VsYXIvc3JjL3dlYnBhY2svdXRpbHMvaGVscGVycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUdILG1DQUFvQztBQUNwQyxnREFBd0I7QUFDeEIsMkNBQTZCO0FBRTdCLDBEQUt1QztBQUV2QyxpRUFBc0Q7QUFXdEQsU0FBZ0IsbUJBQW1CLENBQUMsYUFBYSxHQUFHLHNCQUFhLENBQUMsSUFBSSxFQUFFLE1BQU0sR0FBRyxFQUFFO0lBQ2pGLE1BQU0sWUFBWSxHQUFHLGlCQUFpQixNQUFNLEdBQUcsQ0FBQztJQUVoRCxRQUFRLGFBQWEsRUFBRTtRQUNyQixLQUFLLE9BQU87WUFDVixPQUFPO2dCQUNMLEtBQUssRUFBRSxFQUFFO2dCQUNULE9BQU8sRUFBRSxFQUFFO2dCQUNYLElBQUksRUFBRSxZQUFZO2dCQUNsQixNQUFNLEVBQUUsRUFBRTthQUNYLENBQUM7UUFDSixLQUFLLFNBQVM7WUFDWixPQUFPO2dCQUNMLEtBQUssRUFBRSxZQUFZO2dCQUNuQixPQUFPLEVBQUUsWUFBWTtnQkFDckIsSUFBSSxFQUFFLEVBQUU7Z0JBQ1IsTUFBTSxFQUFFLFlBQVk7YUFDckIsQ0FBQztRQUNKLEtBQUssS0FBSztZQUNSLE9BQU87Z0JBQ0wsS0FBSyxFQUFFLFlBQVk7Z0JBQ25CLE9BQU8sRUFBRSxZQUFZO2dCQUNyQixJQUFJLEVBQUUsWUFBWTtnQkFDbEIsTUFBTSxFQUFFLFlBQVk7YUFDckIsQ0FBQztRQUNKLEtBQUssTUFBTSxDQUFDO1FBQ1o7WUFDRSxPQUFPO2dCQUNMLEtBQUssRUFBRSxFQUFFO2dCQUNULE9BQU8sRUFBRSxFQUFFO2dCQUNYLElBQUksRUFBRSxFQUFFO2dCQUNSLE1BQU0sRUFB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UUFDbEIsVUFBVSxFQUFFLElBQUk7UUFDaEIsV0FBVyxFQUFFLElBQUk7UUFDakIsT0FBTyxFQUFFLFNBQVM7UUFDbEIsWUFBWSxFQUFFLFFBQVE7S0FDdkIsQ0FBQztJQUVGLE9BQU8sT0FBTztRQUNaLENBQUMsQ0FBQyxFQUFFLEdBQUcsb0JBQW9CLEVBQUUsR0FBRywyQkFBMkIsRUFBRTtRQUM3RCxDQUFDLENBQUMsb0JBQW9CLENBQUM7QUFDM0IsQ0FBQztBQXRDRCwwQ0FzQ0M7QUFFRDs7O0dBR0c7QUFDSCxTQUFnQix5QkFBeUIsQ0FBQyxJQUFZO0lBQ3BELElBQUk7UUFDRixPQUFPLENBQUMsT0FBTyxDQUFDLDBCQUEwQixFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBRS9ELE9BQU8sSUFBSSxDQUFDO0tBQ2I7SUFBQyxNQUFNO1FBQ04sT0FBTyxLQUFLLENBQUM7S0FDZDtBQUNILENBQUM7QUFSRCw4REFRQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgdHlwZSB7IE9iamVjdFBhdHRlcm4gfSBmcm9tICdjb3B5LXdlYnBhY2stcGx1Z2luJztcbmltcG9ydCB7IGNyZWF0ZUhhc2ggfSBmcm9tICdjcnlwdG8nO1xuaW1wb3J0IGdsb2IgZnJvbSAnZ2xvYic7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHR5cGUgeyBDb25maWd1cmF0aW9uLCBXZWJwYWNrT3B0aW9uc05vcm1hbGl6ZWQgfSBmcm9tICd3ZWJwYWNrJztcbmltcG9ydCB7XG4gIEFzc2V0UGF0dGVybkNsYXNzLFxuICBPdXRwdXRIYXNoaW5nLFxuICBTY3JpcHRFbGVtZW50LFxuICBTdHlsZUVsZW1lbnQsXG59IGZyb20gJy4uLy4uL2J1aWxkZXJzL2Jyb3dzZXIvc2NoZW1hJztcbmltcG9ydCB7IFdlYnBhY2tDb25maWdPcHRpb25zIH0gZnJvbSAnLi4vLi4vdXRpbHMvYnVpbGQtb3B0aW9ucyc7XG5pbXBvcnQgeyBWRVJTSU9OIH0gZnJvbSAnLi4vLi4vdXRpbHMvcGFja2FnZS12ZXJzaW9uJztcblxuZXhwb3J0IGludGVyZmFjZSBIYXNoRm9ybWF0IHtcbiAgY2h1bms6IHN0cmluZztcbiAgZXh0cmFjdDogc3RyaW5nO1xuICBmaWxlOiBzdHJpbmc7XG4gIHNjcmlwdDogc3RyaW5nO1xufVxuXG5leHBvcnQgdHlwZSBXZWJwYWNrU3RhdHNPcHRpb25zID0gRXhjbHVkZTxDb25maWd1cmF0aW9uWydzdGF0cyddLCBzdHJpbmcgfCBib29sZWFuIHwgdW5kZWZpbmVkPjtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldE91dHB1dEhhc2hGb3JtYXQob3V0cHV0SGFzaGluZyA9IE91dHB1dEhhc2hpbmcuTm9uZSwgbGVuZ3RoID0gMjApOiBIYXNoRm9ybWF0IHtcbiAgY29uc3QgaGFzaFRlbXBsYXRlID0gYC5bY29udGVudGhhc2g6JHtsZW5ndGh9XWA7XG5cbiAgc3dpdGNoIChvdXRwdXRIYXNoaW5nKSB7XG4gICAgY2FzZSAnbWVkaWEnOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgY2h1bms6ICcnLFxuICAgICAgICBleHRyYWN0OiAnJyxcbiAgICAgICAgZmlsZTogaGFzaFRlbXBsYXRlLFxuICAgICAgICBzY3JpcHQ6ICcnLFxuICAgICAgfTtcbiAgICBjYXNlICdidW5kbGVzJzpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGNodW5rOiBoYXNoVGVtcGxhdGUsXG4gICAgICAgIGV4dHJhY3Q6IGhhc2hUZW1wbGF0ZSxcbiAgICAgICAgZmlsZTogJycsXG4gICAgICAgIHNjcmlwdDogaGFzaFRlbXBsYXRlLFxuICAgICAgfTtcbiAgICBjYXNlICdhbGwnOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgY2h1bms6IGhhc2hUZW1wbGF0ZSxcbiAgICAgICAgZXh0cmFjdDogaGFzaFRlbXBsYXRlLFxuICAgICAgICBmaWxlOiBoYXNoVGVtcGxhdGUsXG4gICAgICAgIHNjcmlwdDogaGFzaFRlbXBsYXRlLFxuICAgICAgfTtcbiAgICBjYXNlICdub25lJzpcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgY2h1bms6ICcnLFxuICAgICAgICBleHRyYWN0OiAnJyxcbiAgICAgICAgZmlsZTogJycsXG4gICAgICAgIHNjcmlwdDogJycsXG4gICAgICB9O1xuICB9XG59XG5cbmV4cG9ydCB0eXBlIE5vcm1hbGl6ZWRFbnRyeVBvaW50ID0gUmVxdWlyZWQ8RXhjbHVkZTxTY3JpcHRFbGVtZW50IHwgU3R5bGVFbGVtZW50LCBzdHJpbmc+PjtcblxuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZUV4dHJhRW50cnlQb2ludHMoXG4gIGV4dHJhRW50cnlQb2ludHM6IChTY3JpcHRFbGVtZW50IHwgU3R5bGVFbGVtZW50KVtdLFxuICBkZWZhdWx0QnVuZGxlTmFtZTogc3RyaW5nLFxuKTogTm9ybWFsaXplZEVudHJ5UG9pbnRbXSB7XG4gIHJldHVybiBleHRyYUVudHJ5UG9pbnRzLm1hcCgoZW50cnkpID0+IHtcbiAgICBpZiAodHlwZW9mIGVudHJ5ID09PSAnc3RyaW5nJykge1xuICAgICAgcmV0dXJuIHsgaW5wdXQ6IGVudHJ5LCBpbmplY3Q6IHRydWUsIGJ1bmRsZU5hbWU6IGRlZmF1bHRCdW5kbGVOYW1lIH07XG4gICAgfVxuXG4gICAgY29uc3QgeyBpbmplY3QgPSB0cnVlLCAuLi5uZXdFbnRyeSB9ID0gZW50cnk7XG4gICAgbGV0IGJ1bmRsZU5hbWU7XG4gICAgaWYgKGVudHJ5LmJ1bmRsZU5hbWUpIHtcbiAgICAgIGJ1bmRsZU5hbWUgPSBlbnRyeS5idW5kbGVOYW1lO1xuICAgIH0gZWxzZSBpZiAoIWluamVjdCkge1xuICAgICAgLy8gTGF6eSBlbnRyeSBwb2ludHMgdXNlIHRoZSBmaWxlIG5hbWUgYXMgYnVuZGxlIG5hbWUuXG4gICAgICBidW5kbGVOYW1lID0gcGF0aC5wYXJzZShlbnRyeS5pbnB1dCkubmFtZTtcbiAgICB9IGVsc2Uge1xuICAgICAgYnVuZGxlTmFtZSA9IGRlZmF1bHRCdW5kbGVOYW1lO1xuICAgIH1cblxuICAgIHJldHVybiB7IC4uLm5ld0VudHJ5LCBpbmplY3QsIGJ1bmRsZU5hbWUgfTtcbiAgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhc3NldE5hbWVUZW1wbGF0ZUZhY3RvcnkoaGFzaEZvcm1hdDogSGFzaEZvcm1hdCk6IChyZXNvdXJjZVBhdGg6IHN0cmluZykgPT4gc3RyaW5nIHtcbiAgY29uc3QgdmlzaXRlZEZpbGVzID0gbmV3IE1hcDxzdHJpbmcsIHN0cmluZz4oKTtcblxuICByZXR1cm4gKHJlc291cmNlUGF0aDogc3RyaW5nKSA9PiB7XG4gICAgaWYgKGhhc2hGb3JtYXQuZmlsZSkge1xuICAgICAgLy8gRmlsZSBuYW1lcyBhcmUgaGFzaGVkIHRoZXJlZm9yZSB3ZSBkb24ndCBuZWVkIHRvIGhhbmRsZSBmaWxlcyB3aXRoIHRoZSBzYW1lIGZpbGUgbmFtZS5cbiAgICAgIHJldHVybiBgW25hbWVdJHtoYXNoRm9ybWF0LmZpbGV9LltleHRdYDtcbiAgICB9XG5cbiAgICBjb25zdCBmaWxlbmFtZSA9IHBhdGguYmFzZW5hbWUocmVzb3VyY2VQYXRoKTtcbiAgICAvLyBDaGVjayBpZiB0aGUgZmlsZSB3aXRoIHRoZSBzYW1lIG5hbWUgaGFzIGFscmVhZHkgYmVlbiBwcm9jZXNzZWQuXG4gICAgY29uc3QgdmlzaXRlZCA9IHZpc2l0ZWRGaWxlcy5nZXQoZmlsZW5hbWUpO1xuICAgIGlmICghdmlzaXRlZCkge1xuICAgICAgLy8gTm90IHZpc2l0ZWQuXG4gICAgICB2aXNpdGVkRmlsZXMuc2V0KGZpbGVuYW1lLCByZXNvdXJjZVBhdGgpO1xuXG4gICAgICByZXR1cm4gZmlsZW5hbWU7XG4gICAgfSBlbHNlIGlmICh2aXNpdGVkID09PSByZXNvdXJjZVBhdGgpIHtcbiAgICAgIC8vIFNhbWUgZmlsZS5cbiAgICAgIHJldHVybiBmaWxlbmFtZTtcbiAgICB9XG5cbiAgICAvLyBGaWxlIGhhcyB0aGUgc2FtZSBuYW1lIGJ1dCBpdCdzIGluIGEgZGlmZmVyZW50IGxvY2F0aW9uLlxuICAgIHJldHVybiAnW3BhdGhdW25hbWVdLltleHRdJztcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEluc3RydW1lbnRhdGlvbkV4Y2x1ZGVkUGF0aHMoXG4gIHJvb3Q6IHN0cmluZyxcbiAgZXhjbHVkZWRQYXRoczogc3RyaW5nW10sXG4pOiBTZXQ8c3RyaW5nPiB7XG4gIGNvbnN0IGV4Y2x1ZGVkID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgZm9yIChjb25zdCBleGNsdWRlR2xvYiBvZiBleGNsdWRlZFBhdGhzKSB7XG4gICAgZ2xvYlxuICAgICAgLnN5bmMoZXhjbHVkZUdsb2IsIHsgbm9kaXI6IHRydWUsIGN3ZDogcm9vdCwgcm9vdCwgbm9tb3VudDogdHJ1ZSB9KVxuICAgICAgLmZvckVhY2goKHApID0+IGV4Y2x1ZGVkLmFkZChwYXRoLmpvaW4ocm9vdCwgcCkpKTtcbiAgfVxuXG4gIHJldHVybiBleGNsdWRlZDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZUdsb2JhbFN0eWxlcyhzdHlsZUVudHJ5cG9pbnRzOiBTdHlsZUVsZW1lbnRbXSk6IHtcbiAgZW50cnlQb2ludHM6IFJlY29yZDxzdHJpbmcsIHN0cmluZ1tdPjtcbiAgbm9JbmplY3ROYW1lczogc3RyaW5nW107XG59IHtcbiAgY29uc3QgZW50cnlQb2ludHM6IFJlY29yZDxzdHJpbmcsIHN0cmluZ1tdPiA9IHt9O1xuICBjb25zdCBub0luamVjdE5hbWVzOiBzdHJpbmdbXSA9IFtdO1xuXG4gIGlmIChzdHlsZUVudHJ5cG9pbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiB7IGVudHJ5UG9pbnRzLCBub0luamVjdE5hbWVzIH07XG4gIH1cblxuICBmb3IgKGNvbnN0IHN0eWxlIG9mIG5vcm1hbGl6ZUV4dHJhRW50cnlQb2ludHMoc3R5bGVFbnRyeXBvaW50cywgJ3N0eWxlcycpKSB7XG4gICAgLy8gQWRkIHN0eWxlIGVudHJ5IHBvaW50cy5cbiAgICBlbnRyeVBvaW50c1tzdHlsZS5idW5kbGVOYW1lXSA/Pz0gW107XG4gICAgZW50cnlQb2ludHNbc3R5bGUuYnVuZGxlTmFtZV0ucHVzaChzdHlsZS5pbnB1dCk7XG5cbiAgICAvLyBBZGQgbm9uIGluamVjdGVkIHN0eWxlcyB0byB0aGUgbGlzdC5cbiAgICBpZiAoIXN0eWxlLmluamVjdCkge1xuICAgICAgbm9JbmplY3ROYW1lcy5wdXNoKHN0eWxlLmJ1bmRsZU5hbWUpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB7IGVudHJ5UG9pbnRzLCBub0luamVjdE5hbWVzIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDYWNoZVNldHRpbmdzKFxuICB3Y286IFdlYnBhY2tDb25maWdPcHRpb25zLFxuICBhbmd1bGFyVmVyc2lvbjogc3RyaW5nLFxuKTogV2VicGFja09wdGlvbnNOb3JtYWxpemVkWydjYWNoZSddIHtcbiAgY29uc3QgeyBlbmFibGVkLCBwYXRoOiBjYWNoZURpcmVjdG9yeSB9ID0gd2NvLmJ1aWxkT3B0aW9ucy5jYWNoZTtcbiAgaWYgKGVuYWJsZWQpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogJ2ZpbGVzeXN0ZW0nLFxuICAgICAgcHJvZmlsZTogd2NvLmJ1aWxkT3B0aW9ucy52ZXJib3NlLFxuICAgICAgY2FjaGVEaXJlY3Rvcnk6IHBhdGguam9pbihjYWNoZURpcmVjdG9yeSwgJ2FuZ3VsYXItd2VicGFjaycpLFxuICAgICAgbWF4TWVtb3J5R2VuZXJhdGlvbnM6IDEsXG4gICAgICAvLyBXZSB1c2UgdGhlIHZlcnNpb25zIGFuZCBidWlsZCBvcHRpb25zIGFzIHRoZSBjYWNoZSBuYW1lLiBUaGUgV2VicGFjayBjb25maWd1cmF0aW9ucyBhcmUgdG9vXG4gICAgICAvLyBkeW5hbWljIGFuZCBzaGFyZWQgYW1vbmcgZGlmZmVyZW50IGJ1aWxkIHR5cGVzOiB0ZXN0LCBidWlsZCBhbmQgc2VydmUuXG4gICAgICAvLyBOb25lIG9mIHdoaWNoIGFyZSBcIm5hbWVkXCIuXG4gICAgICBuYW1lOiBjcmVhdGVIYXNoKCdzaGExJylcbiAgICAgICAgLnVwZGF0ZShhbmd1bGFyVmVyc2lvbilcbiAgICAgICAgLnVwZGF0ZShWRVJTSU9OKVxuICAgICAgICAudXBkYXRlKHdjby5wcm9qZWN0Um9vdClcbiAgICAgICAgLnVwZGF0ZShKU09OLnN0cmluZ2lmeSh3Y28udHNDb25maWcpKVxuICAgICAgICAudXBkYXRlKFxuICAgICAgICAgIEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgIC4uLndjby5idWlsZE9wdGlvbnMsXG4gICAgICAgICAgICAvLyBOZWVkZWQgYmVjYXVzZSBvdXRwdXRQYXRoIGNoYW5nZXMgb24gZXZlcnkgYnVpbGQgd2hlbiB1c2luZyBpMThuIGV4dHJhY3Rpb25cbiAgICAgICAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL2FuZ3VsYXItY2xpL2Jsb2IvNzM2YTVmODlkZWFjYTg1ZjQ4N2I3OGFlYzlmZjY2ZDQxMThjZWI2YS9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy91dGlscy9pMThuLW9wdGlvbnMudHMjTDI2NC1MMjY1XG4gICAgICAgICAgICBvdXRwdXRQYXRoOiB1bmRlZmluZWQsXG4gICAgICAgICAgfSksXG4gICAgICAgIClcbiAgICAgICAgLmRpZ2VzdCgnaGV4JyksXG4gICAgfTtcbiAgfVxuXG4gIGlmICh3Y28uYnVpbGRPcHRpb25zLndhdGNoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6ICdtZW1vcnknLFxuICAgICAgbWF4R2VuZXJhdGlvbnM6IDEsXG4gICAgfTtcbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdsb2JhbFNjcmlwdHNCeUJ1bmRsZU5hbWUoXG4gIHNjcmlwdHM6IFNjcmlwdEVsZW1lbnRbXSxcbik6IHsgYnVuZGxlTmFtZTogc3RyaW5nOyBpbmplY3Q6IGJvb2xlYW47IHBhdGhzOiBzdHJpbmdbXSB9W10ge1xuICByZXR1cm4gbm9ybWFsaXplRXh0cmFFbnRyeVBvaW50cyhzY3JpcHRzLCAnc2NyaXB0cycpLnJlZHVjZShcbiAgICAocHJldjogeyBidW5kbGVOYW1lOiBzdHJpbmc7IHBhdGhzOiBzdHJpbmdbXTsgaW5qZWN0OiBib29sZWFuIH1bXSwgY3VycikgPT4ge1xuICAgICAgY29uc3QgeyBidW5kbGVOYW1lLCBpbmplY3QsIGlucHV0IH0gPSBjdXJyO1xuXG4gICAgICBjb25zdCBleGlzdGluZ0VudHJ5ID0gcHJldi5maW5kKChlbCkgPT4gZWwuYnVuZGxlTmFtZSA9PT0gYnVuZGxlTmFtZSk7XG4gICAgICBpZiAoZXhpc3RpbmdFbnRyeSkge1xuICAgICAgICBpZiAoZXhpc3RpbmdFbnRyeS5pbmplY3QgJiYgIWluamVjdCkge1xuICAgICAgICAgIC8vIEFsbCBlbnRyaWVzIGhhdmUgdG8gYmUgbGF6eSBmb3IgdGhlIGJ1bmRsZSB0byBiZSBsYXp5LlxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVGhlICR7YnVuZGxlTmFtZX0gYnVuZGxlIGlzIG1peGluZyBpbmplY3RlZCBhbmQgbm9uLWluamVjdGVkIHNjcmlwdHMuYCk7XG4gICAgICAgIH1cblxuICAgICAgICBleGlzdGluZ0VudHJ5LnBhdGhzLnB1c2goaW5wdXQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcHJldi5wdXNoKHtcbiAgICAgICAgICBidW5kbGVOYW1lLFxuICAgICAgICAgIGluamVjdCxcbiAgICAgICAgICBwYXRoczogW2lucHV0XSxcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBwcmV2O1xuICAgIH0sXG4gICAgW10sXG4gICk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhc3NldFBhdHRlcm5zKHJvb3Q6IHN0cmluZywgYXNzZXRzOiBBc3NldFBhdHRlcm5DbGFzc1tdKSB7XG4gIHJldHVybiBhc3NldHMubWFwKChhc3NldDogQXNzZXRQYXR0ZXJuQ2xhc3MsIGluZGV4OiBudW1iZXIpOiBPYmplY3RQYXR0ZXJuID0+IHtcbiAgICAvLyBSZXNvbHZlIGlucHV0IHBhdGhzIHJlbGF0aXZlIHRvIHdvcmtzcGFjZSByb290IGFuZCBhZGQgc2xhc2ggYXQgdGhlIGVuZC5cbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgcHJlZmVyLWNvbnN0XG4gICAgbGV0IHsgaW5wdXQsIG91dHB1dCwgaWdub3JlID0gW10sIGdsb2IgfSA9IGFzc2V0O1xuICAgIGlucHV0ID0gcGF0aC5yZXNvbHZlKHJvb3QsIGlucHV0KS5yZXBsYWNlKC9cXFxcL2csICcvJyk7XG4gICAgaW5wdXQgPSBpbnB1dC5lbmRzV2l0aCgnLycpID8gaW5wdXQgOiBpbnB1dCArICcvJztcbiAgICBvdXRwdXQgPSBvdXRwdXQuZW5kc1dpdGgoJy8nKSA/IG91dHB1dCA6IG91dHB1dCArICcvJztcblxuICAgIGlmIChvdXRwdXQuc3RhcnRzV2l0aCgnLi4nKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdBbiBhc3NldCBjYW5ub3QgYmUgd3JpdHRlbiB0byBhIGxvY2F0aW9uIG91dHNpZGUgb2YgdGhlIG91dHB1dCBwYXRoLicpO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBjb250ZXh0OiBpbnB1dCxcbiAgICAgIC8vIE5vdyB3ZSByZW1vdmUgc3RhcnRpbmcgc2xhc2ggdG8gbWFrZSBXZWJwYWNrIHBsYWNlIGl0IGZyb20gdGhlIG91dHB1dCByb290LlxuICAgICAgdG86IG91dHB1dC5yZXBsYWNlKC9eXFwvLywgJycpLFxuICAgICAgZnJvbTogZ2xvYixcbiAgICAgIG5vRXJyb3JPbk1pc3Npbmc6IHRydWUsXG4gICAgICBmb3JjZTogdHJ1ZSxcbiAgICAgIGdsb2JPcHRpb25zOiB7XG4gICAgICAgIGRvdDogdHJ1ZSxcbiAgICAgICAgZm9sbG93U3ltYm9saWNMaW5rczogISFhc3NldC5mb2xsb3dTeW1saW5rcyxcbiAgICAgICAgaWdub3JlOiBbXG4gICAgICAgICAgJy5naXRrZWVwJyxcbiAgICAgICAgICAnKiovLkRTX1N0b3JlJyxcbiAgICAgICAgICAnKiovVGh1bWJzLmRiJyxcbiAgICAgICAgICAvLyBOZWdhdGUgcGF0dGVybnMgbmVlZHMgdG8gYmUgYWJzb2x1dGUgYmVjYXVzZSBjb3B5LXdlYnBhY2stcGx1Z2luIHVzZXMgYWJzb2x1dGUgZ2xvYnMgd2hpY2hcbiAgICAgICAgICAvLyBjYXVzZXMgbmVnYXRlIHBhdHRlcm5zIG5vdCB0byBtYXRjaC5cbiAgICAgICAgICAvLyBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS93ZWJwYWNrLWNvbnRyaWIvY29weS13ZWJwYWNrLXBsdWdpbi9pc3N1ZXMvNDk4I2lzc3VlY29tbWVudC02MzkzMjc5MDlcbiAgICAgICAgICAuLi5pZ25vcmUsXG4gICAgICAgIF0ubWFwKChpKSA9PiBwYXRoLnBvc2l4LmpvaW4oaW5wdXQsIGkpKSxcbiAgICAgIH0sXG4gICAgICBwcmlvcml0eTogaW5kZXgsXG4gICAgfTtcbiAgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRTdGF0c09wdGlvbnModmVyYm9zZSA9IGZhbHNlKTogV2VicGFja1N0YXRzT3B0aW9ucyB7XG4gIGNvbnN0IHdlYnBhY2tPdXRwdXRPcHRpb25zOiBXZWJwYWNrU3RhdHNPcHRpb25zID0ge1xuICAgIGFsbDogZmFsc2UsIC8vIEZhbGxiYWNrIHZhbHVlIGZvciBzdGF0cyBvcHRpb25zIHdoZW4gYW4gb3B0aW9uIGlzIG5vdCBkZWZpbmVkLiBJdCBoYXMgcHJlY2VkZW5jZSBvdmVyIGxvY2FsIHdlYnBhY2sgZGVmYXVsdHMuXG4gICAgY29sb3JzOiB0cnVlLFxuICAgIGhhc2g6IHRydWUsIC8vIHJlcXVpcmVkIGJ5IGN1c3RvbSBzdGF0IG91dHB1dFxuICAgIHRpbWluZ3M6IHRydWUsIC8vIHJlcXVpcmVkIGJ5IGN1c3RvbSBzdGF0IG91dHB1dFxuICAgIGNodW5rczogdHJ1ZSwgLy8gcmVxdWlyZWQgYnkgY3VzdG9tIHN0YXQgb3V0cHV0XG4gICAgYnVpbHRBdDogdHJ1ZSwgLy8gcmVxdWlyZWQgYnkgY3VzdG9tIHN0YXQgb3V0cHV0XG4gICAgd2FybmluZ3M6IHRydWUsXG4gICAgZXJyb3JzOiB0cnVlLFxuICAgIGFzc2V0czogdHJ1ZSwgLy8gcmVxdWlyZWQgYnkgY3VzdG9tIHN0YXQgb3V0cHV0XG4gICAgY2FjaGVkQXNzZXRzOiB0cnVlLCAvLyByZXF1aXJlZCBmb3IgYnVuZGxlIHNpemUgY2FsY3VsYXRvcnNcblxuICAgIC8vIE5lZWRlZCBmb3IgbWFya0FzeW5jQ2h1bmtzTm9uSW5pdGlhbC5cbiAgICBpZHM6IHRydWUsXG4gICAgZW50cnlwb2ludHM6IHRydWUsXG4gIH07XG5cbiAgY29uc3QgdmVyYm9zZVdlYnBhY2tPdXRwdXRPcHRpb25zOiBXZWJwYWNrU3RhdHNPcHRpb25zID0ge1xuICAgIC8vIFRoZSB2ZXJib3NlIG91dHB1dCB3aWxsIG1vc3QgbGlrZWx5IGJlIHBpcGVkIHRvIGEgZmlsZSwgc28gY29sb3JzIGp1c3QgbWVzcyBpdCB1cC5cbiAgICBjb2xvcnM6IGZhbHNlLFxuICAgIHVzZWRFeHBvcnRzOiB0cnVlLFxuICAgIG9wdGltaXphdGlvbkJhaWxvdXQ6IHRydWUsXG4gICAgcmVhc29uczogdHJ1ZSxcbiAgICBjaGlsZHJlbjogdHJ1ZSxcbiAgICBhc3NldHM6IHRydWUsXG4gICAgdmVyc2lvbjogdHJ1ZSxcbiAgICBjaHVua01vZHVsZXM6IHRydWUsXG4gICAgZXJyb3JEZXRhaWxzOiB0cnVlLFxuICAgIGVycm9yU3RhY2s6IHRydWUsXG4gICAgbW9kdWxlVHJhY2U6IHRydWUsXG4gICAgbG9nZ2luZzogJ3ZlcmJvc2UnLFxuICAgIG1vZHVsZXNTcGFjZTogSW5maW5pdHksXG4gIH07XG5cbiAgcmV0dXJuIHZlcmJvc2VcbiAgICA/IHsgLi4ud2VicGFja091dHB1dE9wdGlvbnMsIC4uLnZlcmJvc2VXZWJwYWNrT3V0cHV0T3B0aW9ucyB9XG4gICAgOiB3ZWJwYWNrT3V0cHV0T3B0aW9ucztcbn1cblxuLyoqXG4gKiBAcGFyYW0gcm9vdCB0aGUgd29ya3NwYWNlIHJvb3RcbiAqIEByZXR1cm5zIGB0cnVlYCB3aGVuIGBAYW5ndWxhci9wbGF0Zm9ybS1zZXJ2ZXJgIGlzIGluc3RhbGxlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzUGxhdGZvcm1TZXJ2ZXJJbnN0YWxsZWQocm9vdDogc3RyaW5nKTogYm9vbGVhbiB7XG4gIHRyeSB7XG4gICAgcmVxdWlyZS5yZXNvbHZlKCdAYW5ndWxhci9wbGF0Zm9ybS1zZXJ2ZXInLCB7IHBhdGhzOiBbcm9vdF0gfSk7XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59XG4iXX0=