// @ts-nocheck
/*
    MIT License http://www.opensource.org/licenses/mit-license.php
    Author Tobias Koppers @sokra
*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgressPlugin = void 0;
const core_1 = require("@rspack/core");
// const createSchemaValidation = require("./util/create-schema-validation");
// const { contextify } = require("./util/identifier");
/** @typedef {import("../declarations/plugins/ProgressPlugin").HandlerFunction} HandlerFunction */
/** @typedef {import("../declarations/plugins/ProgressPlugin").ProgressPluginArgument} ProgressPluginArgument */
/** @typedef {import("../declarations/plugins/ProgressPlugin").ProgressPluginOptions} ProgressPluginOptions */
/*const validate = createSchemaValidation(
  require("../schemas/plugins/ProgressPlugin.check.js"),
  () => require("../schemas/plugins/ProgressPlugin.json"),
  {
    name: "Progress Plugin",
    baseDataPath: "options"
  }
);*/
const validate = (options) => { };
const median3 = (a, b, c) => {
    return a + b + c - Math.max(a, b, c) - Math.min(a, b, c);
};
const createDefaultHandler = (profile, logger) => {
    /** @type {{ value: string, time: number }[]} */
    const lastStateInfo = [];
    const defaultHandler = (percentage, msg, ...args) => {
        if (profile) {
            if (percentage === 0) {
                lastStateInfo.length = 0;
            }
            const fullState = [msg, ...args];
            const state = fullState.map((s) => s.replace(/\d+\/\d+ /g, ''));
            const now = Date.now();
            const len = Math.max(state.length, lastStateInfo.length);
            for (let i = len; i >= 0; i--) {
                const stateItem = i < state.length ? state[i] : undefined;
                const lastStateItem = i < lastStateInfo.length ? lastStateInfo[i] : undefined;
                if (lastStateItem) {
                    if (stateItem !== lastStateItem.value) {
                        const diff = now - lastStateItem.time;
                        if (lastStateItem.value) {
                            let reportState = lastStateItem.value;
                            if (i > 0) {
                                reportState = lastStateInfo[i - 1].value + ' > ' + reportState;
                            }
                            const stateMsg = `${' | '.repeat(i)}${diff} ms ${reportState}`;
                            const d = diff;
                            // This depends on timing so we ignore it for coverage
                            /* istanbul ignore next */
                            {
                                if (d > 10000) {
                                    logger.error(stateMsg);
                                }
                                else if (d > 1000) {
                                    logger.warn(stateMsg);
                                }
                                else if (d > 10) {
                                    logger.info(stateMsg);
                                }
                                else if (d > 5) {
                                    logger.log(stateMsg);
                                }
                                else {
                                    logger.debug(stateMsg);
                                }
                            }
                        }
                        if (stateItem === undefined) {
                            lastStateInfo.length = i;
                        }
                        else {
                            lastStateItem.value = stateItem;
                            lastStateItem.time = now;
                            lastStateInfo.length = i + 1;
                        }
                    }
                }
                else {
                    lastStateInfo[i] = {
                        value: stateItem,
                        time: now,
                    };
                }
            }
        }
        logger.status(`${Math.floor(percentage * 100)}%`, msg, ...args);
        if (percentage === 1 || (!msg && args.length === 0))
            logger.status();
    };
    return defaultHandler;
};
/**
 * @callback ReportProgress
 * @param {number} p
 * @param {...string} [args]
 * @returns {void}
 */
