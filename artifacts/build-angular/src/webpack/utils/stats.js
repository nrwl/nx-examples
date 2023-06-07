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
exports.webpackStatsLogger = exports.generateBuildEventStats = exports.createWebpackLoggingCallback = exports.statsHasWarnings = exports.statsHasErrors = exports.statsErrorsToString = exports.statsWarningsToString = exports.generateBuildStatsTable = exports.formatSize = void 0;
const core_1 = require("@angular-devkit/core");
const assert_1 = __importDefault(require("assert"));
const path = __importStar(require("path"));
const text_table_1 = __importDefault(require("text-table"));
const utils_1 = require("../../utils");
const color_1 = require("../../utils/color");
const async_chunks_1 = require("./async-chunks");
const helpers_1 = require("./helpers");
function formatSize(size) {
    if (size <= 0) {
        return '0 bytes';
    }
    const abbreviations = ['bytes', 'kB', 'MB', 'GB'];
    const index = Math.floor(Math.log(size) / Math.log(1024));
    const roundedSize = size / Math.pow(1024, index);
    // bytes don't have a fraction
    const fractionDigits = index === 0 ? 0 : 2;
    return `${roundedSize.toFixed(fractionDigits)} ${abbreviations[index]}`;
}
exports.formatSize = formatSize;
function getBuildDuration(webpackStats) {
    (0, assert_1.default)(webpackStats.builtAt, 'buildAt cannot be undefined');
    (0, assert_1.default)(webpackStats.time, 'time cannot be undefined');
    return Date.now() - webpackStats.builtAt + webpackStats.time;
}
function generateBundleStats(info) {
    const rawSize = typeof info.rawSize === 'number' ? info.rawSize : '-';
    const estimatedTransferSize = typeof info.estimatedTransferSize === 'number' ? info.estimatedTransferSize : '-';
    const files = info.files
        ?.filter((f) => !f.endsWith('.map'))
        .map((f) => path.basename(f))
        .join(', ') ?? '';
    const names = info.names?.length ? info.names.join(', ') : '-';
    const initial = !!info.initial;
    return {
        initial,
        stats: [files, names, rawSize, estimatedTransferSize],
    };
}
function generateBuildStatsTable(data, colors, showTotalSize, showEstimatedTransferSize, budgetFailures) {
    const g = (x) => (colors ? color_1.colors.greenBright(x) : x);
    const c = (x) => (colors ? color_1.colors.cyanBright(x) : x);
    const r = (x) => (colors ? color_1.colors.redBright(x) : x);
    const y = (x) => (colors ? color_1.colors.yellowBright(x) : x);
    const bold = (x) => (colors ? color_1.colors.bold(x) : x);
    const dim = (x) => (colors ? color_1.colors.dim(x) : x);
    const getSizeColor = (name, file, defaultColor = c) => {
        const severity = budgets.get(name) || (file && budgets.get(file));
        switch (severity) {
            case 'warning':
                return y;
            case 'error':
                return r;
            default:
                return defaultColor;
        }
    };
    const changedEntryChunksStats = [];
    const changedLazyChunksStats = [];
    let initialTotalRawSize = 0;
    let initialTotalEstimatedTransferSize;
    const budgets = new Map();
    if (budgetFailures) {
        for (const { label, severity } of budgetFailures) {
            // In some cases a file can have multiple budget failures.
            // Favor error.
            if (label && (!budgets.has(label) || budgets.get(label) === 'warning')) {
                budgets.set(label, severity);
            }
        }
    }
    // Sort descending by raw size
    data.sort((a, b) => {
        if (a.stats[2] > b.stats[2]) {
            return -1;
        }
        if (a.stats[2] < b.stats[2]) {
            return 1;
        }
        return 0;
    });
    for (const { initial, stats } of data) {
        const [files, names, rawSize, estimatedTransferSize] = stats;
        const getRawSizeColor = getSizeColor(names, files);
        let data;
        if (showEstimatedTransferSize) {
            data = [
                g(files),
                names,
                getRawSizeColor(typeof rawSize === 'number' ? formatSize(rawSize) : rawSize),
                c(typeof estimatedTransferSize === 'number'
                    ? formatSize(estimatedTransferSize)
                    : estimatedTransferSize),
            ];
        }
        else {
            data = [
                g(files),
                names,
                getRawSizeColor(typeof rawSize === 'number' ? formatSize(rawSize) : rawSize),
                '',
            ];
        }
        if (initial) {
            changedEntryChunksStats.push(data);
            if (typeof rawSize === 'number') {
                initialTotalRawSize += rawSize;
            }
            if (showEstimatedTransferSize && typeof estimatedTransferSize === 'number') {
                if (initialTotalEstimatedTransferSize === undefined) {
                    initialTotalEstimatedTransferSize = 0;
                }
                initialTotalEstimatedTransferSize += estimatedTransferSize;
            }
        }
        else {
            changedLazyChunksStats.push(data);
        }
    }
    const bundleInfo = [];
    const baseTitles = ['Names', 'Raw Size'];
    const tableAlign = ['l', 'l', 'r'];
    if (showEstimatedTransferSize) {
        baseTitles.push('Estimated Transfer Size');
        tableAlign.push('r');
    }
    // Entry chunks
    if (changedEntryChunksStats.length) {
        bundleInfo.push(['Initial Chunk Files', ...baseTitles].map(bold), ...changedEntryChunksStats);
        if (showTotalSize) {
            bundleInfo.push([]);
            const initialSizeTotalColor = getSizeColor('bundle initial', undefined, (x) => x);
            const totalSizeElements = [
                ' ',
                'Initial Total',
                initialSizeTotalColor(formatSize(initialTotalRawSize)),
            ];
            if (showEstimatedTransferSize) {
                totalSizeElements.push(typeof initialTotalEstimatedTransferSize === 'number'
                    ? formatSize(initialTotalEstimatedTransferSize)
                    : '-');
            }
            bundleInfo.push(totalSizeElements.map(bold));
        }
    }
    // Seperator
    if (changedEntryChunksStats.length && changedLazyChunksStats.length) {
        bundleInfo.push([]);
    }
    // Lazy chunks
    if (changedLazyChunksStats.length) {
        bundleInfo.push(['Lazy Chunk Files', ...baseTitles].map(bold), ...changedLazyChunksStats);
    }
    return (0, text_table_1.default)(bundleInfo, {
        hsep: dim(' | '),
        stringLength: (s) => (0, color_1.removeColor)(s).length,
        align: tableAlign,
    });
}
exports.generateBuildStatsTable = generateBuildStatsTable;
function generateBuildStats(hash, time, colors) {
    const w = (x) => (colors ? color_1.colors.bold.white(x) : x);
    return `Build at: ${w(new Date().toISOString())} - Hash: ${w(hash)} - Time: ${w('' + time)}ms`;
}
// We use this cache because we can have multiple builders running in the same process,
// where each builder has different output path.
// Ideally, we should create the logging callback as a factory, but that would need a refactoring.
const runsCache = new Set();
function statsToString(json, 
// eslint-disable-next-line @typescript-eslint/no-explicit-any
statsConfig, budgetFailures) {
    if (!json.chunks?.length) {
        return '';
    }
    const colors = statsConfig.colors;
    const rs = (x) => (colors ? color_1.colors.reset(x) : x);
    const changedChunksStats = [];
    let unchangedChunkNumber = 0;
    let hasEstimatedTransferSizes = false;
    const isFirstRun = !runsCache.has(json.outputPath || '');
    for (const chunk of json.chunks) {
        // During first build we want to display unchanged chunks
        // but unchanged cached chunks are always marked as not rendered.
        if (!isFirstRun && !chunk.rendered) {
            continue;
        }
        const assets = json.assets?.filter((asset) => chunk.files?.includes(asset.name));
        let rawSize = 0;
        let estimatedTransferSize;
        if (assets) {
            for (const asset of assets) {
                if (asset.name.endsWith('.map')) {
                    continue;
                }
                rawSize += asset.size;
                if (typeof asset.info.estimatedTransferSize === 'number') {
                    if (estimatedTransferSize === undefined) {
                        estimatedTransferSize = 0;
                        hasEstimatedTransferSizes = true;
                    }
                    estimatedTransferSize += asset.info.estimatedTransferSize;
                }
            }
        }
        changedChunksStats.push(generateBundleStats({ ...chunk, rawSize, estimatedTransferSize }));
    }
    unchangedChunkNumber = json.chunks.length - changedChunksStats.length;
    runsCache.add(json.outputPath || '');
    const statsTable = generateBuildStatsTable(changedChunksStats, colors, unchangedChunkNumber === 0, hasEstimatedTransferSizes, budgetFailures);
    // In some cases we do things outside of webpack context
    // Such us index generation, service worker augmentation etc...
    // This will correct the time and include these.
    const time = getBuildDuration(json);
    if (unchangedChunkNumber > 0) {
        return ('\n' +
            rs(core_1.tags.stripIndents `
      ${statsTable}

      ${unchangedChunkNumber} unchanged chunks

      ${generateBuildStats(json.hash || '', time, colors)}
      `));
    }
    else {
        return ('\n' +
            rs(core_1.tags.stripIndents `
      ${statsTable}

      ${generateBuildStats(json.hash || '', time, colors)}
      `));
    }
}
function statsWarningsToString(json, statsConfig) {
    const colors = statsConfig.colors;
    const c = (x) => (colors ? color_1.colors.reset.cyan(x) : x);
    const y = (x) => (colors ? color_1.colors.reset.yellow(x) : x);
    const yb = (x) => (colors ? color_1.colors.reset.yellowBright(x) : x);
    const warnings = json.warnings ? [...json.warnings] : [];
    if (json.children) {
        warnings.push(...json.children.map((c) => c.warnings ?? []).reduce((a, b) => [...a, ...b], []));
    }
    let output = '';
    for (const warning of warnings) {
        if (typeof warning === 'string') {
            output += yb(`Warning: ${warning}\n\n`);
        }
        else {
            let file = warning.file || warning.moduleName;
            // Clean up warning paths
            // Ex: ./src/app/styles.scss.webpack[javascript/auto]!=!./node_modules/css-loader/dist/cjs.js....
            // to ./src/app/styles.scss.webpack
            if (file && !statsConfig.errorDetails) {
                const webpackPathIndex = file.indexOf('.webpack[');
                if (webpackPathIndex !== -1) {
                    file = file.substring(0, webpackPathIndex);
                }
            }
            if (file) {
                output += c(file);
                if (warning.loc) {
                    output += ':' + yb(warning.loc);
                }
                output += ' - ';
            }
            if (!/^warning/i.test(warning.message)) {
                output += y('Warning: ');
            }
            output += `${warning.message}\n\n`;
        }
    }
    return output ? '\n' + output : output;
}
exports.statsWarningsToString = statsWarningsToString;
function statsErrorsToString(json, statsConfig) {
    const colors = statsConfig.colors;
    const c = (x) => (colors ? color_1.colors.reset.cyan(x) : x);
    const yb = (x) => (colors ? color_1.colors.reset.yellowBright(x) : x);
    const r = (x) => (colors ? color_1.colors.reset.redBright(x) : x);
    const errors = json.errors ? [...json.errors] : [];
    if (json.children) {
        errors.push(...json.children.map((c) => c?.errors || []).reduce((a, b) => [...a, ...b], []));
    }
    let output = '';
    for (const error of errors) {
        if (typeof error === 'string') {
            output += r(`Error: ${error}\n\n`);
        }
        else {
            let file = error.file || error.moduleName;
            // Clean up error paths
            // Ex: ./src/app/styles.scss.webpack[javascript/auto]!=!./node_modules/css-loader/dist/cjs.js....
            // to ./src/app/styles.scss.webpack
            if (file && !statsConfig.errorDetails) {
                const webpackPathIndex = file.indexOf('.webpack[');
                if (webpackPathIndex !== -1) {
                    file = file.substring(0, webpackPathIndex);
                }
            }
            if (file) {
                output += c(file);
                if (error.loc) {
                    output += ':' + yb(error.loc);
                }
                output += ' - ';
            }
            // In most cases webpack will add stack traces to error messages.
            // This below cleans up the error from stacks.
            // See: https://github.com/webpack/webpack/issues/15980
            const index = error.message.search(/[\n\s]+at /);
            const message = statsConfig.errorStack || index === -1 ? error.message : error.message.substring(0, index);
            if (!/^error/i.test(message)) {
                output += r('Error: ');
            }
            output += `${message}\n\n`;
        }
    }
    return output ? '\n' + output : output;
}
exports.statsErrorsToString = statsErrorsToString;
function statsHasErrors(json) {
    return !!(json.errors?.length || json.children?.some((c) => c.errors?.length));
}
exports.statsHasErrors = statsHasErrors;
function statsHasWarnings(json) {
    return !!(json.warnings?.length || json.children?.some((c) => c.warnings?.length));
}
exports.statsHasWarnings = statsHasWarnings;
function createWebpackLoggingCallback(options, logger) {
    const { verbose = false, scripts = [], styles = [] } = options;
    const extraEntryPoints = [
        ...(0, helpers_1.normalizeExtraEntryPoints)(styles, 'styles'),
        ...(0, helpers_1.normalizeExtraEntryPoints)(scripts, 'scripts'),
    ];
    return (stats, config) => {
        if (verbose) {
            logger.info(stats.toString(config.stats));
        }
        const rawStats = stats.toJson((0, helpers_1.getStatsOptions)(false));
        const webpackStats = {
            ...rawStats,
            chunks: (0, async_chunks_1.markAsyncChunksNonInitial)(rawStats, extraEntryPoints),
        };
        webpackStatsLogger(logger, webpackStats, config);
    };
}
exports.createWebpackLoggingCallback = createWebpackLoggingCallback;
function generateBuildEventStats(webpackStats, browserBuilderOptions) {
    const { chunks = [], assets = [] } = webpackStats;
    let jsSizeInBytes = 0;
    let cssSizeInBytes = 0;
    let initialChunksCount = 0;
    let ngComponentCount = 0;
    let changedChunksCount = 0;
    const allChunksCount = chunks.length;
    const isFirstRun = !runsCache.has(webpackStats.outputPath || '');
    const chunkFiles = new Set();
    for (const chunk of chunks) {
        if (!isFirstRun && chunk.rendered) {
            changedChunksCount++;
        }
        if (chunk.initial) {
            initialChunksCount++;
        }
        for (const file of chunk.files ?? []) {
            chunkFiles.add(file);
        }
    }
    for (const asset of assets) {
        if (asset.name.endsWith('.map') || !chunkFiles.has(asset.name)) {
            continue;
        }
        if (asset.name.endsWith('.js')) {
            jsSizeInBytes += asset.size;
            ngComponentCount += asset.info.ngComponentCount ?? 0;
        }
        else if (asset.name.endsWith('.css')) {
            cssSizeInBytes += asset.size;
        }
    }
    return {
        optimization: !!(0, utils_1.normalizeOptimization)(browserBuilderOptions.optimization).scripts,
        aot: browserBuilderOptions.aot !== false,
        allChunksCount,
        lazyChunksCount: allChunksCount - initialChunksCount,
        initialChunksCount,
        changedChunksCount,
        durationInMs: getBuildDuration(webpackStats),
        cssSizeInBytes,
        jsSizeInBytes,
        ngComponentCount,
    };
}
exports.generateBuildEventStats = generateBuildEventStats;
function webpackStatsLogger(logger, json, config, budgetFailures) {
    logger.info(statsToString(json, config.stats, budgetFailures));
    if (typeof config.stats !== 'object') {
        throw new Error('Invalid Webpack stats configuration.');
    }
    if (statsHasWarnings(json)) {
        logger.warn(statsWarningsToString(json, config.stats));
    }
    if (statsHasErrors(json)) {
        logger.error(statsErrorsToString(json, config.stats));
    }
}
exports.webpackStatsLogger = webpackStatsLogger;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy93ZWJwYWNrL3V0aWxzL3N0YXRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBR0gsK0NBQXFEO0FBQ3JELG9EQUE0QjtBQUM1QiwyQ0FBNkI7QUFDN0IsNERBQW1DO0FBR25DLHVDQUFvRDtBQUVwRCw2Q0FBc0U7QUFDdEUsaURBQTJEO0FBQzNELHVDQUE0RjtBQUU1RixTQUFnQixVQUFVLENBQUMsSUFBWTtJQUNyQyxJQUFJLElBQUksSUFBSSxDQUFDLEVBQUU7UUFDYixPQUFPLFNBQVMsQ0FBQztLQUNsQjtJQUVELE1BQU0sYUFBYSxHQUFHLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDbEQsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUMxRCxNQUFNLFdBQVcsR0FBRyxJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDakQsOEJBQThCO0lBQzlCLE1BQU0sY0FBYyxHQUFHLEtBQUssS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBRTNDLE9BQU8sR0FBRyxXQUFXLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxJQUFJLGFBQWEsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO0FBQzFFLENBQUM7QUFaRCxnQ0FZQztBQWFELFNBQVMsZ0JBQWdCLENBQUMsWUFBOEI7SUFDdEQs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QUFJLENBQUMsRUFBRTtRQUMxQixNQUFNLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztLQUN4RDtJQUVELElBQUksY0FBYyxDQUFDLElBQUksQ0FBQyxFQUFFO1FBQ3hCLE1BQU0sQ0FBQyxLQUFLLENBQUMsbUJBQW1CLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0tBQ3ZEO0FBQ0gsQ0FBQztBQW5CRCxnREFtQkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsgV2VicGFja0xvZ2dpbmdDYWxsYmFjayB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9idWlsZC13ZWJwYWNrJztcbmltcG9ydCB7IGxvZ2dpbmcsIHRhZ3MgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQgYXNzZXJ0IGZyb20gJ2Fzc2VydCc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHRleHRUYWJsZSBmcm9tICd0ZXh0LXRhYmxlJztcbmltcG9ydCB7IENvbmZpZ3VyYXRpb24sIFN0YXRzQ29tcGlsYXRpb24gfSBmcm9tICd3ZWJwYWNrJztcbmltcG9ydCB7IFNjaGVtYSBhcyBCcm93c2VyQnVpbGRlck9wdGlvbnMgfSBmcm9tICcuLi8uLi9idWlsZGVycy9icm93c2VyL3NjaGVtYSc7XG5pbXBvcnQgeyBub3JtYWxpemVPcHRpbWl6YXRpb24gfSBmcm9tICcuLi8uLi91dGlscyc7XG5pbXBvcnQgeyBCdWRnZXRDYWxjdWxhdG9yUmVzdWx0IH0gZnJvbSAnLi4vLi4vdXRpbHMvYnVuZGxlLWNhbGN1bGF0b3InO1xuaW1wb3J0IHsgY29sb3JzIGFzIGFuc2lDb2xvcnMsIHJlbW92ZUNvbG9yIH0gZnJvbSAnLi4vLi4vdXRpbHMvY29sb3InO1xuaW1wb3J0IHsgbWFya0FzeW5jQ2h1bmtzTm9uSW5pdGlhbCB9IGZyb20gJy4vYXN5bmMtY2h1bmtzJztcbmltcG9ydCB7IFdlYnBhY2tTdGF0c09wdGlvbnMsIGdldFN0YXRzT3B0aW9ucywgbm9ybWFsaXplRXh0cmFFbnRyeVBvaW50cyB9IGZyb20gJy4vaGVscGVycyc7XG5cbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXRTaXplKHNpemU6IG51bWJlcik6IHN0cmluZyB7XG4gIGlmIChzaXplIDw9IDApIHtcbiAgICByZXR1cm4gJzAgYnl0ZXMnO1xuICB9XG5cbiAgY29uc3QgYWJicmV2aWF0aW9ucyA9IFsnYnl0ZXMnLCAna0InLCAnTUInLCAnR0InXTtcbiAgY29uc3QgaW5kZXggPSBNYXRoLmZsb29yKE1hdGgubG9nKHNpemUpIC8gTWF0aC5sb2coMTAyNCkpO1xuICBjb25zdCByb3VuZGVkU2l6ZSA9IHNpemUgLyBNYXRoLnBvdygxMDI0LCBpbmRleCk7XG4gIC8vIGJ5dGVzIGRvbid0IGhhdmUgYSBmcmFjdGlvblxuICBjb25zdCBmcmFjdGlvbkRpZ2l0cyA9IGluZGV4ID09PSAwID8gMCA6IDI7XG5cbiAgcmV0dXJuIGAke3JvdW5kZWRTaXplLnRvRml4ZWQoZnJhY3Rpb25EaWdpdHMpfSAke2FiYnJldmlhdGlvbnNbaW5kZXhdfWA7XG59XG5cbmV4cG9ydCB0eXBlIEJ1bmRsZVN0YXRzRGF0YSA9IFtcbiAgZmlsZXM6IHN0cmluZyxcbiAgbmFtZXM6IHN0cmluZyxcbiAgcmF3U2l6ZTogbnVtYmVyIHwgc3RyaW5nLFxuICBlc3RpbWF0ZWRUcmFuc2ZlclNpemU6IG51bWJlciB8IHN0cmluZyxcbl07XG5leHBvcnQgaW50ZXJmYWNlIEJ1bmRsZVN0YXRzIHtcbiAgaW5pdGlhbDogYm9vbGVhbjtcbiAgc3RhdHM6IEJ1bmRsZVN0YXRzRGF0YTtcbn1cblxuZnVuY3Rpb24gZ2V0QnVpbGREdXJhdGlvbih3ZWJwYWNrU3RhdHM6IFN0YXRzQ29tcGlsYXRpb24pOiBudW1iZXIge1xuICBhc3NlcnQod2VicGFja1N0YXRzLmJ1aWx0QXQsICdidWlsZEF0IGNhbm5vdCBiZSB1bmRlZmluZWQnKTtcbiAgYXNzZXJ0KHdlYnBhY2tTdGF0cy50aW1lLCAndGltZSBjYW5ub3QgYmUgdW5kZWZpbmVkJyk7XG5cbiAgcmV0dXJuIERhdGUubm93KCkgLSB3ZWJwYWNrU3RhdHMuYnVpbHRBdCArIHdlYnBhY2tTdGF0cy50aW1lO1xufVxuXG5mdW5jdGlvbiBnZW5lcmF0ZUJ1bmRsZVN0YXRzKGluZm86IHtcbiAgcmF3U2l6ZT86IG51bWJlcjtcbiAgZXN0aW1hdGVkVHJhbnNmZXJTaXplPzogbnVtYmVyO1xuICBmaWxlcz86IHN0cmluZ1tdO1xuICBuYW1lcz86IHN0cmluZ1tdO1xuICBpbml0aWFsPzogYm9vbGVhbjtcbiAgcmVuZGVyZWQ/OiBib29sZWFuO1xufSk6IEJ1bmRsZVN0YXRzIHtcbiAgY29uc3QgcmF3U2l6ZSA9IHR5cGVvZiBpbmZvLnJhd1NpemUgPT09ICdudW1iZXInID8gaW5mby5yYXdTaXplIDogJy0nO1xuICBjb25zdCBlc3RpbWF0ZWRUcmFuc2ZlclNpemUgPVxuICAgIHR5cGVvZiBpbmZvLmVzdGltYXRlZFRyYW5zZmVyU2l6ZSA9PT0gJ251bWJlcicgPyBpbmZvLmVzdGltYXRlZFRyYW5zZmVyU2l6ZSA6ICctJztcbiAgY29uc3QgZmlsZXMgPVxuICAgIGluZm8uZmlsZXNcbiAgICAgID8uZmlsdGVyKChmKSA9PiAhZi5lbmRzV2l0aCgnLm1hcCcpKVxuICAgICAgLm1hcCgoZikgPT4gcGF0aC5iYXNlbmFtZShmKSlcbiAgICAgIC5qb2luKCcsICcpID8/ICcnO1xuICBjb25zdCBuYW1lcyA9IGluZm8ubmFtZXM/Lmxlbmd0aCA/IGluZm8ubmFtZXMuam9pbignLCAnKSA6ICctJztcbiAgY29uc3QgaW5pdGlhbCA9ICEhaW5mby5pbml0aWFsO1xuXG4gIHJldHVybiB7XG4gICAgaW5pdGlhbCxcbiAgICBzdGF0czogW2ZpbGVzLCBuYW1lcywgcmF3U2l6ZSwgZXN0aW1hdGVkVHJhbnNmZXJTaXplXSxcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdlbmVyYXRlQnVpbGRTdGF0c1RhYmxlKFxuICBkYXRhOiBCdW5kbGVTdGF0c1tdLFxuICBjb2xvcnM6IGJvb2xlYW4sXG4gIHNob3dUb3RhbFNpemU6IGJvb2xlYW4sXG4gIHNob3dFc3RpbWF0ZWRUcmFuc2ZlclNpemU6IGJvb2xlYW4sXG4gIGJ1ZGdldEZhaWx1cmVzPzogQnVkZ2V0Q2FsY3VsYXRvclJlc3VsdFtdLFxuKTogc3RyaW5nIHtcbiAgY29uc3QgZyA9ICh4OiBzdHJpbmcpID0+IChjb2xvcnMgPyBhbnNpQ29sb3JzLmdyZWVuQnJpZ2h0KHgpIDogeCk7XG4gIGNvbnN0IGMgPSAoeDogc3RyaW5nKSA9PiAoY29sb3JzID8gYW5zaUNvbG9ycy5jeWFuQnJpZ2h0KHgpIDogeCk7XG4gIGNvbnN0IHIgPSAoeDogc3RyaW5nKSA9PiAoY29sb3JzID8gYW5zaUNvbG9ycy5yZWRCcmlnaHQoeCkgOiB4KTtcbiAgY29uc3QgeSA9ICh4OiBzdHJpbmcpID0+IChjb2xvcnMgPyBhbnNpQ29sb3JzLnllbGxvd0JyaWdodCh4KSA6IHgpO1xuICBjb25zdCBib2xkID0gKHg6IHN0cmluZykgPT4gKGNvbG9ycyA/IGFuc2lDb2xvcnMuYm9sZCh4KSA6IHgpO1xuICBjb25zdCBkaW0gPSAoeDogc3RyaW5nKSA9PiAoY29sb3JzID8gYW5zaUNvbG9ycy5kaW0oeCkgOiB4KTtcblxuICBjb25zdCBnZXRTaXplQ29sb3IgPSAobmFtZTogc3RyaW5nLCBmaWxlPzogc3RyaW5nLCBkZWZhdWx0Q29sb3IgPSBjKSA9PiB7XG4gICAgY29uc3Qgc2V2ZXJpdHkgPSBidWRnZXRzLmdldChuYW1lKSB8fCAoZmlsZSAmJiBidWRnZXRzLmdldChmaWxlKSk7XG4gICAgc3dpdGNoIChzZXZlcml0eSkge1xuICAgICAgY2FzZSAnd2FybmluZyc6XG4gICAgICAgIHJldHVybiB5O1xuICAgICAgY2FzZSAnZXJyb3InOlxuICAgICAgICByZXR1cm4gcjtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiBkZWZhdWx0Q29sb3I7XG4gICAgfVxuICB9O1xuXG4gIGNvbnN0IGNoYW5nZWRFbnRyeUNodW5rc1N0YXRzOiBCdW5kbGVTdGF0c0RhdGFbXSA9IFtdO1xuICBjb25zdCBjaGFuZ2VkTGF6eUNodW5rc1N0YXRzOiBCdW5kbGVTdGF0c0RhdGFbXSA9IFtdO1xuXG4gIGxldCBpbml0aWFsVG90YWxSYXdTaXplID0gMDtcbiAgbGV0IGluaXRpYWxUb3RhbEVzdGltYXRlZFRyYW5zZmVyU2l6ZTtcblxuICBjb25zdCBidWRnZXRzID0gbmV3IE1hcDxzdHJpbmcsIHN0cmluZz4oKTtcbiAgaWYgKGJ1ZGdldEZhaWx1cmVzKSB7XG4gICAgZm9yIChjb25zdCB7IGxhYmVsLCBzZXZlcml0eSB9IG9mIGJ1ZGdldEZhaWx1cmVzKSB7XG4gICAgICAvLyBJbiBzb21lIGNhc2VzIGEgZmlsZSBjYW4gaGF2ZSBtdWx0aXBsZSBidWRnZXQgZmFpbHVyZXMuXG4gICAgICAvLyBGYXZvciBlcnJvci5cbiAgICAgIGlmIChsYWJlbCAmJiAoIWJ1ZGdldHMuaGFzKGxhYmVsKSB8fCBidWRnZXRzLmdldChsYWJlbCkgPT09ICd3YXJuaW5nJykpIHtcbiAgICAgICAgYnVkZ2V0cy5zZXQobGFiZWwsIHNldmVyaXR5KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBTb3J0IGRlc2NlbmRpbmcgYnkgcmF3IHNpemVcbiAgZGF0YS5zb3J0KChhLCBiKSA9PiB7XG4gICAgaWYgKGEuc3RhdHNbMl0gPiBiLnN0YXRzWzJdKSB7XG4gICAgICByZXR1cm4gLTE7XG4gICAgfVxuXG4gICAgaWYgKGEuc3RhdHNbMl0gPCBiLnN0YXRzWzJdKSB7XG4gICAgICByZXR1cm4gMTtcbiAgICB9XG5cbiAgICByZXR1cm4gMDtcbiAgfSk7XG5cbiAgZm9yIChjb25zdCB7IGluaXRpYWwsIHN0YXRzIH0gb2YgZGF0YSkge1xuICAgIGNvbnN0IFtmaWxlcywgbmFtZXMsIHJhd1NpemUsIGVzdGltYXRlZFRyYW5zZmVyU2l6ZV0gPSBzdGF0cztcbiAgICBjb25zdCBnZXRSYXdTaXplQ29sb3IgPSBnZXRTaXplQ29sb3IobmFtZXMsIGZpbGVzKTtcbiAgICBsZXQgZGF0YTogQnVuZGxlU3RhdHNEYXRhO1xuXG4gICAgaWYgKHNob3dFc3RpbWF0ZWRUcmFuc2ZlclNpemUpIHtcbiAgICAgIGRhdGEgPSBbXG4gICAgICAgIGcoZmlsZXMpLFxuICAgICAgICBuYW1lcyxcbiAgICAgICAgZ2V0UmF3U2l6ZUNvbG9yKHR5cGVvZiByYXdTaXplID09PSAnbnVtYmVyJyA/IGZvcm1hdFNpemUocmF3U2l6ZSkgOiByYXdTaXplKSxcbiAgICAgICAgYyhcbiAgICAgICAgICB0eXBlb2YgZXN0aW1hdGVkVHJhbnNmZXJTaXplID09PSAnbnVtYmVyJ1xuICAgICAgICAgICAgPyBmb3JtYXRTaXplKGVzdGltYXRlZFRyYW5zZmVyU2l6ZSlcbiAgICAgICAgICAgIDogZXN0aW1hdGVkVHJhbnNmZXJTaXplLFxuICAgICAgICApLFxuICAgICAgXTtcbiAgICB9IGVsc2Uge1xuICAgICAgZGF0YSA9IFtcbiAgICAgICAgZyhmaWxlcyksXG4gICAgICAgIG5hbWVzLFxuICAgICAgICBnZXRSYXdTaXplQ29sb3IodHlwZW9mIHJhd1NpemUgPT09ICdudW1iZXInID8gZm9ybWF0U2l6ZShyYXdTaXplKSA6IHJhd1NpemUpLFxuICAgICAgICAnJyxcbiAgICAgIF07XG4gICAgfVxuXG4gICAgaWYgKGluaXRpYWwpIHtcbiAgICAgIGNoYW5nZWRFbnRyeUNodW5rc1N0YXRzLnB1c2goZGF0YSk7XG4gICAgICBpZiAodHlwZW9mIHJhd1NpemUgPT09ICdudW1iZXInKSB7XG4gICAgICAgIGluaXRpYWxUb3RhbFJhd1NpemUgKz0gcmF3U2l6ZTtcbiAgICAgIH1cbiAgICAgIGlmIChzaG93RXN0aW1hdGVkVHJhbnNmZXJTaXplICYmIHR5cGVvZiBlc3RpbWF0ZWRUcmFuc2ZlclNpemUgPT09ICdudW1iZXInKSB7XG4gICAgICAgIGlmIChpbml0aWFsVG90YWxFc3RpbWF0ZWRUcmFuc2ZlclNpemUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIGluaXRpYWxUb3RhbEVzdGltYXRlZFRyYW5zZmVyU2l6ZSA9IDA7XG4gICAgICAgIH1cbiAgICAgICAgaW5pdGlhbFRvdGFsRXN0aW1hdGVkVHJhbnNmZXJTaXplICs9IGVzdGltYXRlZFRyYW5zZmVyU2l6ZTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgY2hhbmdlZExhenlDaHVua3NTdGF0cy5wdXNoKGRhdGEpO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IGJ1bmRsZUluZm86IChzdHJpbmcgfCBudW1iZXIpW11bXSA9IFtdO1xuICBjb25zdCBiYXNlVGl0bGVzID0gWydOYW1lcycsICdSYXcgU2l6ZSddO1xuICBjb25zdCB0YWJsZUFsaWduOiAoJ2wnIHwgJ3InKVtdID0gWydsJywgJ2wnLCAnciddO1xuXG4gIGlmIChzaG93RXN0aW1hdGVkVHJhbnNmZXJTaXplKSB7XG4gICAgYmFzZVRpdGxlcy5wdXNoKCdFc3RpbWF0ZWQgVHJhbnNmZXIgU2l6ZScpO1xuICAgIHRhYmxlQWxpZ24ucHVzaCgncicpO1xuICB9XG5cbiAgLy8gRW50cnkgY2h1bmtzXG4gIGlmIChjaGFuZ2VkRW50cnlDaHVua3NTdGF0cy5sZW5ndGgpIHtcbiAgICBidW5kbGVJbmZvLnB1c2goWydJbml0aWFsIENodW5rIEZpbGVzJywgLi4uYmFzZVRpdGxlc10ubWFwKGJvbGQpLCAuLi5jaGFuZ2VkRW50cnlDaHVua3NTdGF0cyk7XG5cbiAgICBpZiAoc2hvd1RvdGFsU2l6ZSkge1xuICAgICAgYnVuZGxlSW5mby5wdXNoKFtdKTtcblxuICAgICAgY29uc3QgaW5pdGlhbFNpemVUb3RhbENvbG9yID0gZ2V0U2l6ZUNvbG9yKCdidW5kbGUgaW5pdGlhbCcsIHVuZGVmaW5lZCwgKHgpID0+IHgpO1xuICAgICAgY29uc3QgdG90YWxTaXplRWxlbWVudHMgPSBbXG4gICAgICAgICcgJyxcbiAgICAgICAgJ0luaXRpYWwgVG90YWwnLFxuICAgICAgICBpbml0aWFsU2l6ZVRvdGFsQ29sb3IoZm9ybWF0U2l6ZShpbml0aWFsVG90YWxSYXdTaXplKSksXG4gICAgICBdO1xuICAgICAgaWYgKHNob3dFc3RpbWF0ZWRUcmFuc2ZlclNpemUpIHtcbiAgICAgICAgdG90YWxTaXplRWxlbWVudHMucHVzaChcbiAgICAgICAgICB0eXBlb2YgaW5pdGlhbFRvdGFsRXN0aW1hdGVkVHJhbnNmZXJTaXplID09PSAnbnVtYmVyJ1xuICAgICAgICAgICAgPyBmb3JtYXRTaXplKGluaXRpYWxUb3RhbEVzdGltYXRlZFRyYW5zZmVyU2l6ZSlcbiAgICAgICAgICAgIDogJy0nLFxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgYnVuZGxlSW5mby5wdXNoKHRvdGFsU2l6ZUVsZW1lbnRzLm1hcChib2xkKSk7XG4gICAgfVxuICB9XG5cbiAgLy8gU2VwZXJhdG9yXG4gIGlmIChjaGFuZ2VkRW50cnlDaHVua3NTdGF0cy5sZW5ndGggJiYgY2hhbmdlZExhenlDaHVua3NTdGF0cy5sZW5ndGgpIHtcbiAgICBidW5kbGVJbmZvLnB1c2goW10pO1xuICB9XG5cbiAgLy8gTGF6eSBjaHVua3NcbiAgaWYgKGNoYW5nZWRMYXp5Q2h1bmtzU3RhdHMubGVuZ3RoKSB7XG4gICAgYnVuZGxlSW5mby5wdXNoKFsnTGF6eSBDaHVuayBGaWxlcycsIC4uLmJhc2VUaXRsZXNdLm1hcChib2xkKSwgLi4uY2hhbmdlZExhenlDaHVua3NTdGF0cyk7XG4gIH1cblxuICByZXR1cm4gdGV4dFRhYmxlKGJ1bmRsZUluZm8sIHtcbiAgICBoc2VwOiBkaW0oJyB8ICcpLFxuICAgIHN0cmluZ0xlbmd0aDogKHMpID0+IHJlbW92ZUNvbG9yKHMpLmxlbmd0aCxcbiAgICBhbGlnbjogdGFibGVBbGlnbixcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGdlbmVyYXRlQnVpbGRTdGF0cyhoYXNoOiBzdHJpbmcsIHRpbWU6IG51bWJlciwgY29sb3JzOiBib29sZWFuKTogc3RyaW5nIHtcbiAgY29uc3QgdyA9ICh4OiBzdHJpbmcpID0+IChjb2xvcnMgPyBhbnNpQ29sb3JzLmJvbGQud2hpdGUoeCkgOiB4KTtcblxuICByZXR1cm4gYEJ1aWxkIGF0OiAke3cobmV3IERhdGUoKS50b0lTT1N0cmluZygpKX0gLSBIYXNoOiAke3coaGFzaCl9IC0gVGltZTogJHt3KCcnICsgdGltZSl9bXNgO1xufVxuXG4vLyBXZSB1c2UgdGhpcyBjYWNoZSBiZWNhdXNlIHdlIGNhbiBoYXZlIG11bHRpcGxlIGJ1aWxkZXJzIHJ1bm5pbmcgaW4gdGhlIHNhbWUgcHJvY2Vzcyxcbi8vIHdoZXJlIGVhY2ggYnVpbGRlciBoYXMgZGlmZmVyZW50IG91dHB1dCBwYXRoLlxuXG4vLyBJZGVhbGx5LCB3ZSBzaG91bGQgY3JlYXRlIHRoZSBsb2dnaW5nIGNhbGxiYWNrIGFzIGEgZmFjdG9yeSwgYnV0IHRoYXQgd291bGQgbmVlZCBhIHJlZmFjdG9yaW5nLlxuY29uc3QgcnVuc0NhY2hlID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbmZ1bmN0aW9uIHN0YXRzVG9TdHJpbmcoXG4gIGpzb246IFN0YXRzQ29tcGlsYXRpb24sXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gIHN0YXRzQ29uZmlnOiBhbnksXG4gIGJ1ZGdldEZhaWx1cmVzPzogQnVkZ2V0Q2FsY3VsYXRvclJlc3VsdFtdLFxuKTogc3RyaW5nIHtcbiAgaWYgKCFqc29uLmNodW5rcz8ubGVuZ3RoKSB7XG4gICAgcmV0dXJuICcnO1xuICB9XG5cbiAgY29uc3QgY29sb3JzID0gc3RhdHNDb25maWcuY29sb3JzO1xuICBjb25zdCBycyA9ICh4OiBzdHJpbmcpID0+IChjb2xvcnMgPyBhbnNpQ29sb3JzLnJlc2V0KHgpIDogeCk7XG5cbiAgY29uc3QgY2hhbmdlZENodW5rc1N0YXRzOiBCdW5kbGVTdGF0c1tdID0gW107XG4gIGxldCB1bmNoYW5nZWRDaHVua051bWJlciA9IDA7XG4gIGxldCBoYXNFc3RpbWF0ZWRUcmFuc2ZlclNpemVzID0gZmFsc2U7XG5cbiAgY29uc3QgaXNGaXJzdFJ1biA9ICFydW5zQ2FjaGUuaGFzKGpzb24ub3V0cHV0UGF0aCB8fCAnJyk7XG5cbiAgZm9yIChjb25zdCBjaHVuayBvZiBqc29uLmNodW5rcykge1xuICAgIC8vIER1cmluZyBmaXJzdCBidWlsZCB3ZSB3YW50IHRvIGRpc3BsYXkgdW5jaGFuZ2VkIGNodW5rc1xuICAgIC8vIGJ1dCB1bmNoYW5nZWQgY2FjaGVkIGNodW5rcyBhcmUgYWx3YXlzIG1hcmtlZCBhcyBub3QgcmVuZGVyZWQuXG4gICAgaWYgKCFpc0ZpcnN0UnVuICYmICFjaHVuay5yZW5kZXJlZCkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgYXNzZXRzID0ganNvbi5hc3NldHM/LmZpbHRlcigoYXNzZXQpID0+IGNodW5rLmZpbGVzPy5pbmNsdWRlcyhhc3NldC5uYW1lKSk7XG4gICAgbGV0IHJhd1NpemUgPSAwO1xuICAgIGxldCBlc3RpbWF0ZWRUcmFuc2ZlclNpemU7XG4gICAgaWYgKGFzc2V0cykge1xuICAgICAgZm9yIChjb25zdCBhc3NldCBvZiBhc3NldHMpIHtcbiAgICAgICAgaWYgKGFzc2V0Lm5hbWUuZW5kc1dpdGgoJy5tYXAnKSkge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmF3U2l6ZSArPSBhc3NldC5zaXplO1xuXG4gICAgICAgIGlmICh0eXBlb2YgYXNzZXQuaW5mby5lc3RpbWF0ZWRUcmFuc2ZlclNpemUgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgaWYgKGVzdGltYXRlZFRyYW5zZmVyU2l6ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBlc3RpbWF0ZWRUcmFuc2ZlclNpemUgPSAwO1xuICAgICAgICAgICAgaGFzRXN0aW1hdGVkVHJhbnNmZXJTaXplcyA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVzdGltYXRlZFRyYW5zZmVyU2l6ZSArPSBhc3NldC5pbmZvLmVzdGltYXRlZFRyYW5zZmVyU2l6ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBjaGFuZ2VkQ2h1bmtzU3RhdHMucHVzaChnZW5lcmF0ZUJ1bmRsZVN0YXRzKHsgLi4uY2h1bmssIHJhd1NpemUsIGVzdGltYXRlZFRyYW5zZmVyU2l6ZSB9KSk7XG4gIH1cbiAgdW5jaGFuZ2VkQ2h1bmtOdW1iZXIgPSBqc29uLmNodW5rcy5sZW5ndGggLSBjaGFuZ2VkQ2h1bmtzU3RhdHMubGVuZ3RoO1xuXG4gIHJ1bnNDYWNoZS5hZGQoanNvbi5vdXRwdXRQYXRoIHx8ICcnKTtcblxuICBjb25zdCBzdGF0c1RhYmxlID0gZ2VuZXJhdGVCdWlsZFN0YXRzVGFibGUoXG4gICAgY2hhbmdlZENodW5rc1N0YXRzLFxuICAgIGNvbG9ycyxcbiAgICB1bmNoYW5nZWRDaHVua051bWJlciA9PT0gMCxcbiAgICBoYXNFc3RpbWF0ZWRUcmFuc2ZlclNpemVzLFxuICAgIGJ1ZGdldEZhaWx1cmVzLFxuICApO1xuXG4gIC8vIEluIHNvbWUgY2FzZXMgd2UgZG8gdGhpbmdzIG91dHNpZGUgb2Ygd2VicGFjayBjb250ZXh0XG4gIC8vIFN1Y2ggdXMgaW5kZXggZ2VuZXJhdGlvbiwgc2VydmljZSB3b3JrZXIgYXVnbWVudGF0aW9uIGV0Yy4uLlxuICAvLyBUaGlzIHdpbGwgY29ycmVjdCB0aGUgdGltZSBhbmQgaW5jbHVkZSB0aGVzZS5cblxuICBjb25zdCB0aW1lID0gZ2V0QnVpbGREdXJhdGlvbihqc29uKTtcblxuICBpZiAodW5jaGFuZ2VkQ2h1bmtOdW1iZXIgPiAwKSB7XG4gICAgcmV0dXJuIChcbiAgICAgICdcXG4nICtcbiAgICAgIHJzKHRhZ3Muc3RyaXBJbmRlbnRzYFxuICAgICAgJHtzdGF0c1RhYmxlfVxuXG4gICAgICAke3VuY2hhbmdlZENodW5rTnVtYmVyfSB1bmNoYW5nZWQgY2h1bmtzXG5cbiAgICAgICR7Z2VuZXJhdGVCdWlsZFN0YXRzKGpzb24uaGFzaCB8fCAnJywgdGltZSwgY29sb3JzKX1cbiAgICAgIGApXG4gICAgKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gKFxuICAgICAgJ1xcbicgK1xuICAgICAgcnModGFncy5zdHJpcEluZGVudHNgXG4gICAgICAke3N0YXRzVGFibGV9XG5cbiAgICAgICR7Z2VuZXJhdGVCdWlsZFN0YXRzKGpzb24uaGFzaCB8fCAnJywgdGltZSwgY29sb3JzKX1cbiAgICAgIGApXG4gICAgKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gc3RhdHNXYXJuaW5nc1RvU3RyaW5nKFxuICBqc29uOiBTdGF0c0NvbXBpbGF0aW9uLFxuICBzdGF0c0NvbmZpZzogV2VicGFja1N0YXRzT3B0aW9ucyxcbik6IHN0cmluZyB7XG4gIGNvbnN0IGNvbG9ycyA9IHN0YXRzQ29uZmlnLmNvbG9ycztcbiAgY29uc3QgYyA9ICh4OiBzdHJpbmcpID0+IChjb2xvcnMgPyBhbnNpQ29sb3JzLnJlc2V0LmN5YW4oeCkgOiB4KTtcbiAgY29uc3QgeSA9ICh4OiBzdHJpbmcpID0+IChjb2xvcnMgPyBhbnNpQ29sb3JzLnJlc2V0LnllbGxvdyh4KSA6IHgpO1xuICBjb25zdCB5YiA9ICh4OiBzdHJpbmcpID0+IChjb2xvcnMgPyBhbnNpQ29sb3JzLnJlc2V0LnllbGxvd0JyaWdodCh4KSA6IHgpO1xuXG4gIGNvbnN0IHdhcm5pbmdzID0ganNvbi53YXJuaW5ncyA/IFsuLi5qc29uLndhcm5pbmdzXSA6IFtdO1xuICBpZiAoanNvbi5jaGlsZHJlbikge1xuICAgIHdhcm5pbmdzLnB1c2goLi4uanNvbi5jaGlsZHJlbi5tYXAoKGMpID0+IGMud2FybmluZ3MgPz8gW10pLnJlZHVjZSgoYSwgYikgPT4gWy4uLmEsIC4uLmJdLCBbXSkpO1xuICB9XG5cbiAgbGV0IG91dHB1dCA9ICcnO1xuICBmb3IgKGNvbnN0IHdhcm5pbmcgb2Ygd2FybmluZ3MpIHtcbiAgICBpZiAodHlwZW9mIHdhcm5pbmcgPT09ICdzdHJpbmcnKSB7XG4gICAgICBvdXRwdXQgKz0geWIoYFdhcm5pbmc6ICR7d2FybmluZ31cXG5cXG5gKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IGZpbGUgPSB3YXJuaW5nLmZpbGUgfHwgd2FybmluZy5tb2R1bGVOYW1lO1xuICAgICAgLy8gQ2xlYW4gdXAgd2FybmluZyBwYXRoc1xuICAgICAgLy8gRXg6IC4vc3JjL2FwcC9zdHlsZXMuc2Nzcy53ZWJwYWNrW2phdmFzY3JpcHQvYXV0b10hPSEuL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2Rpc3QvY2pzLmpzLi4uLlxuICAgICAgLy8gdG8gLi9zcmMvYXBwL3N0eWxlcy5zY3NzLndlYnBhY2tcbiAgICAgIGlmIChmaWxlICYmICFzdGF0c0NvbmZpZy5lcnJvckRldGFpbHMpIHtcbiAgICAgICAgY29uc3Qgd2VicGFja1BhdGhJbmRleCA9IGZpbGUuaW5kZXhPZignLndlYnBhY2tbJyk7XG4gICAgICAgIGlmICh3ZWJwYWNrUGF0aEluZGV4ICE9PSAtMSkge1xuICAgICAgICAgIGZpbGUgPSBmaWxlLnN1YnN0cmluZygwLCB3ZWJwYWNrUGF0aEluZGV4KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoZmlsZSkge1xuICAgICAgICBvdXRwdXQgKz0gYyhmaWxlKTtcbiAgICAgICAgaWYgKHdhcm5pbmcubG9jKSB7XG4gICAgICAgICAgb3V0cHV0ICs9ICc6JyArIHliKHdhcm5pbmcubG9jKTtcbiAgICAgICAgfVxuICAgICAgICBvdXRwdXQgKz0gJyAtICc7XG4gICAgICB9XG4gICAgICBpZiAoIS9ed2FybmluZy9pLnRlc3Qod2FybmluZy5tZXNzYWdlKSkge1xuICAgICAgICBvdXRwdXQgKz0geSgnV2FybmluZzogJyk7XG4gICAgICB9XG4gICAgICBvdXRwdXQgKz0gYCR7d2FybmluZy5tZXNzYWdlfVxcblxcbmA7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG91dHB1dCA/ICdcXG4nICsgb3V0cHV0IDogb3V0cHV0O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc3RhdHNFcnJvcnNUb1N0cmluZyhcbiAganNvbjogU3RhdHNDb21waWxhdGlvbixcbiAgc3RhdHNDb25maWc6IFdlYnBhY2tTdGF0c09wdGlvbnMsXG4pOiBzdHJpbmcge1xuICBjb25zdCBjb2xvcnMgPSBzdGF0c0NvbmZpZy5jb2xvcnM7XG4gIGNvbnN0IGMgPSAoeDogc3RyaW5nKSA9PiAoY29sb3JzID8gYW5zaUNvbG9ycy5yZXNldC5jeWFuKHgpIDogeCk7XG4gIGNvbnN0IHliID0gKHg6IHN0cmluZykgPT4gKGNvbG9ycyA/IGFuc2lDb2xvcnMucmVzZXQueWVsbG93QnJpZ2h0KHgpIDogeCk7XG4gIGNvbnN0IHIgPSAoeDogc3RyaW5nKSA9PiAoY29sb3JzID8gYW5zaUNvbG9ycy5yZXNldC5yZWRCcmlnaHQoeCkgOiB4KTtcblxuICBjb25zdCBlcnJvcnMgPSBqc29uLmVycm9ycyA/IFsuLi5qc29uLmVycm9yc10gOiBbXTtcbiAgaWYgKGpzb24uY2hpbGRyZW4pIHtcbiAgICBlcnJvcnMucHVzaCguLi5qc29uLmNoaWxkcmVuLm1hcCgoYykgPT4gYz8uZXJyb3JzIHx8IFtdKS5yZWR1Y2UoKGEsIGIpID0+IFsuLi5hLCAuLi5iXSwgW10pKTtcbiAgfVxuXG4gIGxldCBvdXRwdXQgPSAnJztcbiAgZm9yIChjb25zdCBlcnJvciBvZiBlcnJvcnMpIHtcbiAgICBpZiAodHlwZW9mIGVycm9yID09PSAnc3RyaW5nJykge1xuICAgICAgb3V0cHV0ICs9IHIoYEVycm9yOiAke2Vycm9yfVxcblxcbmApO1xuICAgIH0gZWxzZSB7XG4gICAgICBsZXQgZmlsZSA9IGVycm9yLmZpbGUgfHwgZXJyb3IubW9kdWxlTmFtZTtcbiAgICAgIC8vIENsZWFuIHVwIGVycm9yIHBhdGhzXG4gICAgICAvLyBFeDogLi9zcmMvYXBwL3N0eWxlcy5zY3NzLndlYnBhY2tbamF2YXNjcmlwdC9hdXRvXSE9IS4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvZGlzdC9janMuanMuLi4uXG4gICAgICAvLyB0byAuL3NyYy9hcHAvc3R5bGVzLnNjc3Mud2VicGFja1xuICAgICAgaWYgKGZpbGUgJiYgIXN0YXRzQ29uZmlnLmVycm9yRGV0YWlscykge1xuICAgICAgICBjb25zdCB3ZWJwYWNrUGF0aEluZGV4ID0gZmlsZS5pbmRleE9mKCcud2VicGFja1snKTtcbiAgICAgICAgaWYgKHdlYnBhY2tQYXRoSW5kZXggIT09IC0xKSB7XG4gICAgICAgICAgZmlsZSA9IGZpbGUuc3Vic3RyaW5nKDAsIHdlYnBhY2tQYXRoSW5kZXgpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChmaWxlKSB7XG4gICAgICAgIG91dHB1dCArPSBjKGZpbGUpO1xuICAgICAgICBpZiAoZXJyb3IubG9jKSB7XG4gICAgICAgICAgb3V0cHV0ICs9ICc6JyArIHliKGVycm9yLmxvYyk7XG4gICAgICAgIH1cbiAgICAgICAgb3V0cHV0ICs9ICcgLSAnO1xuICAgICAgfVxuXG4gICAgICAvLyBJbiBtb3N0IGNhc2VzIHdlYnBhY2sgd2lsbCBhZGQgc3RhY2sgdHJhY2VzIHRvIGVycm9yIG1lc3NhZ2VzLlxuICAgICAgLy8gVGhpcyBiZWxvdyBjbGVhbnMgdXAgdGhlIGVycm9yIGZyb20gc3RhY2tzLlxuICAgICAgLy8gU2VlOiBodHRwczovL2dpdGh1Yi5jb20vd2VicGFjay93ZWJwYWNrL2lzc3Vlcy8xNTk4MFxuICAgICAgY29uc3QgaW5kZXggPSBlcnJvci5tZXNzYWdlLnNlYXJjaCgvW1xcblxcc10rYXQgLyk7XG4gICAgICBjb25zdCBtZXNzYWdlID1cbiAgICAgICAgc3RhdHNDb25maWcuZXJyb3JTdGFjayB8fCBpbmRleCA9PT0gLTEgPyBlcnJvci5tZXNzYWdlIDogZXJyb3IubWVzc2FnZS5zdWJzdHJpbmcoMCwgaW5kZXgpO1xuXG4gICAgICBpZiAoIS9eZXJyb3IvaS50ZXN0KG1lc3NhZ2UpKSB7XG4gICAgICAgIG91dHB1dCArPSByKCdFcnJvcjogJyk7XG4gICAgICB9XG4gICAgICBvdXRwdXQgKz0gYCR7bWVzc2FnZX1cXG5cXG5gO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBvdXRwdXQgPyAnXFxuJyArIG91dHB1dCA6IG91dHB1dDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHN0YXRzSGFzRXJyb3JzKGpzb246IFN0YXRzQ29tcGlsYXRpb24pOiBib29sZWFuIHtcbiAgcmV0dXJuICEhKGpzb24uZXJyb3JzPy5sZW5ndGggfHwganNvbi5jaGlsZHJlbj8uc29tZSgoYykgPT4gYy5lcnJvcnM/Lmxlbmd0aCkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc3RhdHNIYXNXYXJuaW5ncyhqc29uOiBTdGF0c0NvbXBpbGF0aW9uKTogYm9vbGVhbiB7XG4gIHJldHVybiAhIShqc29uLndhcm5pbmdzPy5sZW5ndGggfHwganNvbi5jaGlsZHJlbj8uc29tZSgoYykgPT4gYy53YXJuaW5ncz8ubGVuZ3RoKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVXZWJwYWNrTG9nZ2luZ0NhbGxiYWNrKFxuICBvcHRpb25zOiBCcm93c2VyQnVpbGRlck9wdGlvbnMsXG4gIGxvZ2dlcjogbG9nZ2luZy5Mb2dnZXJBcGksXG4pOiBXZWJwYWNrTG9nZ2luZ0NhbGxiYWNrIHtcbiAgY29uc3QgeyB2ZXJib3NlID0gZmFsc2UsIHNjcmlwdHMgPSBbXSwgc3R5bGVzID0gW10gfSA9IG9wdGlvbnM7XG4gIGNvbnN0IGV4dHJhRW50cnlQb2ludHMgPSBbXG4gICAgLi4ubm9ybWFsaXplRXh0cmFFbnRyeVBvaW50cyhzdHlsZXMsICdzdHlsZXMnKSxcbiAgICAuLi5ub3JtYWxpemVFeHRyYUVudHJ5UG9pbnRzKHNjcmlwdHMsICdzY3JpcHRzJyksXG4gIF07XG5cbiAgcmV0dXJuIChzdGF0cywgY29uZmlnKSA9PiB7XG4gICAgaWYgKHZlcmJvc2UpIHtcbiAgICAgIGxvZ2dlci5pbmZvKHN0YXRzLnRvU3RyaW5nKGNvbmZpZy5zdGF0cykpO1xuICAgIH1cblxuICAgIGNvbnN0IHJhd1N0YXRzID0gc3RhdHMudG9Kc29uKGdldFN0YXRzT3B0aW9ucyhmYWxzZSkpO1xuICAgIGNvbnN0IHdlYnBhY2tTdGF0cyA9IHtcbiAgICAgIC4uLnJhd1N0YXRzLFxuICAgICAgY2h1bmtzOiBtYXJrQXN5bmNDaHVua3NOb25Jbml0aWFsKHJhd1N0YXRzLCBleHRyYUVudHJ5UG9pbnRzKSxcbiAgICB9O1xuXG4gICAgd2VicGFja1N0YXRzTG9nZ2VyKGxvZ2dlciwgd2VicGFja1N0YXRzLCBjb25maWcpO1xuICB9O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEJ1aWxkRXZlbnRTdGF0cyB7XG4gIGFvdDogYm9vbGVhbjtcbiAgb3B0aW1pemF0aW9uOiBib29sZWFuO1xuICBhbGxDaHVua3NDb3VudDogbnVtYmVyO1xuICBsYXp5Q2h1bmtzQ291bnQ6IG51bWJlcjtcbiAgaW5pdGlhbENodW5rc0NvdW50OiBudW1iZXI7XG4gIGNoYW5nZWRDaHVua3NDb3VudD86IG51bWJlcjtcbiAgZHVyYXRpb25Jbk1zOiBudW1iZXI7XG4gIGNzc1NpemVJbkJ5dGVzOiBudW1iZXI7XG4gIGpzU2l6ZUluQnl0ZXM6IG51bWJlcjtcbiAgbmdDb21wb25lbnRDb3VudDogbnVtYmVyO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2VuZXJhdGVCdWlsZEV2ZW50U3RhdHMoXG4gIHdlYnBhY2tTdGF0czogU3RhdHNDb21waWxhdGlvbixcbiAgYnJvd3NlckJ1aWxkZXJPcHRpb25zOiBCcm93c2VyQnVpbGRlck9wdGlvbnMsXG4pOiBCdWlsZEV2ZW50U3RhdHMge1xuICBjb25zdCB7IGNodW5rcyA9IFtdLCBhc3NldHMgPSBbXSB9ID0gd2VicGFja1N0YXRzO1xuXG4gIGxldCBqc1NpemVJbkJ5dGVzID0gMDtcbiAgbGV0IGNzc1NpemVJbkJ5dGVzID0gMDtcbiAgbGV0IGluaXRpYWxDaHVua3NDb3VudCA9IDA7XG4gIGxldCBuZ0NvbXBvbmVudENvdW50ID0gMDtcbiAgbGV0IGNoYW5nZWRDaHVua3NDb3VudCA9IDA7XG5cbiAgY29uc3QgYWxsQ2h1bmtzQ291bnQgPSBjaHVua3MubGVuZ3RoO1xuICBjb25zdCBpc0ZpcnN0UnVuID0gIXJ1bnNDYWNoZS5oYXMod2VicGFja1N0YXRzLm91dHB1dFBhdGggfHwgJycpO1xuXG4gIGNvbnN0IGNodW5rRmlsZXMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgZm9yIChjb25zdCBjaHVuayBvZiBjaHVua3MpIHtcbiAgICBpZiAoIWlzRmlyc3RSdW4gJiYgY2h1bmsucmVuZGVyZWQpIHtcbiAgICAgIGNoYW5nZWRDaHVua3NDb3VudCsrO1xuICAgIH1cblxuICAgIGlmIChjaHVuay5pbml0aWFsKSB7XG4gICAgICBpbml0aWFsQ2h1bmtzQ291bnQrKztcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IGZpbGUgb2YgY2h1bmsuZmlsZXMgPz8gW10pIHtcbiAgICAgIGNodW5rRmlsZXMuYWRkKGZpbGUpO1xuICAgIH1cbiAgfVxuXG4gIGZvciAoY29uc3QgYXNzZXQgb2YgYXNzZXRzKSB7XG4gICAgaWYgKGFzc2V0Lm5hbWUuZW5kc1dpdGgoJy5tYXAnKSB8fCAhY2h1bmtGaWxlcy5oYXMoYXNzZXQubmFtZSkpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChhc3NldC5uYW1lLmVuZHNXaXRoKCcuanMnKSkge1xuICAgICAganNTaXplSW5CeXRlcyArPSBhc3NldC5zaXplO1xuICAgICAgbmdDb21wb25lbnRDb3VudCArPSBhc3NldC5pbmZvLm5nQ29tcG9uZW50Q291bnQgPz8gMDtcbiAgICB9IGVsc2UgaWYgKGFzc2V0Lm5hbWUuZW5kc1dpdGgoJy5jc3MnKSkge1xuICAgICAgY3NzU2l6ZUluQnl0ZXMgKz0gYXNzZXQuc2l6ZTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4ge1xuICAgIG9wdGltaXphdGlvbjogISFub3JtYWxpemVPcHRpbWl6YXRpb24oYnJvd3NlckJ1aWxkZXJPcHRpb25zLm9wdGltaXphdGlvbikuc2NyaXB0cyxcbiAgICBhb3Q6IGJyb3dzZXJCdWlsZGVyT3B0aW9ucy5hb3QgIT09IGZhbHNlLFxuICAgIGFsbENodW5rc0NvdW50LFxuICAgIGxhenlDaHVua3NDb3VudDogYWxsQ2h1bmtzQ291bnQgLSBpbml0aWFsQ2h1bmtzQ291bnQsXG4gICAgaW5pdGlhbENodW5rc0NvdW50LFxuICAgIGNoYW5nZWRDaHVua3NDb3VudCxcbiAgICBkdXJhdGlvbkluTXM6IGdldEJ1aWxkRHVyYXRpb24od2VicGFja1N0YXRzKSxcbiAgICBjc3NTaXplSW5CeXRlcyxcbiAgICBqc1NpemVJbkJ5dGVzLFxuICAgIG5nQ29tcG9uZW50Q291bnQsXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB3ZWJwYWNrU3RhdHNMb2dnZXIoXG4gIGxvZ2dlcjogbG9nZ2luZy5Mb2dnZXJBcGksXG4gIGpzb246IFN0YXRzQ29tcGlsYXRpb24sXG4gIGNvbmZpZzogQ29uZmlndXJhdGlvbixcbiAgYnVkZ2V0RmFpbHVyZXM/OiBCdWRnZXRDYWxjdWxhdG9yUmVzdWx0W10sXG4pOiB2b2lkIHtcbiAgbG9nZ2VyLmluZm8oc3RhdHNUb1N0cmluZyhqc29uLCBjb25maWcuc3RhdHMsIGJ1ZGdldEZhaWx1cmVzKSk7XG5cbiAgaWYgKHR5cGVvZiBjb25maWcuc3RhdHMgIT09ICdvYmplY3QnKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIFdlYnBhY2sgc3RhdHMgY29uZmlndXJhdGlvbi4nKTtcbiAgfVxuXG4gIGlmIChzdGF0c0hhc1dhcm5pbmdzKGpzb24pKSB7XG4gICAgbG9nZ2VyLndhcm4oc3RhdHNXYXJuaW5nc1RvU3RyaW5nKGpzb24sIGNvbmZpZy5zdGF0cykpO1xuICB9XG5cbiAgaWYgKHN0YXRzSGFzRXJyb3JzKGpzb24pKSB7XG4gICAgbG9nZ2VyLmVycm9yKHN0YXRzRXJyb3JzVG9TdHJpbmcoanNvbiwgY29uZmlnLnN0YXRzKSk7XG4gIH1cbn1cbiJdfQ==