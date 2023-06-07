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
const path = __importStar(require("path"));
const webpack_1 = __importDefault(require("webpack"));
const webpack_dev_middleware_1 = __importDefault(require("webpack-dev-middleware"));
const stats_1 = require("../../utils/stats");
const node_1 = require("@angular-devkit/core/node");
const index_1 = require("../../../utils/index");
const KARMA_APPLICATION_PATH = '_karma_webpack_';
let blocked = [];
let isBlocked = false;
let webpackMiddleware;
let successCb;
let failureCb;
const init = (config, emitter) => {
    if (!config.buildWebpack) {
        throw new Error(`The '@angular-devkit/build-angular/plugins/karma' karma plugin is meant to` +
            ` be used from within Angular CLI and will not work correctly outside of it.`);
    }
    const options = config.buildWebpack.options;
    const logger = config.buildWebpack.logger || (0, node_1.createConsoleLogger)();
    successCb = config.buildWebpack.successCb;
    failureCb = config.buildWebpack.failureCb;
    // Add a reporter that fixes sourcemap urls.
    if ((0, index_1.normalizeSourceMaps)(options.sourceMap).scripts) {
        config.reporters.unshift('@angular-devkit/build-angular--sourcemap-reporter');
        // Code taken from https://github.com/tschaub/karma-source-map-support.
        // We can't use it directly because we need to add it conditionally in this file, and karma
        // frameworks cannot be added dynamically.
        const smsPath = path.dirname(require.resolve('source-map-support'));
        const ksmsPath = path.dirname(require.resolve('karma-source-map-support'));
        config.files.unshift({
            pattern: path.join(smsPath, 'browser-source-map-support.js'),
            included: true,
            served: true,
            watched: false,
        }, { pattern: path.join(ksmsPath, 'client.js'), included: true, served: true, watched: false });
    }
    config.reporters.unshift('@angular-devkit/build-angular--event-reporter');
    // When using code-coverage, auto-add karma-coverage.
    if (options.codeCoverage &&
        !config.reporters.some((r) => r === 'coverage' || r === 'coverage-istanbul')) {
        config.reporters.push('coverage');
    }
    // Add webpack config.
    const webpackConfig = config.buildWebpack.webpackConfig;
    const webpackMiddlewareConfig = {
        // Hide webpack output because its noisy.
        stats: false,
        publicPath: `/${KARMA_APPLICATION_PATH}/`,
    };
    // Use existing config if any.
    config.webpack = { ...webpackConfig, ...config.webpack };
    config.webpackMiddleware = { ...webpackMiddlewareConfig, ...config.webpackMiddleware };
    // Our custom context and debug files list the webpack bundles directly instead of using
    // the karma files array.
    config.customContextFile = `${__dirname}/karma-context.html`;
    config.customDebugFile = `${__dirname}/karma-debug.html`;
    // Add the request blocker and the webpack server fallback.
    config.beforeMiddleware = config.beforeMiddleware || [];
    config.beforeMiddleware.push('@angular-devkit/build-angular--blocker');
    config.middleware = config.middleware || [];
    config.middleware.push('@angular-devkit/build-angular--fallback');
    if (config.singleRun) {
        // There's no option to turn off file watching in webpack-dev-server, but
        // we can override the file watcher instead.
        webpackConfig.plugins.unshift({
            apply: (compiler) => {
                compiler.hooks.afterEnvironment.tap('karma', () => {
                    compiler.watchFileSystem = { watch: () => { } };
                });
            },
        });
    }
    // Files need to be served from a custom path for Karma.
    webpackConfig.output.path = `/${KARMA_APPLICATION_PATH}/`;
    webpackConfig.output.publicPath = `/${KARMA_APPLICATION_PATH}/`;
    const compiler = (0, webpack_1.default)(webpackConfig, (error, stats) => {
        if (error) {
            throw error;
        }
        if (stats?.hasErrors()) {
            // Only generate needed JSON stats and when needed.
            const statsJson = stats?.toJson({
                all: false,
                children: true,
                errors: true,
                warnings: true,
            });
            logger.error((0, stats_1.statsErrorsToString)(statsJson, { colors: true }));
            if (config.singleRun) {
                // Notify potential listeners of the compile error.
                emitter.emit('load_error');
            }
            // Finish Karma run early in case of compilation error.
            emitter.emit('run_complete', [], { exitCode: 1 });
            // Emit a failure build event if there are compilation errors.
            failureCb();
        }
    });
    function handler(callback) {
        isBlocked = true;
        callback?.();
    }
    compiler.hooks.invalid.tap('karma', () => handler());
    compiler.hooks.watchRun.tapAsync('karma', (_, callback) => handler(callback));
    compiler.hooks.run.tapAsync('karma', (_, callback) => handler(callback));
    webpackMiddleware = (0, webpack_dev_middleware_1.default)(compiler, webpackMiddlewareConfig);
    emitter.on('exit', (done) => {
        webpackMiddleware.close();
        compiler.close(() => done());
    });
    function unblock() {
        isBlocked = false;
        blocked.forEach((cb) => cb());
        blocked = [];
    }
    let lastCompilationHash;
    let isFirstRun = true;
    return new Promise((resolve) => {
        compiler.hooks.done.tap('karma', (stats) => {
            if (isFirstRun) {
                // This is needed to block Karma from launching browsers before Webpack writes the assets in memory.
                // See the below:
                // https://github.com/karma-runner/karma-chrome-launcher/issues/154#issuecomment-986661937
                // https://github.com/angular/angular-cli/issues/22495
                isFirstRun = false;
                resolve();
            }
            if (stats.hasErrors()) {
                lastCompilationHash = undefined;
            }
            else if (stats.hash != lastCompilationHash) {
                // Refresh karma only when there are no webpack errors, and if the compilation changed.
                lastCompilationHash = stats.hash;
                emitter.refreshFiles();
            }
            unblock();
        });
    });
};
init.$inject = ['config', 'emitter'];
// Block requests until the Webpack compilation is done.
function requestBlocker() {
    return function (_request, _response, next) {
        if (isBlocked) {
            blocked.push(next);
        }
        else {
            next();
        }
    };
}
// Copied from "karma-jasmine-diff-reporter" source code:
// In case, when multiple reporters are used in conjunction
// with initSourcemapReporter, they both will show repetitive log
// messages when displaying everything that supposed to write to terminal.
// So just suppress any logs from initSourcemapReporter by doing nothing on
// browser log, because it is an utility reporter,
// unless it's alone in the "reporters" option and base reporter is used.
function muteDuplicateReporterLogging(context, config) {
    context.writeCommonMsg = () => { };
    const reporterName = '@angular/cli';
    const hasTrailingReporters = config.reporters.slice(-1).pop() !== reporterName;
    if (hasTrailingReporters) {
        context.writeCommonMsg = () => { };
    }
}
// Emits builder events.
const eventReporter = function (baseReporterDecorator, config) {
    baseReporterDecorator(this);
    muteDuplicateReporterLogging(this, config);
    this.onRunComplete = function (_browsers, results) {
        if (results.exitCode === 0) {
            successCb();
        }
        else {
            failureCb();
        }
    };
    // avoid duplicate failure message
    this.specFailure = () => { };
};
eventReporter.$inject = ['baseReporterDecorator', 'config'];
// Strip the server address and webpack scheme (webpack://) from error log.
const sourceMapReporter = function (baseReporterDecorator, config) {
    baseReporterDecorator(this);
    muteDuplicateReporterLogging(this, config);
    const urlRegexp = /http:\/\/localhost:\d+\/_karma_webpack_\/(webpack:\/)?/gi;
    this.onSpecComplete = function (_browser, result) {
        if (!result.success) {
            result.log = result.log.map((l) => l.replace(urlRegexp, ''));
        }
    };
    // avoid duplicate complete message
    this.onRunComplete = () => { };
    // avoid duplicate failure message
    this.specFailure = () => { };
};
sourceMapReporter.$inject = ['baseReporterDecorator', 'config'];
// When a request is not found in the karma server, try looking for it from the webpack server root.
function fallbackMiddleware() {
    return function (request, response, next) {
        if (webpackMiddleware) {
            if (request.url && !new RegExp(`\\/${KARMA_APPLICATION_PATH}\\/.*`).test(request.url)) {
                request.url = '/' + KARMA_APPLICATION_PATH + request.url;
            }
            webpackMiddleware(request, response, () => {
                const alwaysServe = [
                    `/${KARMA_APPLICATION_PATH}/runtime.js`,
                    `/${KARMA_APPLICATION_PATH}/polyfills.js`,
                    `/${KARMA_APPLICATION_PATH}/scripts.js`,
                    `/${KARMA_APPLICATION_PATH}/styles.css`,
                    `/${KARMA_APPLICATION_PATH}/vendor.js`,
                ];
                if (request.url && alwaysServe.includes(request.url)) {
                    response.statusCode = 200;
                    response.end();
                }
                else {
                    next();
                }
            });
        }
        else {
            next();
        }
    };
}
module.exports = {
    'framework:@angular-devkit/build-angular': ['factory', init],
    'reporter:@angular-devkit/build-angular--sourcemap-reporter': ['type', sourceMapReporter],
    'reporter:@angular-devkit/build-angular--event-reporter': ['type', eventReporter],
    'middleware:@angular-devkit/build-angular--blocker': ['factory', requestBlocker],
    'middleware:@angular-devkit/build-angular--fallback': ['factory', fallbackMiddleware],
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2FybWEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy93ZWJwYWNrL3BsdWdpbnMva2FybWEva2FybWEudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUtILDJDQUE2QjtBQUM3QixzREFBOEI7QUFDOUIsb0ZBQTBEO0FBRTFELDZDQUF3RDtBQUN4RCxvREFBZ0U7QUFHaEUsZ0RBQTJEO0FBRTNELE1BQU0sc0JBQXNCLEdBQUcsaUJBQWlCLENBQUM7QUFFakQsSUFBSSxPQUFPLEdBQVUsRUFBRSxDQUFDO0FBQ3hCLElBQUksU0FBUyxHQUFHLEtBQUssQ0FBQztBQUN0QixJQUFJLGlCQUFzQixDQUFDO0FBQzNCLElBQUksU0FBcUIsQ0FBQztBQUMxQixJQUFJLFNBQXFCLENBQUM7QUFFMUIsTUFBTSxJQUFJLEdBQVEsQ0FBQyxNQUFXLEVBQUUsT0FBWSxFQUFFLEVBQUU7SUFDOUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxZQUFZLEVBQUU7UUFDeEIsTUFBTSxJQUFJLEtBQUssQ0FDYiw0RUFBNEU7WUFDMUUsNkVBQTZFLENBQ2hGLENBQUM7S0FDSDtJQUNELE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxZQUFZLENBQUMsT0FBdUIsQ0FBQztJQUM1RCxNQUFNLE1BQU0sR0FBbUIsTUFBTSxDQUFDLFlBQVksQ0FBQyxNQUFNLElBQUksSUFBQSwwQkFBbUIsR0FBRSxDQUFDO0lBQ25GLFNBQVMsR0FBRyxNQUFNLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQztJQUMxQyxTQUFTLEdBQUcsTUFBTSxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUM7SUFFMUMsNENBQTRDO0lBQzVDLElBQUksSUFBQSwyQkFBbUIsRUFBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENB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Q0FBQyxHQUFHLEVBQUUsQ0FBQztpQkFDaEI7cUJBQU07b0JBQ0wsSUFBSSxFQUFFLENBQUM7aUJBQ1I7WUFDSCxDQUFDLENBQUMsQ0FBQztTQUNKO2FBQU07WUFDTCxJQUFJLEVBQUUsQ0FBQztTQUNSO0lBQ0gsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQUVELE1BQU0sQ0FBQyxPQUFPLEdBQUc7SUFDZix5Q0FBeUMsRUFBRSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUM7SUFDNUQsNERBQTRELEVBQUUsQ0FBQyxNQUFNLEVBQUUsaUJBQWlCLENBQUM7SUFDekYsd0RBQXdELEVBQUUsQ0FBQyxNQUFNLEVBQUUsYUFBYSxDQUFDO0lBQ2pGLG1EQUFtRCxFQUFFLENBQUMsU0FBUyxFQUFFLGNBQWMsQ0FBQztJQUNoRixvREFBb0QsRUFBRSxDQUFDLFNBQVMsRUFBRSxrQkFBa0IsQ0FBQztDQUN0RixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbi8qIGVzbGludC1kaXNhYmxlICovXG4vLyBUT0RPOiBjbGVhbnVwIHRoaXMgZmlsZSwgaXQncyBjb3BpZWQgYXMgaXMgZnJvbSBBbmd1bGFyIENMSS5cbmltcG9ydCAqIGFzIGh0dHAgZnJvbSAnaHR0cCc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHdlYnBhY2sgZnJvbSAnd2VicGFjayc7XG5pbXBvcnQgd2VicGFja0Rldk1pZGRsZXdhcmUgZnJvbSAnd2VicGFjay1kZXYtbWlkZGxld2FyZSc7XG5cbmltcG9ydCB7IHN0YXRzRXJyb3JzVG9TdHJpbmcgfSBmcm9tICcuLi8uLi91dGlscy9zdGF0cyc7XG5pbXBvcnQgeyBjcmVhdGVDb25zb2xlTG9nZ2VyIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUvbm9kZSc7XG5pbXBvcnQgeyBsb2dnaW5nIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHsgQnVpbGRPcHRpb25zIH0gZnJvbSAnLi4vLi4vLi4vdXRpbHMvYnVpbGQtb3B0aW9ucyc7XG5pbXBvcnQgeyBub3JtYWxpemVTb3VyY2VNYXBzIH0gZnJvbSAnLi4vLi4vLi4vdXRpbHMvaW5kZXgnO1xuXG5jb25zdCBLQVJNQV9BUFBMSUNBVElPTl9QQVRIID0gJ19rYXJtYV93ZWJwYWNrXyc7XG5cbmxldCBibG9ja2VkOiBhbnlbXSA9IFtdO1xubGV0IGlzQmxvY2tlZCA9IGZhbHNlO1xubGV0IHdlYnBhY2tNaWRkbGV3YXJlOiBhbnk7XG5sZXQgc3VjY2Vzc0NiOiAoKSA9PiB2b2lkO1xubGV0IGZhaWx1cmVDYjogKCkgPT4gdm9pZDtcblxuY29uc3QgaW5pdDogYW55ID0gKGNvbmZpZzogYW55LCBlbWl0dGVyOiBhbnkpID0+IHtcbiAgaWYgKCFjb25maWcuYnVpbGRXZWJwYWNrKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgYFRoZSAnQGFuZ3VsYXItZGV2a2l0L2J1aWxkLWFuZ3VsYXIvcGx1Z2lucy9rYXJtYScga2FybWEgcGx1Z2luIGlzIG1lYW50IHRvYCArXG4gICAgICAgIGAgYmUgdXNlZCBmcm9tIHdpdGhpbiBBbmd1bGFyIENMSSBhbmQgd2lsbCBub3Qgd29yayBjb3JyZWN0bHkgb3V0c2lkZSBvZiBpdC5gLFxuICAgICk7XG4gIH1cbiAgY29uc3Qgb3B0aW9ucyA9IGNvbmZpZy5idWlsZFdlYnBhY2sub3B0aW9ucyBhcyBCdWlsZE9wdGlvbnM7XG4gIGNvbnN0IGxvZ2dlcjogbG9nZ2luZy5Mb2dnZXIgPSBjb25maWcuYnVpbGRXZWJwYWNrLmxvZ2dlciB8fCBjcmVhdGVDb25zb2xlTG9nZ2VyKCk7XG4gIHN1Y2Nlc3NDYiA9IGNvbmZpZy5idWlsZFdlYnBhY2suc3VjY2Vzc0NiO1xuICBmYWlsdXJlQ2IgPSBjb25maWcuYnVpbGRXZWJwYWNrLmZhaWx1cmVDYjtcblxuICAvLyBBZGQgYSByZXBvcnRlciB0aGF0IGZpeGVzIHNvdXJjZW1hcCB1cmxzLlxuICBpZiAobm9ybWFsaXplU291cmNlTWFwcyhvcHRpb25zLnNvdXJjZU1hcCkuc2NyaXB0cykge1xuICAgIGNvbmZpZy5yZXBvcnRlcnMudW5zaGlmdCgnQGFuZ3VsYXItZGV2a2l0L2J1aWxkLWFuZ3VsYXItLXNvdXJjZW1hcC1yZXBvcnRlcicpO1xuXG4gICAgLy8gQ29kZSB0YWtlbiBmcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS90c2NoYXViL2thcm1hLXNvdXJjZS1tYXAtc3VwcG9ydC5cbiAgICAvLyBXZSBjYW4ndCB1c2UgaXQgZGlyZWN0bHkgYmVjYXVzZSB3ZSBuZWVkIHRvIGFkZCBpdCBjb25kaXRpb25hbGx5IGluIHRoaXMgZmlsZSwgYW5kIGthcm1hXG4gICAgLy8gZnJhbWV3b3JrcyBjYW5ub3QgYmUgYWRkZWQgZHluYW1pY2FsbHkuXG4gICAgY29uc3Qgc21zUGF0aCA9IHBhdGguZGlybmFtZShyZXF1aXJlLnJlc29sdmUoJ3NvdXJjZS1tYXAtc3VwcG9ydCcpKTtcbiAgICBjb25zdCBrc21zUGF0aCA9IHBhdGguZGlybmFtZShyZXF1aXJlLnJlc29sdmUoJ2thcm1hLXNvdXJjZS1tYXAtc3VwcG9ydCcpKTtcblxuICAgIGNvbmZpZy5maWxlcy51bnNoaWZ0KFxuICAgICAge1xuICAgICAgICBwYXR0ZXJuOiBwYXRoLmpvaW4oc21zUGF0aCwgJ2Jyb3dzZXItc291cmNlLW1hcC1zdXBwb3J0LmpzJyksXG4gICAgICAgIGluY2x1ZGVkOiB0cnVlLFxuICAgICAgICBzZXJ2ZWQ6IHRydWUsXG4gICAgICAgIHdhdGNoZWQ6IGZhbHNlLFxuICAgICAgfSxcbiAgICAgIHsgcGF0dGVybjogcGF0aC5qb2luKGtzbXNQYXRoLCAnY2xpZW50LmpzJyksIGluY2x1ZGVkOiB0cnVlLCBzZXJ2ZWQ6IHRydWUsIHdhdGNoZWQ6IGZhbHNlIH0sXG4gICAgKTtcbiAgfVxuXG4gIGNvbmZpZy5yZXBvcnRlcnMudW5zaGlmdCgnQGFuZ3VsYXItZGV2a2l0L2J1aWxkLWFuZ3VsYXItLWV2ZW50LXJlcG9ydGVyJyk7XG5cbiAgLy8gV2hlbiB1c2luZyBjb2RlLWNvdmVyYWdlLCBhdXRvLWFkZCBrYXJtYS1jb3ZlcmFnZS5cbiAgaWYgKFxuICAgIG9wdGlvbnMuY29kZUNvdmVyYWdlICYmXG4gICAgIWNvbmZpZy5yZXBvcnRlcnMuc29tZSgocjogc3RyaW5nKSA9PiByID09PSAnY292ZXJhZ2UnIHx8IHIgPT09ICdjb3ZlcmFnZS1pc3RhbmJ1bCcpXG4gICkge1xuICAgIGNvbmZpZy5yZXBvcnRlcnMucHVzaCgnY292ZXJhZ2UnKTtcbiAgfVxuXG4gIC8vIEFkZCB3ZWJwYWNrIGNvbmZpZy5cbiAgY29uc3Qgd2VicGFja0NvbmZpZyA9IGNvbmZpZy5idWlsZFdlYnBhY2sud2VicGFja0NvbmZpZztcbiAgY29uc3Qgd2VicGFja01pZGRsZXdhcmVDb25maWcgPSB7XG4gICAgLy8gSGlkZSB3ZWJwYWNrIG91dHB1dCBiZWNhdXNlIGl0cyBub2lzeS5cbiAgICBzdGF0czogZmFsc2UsXG4gICAgcHVibGljUGF0aDogYC8ke0tBUk1BX0FQUExJQ0FUSU9OX1BBVEh9L2AsXG4gIH07XG5cbiAgLy8gVXNlIGV4aXN0aW5nIGNvbmZpZyBpZiBhbnkuXG4gIGNvbmZpZy53ZWJwYWNrID0geyAuLi53ZWJwYWNrQ29uZmlnLCAuLi5jb25maWcud2VicGFjayB9O1xuICBjb25maWcud2VicGFja01pZGRsZXdhcmUgPSB7IC4uLndlYnBhY2tNaWRkbGV3YXJlQ29uZmlnLCAuLi5jb25maWcud2VicGFja01pZGRsZXdhcmUgfTtcblxuICAvLyBPdXIgY3VzdG9tIGNvbnRleHQgYW5kIGRlYnVnIGZpbGVzIGxpc3QgdGhlIHdlYnBhY2sgYnVuZGxlcyBkaXJlY3RseSBpbnN0ZWFkIG9mIHVzaW5nXG4gIC8vIHRoZSBrYXJtYSBmaWxlcyBhcnJheS5cbiAgY29uZmlnLmN1c3RvbUNvbnRleHRGaWxlID0gYCR7X19kaXJuYW1lfS9rYXJtYS1jb250ZXh0Lmh0bWxgO1xuICBjb25maWcuY3VzdG9tRGVidWdGaWxlID0gYCR7X19kaXJuYW1lfS9rYXJtYS1kZWJ1Zy5odG1sYDtcblxuICAvLyBBZGQgdGhlIHJlcXVlc3QgYmxvY2tlciBhbmQgdGhlIHdlYnBhY2sgc2VydmVyIGZhbGxiYWNrLlxuICBjb25maWcuYmVmb3JlTWlkZGxld2FyZSA9IGNvbmZpZy5iZWZvcmVNaWRkbGV3YXJlIHx8IFtdO1xuICBjb25maWcuYmVmb3JlTWlkZGxld2FyZS5wdXNoKCdAYW5ndWxhci1kZXZraXQvYnVpbGQtYW5ndWxhci0tYmxvY2tlcicpO1xuICBjb25maWcubWlkZGxld2FyZSA9IGNvbmZpZy5taWRkbGV3YXJlIHx8IFtdO1xuICBjb25maWcubWlkZGxld2FyZS5wdXNoKCdAYW5ndWxhci1kZXZraXQvYnVpbGQtYW5ndWxhci0tZmFsbGJhY2snKTtcblxuICBpZiAoY29uZmlnLnNpbmdsZVJ1bikge1xuICAgIC8vIFRoZXJlJ3Mgbm8gb3B0aW9uIHRvIHR1cm4gb2ZmIGZpbGUgd2F0Y2hpbmcgaW4gd2VicGFjay1kZXYtc2VydmVyLCBidXRcbiAgICAvLyB3ZSBjYW4gb3ZlcnJpZGUgdGhlIGZpbGUgd2F0Y2hlciBpbnN0ZWFkLlxuICAgIHdlYnBhY2tDb25maWcucGx1Z2lucy51bnNoaWZ0KHtcbiAgICAgIGFwcGx5OiAoY29tcGlsZXI6IGFueSkgPT4ge1xuICAgICAgICBjb21waWxlci5ob29rcy5hZnRlckVudmlyb25tZW50LnRhcCgna2FybWEnLCAoKSA9PiB7XG4gICAgICAgICAgY29tcGlsZXIud2F0Y2hGaWxlU3lzdGVtID0geyB3YXRjaDogKCkgPT4ge30gfTtcbiAgICAgICAgfSk7XG4gICAgICB9LFxuICAgIH0pO1xuICB9XG4gIC8vIEZpbGVzIG5lZWQgdG8gYmUgc2VydmVkIGZyb20gYSBjdXN0b20gcGF0aCBmb3IgS2FybWEuXG4gIHdlYnBhY2tDb25maWcub3V0cHV0LnBhdGggPSBgLyR7S0FSTUFfQVBQTElDQVRJT05fUEFUSH0vYDtcbiAgd2VicGFja0NvbmZpZy5vdXRwdXQucHVibGljUGF0aCA9IGAvJHtLQVJNQV9BUFBMSUNBVElPTl9QQVRIfS9gO1xuXG4gIGNvbnN0IGNvbXBpbGVyID0gd2VicGFjayh3ZWJwYWNrQ29uZmlnLCAoZXJyb3IsIHN0YXRzKSA9PiB7XG4gICAgaWYgKGVycm9yKSB7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG5cbiAgICBpZiAoc3RhdHM/Lmhhc0Vycm9ycygpKSB7XG4gICAgICAvLyBPbmx5IGdlbmVyYXRlIG5lZWRlZCBKU09OIHN0YXRzIGFuZCB3aGVuIG5lZWRlZC5cbiAgICAgIGNvbnN0IHN0YXRzSnNvbiA9IHN0YXRzPy50b0pzb24oe1xuICAgICAgICBhbGw6IGZhbHNlLFxuICAgICAgICBjaGlsZHJlbjogdHJ1ZSxcbiAgICAgICAgZXJyb3JzOiB0cnVlLFxuICAgICAgICB3YXJuaW5nczogdHJ1ZSxcbiAgICAgIH0pO1xuXG4gICAgICBsb2dnZXIuZXJyb3Ioc3RhdHNFcnJvcnNUb1N0cmluZyhzdGF0c0pzb24sIHsgY29sb3JzOiB0cnVlIH0pKTtcblxuICAgICAgaWYgKGNvbmZpZy5zaW5nbGVSdW4pIHtcbiAgICAgICAgLy8gTm90aWZ5IHBvdGVudGlhbCBsaXN0ZW5lcnMgb2YgdGhlIGNvbXBpbGUgZXJyb3IuXG4gICAgICAgIGVtaXR0ZXIuZW1pdCgnbG9hZF9lcnJvcicpO1xuICAgICAgfVxuXG4gICAgICAvLyBGaW5pc2ggS2FybWEgcnVuIGVhcmx5IGluIGNhc2Ugb2YgY29tcGlsYXRpb24gZXJyb3IuXG4gICAgICBlbWl0dGVyLmVtaXQoJ3J1bl9jb21wbGV0ZScsIFtdLCB7IGV4aXRDb2RlOiAxIH0pO1xuXG4gICAgICAvLyBFbWl0IGEgZmFpbHVyZSBidWlsZCBldmVudCBpZiB0aGVyZSBhcmUgY29tcGlsYXRpb24gZXJyb3JzLlxuICAgICAgZmFpbHVyZUNiKCk7XG4gICAgfVxuICB9KTtcblxuICBmdW5jdGlvbiBoYW5kbGVyKGNhbGxiYWNrPzogKCkgPT4gdm9pZCk6IHZvaWQge1xuICAgIGlzQmxvY2tlZCA9IHRydWU7XG4gICAgY2FsbGJhY2s/LigpO1xuICB9XG5cbiAgY29tcGlsZXIuaG9va3MuaW52YWxpZC50YXAoJ2thcm1hJywgKCkgPT4gaGFuZGxlcigpKTtcbiAgY29tcGlsZXIuaG9va3Mud2F0Y2hSdW4udGFwQXN5bmMoJ2thcm1hJywgKF86IGFueSwgY2FsbGJhY2s6ICgpID0+IHZvaWQpID0+IGhhbmRsZXIoY2FsbGJhY2spKTtcbiAgY29tcGlsZXIuaG9va3MucnVuLnRhcEFzeW5jKCdrYXJtYScsIChfOiBhbnksIGNhbGxiYWNrOiAoKSA9PiB2b2lkKSA9PiBoYW5kbGVyKGNhbGxiYWNrKSk7XG5cbiAgd2VicGFja01pZGRsZXdhcmUgPSB3ZWJwYWNrRGV2TWlkZGxld2FyZShjb21waWxlciwgd2VicGFja01pZGRsZXdhcmVDb25maWcpO1xuICBlbWl0dGVyLm9uKCdleGl0JywgKGRvbmU6IGFueSkgPT4ge1xuICAgIHdlYnBhY2tNaWRkbGV3YXJlLmNsb3NlKCk7XG4gICAgY29tcGlsZXIuY2xvc2UoKCkgPT4gZG9uZSgpKTtcbiAgfSk7XG5cbiAgZnVuY3Rpb24gdW5ibG9jaygpIHtcbiAgICBpc0Jsb2NrZWQgPSBmYWxzZTtcbiAgICBibG9ja2VkLmZvckVhY2goKGNiKSA9PiBjYigpKTtcbiAgICBibG9ja2VkID0gW107XG4gIH1cblxuICBsZXQgbGFzdENvbXBpbGF0aW9uSGFzaDogc3RyaW5nIHwgdW5kZWZpbmVkO1xuICBsZXQgaXNGaXJzdFJ1biA9IHRydWU7XG5cbiAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlKSA9PiB7XG4gICAgY29tcGlsZXIuaG9va3MuZG9uZS50YXAoJ2thcm1hJywgKHN0YXRzKSA9PiB7XG4gICAgICBpZiAoaXNGaXJzdFJ1bikge1xuICAgICAgICAvLyBUaGlzIGlzIG5lZWRlZCB0byBibG9jayBLYXJtYSBmcm9tIGxhdW5jaGluZyBicm93c2VycyBiZWZvcmUgV2VicGFjayB3cml0ZXMgdGhlIGFzc2V0cyBpbiBtZW1vcnkuXG4gICAgICAgIC8vIFNlZSB0aGUgYmVsb3c6XG4gICAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9rYXJtYS1ydW5uZXIva2FybWEtY2hyb21lLWxhdW5jaGVyL2lzc3Vlcy8xNTQjaXNzdWVjb21tZW50LTk4NjY2MTkzN1xuICAgICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci9hbmd1bGFyLWNsaS9pc3N1ZXMvMjI0OTVcbiAgICAgICAgaXNGaXJzdFJ1biA9IGZhbHNlO1xuICAgICAgICByZXNvbHZlKCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChzdGF0cy5oYXNFcnJvcnMoKSkge1xuICAgICAgICBsYXN0Q29tcGlsYXRpb25IYXNoID0gdW5kZWZpbmVkO1xuICAgICAgfSBlbHNlIGlmIChzdGF0cy5oYXNoICE9IGxhc3RDb21waWxhdGlvbkhhc2gpIHtcbiAgICAgICAgLy8gUmVmcmVzaCBrYXJtYSBvbmx5IHdoZW4gdGhlcmUgYXJlIG5vIHdlYnBhY2sgZXJyb3JzLCBhbmQgaWYgdGhlIGNvbXBpbGF0aW9uIGNoYW5nZWQuXG4gICAgICAgIGxhc3RDb21waWxhdGlvbkhhc2ggPSBzdGF0cy5oYXNoO1xuICAgICAgICBlbWl0dGVyLnJlZnJlc2hGaWxlcygpO1xuICAgICAgfVxuXG4gICAgICB1bmJsb2NrKCk7XG4gICAgfSk7XG4gIH0pO1xufTtcblxuaW5pdC4kaW5qZWN0ID0gWydjb25maWcnLCAnZW1pdHRlciddO1xuXG4vLyBCbG9jayByZXF1ZXN0cyB1bnRpbCB0aGUgV2VicGFjayBjb21waWxhdGlvbiBpcyBkb25lLlxuZnVuY3Rpb24gcmVxdWVzdEJsb2NrZXIoKSB7XG4gIHJldHVybiBmdW5jdGlvbiAoX3JlcXVlc3Q6IGFueSwgX3Jlc3BvbnNlOiBhbnksIG5leHQ6ICgpID0+IHZvaWQpIHtcbiAgICBpZiAoaXNCbG9ja2VkKSB7XG4gICAgICBibG9ja2VkLnB1c2gobmV4dCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5leHQoKTtcbiAgICB9XG4gIH07XG59XG5cbi8vIENvcGllZCBmcm9tIFwia2FybWEtamFzbWluZS1kaWZmLXJlcG9ydGVyXCIgc291cmNlIGNvZGU6XG4vLyBJbiBjYXNlLCB3aGVuIG11bHRpcGxlIHJlcG9ydGVycyBhcmUgdXNlZCBpbiBjb25qdW5jdGlvblxuLy8gd2l0aCBpbml0U291cmNlbWFwUmVwb3J0ZXIsIHRoZXkgYm90aCB3aWxsIHNob3cgcmVwZXRpdGl2ZSBsb2dcbi8vIG1lc3NhZ2VzIHdoZW4gZGlzcGxheWluZyBldmVyeXRoaW5nIHRoYXQgc3VwcG9zZWQgdG8gd3JpdGUgdG8gdGVybWluYWwuXG4vLyBTbyBqdXN0IHN1cHByZXNzIGFueSBsb2dzIGZyb20gaW5pdFNvdXJjZW1hcFJlcG9ydGVyIGJ5IGRvaW5nIG5vdGhpbmcgb25cbi8vIGJyb3dzZXIgbG9nLCBiZWNhdXNlIGl0IGlzIGFuIHV0aWxpdHkgcmVwb3J0ZXIsXG4vLyB1bmxlc3MgaXQncyBhbG9uZSBpbiB0aGUgXCJyZXBvcnRlcnNcIiBvcHRpb24gYW5kIGJhc2UgcmVwb3J0ZXIgaXMgdXNlZC5cbmZ1bmN0aW9uIG11dGVEdXBsaWNhdGVSZXBvcnRlckxvZ2dpbmcoY29udGV4dDogYW55LCBjb25maWc6IGFueSkge1xuICBjb250ZXh0LndyaXRlQ29tbW9uTXNnID0gKCkgPT4ge307XG4gIGNvbnN0IHJlcG9ydGVyTmFtZSA9ICdAYW5ndWxhci9jbGknO1xuICBjb25zdCBoYXNUcmFpbGluZ1JlcG9ydGVycyA9IGNvbmZpZy5yZXBvcnRlcnMuc2xpY2UoLTEpLnBvcCgpICE9PSByZXBvcnRlck5hbWU7XG5cbiAgaWYgKGhhc1RyYWlsaW5nUmVwb3J0ZXJzKSB7XG4gICAgY29udGV4dC53cml0ZUNvbW1vbk1zZyA9ICgpID0+IHt9O1xuICB9XG59XG5cbi8vIEVtaXRzIGJ1aWxkZXIgZXZlbnRzLlxuY29uc3QgZXZlbnRSZXBvcnRlcjogYW55ID0gZnVuY3Rpb24gKHRoaXM6IGFueSwgYmFzZVJlcG9ydGVyRGVjb3JhdG9yOiBhbnksIGNvbmZpZzogYW55KSB7XG4gIGJhc2VSZXBvcnRlckRlY29yYXRvcih0aGlzKTtcblxuICBtdXRlRHVwbGljYXRlUmVwb3J0ZXJMb2dnaW5nKHRoaXMsIGNvbmZpZyk7XG5cbiAgdGhpcy5vblJ1bkNvbXBsZXRlID0gZnVuY3Rpb24gKF9icm93c2VyczogYW55LCByZXN1bHRzOiBhbnkpIHtcbiAgICBpZiAocmVzdWx0cy5leGl0Q29kZSA9PT0gMCkge1xuICAgICAgc3VjY2Vzc0NiKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGZhaWx1cmVDYigpO1xuICAgIH1cbiAgfTtcblxuICAvLyBhdm9pZCBkdXBsaWNhdGUgZmFpbHVyZSBtZXNzYWdlXG4gIHRoaXMuc3BlY0ZhaWx1cmUgPSAoKSA9PiB7fTtcbn07XG5cbmV2ZW50UmVwb3J0ZXIuJGluamVjdCA9IFsnYmFzZVJlcG9ydGVyRGVjb3JhdG9yJywgJ2NvbmZpZyddO1xuXG4vLyBTdHJpcCB0aGUgc2VydmVyIGFkZHJlc3MgYW5kIHdlYnBhY2sgc2NoZW1lICh3ZWJwYWNrOi8vKSBmcm9tIGVycm9yIGxvZy5cbmNvbnN0IHNvdXJjZU1hcFJlcG9ydGVyOiBhbnkgPSBmdW5jdGlvbiAodGhpczogYW55LCBiYXNlUmVwb3J0ZXJEZWNvcmF0b3I6IGFueSwgY29uZmlnOiBhbnkpIHtcbiAgYmFzZVJlcG9ydGVyRGVjb3JhdG9yKHRoaXMpO1xuICBtdXRlRHVwbGljYXRlUmVwb3J0ZXJMb2dnaW5nKHRoaXMsIGNvbmZpZyk7XG5cbiAgY29uc3QgdXJsUmVnZXhwID0gL2h0dHA6XFwvXFwvbG9jYWxob3N0OlxcZCtcXC9fa2FybWFfd2VicGFja19cXC8od2VicGFjazpcXC8pPy9naTtcblxuICB0aGlzLm9uU3BlY0NvbXBsZXRlID0gZnVuY3Rpb24gKF9icm93c2VyOiBhbnksIHJlc3VsdDogYW55KSB7XG4gICAgaWYgKCFyZXN1bHQuc3VjY2Vzcykge1xuICAgICAgcmVzdWx0LmxvZyA9IHJlc3VsdC5sb2cubWFwKChsOiBzdHJpbmcpID0+IGwucmVwbGFjZSh1cmxSZWdleHAsICcnKSk7XG4gICAgfVxuICB9O1xuXG4gIC8vIGF2b2lkIGR1cGxpY2F0ZSBjb21wbGV0ZSBtZXNzYWdlXG4gIHRoaXMub25SdW5Db21wbGV0ZSA9ICgpID0+IHt9O1xuXG4gIC8vIGF2b2lkIGR1cGxpY2F0ZSBmYWlsdXJlIG1lc3NhZ2VcbiAgdGhpcy5zcGVjRmFpbHVyZSA9ICgpID0+IHt9O1xufTtcblxuc291cmNlTWFwUmVwb3J0ZXIuJGluamVjdCA9IFsnYmFzZVJlcG9ydGVyRGVjb3JhdG9yJywgJ2NvbmZpZyddO1xuXG4vLyBXaGVuIGEgcmVxdWVzdCBpcyBub3QgZm91bmQgaW4gdGhlIGthcm1hIHNlcnZlciwgdHJ5IGxvb2tpbmcgZm9yIGl0IGZyb20gdGhlIHdlYnBhY2sgc2VydmVyIHJvb3QuXG5mdW5jdGlvbiBmYWxsYmFja01pZGRsZXdhcmUoKSB7XG4gIHJldHVybiBmdW5jdGlvbiAocmVxdWVzdDogaHR0cC5JbmNvbWluZ01lc3NhZ2UsIHJlc3BvbnNlOiBodHRwLlNlcnZlclJlc3BvbnNlLCBuZXh0OiAoKSA9PiB2b2lkKSB7XG4gICAgaWYgKHdlYnBhY2tNaWRkbGV3YXJlKSB7XG4gICAgICBpZiAocmVxdWVzdC51cmwgJiYgIW5ldyBSZWdFeHAoYFxcXFwvJHtLQVJNQV9BUFBMSUNBVElPTl9QQVRIfVxcXFwvLipgKS50ZXN0KHJlcXVlc3QudXJsKSkge1xuICAgICAgICByZXF1ZXN0LnVybCA9ICcvJyArIEtBUk1BX0FQUExJQ0FUSU9OX1BBVEggKyByZXF1ZXN0LnVybDtcbiAgICAgIH1cbiAgICAgIHdlYnBhY2tNaWRkbGV3YXJlKHJlcXVlc3QsIHJlc3BvbnNlLCAoKSA9PiB7XG4gICAgICAgIGNvbnN0IGFsd2F5c1NlcnZlID0gW1xuICAgICAgICAgIGAvJHtLQVJNQV9BUFBMSUNBVElPTl9QQVRIfS9ydW50aW1lLmpzYCxcbiAgICAgICAgICBgLyR7S0FSTUFfQVBQTElDQVRJT05fUEFUSH0vcG9seWZpbGxzLmpzYCxcbiAgICAgICAgICBgLyR7S0FSTUFfQVBQTElDQVRJT05fUEFUSH0vc2NyaXB0cy5qc2AsXG4gICAgICAgICAgYC8ke0tBUk1BX0FQUExJQ0FUSU9OX1BBVEh9L3N0eWxlcy5jc3NgLFxuICAgICAgICAgIGAvJHtLQVJNQV9BUFBMSUNBVElPTl9QQVRIfS92ZW5kb3IuanNgLFxuICAgICAgICBdO1xuICAgICAgICBpZiAocmVxdWVzdC51cmwgJiYgYWx3YXlzU2VydmUuaW5jbHVkZXMocmVxdWVzdC51cmwpKSB7XG4gICAgICAgICAgcmVzcG9uc2Uuc3RhdHVzQ29kZSA9IDIwMDtcbiAgICAgICAgICByZXNwb25zZS5lbmQoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBuZXh0KCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBuZXh0KCk7XG4gICAgfVxuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgJ2ZyYW1ld29yazpAYW5ndWxhci1kZXZraXQvYnVpbGQtYW5ndWxhcic6IFsnZmFjdG9yeScsIGluaXRdLFxuICAncmVwb3J0ZXI6QGFuZ3VsYXItZGV2a2l0L2J1aWxkLWFuZ3VsYXItLXNvdXJjZW1hcC1yZXBvcnRlcic6IFsndHlwZScsIHNvdXJjZU1hcFJlcG9ydGVyXSxcbiAgJ3JlcG9ydGVyOkBhbmd1bGFyLWRldmtpdC9idWlsZC1hbmd1bGFyLS1ldmVudC1yZXBvcnRlcic6IFsndHlwZScsIGV2ZW50UmVwb3J0ZXJdLFxuICAnbWlkZGxld2FyZTpAYW5ndWxhci1kZXZraXQvYnVpbGQtYW5ndWxhci0tYmxvY2tlcic6IFsnZmFjdG9yeScsIHJlcXVlc3RCbG9ja2VyXSxcbiAgJ21pZGRsZXdhcmU6QGFuZ3VsYXItZGV2a2l0L2J1aWxkLWFuZ3VsYXItLWZhbGxiYWNrJzogWydmYWN0b3J5JywgZmFsbGJhY2tNaWRkbGV3YXJlXSxcbn07XG4iXX0=