/** @type {WeakMap<Compiler,ReportProgress>} */
const progressReporters = new WeakMap();
class ProgressPlugin {
    /**
     * @param {Compiler} compiler the current compiler
     * @returns {ReportProgress} a progress reporter, if any
     */
    static getReporter(compiler) {
        return progressReporters.get(compiler);
    }
    /**
     * @param {ProgressPluginArgument} options options
     */
    constructor(options = {}) {
        if (typeof options === 'function') {
            options = {
                handler: options,
            };
        }
        validate(options);
        options = { ...ProgressPlugin.defaultOptions, ...options };
        this.profile = options.profile;
        this.handler = options.handler;
        this.modulesCount = options.modulesCount;
        this.dependenciesCount = options.dependenciesCount;
        this.showEntries = options.entries;
        this.showModules = options.modules;
        this.showDependencies = options.dependencies;
        this.showActiveModules = options.activeModules;
        this.percentBy = options.percentBy;
    }
    /**
     * @param {Compiler | MultiCompiler} compiler webpack compiler
     * @returns {void}
     */
    apply(compiler) {
        const handler = this.handler ||
            createDefaultHandler(this.profile, compiler.getInfrastructureLogger('webpack.Progress'));
        if (compiler instanceof core_1.MultiCompiler) {
            this._applyOnMultiCompiler(compiler, handler);
        }
        else if (compiler instanceof core_1.Compiler) {
            this._applyOnCompiler(compiler, handler);
        }
    }
    /**
     * @param {MultiCompiler} compiler webpack multi-compiler
     * @param {HandlerFunction} handler function that executes for every progress step
     * @returns {void}
     */
    _applyOnMultiCompiler(compiler, handler) {
        const states = compiler.compilers.map(() => /** @type {[number, ...string[]]} */ [0]);
        compiler.compilers.forEach((compiler, idx) => {
            new ProgressPlugin((p, msg, ...args) => {
                states[idx] = [p, msg, ...args];
                let sum = 0;
                for (const [p] of states)
                    sum += p;
                handler(sum / states.length, `[${idx}] ${msg}`, ...args);
            }).apply(compiler);
        });
    }
    /**
     * @param {Compiler} compiler webpack compiler
     * @param {HandlerFunction} handler function that executes for every progress step
     * @returns {void}
     */
    _applyOnCompiler(compiler, handler) {
        const showEntries = this.showEntries;
        const showModules = this.showModules;
        const showDependencies = this.showDependencies;
        const showActiveModules = this.showActiveModules;
        let lastActiveModule = '';
        let currentLoader = '';
        let lastModulesCount = 0;
        let lastDependenciesCount = 0;
        let lastEntriesCount = 0;
        let modulesCount = 0;
        let dependenciesCount = 0;
        let entriesCount = 1;
        let doneModules = 0;
        let doneDependencies = 0;
        let doneEntries = 0;
        const activeModules = new Set();
        let lastUpdate = 0;
        const updateThrottled = () => {
            if (lastUpdate + 500 < Date.now())
                update();
        };
        const update = () => {
            /** @type {string[]} */
            const items = [];
            const percentByModules = doneModules / Math.max(lastModulesCount || this.modulesCount || 1, modulesCount);
            const percentByEntries = doneEntries / Math.max(lastEntriesCount || this.dependenciesCount || 1, entriesCount);
            const percentByDependencies = doneDependencies / Math.max(lastDependenciesCount || 1, dependenciesCount);
            let percentageFactor;
            switch (this.percentBy) {
                case 'entries':
                    percentageFactor = percentByEntries;
                    break;
                case 'dependencies':
                    percentageFactor = percentByDependencies;
                    break;
                case 'modules':
                    percentageFactor = percentByModules;
                    break;
                default:
                    percentageFactor = median3(percentByModules, percentByEntries, percentByDependencies);
            }
            const percentage = 0.1 + percentageFactor * 0.55;
            if (currentLoader) {
                items.push(`import loader ${contextify(compiler.context, currentLoader, compiler.root)}`);
            }
            else {
                const statItems = [];
                if (showEntries) {
                    statItems.push(`${doneEntries}/${entriesCount} entries`);
                }
                if (showDependencies) {
                    statItems.push(`${doneDependencies}/${dependenciesCount} dependencies`);
                }
                if (showModules) {
                    statItems.push(`${doneModules}/${modulesCount} modules`);
                }
                if (showActiveModules) {
                    statItems.push(`${activeModules.size} active`);
                }
                if (statItems.length > 0) {
                    items.push(statItems.join(' '));
                }
                if (showActiveModules) {
                    items.push(lastActiveModule);
                }
            }
            handler(percentage, 'building', ...items);
            lastUpdate = Date.now();
        };
        const factorizeAdd = () => {
            dependenciesCount++;
            if (dependenciesCount < 50 || dependenciesCount % 100 === 0)
                updateThrottled();
        };
        const factorizeDone = () => {
            doneDependencies++;
            if (doneDependencies < 50 || doneDependencies % 100 === 0)
                updateThrottled();
        };
        const moduleAdd = () => {
            modulesCount++;
            if (modulesCount < 50 || modulesCount % 100 === 0)
                updateThrottled();
        };
        // only used when showActiveModules is set
        const moduleBuild = (module) => {
            const ident = module.identifier();
            if (ident) {
                activeModules.add(ident);
                lastActiveModule = ident;
                update();
            }
        };
        const entryAdd = (entry, options) => {
            entriesCount++;
            if (entriesCount < 5 || entriesCount % 10 === 0)
                updateThrottled();
        };
        const moduleDone = (module) => {
            doneModules++;
            if (showActiveModules) {
                const ident = module.identifier();
                if (ident) {
                    activeModules.delete(ident);
                    if (lastActiveModule === ident) {
                        lastActiveModule = '';
                        for (const m of activeModules) {
                            lastActiveModule = m;
                        }
                        update();
                        return;
                    }
                }
            }
            if (doneModules < 50 || doneModules % 100 === 0)
                updateThrottled();
        };
        const entryDone = (entry, options) => {
            doneEntries++;
            update();
        };
        const cache = compiler.getCache('ProgressPlugin').getItemCache('counts', null);
        let cacheGetPromise;
        compiler.hooks.beforeCompile.tap('ProgressPlugin', () => {
            if (!cacheGetPromise) {
                cacheGetPromise = cache.getPromise().then((data) => {
                    if (data) {
                        lastModulesCount = lastModulesCount || data.modulesCount;
                        lastDependenciesCount = lastDependenciesCount || data.dependenciesCount;
                    }
                    return data;
                }, (err) => {
                    // Ignore error
                });
            }
        });
        compiler.hooks.afterCompile.tapPromise('ProgressPlugin', (compilation) => {
            if (compilation.compiler.isChild())
                return Promise.resolve();
            return cacheGetPromise.then(async (oldData) => {
                if (!oldData ||
                    oldData.modulesCount !== modulesCount ||
                    oldData.dependenciesCount !== dependenciesCount) {
                    await cache.storePromise({ modulesCount, dependenciesCount });
                }
            });
        });
        compiler.hooks.compilation.tap('ProgressPlugin', (compilation) => {
            if (compilation.compiler.isChild())
                return;
            lastModulesCount = modulesCount;
            lastEntriesCount = entriesCount;
            lastDependenciesCount = dependenciesCount;
            modulesCount = dependenciesCount = entriesCount = 0;
            doneModules = doneDependencies = doneEntries = 0;
            compilation.factorizeQueue.hooks.added.tap('ProgressPlugin', factorizeAdd);
            compilation.factorizeQueue.hooks.result.tap('ProgressPlugin', factorizeDone);
            compilation.addModuleQueue.hooks.added.tap('ProgressPlugin', moduleAdd);
            compilation.processDependenciesQueue.hooks.result.tap('ProgressPlugin', moduleDone);
            if (showActiveModules) {
                compilation.hooks.buildModule.tap('ProgressPlugin', moduleBuild);
            }
            compilation.hooks.addEntry.tap('ProgressPlugin', entryAdd);
            compilation.hooks.failedEntry.tap('ProgressPlugin', entryDone);
            compilation.hooks.succeedEntry.tap('ProgressPlugin', entryDone);
            // avoid dynamic require if bundled with webpack
            // @ts-expect-error
            if (typeof __webpack_require__ !== 'function') {
                const requiredLoaders = new Set();
                core_1.NormalModule.getCompilationHooks(compilation).beforeLoaders.tap('ProgressPlugin', (loaders) => {
                    for (const loader of loaders) {
                        if (loader.type !== 'module' && !requiredLoaders.has(loader.loader)) {
                            requiredLoaders.add(loader.loader);
                            currentLoader = loader.loader;
                            update();
                            require(loader.loader);
                        }
                    }
                    if (currentLoader) {
                        currentLoader = '';
                        update();
                    }
                });
            }
            const hooks = {
                finishModules: 'finish module graph',
                seal: 'plugins',
                optimizeDependencies: 'dependencies optimization',
                afterOptimizeDependencies: 'after dependencies optimization',
                beforeChunks: 'chunk graph',
                afterChunks: 'after chunk graph',
                optimize: 'optimizing',
                optimizeModules: 'module optimization',
                afterOptimizeModules: 'after module optimization',
                optimizeChunks: 'chunk optimization',
                afterOptimizeChunks: 'after chunk optimization',
                optimizeTree: 'module and chunk tree optimization',
                afterOptimizeTree: 'after module and chunk tree optimization',
                optimizeChunkModules: 'chunk modules optimization',
                afterOptimizeChunkModules: 'after chunk modules optimization',
                reviveModules: 'module reviving',
                beforeModuleIds: 'before module ids',
                moduleIds: 'module ids',
                optimizeModuleIds: 'module id optimization',
                afterOptimizeModuleIds: 'module id optimization',
                reviveChunks: 'chunk reviving',
                beforeChunkIds: 'before chunk ids',
                chunkIds: 'chunk ids',
                optimizeChunkIds: 'chunk id optimization',
                afterOptimizeChunkIds: 'after chunk id optimization',
                recordModules: 'record modules',
                recordChunks: 'record chunks',
                beforeModuleHash: 'module hashing',
                beforeCodeGeneration: 'code generation',
                beforeRuntimeRequirements: 'runtime requirements',
                beforeHash: 'hashing',
                afterHash: 'after hashing',
                recordHash: 'record hash',
                beforeModuleAssets: 'module assets processing',
                beforeChunkAssets: 'chunk assets processing',
                processAssets: 'asset processing',
                afterProcessAssets: 'after asset optimization',
                record: 'recording',
                afterSeal: 'after seal',
            };
            const numberOfHooks = Object.keys(hooks).length;
            Object.keys(hooks).forEach((name, idx) => {
                const title = hooks[name];
                const percentage = (idx / numberOfHooks) * 0.25 + 0.7;
                compilation.hooks[name].intercept({
                    name: 'ProgressPlugin',
                    call() {
                        handler(percentage, 'sealing', title);
                    },
                    done() {
                        progressReporters.set(compiler, undefined);
                        handler(percentage, 'sealing', title);
                    },
                    result() {
                        handler(percentage, 'sealing', title);
                    },
                    error() {
                        handler(percentage, 'sealing', title);
                    },
                    tap(tap) {
                        // p is percentage from 0 to 1
                        // args is any number of messages in a hierarchical matter
                        progressReporters.set(compilation.compiler, (p, ...args) => {
                            handler(percentage, 'sealing', title, tap.name, ...args);
                        });
                        handler(percentage, 'sealing', title, tap.name);
                    },
                });
            });
        });
        compiler.hooks.make.intercept({
            name: 'ProgressPlugin',
            call() {
                handler(0.1, 'building');
            },
            done() {
                handler(0.65, 'building');
            },
        });
        const interceptHook = (hook, progress, category, name) => {
            hook.intercept({
                name: 'ProgressPlugin',
                call() {
                    handler(progress, category, name);
                },
                done() {
                    progressReporters.set(compiler, undefined);
                    handler(progress, category, name);
                },
                result() {
                    handler(progress, category, name);
                },
                error() {
                    handler(progress, category, name);
                },
                tap(tap) {
                    progressReporters.set(compiler, (p, ...args) => {
                        handler(progress, category, name, tap.name, ...args);
                    });
                    handler(progress, category, name, tap.name);
                },
            });
        };
        compiler.cache.hooks.endIdle.intercept({
            name: 'ProgressPlugin',
            call() {
                handler(0, '');
            },
        });
        interceptHook(compiler.cache.hooks.endIdle, 0.01, 'cache', 'end idle');
        compiler.hooks.beforeRun.intercept({
            name: 'ProgressPlugin',
            call() {
                handler(0, '');
            },
        });
        interceptHook(compiler.hooks.beforeRun, 0.01, 'setup', 'before run');
        interceptHook(compiler.hooks.run, 0.02, 'setup', 'run');
        interceptHook(compiler.hooks.watchRun, 0.03, 'setup', 'watch run');
        interceptHook(compiler.hooks.normalModuleFactory, 0.04, 'setup', 'normal module factory');
        interceptHook(compiler.hooks.contextModuleFactory, 0.05, 'setup', 'context module factory');
        interceptHook(compiler.hooks.beforeCompile, 0.06, 'setup', 'before compile');
        interceptHook(compiler.hooks.compile, 0.07, 'setup', 'compile');
        interceptHook(compiler.hooks.thisCompilation, 0.08, 'setup', 'compilation');
        interceptHook(compiler.hooks.compilation, 0.09, 'setup', 'compilation');
        interceptHook(compiler.hooks.finishMake, 0.69, 'building', 'finish');
        interceptHook(compiler.hooks.emit, 0.95, 'emitting', 'emit');
        interceptHook(compiler.hooks.afterEmit, 0.98, 'emitting', 'after emit');
        interceptHook(compiler.hooks.done, 0.99, 'done', 'plugins');
        compiler.hooks.done.intercept({
            name: 'ProgressPlugin',
            done() {
                handler(0.99, '');
            },
        });
        interceptHook(compiler.cache.hooks.storeBuildDependencies, 0.99, 'cache', 'store build dependencies');
        interceptHook(compiler.cache.hooks.shutdown, 0.99, 'cache', 'shutdown');
        interceptHook(compiler.cache.hooks.beginIdle, 0.99, 'cache', 'begin idle');
        interceptHook(compiler.hooks.watchClose, 0.99, 'end', 'closing watch compilation');
        compiler.cache.hooks.beginIdle.intercept({
            name: 'ProgressPlugin',
            done() {
                handler(1, '');
            },
        });
        compiler.cache.hooks.shutdown.intercept({
            name: 'ProgressPlugin',
            done() {
                handler(1, '');
            },
        });
    }
}
exports.ProgressPlugin = ProgressPlugin;
ProgressPlugin.defaultOptions = {
    profile: false,
    modulesCount: 5000,
    dependenciesCount: 10000,
    modules: true,
    dependencies: true,
    activeModules: false,
    entries: true,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2VicGFjay1wcm9ncmVzcy1wbHVnaW4uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy9idWlsZGVycy9icm93c2VyLXJzcGFjay9wbHVnaW5zL3dlYnBhY2svd2VicGFjay1wcm9ncmVzcy1wbHVnaW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsY0FBYztBQUNkOzs7RUFHRTtBQUVGLFlBQVksQ0FBQzs7O0FBRWIsdUNBQXFFO0FBQ3JFLDZFQUE2RTtBQUM3RSx1REFBdUQ7QUFFdkQsa0dBQWtHO0FBQ2xHLGdIQUFnSDtBQUNoSCw4R0FBOEc7QUFFOUc7Ozs7Ozs7SUFPSTtBQUVKLE1BQU0sUUFBUSxHQUFHLENBQUMsT0FBTyxFQUFFLEVBQUUsR0FBRSxDQUFDLENBQUM7QUFFakMsTUFBTSxPQUFPLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO0lBQzFCLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUMzRCxDQUFDLENBQUM7QUFFRixNQUFNLG9CQUFvQixHQUFHLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO0lBQy9DLGdEQUFnRDtJQUNoRCxNQUFNLGFBQWEsR0FBRyxFQUFFLENBQUM7SUFFekIsTUFBTSxjQUFjLEdBQUcsQ0FBQyxVQUFVLEVBQUUsR0FBRyxFQUFFLEdBQUcsSUFBSSxFQUFFLEVBQUU7UUFDbEQsSUFBSSxPQUFPLEVBQUU7WUFDWCxJQUFJLFVBQVUsS0FBSyxDQUFDLEVBQUU7Z0JBQ3BCLGFBQWEsQ0FBQyxNQUFNLEdBQUcs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RixDQUFDLENBQUM7UUFDSCxRQUFRLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDO1lBQ3RDLElBQUksRUFBRSxnQkFBZ0I7WUFDdEIsSUFBSTtnQkFDRixPQUFPLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ2pCLENBQUM7U0FDRixDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUF0YkQsd0NBc2JDO0FBRUQsY0FBYyxDQUFDLGNBQWMsR0FBRztJQUM5QixPQUFPLEVBQUUsS0FBSztJQUNkLFlBQVksRUFBRSxJQUFJO0lBQ2xCLGlCQUFpQixFQUFFLEtBQUs7SUFDeEIsT0FBTyxFQUFFLElBQUk7SUFDYixZQUFZLEVBQUUsSUFBSTtJQUNsQixhQUFhLEVBQUUsS0FBSztJQUNwQixPQUFPLEVBQUUsSUFBSTtDQUNkLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBAdHMtbm9jaGVja1xuLypcblx0TUlUIExpY2Vuc2UgaHR0cDovL3d3dy5vcGVuc291cmNlLm9yZy9saWNlbnNlcy9taXQtbGljZW5zZS5waHBcblx0QXV0aG9yIFRvYmlhcyBLb3BwZXJzIEBzb2tyYVxuKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgeyBDb21waWxlciwgTXVsdGlDb21waWxlciwgTm9ybWFsTW9kdWxlIH0gZnJvbSAnQHJzcGFjay9jb3JlJztcbi8vIGNvbnN0IGNyZWF0ZVNjaGVtYVZhbGlkYXRpb24gPSByZXF1aXJlKFwiLi91dGlsL2NyZWF0ZS1zY2hlbWEtdmFsaWRhdGlvblwiKTtcbi8vIGNvbnN0IHsgY29udGV4dGlmeSB9ID0gcmVxdWlyZShcIi4vdXRpbC9pZGVudGlmaWVyXCIpO1xuXG4vKiogQHR5cGVkZWYge2ltcG9ydChcIi4uL2RlY2xhcmF0aW9ucy9wbHVnaW5zL1Byb2dyZXNzUGx1Z2luXCIpLkhhbmRsZXJGdW5jdGlvbn0gSGFuZGxlckZ1bmN0aW9uICovXG4vKiogQHR5cGVkZWYge2ltcG9ydChcIi4uL2RlY2xhcmF0aW9ucy9wbHVnaW5zL1Byb2dyZXNzUGx1Z2luXCIpLlByb2dyZXNzUGx1Z2luQXJndW1lbnR9IFByb2dyZXNzUGx1Z2luQXJndW1lbnQgKi9cbi8qKiBAdHlwZWRlZiB7aW1wb3J0KFwiLi4vZGVjbGFyYXRpb25zL3BsdWdpbnMvUHJvZ3Jlc3NQbHVnaW5cIikuUHJvZ3Jlc3NQbHVnaW5PcHRpb25zfSBQcm9ncmVzc1BsdWdpbk9wdGlvbnMgKi9cblxuLypjb25zdCB2YWxpZGF0ZSA9IGNyZWF0ZVNjaGVtYVZhbGlkYXRpb24oXG4gIHJlcXVpcmUoXCIuLi9zY2hlbWFzL3BsdWdpbnMvUHJvZ3Jlc3NQbHVnaW4uY2hlY2suanNcIiksXG4gICgpID0+IHJlcXVpcmUoXCIuLi9zY2hlbWFzL3BsdWdpbnMvUHJvZ3Jlc3NQbHVnaW4uanNvblwiKSxcbiAge1xuICAgIG5hbWU6IFwiUHJvZ3Jlc3MgUGx1Z2luXCIsXG4gICAgYmFzZURhdGFQYXRoOiBcIm9wdGlvbnNcIlxuICB9XG4pOyovXG5cbmNvbnN0IHZhbGlkYXRlID0gKG9wdGlvbnMpID0+IHt9O1xuXG5jb25zdCBtZWRpYW4zID0gKGEsIGIsIGMpID0+IHtcbiAgcmV0dXJuIGEgKyBiICsgYyAtIE1hdGgubWF4KGEsIGIsIGMpIC0gTWF0aC5taW4oYSwgYiwgYyk7XG59O1xuXG5jb25zdCBjcmVhdGVEZWZhdWx0SGFuZGxlciA9IChwcm9maWxlLCBsb2dnZXIpID0+IHtcbiAgLyoqIEB0eXBlIHt7IHZhbHVlOiBzdHJpbmcsIHRpbWU6IG51bWJlciB9W119ICovXG4gIGNvbnN0IGxhc3RTdGF0ZUluZm8gPSBbXTtcblxuICBjb25zdCBkZWZhdWx0SGFuZGxlciA9IChwZXJjZW50YWdlLCBtc2csIC4uLmFyZ3MpID0+IHtcbiAgICBpZiAocHJvZmlsZSkge1xuICAgICAgaWYgKHBlcmNlbnRhZ2UgPT09IDApIHtcbiAgICAgICAgbGFzdFN0YXRlSW5mby5sZW5ndGggPSAwO1xuICAgICAgfVxuICAgICAgY29uc3QgZnVsbFN0YXRlID0gW21zZywgLi4uYXJnc107XG4gICAgICBjb25zdCBzdGF0ZSA9IGZ1bGxTdGF0ZS5tYXAoKHMpID0+IHMucmVwbGFjZSgvXFxkK1xcL1xcZCsgL2csICcnKSk7XG4gICAgICBjb25zdCBub3cgPSBEYXRlLm5vdygpO1xuICAgICAgY29uc3QgbGVuID0gTWF0aC5tYXgoc3RhdGUubGVuZ3RoLCBsYXN0U3RhdGVJbmZvLmxlbmd0aCk7XG4gICAgICBmb3IgKGxldCBpID0gbGVuOyBpID49IDA7IGktLSkge1xuICAgICAgICBjb25zdCBzdGF0ZUl0ZW0gPSBpIDwgc3RhdGUubGVuZ3RoID8gc3RhdGVbaV0gOiB1bmRlZmluZWQ7XG4gICAgICAgIGNvbnN0IGxhc3RTdGF0ZUl0ZW0gPSBpIDwgbGFzdFN0YXRlSW5mby5sZW5ndGggPyBsYXN0U3RhdGVJbmZvW2ldIDogdW5kZWZpbmVkO1xuICAgICAgICBpZiAobGFzdFN0YXRlSXRlbSkge1xuICAgICAgICAgIGlmIChzdGF0ZUl0ZW0gIT09IGxhc3RTdGF0ZUl0ZW0udmFsdWUpIHtcbiAgICAgICAgICAgIGNvbnN0IGRpZmYgPSBub3cgLSBsYXN0U3RhdGVJdGVtLnRpbWU7XG4gICAgICAgICAgICBpZiAobGFzdFN0YXRlSXRlbS52YWx1ZSkge1xuICAgICAgICAgICAgICBsZXQgcmVwb3J0U3RhdGUgPSBsYXN0U3RhdGVJdGVtLnZhbHVlO1xuICAgICAgICAgICAgICBpZiAoaSA+IDApIHtcbiAgICAgICAgICAgICAgICByZXBvcnRTdGF0ZSA9IGxhc3RTdGF0ZUluZm9baSAtIDFdLnZhbHVlICsgJyA+ICcgKyByZXBvcnRTdGF0ZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBjb25zdCBzdGF0ZU1zZyA9IGAkeycgfCAnLnJlcGVhdChpKX0ke2RpZmZ9IG1zICR7cmVwb3J0U3RhdGV9YDtcbiAgICAgICAgICAgICAgY29uc3QgZCA9IGRpZmY7XG4gICAgICAgICAgICAgIC8vIFRoaXMgZGVwZW5kcyBvbiB0aW1pbmcgc28gd2UgaWdub3JlIGl0IGZvciBjb3ZlcmFnZVxuICAgICAgICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgaWYgKGQgPiAxMDAwMCkge1xuICAgICAgICAgICAgICAgICAgbG9nZ2VyLmVycm9yKHN0YXRlTXNnKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGQgPiAxMDAwKSB7XG4gICAgICAgICAgICAgICAgICBsb2dnZXIud2FybihzdGF0ZU1zZyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChkID4gMTApIHtcbiAgICAgICAgICAgICAgICAgIGxvZ2dlci5pbmZvKHN0YXRlTXNnKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGQgPiA1KSB7XG4gICAgICAgICAgICAgICAgICBsb2dnZXIubG9nKHN0YXRlTXNnKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgbG9nZ2VyLmRlYnVnKHN0YXRlTXNnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChzdGF0ZUl0ZW0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICBsYXN0U3RhdGVJbmZvLmxlbmd0aCA9IGk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBsYXN0U3RhdGVJdGVtLnZhbHVlID0gc3RhdGVJdGVtO1xuICAgICAgICAgICAgICBsYXN0U3RhdGVJdGVtLnRpbWUgPSBub3c7XG4gICAgICAgICAgICAgIGxhc3RTdGF0ZUluZm8ubGVuZ3RoID0gaSArIDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGxhc3RTdGF0ZUluZm9baV0gPSB7XG4gICAgICAgICAgICB2YWx1ZTogc3RhdGVJdGVtLFxuICAgICAgICAgICAgdGltZTogbm93LFxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgbG9nZ2VyLnN0YXR1cyhgJHtNYXRoLmZsb29yKHBlcmNlbnRhZ2UgKiAxMDApfSVgLCBtc2csIC4uLmFyZ3MpO1xuICAgIGlmIChwZXJjZW50YWdlID09PSAxIHx8ICghbXNnICYmIGFyZ3MubGVuZ3RoID09PSAwKSkgbG9nZ2VyLnN0YXR1cygpO1xuICB9O1xuXG4gIHJldHVybiBkZWZhdWx0SGFuZGxlcjtcbn07XG5cbi8qKlxuICogQGNhbGxiYWNrIFJlcG9ydFByb2dyZXNzXG4gKiBAcGFyYW0ge251bWJlcn0gcFxuICogQHBhcmFtIHsuLi5zdHJpbmd9IFthcmdzXVxuICogQHJldHVybnMge3ZvaWR9XG4gKi9cblxuLyoqIEB0eXBlIHtXZWFrTWFwPENvbXBpbGVyLFJlcG9ydFByb2dyZXNzPn0gKi9cbmNvbnN0IHByb2dyZXNzUmVwb3J0ZXJzID0gbmV3IFdlYWtNYXAoKTtcblxuZXhwb3J0IGNsYXNzIFByb2dyZXNzUGx1Z2luIHtcbiAgLyoqXG4gICAqIEBwYXJhbSB7Q29tcGlsZXJ9IGNvbXBpbGVyIHRoZSBjdXJyZW50IGNvbXBpbGVyXG4gICAqIEByZXR1cm5zIHtSZXBvcnRQcm9ncmVzc30gYSBwcm9ncmVzcyByZXBvcnRlciwgaWYgYW55XG4gICAqL1xuICBzdGF0aWMgZ2V0UmVwb3J0ZXIoY29tcGlsZXIpIHtcbiAgICByZXR1cm4gcHJvZ3Jlc3NSZXBvcnRlcnMuZ2V0KGNvbXBpbGVyKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge1Byb2dyZXNzUGx1Z2luQXJndW1lbnR9IG9wdGlvbnMgb3B0aW9uc1xuICAgKi9cbiAgY29uc3RydWN0b3Iob3B0aW9ucyA9IHt9KSB7XG4gICAgaWYgKHR5cGVvZiBvcHRpb25zID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBvcHRpb25zID0ge1xuICAgICAgICBoYW5kbGVyOiBvcHRpb25zLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICB2YWxpZGF0ZShvcHRpb25zKTtcbiAgICBvcHRpb25zID0geyAuLi5Qcm9ncmVzc1BsdWdpbi5kZWZhdWx0T3B0aW9ucywgLi4ub3B0aW9ucyB9O1xuXG4gICAgdGhpcy5wcm9maWxlID0gb3B0aW9ucy5wcm9maWxlO1xuICAgIHRoaXMuaGFuZGxlciA9IG9wdGlvbnMuaGFuZGxlcjtcbiAgICB0aGlzLm1vZHVsZXNDb3VudCA9IG9wdGlvbnMubW9kdWxlc0NvdW50O1xuICAgIHRoaXMuZGVwZW5kZW5jaWVzQ291bnQgPSBvcHRpb25zLmRlcGVuZGVuY2llc0NvdW50O1xuICAgIHRoaXMuc2hvd0VudHJpZXMgPSBvcHRpb25zLmVudHJpZXM7XG4gICAgdGhpcy5zaG93TW9kdWxlcyA9IG9wdGlvbnMubW9kdWxlcztcbiAgICB0aGlzLnNob3dEZXBlbmRlbmNpZXMgPSBvcHRpb25zLmRlcGVuZGVuY2llcztcbiAgICB0aGlzLnNob3dBY3RpdmVNb2R1bGVzID0gb3B0aW9ucy5hY3RpdmVNb2R1bGVzO1xuICAgIHRoaXMucGVyY2VudEJ5ID0gb3B0aW9ucy5wZXJjZW50Qnk7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtDb21waWxlciB8IE11bHRpQ29tcGlsZXJ9IGNvbXBpbGVyIHdlYnBhY2sgY29tcGlsZXJcbiAgICogQHJldHVybnMge3ZvaWR9XG4gICAqL1xuICBhcHBseShjb21waWxlcikge1xuICAgIGNvbnN0IGhhbmRsZXIgPVxuICAgICAgdGhpcy5oYW5kbGVyIHx8XG4gICAgICBjcmVhdGVEZWZhdWx0SGFuZGxlcih0aGlzLnByb2ZpbGUsIGNvbXBpbGVyLmdldEluZnJhc3RydWN0dXJlTG9nZ2VyKCd3ZWJwYWNrLlByb2dyZXNzJykpO1xuICAgIGlmIChjb21waWxlciBpbnN0YW5jZW9mIE11bHRpQ29tcGlsZXIpIHtcbiAgICAgIHRoaXMuX2FwcGx5T25NdWx0aUNvbXBpbGVyKGNvbXBpbGVyLCBoYW5kbGVyKTtcbiAgICB9IGVsc2UgaWYgKGNvbXBpbGVyIGluc3RhbmNlb2YgQ29tcGlsZXIpIHtcbiAgICAgIHRoaXMuX2FwcGx5T25Db21waWxlcihjb21waWxlciwgaGFuZGxlcik7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7TXVsdGlDb21waWxlcn0gY29tcGlsZXIgd2VicGFjayBtdWx0aS1jb21waWxlclxuICAgKiBAcGFyYW0ge0hhbmRsZXJGdW5jdGlvbn0gaGFuZGxlciBmdW5jdGlvbiB0aGF0IGV4ZWN1dGVzIGZvciBldmVyeSBwcm9ncmVzcyBzdGVwXG4gICAqIEByZXR1cm5zIHt2b2lkfVxuICAgKi9cbiAgX2FwcGx5T25NdWx0aUNvbXBpbGVyKGNvbXBpbGVyLCBoYW5kbGVyKSB7XG4gICAgY29uc3Qgc3RhdGVzID0gY29tcGlsZXIuY29tcGlsZXJzLm1hcCgoKSA9PiAvKiogQHR5cGUge1tudW1iZXIsIC4uLnN0cmluZ1tdXX0gKi8gWzBdKTtcbiAgICBjb21waWxlci5jb21waWxlcnMuZm9yRWFjaCgoY29tcGlsZXIsIGlkeCkgPT4ge1xuICAgICAgbmV3IFByb2dyZXNzUGx1Z2luKChwLCBtc2csIC4uLmFyZ3MpID0+IHtcbiAgICAgICAgc3RhdGVzW2lkeF0gPSBbcCwgbXNnLCAuLi5hcmdzXTtcbiAgICAgICAgbGV0IHN1bSA9IDA7XG4gICAgICAgIGZvciAoY29uc3QgW3BdIG9mIHN0YXRlcykgc3VtICs9IHA7XG4gICAgICAgIGhhbmRsZXIoc3VtIC8gc3RhdGVzLmxlbmd0aCwgYFske2lkeH1dICR7bXNnfWAsIC4uLmFyZ3MpO1xuICAgICAgfSkuYXBwbHkoY29tcGlsZXIpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7Q29tcGlsZXJ9IGNvbXBpbGVyIHdlYnBhY2sgY29tcGlsZXJcbiAgICogQHBhcmFtIHtIYW5kbGVyRnVuY3Rpb259IGhhbmRsZXIgZnVuY3Rpb24gdGhhdCBleGVjdXRlcyBmb3IgZXZlcnkgcHJvZ3Jlc3Mgc3RlcFxuICAgKiBAcmV0dXJucyB7dm9pZH1cbiAgICovXG4gIF9hcHBseU9uQ29tcGlsZXIoY29tcGlsZXIsIGhhbmRsZXIpIHtcbiAgICBjb25zdCBzaG93RW50cmllcyA9IHRoaXMuc2hvd0VudHJpZXM7XG4gICAgY29uc3Qgc2hvd01vZHVsZXMgPSB0aGlzLnNob3dNb2R1bGVzO1xuICAgIGNvbnN0IHNob3dEZXBlbmRlbmNpZXMgPSB0aGlzLnNob3dEZXBlbmRlbmNpZXM7XG4gICAgY29uc3Qgc2hvd0FjdGl2ZU1vZHVsZXMgPSB0aGlzLnNob3dBY3RpdmVNb2R1bGVzO1xuICAgIGxldCBsYXN0QWN0aXZlTW9kdWxlID0gJyc7XG4gICAgbGV0IGN1cnJlbnRMb2FkZXIgPSAnJztcbiAgICBsZXQgbGFzdE1vZHVsZXNDb3VudCA9IDA7XG4gICAgbGV0IGxhc3REZXBlbmRlbmNpZXNDb3VudCA9IDA7XG4gICAgbGV0IGxhc3RFbnRyaWVzQ291bnQgPSAwO1xuICAgIGxldCBtb2R1bGVzQ291bnQgPSAwO1xuICAgIGxldCBkZXBlbmRlbmNpZXNDb3VudCA9IDA7XG4gICAgbGV0IGVudHJpZXNDb3VudCA9IDE7XG4gICAgbGV0IGRvbmVNb2R1bGVzID0gMDtcbiAgICBsZXQgZG9uZURlcGVuZGVuY2llcyA9IDA7XG4gICAgbGV0IGRvbmVFbnRyaWVzID0gMDtcbiAgICBjb25zdCBhY3RpdmVNb2R1bGVzID0gbmV3IFNldCgpO1xuICAgIGxldCBsYXN0VXBkYXRlID0gMDtcblxuICAgIGNvbnN0IHVwZGF0ZVRocm90dGxlZCA9ICgpID0+IHtcbiAgICAgIGlmIChsYXN0VXBkYXRlICsgNTAwIDwgRGF0ZS5ub3coKSkgdXBkYXRlKCk7XG4gICAgfTtcblxuICAgIGNvbnN0IHVwZGF0ZSA9ICgpID0+IHtcbiAgICAgIC8qKiBAdHlwZSB7c3RyaW5nW119ICovXG4gICAgICBjb25zdCBpdGVtcyA9IFtdO1xuICAgICAgY29uc3QgcGVyY2VudEJ5TW9kdWxlcyA9XG4gICAgICAgIGRvbmVNb2R1bGVzIC8gTWF0aC5tYXgobGFzdE1vZHVsZXNDb3VudCB8fCB0aGlzLm1vZHVsZXNDb3VudCB8fCAxLCBtb2R1bGVzQ291bnQpO1xuICAgICAgY29uc3QgcGVyY2VudEJ5RW50cmllcyA9XG4gICAgICAgIGRvbmVFbnRyaWVzIC8gTWF0aC5tYXgobGFzdEVudHJpZXNDb3VudCB8fCB0aGlzLmRlcGVuZGVuY2llc0NvdW50IHx8IDEsIGVudHJpZXNDb3VudCk7XG4gICAgICBjb25zdCBwZXJjZW50QnlEZXBlbmRlbmNpZXMgPVxuICAgICAgICBkb25lRGVwZW5kZW5jaWVzIC8gTWF0aC5tYXgobGFzdERlcGVuZGVuY2llc0NvdW50IHx8IDEsIGRlcGVuZGVuY2llc0NvdW50KTtcbiAgICAgIGxldCBwZXJjZW50YWdlRmFjdG9yO1xuXG4gICAgICBzd2l0Y2ggKHRoaXMucGVyY2VudEJ5KSB7XG4gICAgICAgIGNhc2UgJ2VudHJpZXMnOlxuICAgICAgICAgIHBlcmNlbnRhZ2VGYWN0b3IgPSBwZXJjZW50QnlFbnRyaWVzO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdkZXBlbmRlbmNpZXMnOlxuICAgICAgICAgIHBlcmNlbnRhZ2VGYWN0b3IgPSBwZXJjZW50QnlEZXBlbmRlbmNpZXM7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ21vZHVsZXMnOlxuICAgICAgICAgIHBlcmNlbnRhZ2VGYWN0b3IgPSBwZXJjZW50QnlNb2R1bGVzO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHBlcmNlbnRhZ2VGYWN0b3IgPSBtZWRpYW4zKHBlcmNlbnRCeU1vZHVsZXMsIHBlcmNlbnRCeUVudHJpZXMsIHBlcmNlbnRCeURlcGVuZGVuY2llcyk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHBlcmNlbnRhZ2UgPSAwLjEgKyBwZXJjZW50YWdlRmFjdG9yICogMC41NTtcblxuICAgICAgaWYgKGN1cnJlbnRMb2FkZXIpIHtcbiAgICAgICAgaXRlbXMucHVzaChgaW1wb3J0IGxvYWRlciAke2NvbnRleHRpZnkoY29tcGlsZXIuY29udGV4dCwgY3VycmVudExvYWRlciwgY29tcGlsZXIucm9vdCl9YCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBzdGF0SXRlbXMgPSBbXTtcbiAgICAgICAgaWYgKHNob3dFbnRyaWVzKSB7XG4gICAgICAgICAgc3RhdEl0ZW1zLnB1c2goYCR7ZG9uZUVudHJpZXN9LyR7ZW50cmllc0NvdW50fSBlbnRyaWVzYCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNob3dEZXBlbmRlbmNpZXMpIHtcbiAgICAgICAgICBzdGF0SXRlbXMucHVzaChgJHtkb25lRGVwZW5kZW5jaWVzfS8ke2RlcGVuZGVuY2llc0NvdW50fSBkZXBlbmRlbmNpZXNgKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc2hvd01vZHVsZXMpIHtcbiAgICAgICAgICBzdGF0SXRlbXMucHVzaChgJHtkb25lTW9kdWxlc30vJHttb2R1bGVzQ291bnR9IG1vZHVsZXNgKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc2hvd0FjdGl2ZU1vZHVsZXMpIHtcbiAgICAgICAgICBzdGF0SXRlbXMucHVzaChgJHthY3RpdmVNb2R1bGVzLnNpemV9IGFjdGl2ZWApO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzdGF0SXRlbXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgIGl0ZW1zLnB1c2goc3RhdEl0ZW1zLmpvaW4oJyAnKSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNob3dBY3RpdmVNb2R1bGVzKSB7XG4gICAgICAgICAgaXRlbXMucHVzaChsYXN0QWN0aXZlTW9kdWxlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaGFuZGxlcihwZXJjZW50YWdlLCAnYnVpbGRpbmcnLCAuLi5pdGVtcyk7XG4gICAgICBsYXN0VXBkYXRlID0gRGF0ZS5ub3coKTtcbiAgICB9O1xuXG4gICAgY29uc3QgZmFjdG9yaXplQWRkID0gKCkgPT4ge1xuICAgICAgZGVwZW5kZW5jaWVzQ291bnQrKztcbiAgICAgIGlmIChkZXBlbmRlbmNpZXNDb3VudCA8IDUwIHx8IGRlcGVuZGVuY2llc0NvdW50ICUgMTAwID09PSAwKSB1cGRhdGVUaHJvdHRsZWQoKTtcbiAgICB9O1xuXG4gICAgY29uc3QgZmFjdG9yaXplRG9uZSA9ICgpID0+IHtcbiAgICAgIGRvbmVEZXBlbmRlbmNpZXMrKztcbiAgICAgIGlmIChkb25lRGVwZW5kZW5jaWVzIDwgNTAgfHwgZG9uZURlcGVuZGVuY2llcyAlIDEwMCA9PT0gMCkgdXBkYXRlVGhyb3R0bGVkKCk7XG4gICAgfTtcblxuICAgIGNvbnN0IG1vZHVsZUFkZCA9ICgpID0+IHtcbiAgICAgIG1vZHVsZXNDb3VudCsrO1xuICAgICAgaWYgKG1vZHVsZXNDb3VudCA8IDUwIHx8IG1vZHVsZXNDb3VudCAlIDEwMCA9PT0gMCkgdXBkYXRlVGhyb3R0bGVkKCk7XG4gICAgfTtcblxuICAgIC8vIG9ubHkgdXNlZCB3aGVuIHNob3dBY3RpdmVNb2R1bGVzIGlzIHNldFxuICAgIGNvbnN0IG1vZHVsZUJ1aWxkID0gKG1vZHVsZSkgPT4ge1xuICAgICAgY29uc3QgaWRlbnQgPSBtb2R1bGUuaWRlbnRpZmllcigpO1xuICAgICAgaWYgKGlkZW50KSB7XG4gICAgICAgIGFjdGl2ZU1vZHVsZXMuYWRkKGlkZW50KTtcbiAgICAgICAgbGFzdEFjdGl2ZU1vZHVsZSA9IGlkZW50O1xuICAgICAgICB1cGRhdGUoKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgY29uc3QgZW50cnlBZGQgPSAoZW50cnksIG9wdGlvbnMpID0+IHtcbiAgICAgIGVudHJpZXNDb3VudCsrO1xuICAgICAgaWYgKGVudHJpZXNDb3VudCA8IDUgfHwgZW50cmllc0NvdW50ICUgMTAgPT09IDApIHVwZGF0ZVRocm90dGxlZCgpO1xuICAgIH07XG5cbiAgICBjb25zdCBtb2R1bGVEb25lID0gKG1vZHVsZSkgPT4ge1xuICAgICAgZG9uZU1vZHVsZXMrKztcbiAgICAgIGlmIChzaG93QWN0aXZlTW9kdWxlcykge1xuICAgICAgICBjb25zdCBpZGVudCA9IG1vZHVsZS5pZGVudGlmaWVyKCk7XG4gICAgICAgIGlmIChpZGVudCkge1xuICAgICAgICAgIGFjdGl2ZU1vZHVsZXMuZGVsZXRlKGlkZW50KTtcbiAgICAgICAgICBpZiAobGFzdEFjdGl2ZU1vZHVsZSA9PT0gaWRlbnQpIHtcbiAgICAgICAgICAgIGxhc3RBY3RpdmVNb2R1bGUgPSAnJztcbiAgICAgICAgICAgIGZvciAoY29uc3QgbSBvZiBhY3RpdmVNb2R1bGVzKSB7XG4gICAgICAgICAgICAgIGxhc3RBY3RpdmVNb2R1bGUgPSBtO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdXBkYXRlKCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoZG9uZU1vZHVsZXMgPCA1MCB8fCBkb25lTW9kdWxlcyAlIDEwMCA9PT0gMCkgdXBkYXRlVGhyb3R0bGVkKCk7XG4gICAgfTtcblxuICAgIGNvbnN0IGVudHJ5RG9uZSA9IChlbnRyeSwgb3B0aW9ucykgPT4ge1xuICAgICAgZG9uZUVudHJpZXMrKztcbiAgICAgIHVwZGF0ZSgpO1xuICAgIH07XG5cbiAgICBjb25zdCBjYWNoZSA9IGNvbXBpbGVyLmdldENhY2hlKCdQcm9ncmVzc1BsdWdpbicpLmdldEl0ZW1DYWNoZSgnY291bnRzJywgbnVsbCk7XG5cbiAgICBsZXQgY2FjaGVHZXRQcm9taXNlO1xuXG4gICAgY29tcGlsZXIuaG9va3MuYmVmb3JlQ29tcGlsZS50YXAoJ1Byb2dyZXNzUGx1Z2luJywgKCkgPT4ge1xuICAgICAgaWYgKCFjYWNoZUdldFByb21pc2UpIHtcbiAgICAgICAgY2FjaGVHZXRQcm9taXNlID0gY2FjaGUuZ2V0UHJvbWlzZSgpLnRoZW4oXG4gICAgICAgICAgKGRhdGEpID0+IHtcbiAgICAgICAgICAgIGlmIChkYXRhKSB7XG4gICAgICAgICAgICAgIGxhc3RNb2R1bGVzQ291bnQgPSBsYXN0TW9kdWxlc0NvdW50IHx8IGRhdGEubW9kdWxlc0NvdW50O1xuICAgICAgICAgICAgICBsYXN0RGVwZW5kZW5jaWVzQ291bnQgPSBsYXN0RGVwZW5kZW5jaWVzQ291bnQgfHwgZGF0YS5kZXBlbmRlbmNpZXNDb3VudDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBkYXRhO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgKGVycikgPT4ge1xuICAgICAgICAgICAgLy8gSWdub3JlIGVycm9yXG4gICAgICAgICAgfSxcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGNvbXBpbGVyLmhvb2tzLmFmdGVyQ29tcGlsZS50YXBQcm9taXNlKCdQcm9ncmVzc1BsdWdpbicsIChjb21waWxhdGlvbikgPT4ge1xuICAgICAgaWYgKGNvbXBpbGF0aW9uLmNvbXBpbGVyLmlzQ2hpbGQoKSkgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgcmV0dXJuIGNhY2hlR2V0UHJvbWlzZS50aGVuKGFzeW5jIChvbGREYXRhKSA9PiB7XG4gICAgICAgIGlmIChcbiAgICAgICAgICAhb2xkRGF0YSB8fFxuICAgICAgICAgIG9sZERhdGEubW9kdWxlc0NvdW50ICE9PSBtb2R1bGVzQ291bnQgfHxcbiAgICAgICAgICBvbGREYXRhLmRlcGVuZGVuY2llc0NvdW50ICE9PSBkZXBlbmRlbmNpZXNDb3VudFxuICAgICAgICApIHtcbiAgICAgICAgICBhd2FpdCBjYWNoZS5zdG9yZVByb21pc2UoeyBtb2R1bGVzQ291bnQsIGRlcGVuZGVuY2llc0NvdW50IH0pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGNvbXBpbGVyLmhvb2tzLmNvbXBpbGF0aW9uLnRhcCgnUHJvZ3Jlc3NQbHVnaW4nLCAoY29tcGlsYXRpb24pID0+IHtcbiAgICAgIGlmIChjb21waWxhdGlvbi5jb21waWxlci5pc0NoaWxkKCkpIHJldHVybjtcbiAgICAgIGxhc3RNb2R1bGVzQ291bnQgPSBtb2R1bGVzQ291bnQ7XG4gICAgICBsYXN0RW50cmllc0NvdW50ID0gZW50cmllc0NvdW50O1xuICAgICAgbGFzdERlcGVuZGVuY2llc0NvdW50ID0gZGVwZW5kZW5jaWVzQ291bnQ7XG4gICAgICBtb2R1bGVzQ291bnQgPSBkZXBlbmRlbmNpZXNDb3VudCA9IGVudHJpZXNDb3VudCA9IDA7XG4gICAgICBkb25lTW9kdWxlcyA9IGRvbmVEZXBlbmRlbmNpZXMgPSBkb25lRW50cmllcyA9IDA7XG5cbiAgICAgIGNvbXBpbGF0aW9uLmZhY3Rvcml6ZVF1ZXVlLmhvb2tzLmFkZGVkLnRhcCgnUHJvZ3Jlc3NQbHVnaW4nLCBmYWN0b3JpemVBZGQpO1xuICAgICAgY29tcGlsYXRpb24uZmFjdG9yaXplUXVldWUuaG9va3MucmVzdWx0LnRhcCgnUHJvZ3Jlc3NQbHVnaW4nLCBmYWN0b3JpemVEb25lKTtcblxuICAgICAgY29tcGlsYXRpb24uYWRkTW9kdWxlUXVldWUuaG9va3MuYWRkZWQudGFwKCdQcm9ncmVzc1BsdWdpbicsIG1vZHVsZUFkZCk7XG4gICAgICBjb21waWxhdGlvbi5wcm9jZXNzRGVwZW5kZW5jaWVzUXVldWUuaG9va3MucmVzdWx0LnRhcCgnUHJvZ3Jlc3NQbHVnaW4nLCBtb2R1bGVEb25lKTtcblxuICAgICAgaWYgKHNob3dBY3RpdmVNb2R1bGVzKSB7XG4gICAgICAgIGNvbXBpbGF0aW9uLmhvb2tzLmJ1aWxkTW9kdWxlLnRhcCgnUHJvZ3Jlc3NQbHVnaW4nLCBtb2R1bGVCdWlsZCk7XG4gICAgICB9XG5cbiAgICAgIGNvbXBpbGF0aW9uLmhvb2tzLmFkZEVudHJ5LnRhcCgnUHJvZ3Jlc3NQbHVnaW4nLCBlbnRyeUFkZCk7XG4gICAgICBjb21waWxhdGlvbi5ob29rcy5mYWlsZWRFbnRyeS50YXAoJ1Byb2dyZXNzUGx1Z2luJywgZW50cnlEb25lKTtcbiAgICAgIGNvbXBpbGF0aW9uLmhvb2tzLnN1Y2NlZWRFbnRyeS50YXAoJ1Byb2dyZXNzUGx1Z2luJywgZW50cnlEb25lKTtcblxuICAgICAgLy8gYXZvaWQgZHluYW1pYyByZXF1aXJlIGlmIGJ1bmRsZWQgd2l0aCB3ZWJwYWNrXG4gICAgICAvLyBAdHMtZXhwZWN0LWVycm9yXG4gICAgICBpZiAodHlwZW9mIF9fd2VicGFja19yZXF1aXJlX18gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgY29uc3QgcmVxdWlyZWRMb2FkZXJzID0gbmV3IFNldCgpO1xuICAgICAgICBOb3JtYWxNb2R1bGUuZ2V0Q29tcGlsYXRpb25Ib29rcyhjb21waWxhdGlvbikuYmVmb3JlTG9hZGVycy50YXAoXG4gICAgICAgICAgJ1Byb2dyZXNzUGx1Z2luJyxcbiAgICAgICAgICAobG9hZGVycykgPT4ge1xuICAgICAgICAgICAgZm9yIChjb25zdCBsb2FkZXIgb2YgbG9hZGVycykge1xuICAgICAgICAgICAgICBpZiAobG9hZGVyLnR5cGUgIT09ICdtb2R1bGUnICYmICFyZXF1aXJlZExvYWRlcnMuaGFzKGxvYWRlci5sb2FkZXIpKSB7XG4gICAgICAgICAgICAgICAgcmVxdWlyZWRMb2FkZXJzLmFkZChsb2FkZXIubG9hZGVyKTtcbiAgICAgICAgICAgICAgICBjdXJyZW50TG9hZGVyID0gbG9hZGVyLmxvYWRlcjtcbiAgICAgICAgICAgICAgICB1cGRhdGUoKTtcbiAgICAgICAgICAgICAgICByZXF1aXJlKGxvYWRlci5sb2FkZXIpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoY3VycmVudExvYWRlcikge1xuICAgICAgICAgICAgICBjdXJyZW50TG9hZGVyID0gJyc7XG4gICAgICAgICAgICAgIHVwZGF0ZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGhvb2tzID0ge1xuICAgICAgICBmaW5pc2hNb2R1bGVzOiAnZmluaXNoIG1vZHVsZSBncmFwaCcsXG4gICAgICAgIHNlYWw6ICdwbHVnaW5zJyxcbiAgICAgICAgb3B0aW1pemVEZXBlbmRlbmNpZXM6ICdkZXBlbmRlbmNpZXMgb3B0aW1pemF0aW9uJyxcbiAgICAgICAgYWZ0ZXJPcHRpbWl6ZURlcGVuZGVuY2llczogJ2FmdGVyIGRlcGVuZGVuY2llcyBvcHRpbWl6YXRpb24nLFxuICAgICAgICBiZWZvcmVDaHVua3M6ICdjaHVuayBncmFwaCcsXG4gICAgICAgIGFmdGVyQ2h1bmtzOiAnYWZ0ZXIgY2h1bmsgZ3JhcGgnLFxuICAgICAgICBvcHRpbWl6ZTogJ29wdGltaXppbmcnLFxuICAgICAgICBvcHRpbWl6ZU1vZHVsZXM6ICdtb2R1bGUgb3B0aW1pemF0aW9uJyxcbiAgICAgICAgYWZ0ZXJPcHRpbWl6ZU1vZHVsZXM6ICdhZnRlciBtb2R1bGUgb3B0aW1pemF0aW9uJyxcbiAgICAgICAgb3B0aW1pemVDaHVua3M6ICdjaHVuayBvcHRpbWl6YXRpb24nLFxuICAgICAgICBhZnRlck9wdGltaXplQ2h1bmtzOiAnYWZ0ZXIgY2h1bmsgb3B0aW1pemF0aW9uJyxcbiAgICAgICAgb3B0aW1pemVUcmVlOiAnbW9kdWxlIGFuZCBjaHVuayB0cmVlIG9wdGltaXphdGlvbicsXG4gICAgICAgIGFmdGVyT3B0aW1pemVUcmVlOiAnYWZ0ZXIgbW9kdWxlIGFuZCBjaHVuayB0cmVlIG9wdGltaXphdGlvbicsXG4gICAgICAgIG9wdGltaXplQ2h1bmtNb2R1bGVzOiAnY2h1bmsgbW9kdWxlcyBvcHRpbWl6YXRpb24nLFxuICAgICAgICBhZnRlck9wdGltaXplQ2h1bmtNb2R1bGVzOiAnYWZ0ZXIgY2h1bmsgbW9kdWxlcyBvcHRpbWl6YXRpb24nLFxuICAgICAgICByZXZpdmVNb2R1bGVzOiAnbW9kdWxlIHJldml2aW5nJyxcbiAgICAgICAgYmVmb3JlTW9kdWxlSWRzOiAnYmVmb3JlIG1vZHVsZSBpZHMnLFxuICAgICAgICBtb2R1bGVJZHM6ICdtb2R1bGUgaWRzJyxcbiAgICAgICAgb3B0aW1pemVNb2R1bGVJZHM6ICdtb2R1bGUgaWQgb3B0aW1pemF0aW9uJyxcbiAgICAgICAgYWZ0ZXJPcHRpbWl6ZU1vZHVsZUlkczogJ21vZHVsZSBpZCBvcHRpbWl6YXRpb24nLFxuICAgICAgICByZXZpdmVDaHVua3M6ICdjaHVuayByZXZpdmluZycsXG4gICAgICAgIGJlZm9yZUNodW5rSWRzOiAnYmVmb3JlIGNodW5rIGlkcycsXG4gICAgICAgIGNodW5rSWRzOiAnY2h1bmsgaWRzJyxcbiAgICAgICAgb3B0aW1pemVDaHVua0lkczogJ2NodW5rIGlkIG9wdGltaXphdGlvbicsXG4gICAgICAgIGFmdGVyT3B0aW1pemVDaHVua0lkczogJ2FmdGVyIGNodW5rIGlkIG9wdGltaXphdGlvbicsXG4gICAgICAgIHJlY29yZE1vZHVsZXM6ICdyZWNvcmQgbW9kdWxlcycsXG4gICAgICAgIHJlY29yZENodW5rczogJ3JlY29yZCBjaHVua3MnLFxuICAgICAgICBiZWZvcmVNb2R1bGVIYXNoOiAnbW9kdWxlIGhhc2hpbmcnLFxuICAgICAgICBiZWZvcmVDb2RlR2VuZXJhdGlvbjogJ2NvZGUgZ2VuZXJhdGlvbicsXG4gICAgICAgIGJlZm9yZVJ1bnRpbWVSZXF1aXJlbWVudHM6ICdydW50aW1lIHJlcXVpcmVtZW50cycsXG4gICAgICAgIGJlZm9yZUhhc2g6ICdoYXNoaW5nJyxcbiAgICAgICAgYWZ0ZXJIYXNoOiAnYWZ0ZXIgaGFzaGluZycsXG4gICAgICAgIHJlY29yZEhhc2g6ICdyZWNvcmQgaGFzaCcsXG4gICAgICAgIGJlZm9yZU1vZHVsZUFzc2V0czogJ21vZHVsZSBhc3NldHMgcHJvY2Vzc2luZycsXG4gICAgICAgIGJlZm9yZUNodW5rQXNzZXRzOiAnY2h1bmsgYXNzZXRzIHByb2Nlc3NpbmcnLFxuICAgICAgICBwcm9jZXNzQXNzZXRzOiAnYXNzZXQgcHJvY2Vzc2luZycsXG4gICAgICAgIGFmdGVyUHJvY2Vzc0Fzc2V0czogJ2FmdGVyIGFzc2V0IG9wdGltaXphdGlvbicsXG4gICAgICAgIHJlY29yZDogJ3JlY29yZGluZycsXG4gICAgICAgIGFmdGVyU2VhbDogJ2FmdGVyIHNlYWwnLFxuICAgICAgfTtcbiAgICAgIGNvbnN0IG51bWJlck9mSG9va3MgPSBPYmplY3Qua2V5cyhob29rcykubGVuZ3RoO1xuICAgICAgT2JqZWN0LmtleXMoaG9va3MpLmZvckVhY2goKG5hbWUsIGlkeCkgPT4ge1xuICAgICAgICBjb25zdCB0aXRsZSA9IGhvb2tzW25hbWVdO1xuICAgICAgICBjb25zdCBwZXJjZW50YWdlID0gKGlkeCAvIG51bWJlck9mSG9va3MpICogMC4yNSArIDAuNztcbiAgICAgICAgY29tcGlsYXRpb24uaG9va3NbbmFtZV0uaW50ZXJjZXB0KHtcbiAgICAgICAgICBuYW1lOiAnUHJvZ3Jlc3NQbHVnaW4nLFxuICAgICAgICAgIGNhbGwoKSB7XG4gICAgICAgICAgICBoYW5kbGVyKHBlcmNlbnRhZ2UsICdzZWFsaW5nJywgdGl0bGUpO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgZG9uZSgpIHtcbiAgICAgICAgICAgIHByb2dyZXNzUmVwb3J0ZXJzLnNldChjb21waWxlciwgdW5kZWZpbmVkKTtcbiAgICAgICAgICAgIGhhbmRsZXIocGVyY2VudGFnZSwgJ3NlYWxpbmcnLCB0aXRsZSk7XG4gICAgICAgICAgfSxcbiAgICAgICAgICByZXN1bHQoKSB7XG4gICAgICAgICAgICBoYW5kbGVyKHBlcmNlbnRhZ2UsICdzZWFsaW5nJywgdGl0bGUpO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgZXJyb3IoKSB7XG4gICAgICAgICAgICBoYW5kbGVyKHBlcmNlbnRhZ2UsICdzZWFsaW5nJywgdGl0bGUpO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgdGFwKHRhcCkge1xuICAgICAgICAgICAgLy8gcCBpcyBwZXJjZW50YWdlIGZyb20gMCB0byAxXG4gICAgICAgICAgICAvLyBhcmdzIGlzIGFueSBudW1iZXIgb2YgbWVzc2FnZXMgaW4gYSBoaWVyYXJjaGljYWwgbWF0dGVyXG4gICAgICAgICAgICBwcm9ncmVzc1JlcG9ydGVycy5zZXQoY29tcGlsYXRpb24uY29tcGlsZXIsIChwLCAuLi5hcmdzKSA9PiB7XG4gICAgICAgICAgICAgIGhhbmRsZXIocGVyY2VudGFnZSwgJ3NlYWxpbmcnLCB0aXRsZSwgdGFwLm5hbWUsIC4uLmFyZ3MpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBoYW5kbGVyKHBlcmNlbnRhZ2UsICdzZWFsaW5nJywgdGl0bGUsIHRhcC5uYW1lKTtcbiAgICAgICAgICB9LFxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIGNvbXBpbGVyLmhvb2tzLm1ha2UuaW50ZXJjZXB0KHtcbiAgICAgIG5hbWU6ICdQcm9ncmVzc1BsdWdpbicsXG4gICAgICBjYWxsKCkge1xuICAgICAgICBoYW5kbGVyKDAuMSwgJ2J1aWxkaW5nJyk7XG4gICAgICB9LFxuICAgICAgZG9uZSgpIHtcbiAgICAgICAgaGFuZGxlcigwLjY1LCAnYnVpbGRpbmcnKTtcbiAgICAgIH0sXG4gICAgfSk7XG4gICAgY29uc3QgaW50ZXJjZXB0SG9vayA9IChob29rLCBwcm9ncmVzcywgY2F0ZWdvcnksIG5hbWUpID0+IHtcbiAgICAgIGhvb2suaW50ZXJjZXB0KHtcbiAgICAgICAgbmFtZTogJ1Byb2dyZXNzUGx1Z2luJyxcbiAgICAgICAgY2FsbCgpIHtcbiAgICAgICAgICBoYW5kbGVyKHByb2dyZXNzLCBjYXRlZ29yeSwgbmFtZSk7XG4gICAgICAgIH0sXG4gICAgICAgIGRvbmUoKSB7XG4gICAgICAgICAgcHJvZ3Jlc3NSZXBvcnRlcnMuc2V0KGNvbXBpbGVyLCB1bmRlZmluZWQpO1xuICAgICAgICAgIGhhbmRsZXIocHJvZ3Jlc3MsIGNhdGVnb3J5LCBuYW1lKTtcbiAgICAgICAgfSxcbiAgICAgICAgcmVzdWx0KCkge1xuICAgICAgICAgIGhhbmRsZXIocHJvZ3Jlc3MsIGNhdGVnb3J5LCBuYW1lKTtcbiAgICAgICAgfSxcbiAgICAgICAgZXJyb3IoKSB7XG4gICAgICAgICAgaGFuZGxlcihwcm9ncmVzcywgY2F0ZWdvcnksIG5hbWUpO1xuICAgICAgICB9LFxuICAgICAgICB0YXAodGFwKSB7XG4gICAgICAgICAgcHJvZ3Jlc3NSZXBvcnRlcnMuc2V0KGNvbXBpbGVyLCAocCwgLi4uYXJncykgPT4ge1xuICAgICAgICAgICAgaGFuZGxlcihwcm9ncmVzcywgY2F0ZWdvcnksIG5hbWUsIHRhcC5uYW1lLCAuLi5hcmdzKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBoYW5kbGVyKHByb2dyZXNzLCBjYXRlZ29yeSwgbmFtZSwgdGFwLm5hbWUpO1xuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgfTtcbiAgICBjb21waWxlci5jYWNoZS5ob29rcy5lbmRJZGxlLmludGVyY2VwdCh7XG4gICAgICBuYW1lOiAnUHJvZ3Jlc3NQbHVnaW4nLFxuICAgICAgY2FsbCgpIHtcbiAgICAgICAgaGFuZGxlcigwLCAnJyk7XG4gICAgICB9LFxuICAgIH0pO1xuICAgIGludGVyY2VwdEhvb2soY29tcGlsZXIuY2FjaGUuaG9va3MuZW5kSWRsZSwgMC4wMSwgJ2NhY2hlJywgJ2VuZCBpZGxlJyk7XG4gICAgY29tcGlsZXIuaG9va3MuYmVmb3JlUnVuLmludGVyY2VwdCh7XG4gICAgICBuYW1lOiAnUHJvZ3Jlc3NQbHVnaW4nLFxuICAgICAgY2FsbCgpIHtcbiAgICAgICAgaGFuZGxlcigwLCAnJyk7XG4gICAgICB9LFxuICAgIH0pO1xuICAgIGludGVyY2VwdEhvb2soY29tcGlsZXIuaG9va3MuYmVmb3JlUnVuLCAwLjAxLCAnc2V0dXAnLCAnYmVmb3JlIHJ1bicpO1xuICAgIGludGVyY2VwdEhvb2soY29tcGlsZXIuaG9va3MucnVuLCAwLjAyLCAnc2V0dXAnLCAncnVuJyk7XG4gICAgaW50ZXJjZXB0SG9vayhjb21waWxlci5ob29rcy53YXRjaFJ1biwgMC4wMywgJ3NldHVwJywgJ3dhdGNoIHJ1bicpO1xuICAgIGludGVyY2VwdEhvb2soY29tcGlsZXIuaG9va3Mubm9ybWFsTW9kdWxlRmFjdG9yeSwgMC4wNCwgJ3NldHVwJywgJ25vcm1hbCBtb2R1bGUgZmFjdG9yeScpO1xuICAgIGludGVyY2VwdEhvb2soY29tcGlsZXIuaG9va3MuY29udGV4dE1vZHVsZUZhY3RvcnksIDAuMDUsICdzZXR1cCcsICdjb250ZXh0IG1vZHVsZSBmYWN0b3J5Jyk7XG4gICAgaW50ZXJjZXB0SG9vayhjb21waWxlci5ob29rcy5iZWZvcmVDb21waWxlLCAwLjA2LCAnc2V0dXAnLCAnYmVmb3JlIGNvbXBpbGUnKTtcbiAgICBpbnRlcmNlcHRIb29rKGNvbXBpbGVyLmhvb2tzLmNvbXBpbGUsIDAuMDcsICdzZXR1cCcsICdjb21waWxlJyk7XG4gICAgaW50ZXJjZXB0SG9vayhjb21waWxlci5ob29rcy50aGlzQ29tcGlsYXRpb24sIDAuMDgsICdzZXR1cCcsICdjb21waWxhdGlvbicpO1xuICAgIGludGVyY2VwdEhvb2soY29tcGlsZXIuaG9va3MuY29tcGlsYXRpb24sIDAuMDksICdzZXR1cCcsICdjb21waWxhdGlvbicpO1xuICAgIGludGVyY2VwdEhvb2soY29tcGlsZXIuaG9va3MuZmluaXNoTWFrZSwgMC42OSwgJ2J1aWxkaW5nJywgJ2ZpbmlzaCcpO1xuICAgIGludGVyY2VwdEhvb2soY29tcGlsZXIuaG9va3MuZW1pdCwgMC45NSwgJ2VtaXR0aW5nJywgJ2VtaXQnKTtcbiAgICBpbnRlcmNlcHRIb29rKGNvbXBpbGVyLmhvb2tzLmFmdGVyRW1pdCwgMC45OCwgJ2VtaXR0aW5nJywgJ2FmdGVyIGVtaXQnKTtcbiAgICBpbnRlcmNlcHRIb29rKGNvbXBpbGVyLmhvb2tzLmRvbmUsIDAuOTksICdkb25lJywgJ3BsdWdpbnMnKTtcbiAgICBjb21waWxlci5ob29rcy5kb25lLmludGVyY2VwdCh7XG4gICAgICBuYW1lOiAnUHJvZ3Jlc3NQbHVnaW4nLFxuICAgICAgZG9uZSgpIHtcbiAgICAgICAgaGFuZGxlcigwLjk5LCAnJyk7XG4gICAgICB9LFxuICAgIH0pO1xuICAgIGludGVyY2VwdEhvb2soXG4gICAgICBjb21waWxlci5jYWNoZS5ob29rcy5zdG9yZUJ1aWxkRGVwZW5kZW5jaWVzLFxuICAgICAgMC45OSxcbiAgICAgICdjYWNoZScsXG4gICAgICAnc3RvcmUgYnVpbGQgZGVwZW5kZW5jaWVzJyxcbiAgICApO1xuICAgIGludGVyY2VwdEhvb2soY29tcGlsZXIuY2FjaGUuaG9va3Muc2h1dGRvd24sIDAuOTksICdjYWNoZScsICdzaHV0ZG93bicpO1xuICAgIGludGVyY2VwdEhvb2soY29tcGlsZXIuY2FjaGUuaG9va3MuYmVnaW5JZGxlLCAwLjk5LCAnY2FjaGUnLCAnYmVnaW4gaWRsZScpO1xuICAgIGludGVyY2VwdEhvb2soY29tcGlsZXIuaG9va3Mud2F0Y2hDbG9zZSwgMC45OSwgJ2VuZCcsICdjbG9zaW5nIHdhdGNoIGNvbXBpbGF0aW9uJyk7XG4gICAgY29tcGlsZXIuY2FjaGUuaG9va3MuYmVnaW5JZGxlLmludGVyY2VwdCh7XG4gICAgICBuYW1lOiAnUHJvZ3Jlc3NQbHVnaW4nLFxuICAgICAgZG9uZSgpIHtcbiAgICAgICAgaGFuZGxlcigxLCAnJyk7XG4gICAgICB9LFxuICAgIH0pO1xuICAgIGNvbXBpbGVyLmNhY2hlLmhvb2tzLnNodXRkb3duLmludGVyY2VwdCh7XG4gICAgICBuYW1lOiAnUHJvZ3Jlc3NQbHVnaW4nLFxuICAgICAgZG9uZSgpIHtcbiAgICAgICAgaGFuZGxlcigxLCAnJyk7XG4gICAgICB9LFxuICAgIH0pO1xuICB9XG59XG5cblByb2dyZXNzUGx1Z2luLmRlZmF1bHRPcHRpb25zID0ge1xuICBwcm9maWxlOiBmYWxzZSxcbiAgbW9kdWxlc0NvdW50OiA1MDAwLFxuICBkZXBlbmRlbmNpZXNDb3VudDogMTAwMDAsXG4gIG1vZHVsZXM6IHRydWUsXG4gIGRlcGVuZGVuY2llczogdHJ1ZSxcbiAgYWN0aXZlTW9kdWxlczogZmFsc2UsXG4gIGVudHJpZXM6IHRydWUsXG59O1xuIl19