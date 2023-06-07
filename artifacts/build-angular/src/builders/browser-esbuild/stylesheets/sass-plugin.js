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
exports.createSassPlugin = exports.shutdownSassWorkerPool = void 0;
const node_assert_1 = __importDefault(require("node:assert"));
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
const node_url_1 = require("node:url");
let sassWorkerPool;
function isSassException(error) {
    return !!error && typeof error === 'object' && 'sassMessage' in error;
}
function shutdownSassWorkerPool() {
    sassWorkerPool?.close();
    sassWorkerPool = undefined;
}
exports.shutdownSassWorkerPool = shutdownSassWorkerPool;
function createSassPlugin(options, cache) {
    return {
        name: 'angular-sass',
        setup(build) {
            const resolveUrl = async (url, previousResolvedModules) => {
                let result = await build.resolve(url, {
                    kind: 'import-rule',
                    // This should ideally be the directory of the importer file from Sass
                    // but that is not currently available from the Sass importer API.
                    resolveDir: build.initialOptions.absWorkingDir,
                });
                // Workaround to support Yarn PnP without access to the importer file from Sass
                if (!result.path && previousResolvedModules?.size) {
                    for (const previous of previousResolvedModules) {
                        result = await build.resolve(url, {
                            kind: 'import-rule',
                            resolveDir: previous,
                        });
                        if (result.path) {
                            break;
                        }
                    }
                }
                return result;
            };
            build.onLoad({ filter: /^s[ac]ss;/, namespace: 'angular:styles/component' }, async (args) => {
                const data = options.inlineComponentData?.[args.path];
                (0, node_assert_1.default)(typeof data === 'string', `component style name should always be found [${args.path}]`);
                let result = cache?.get(data);
                if (result === undefined) {
                    const [language, , filePath] = args.path.split(';', 3);
                    const syntax = language === 'sass' ? 'indented' : 'scss';
                    result = await compileString(data, filePath, syntax, options, resolveUrl);
                    if (result.errors === undefined) {
                        // Cache the result if there were no errors
                        await cache?.put(data, result);
                    }
                }
                return result;
            });
            build.onLoad({ filter: /\.s[ac]ss$/ }, async (args) => {
                let result = cache?.get(args.path);
                if (result === undefined) {
                    const data = await (0, promises_1.readFile)(args.path, 'utf-8');
                    const syntax = (0, node_path_1.extname)(args.path).toLowerCase() === '.sass' ? 'indented' : 'scss';
                    result = await compileString(data, args.path, syntax, options, resolveUrl);
                    if (result.errors === undefined) {
                        // Cache the result if there were no errors
                        await cache?.put(args.path, result);
                    }
                }
                return result;
            });
        },
    };
}
exports.createSassPlugin = createSassPlugin;
async function compileString(data, filePath, syntax, options, resolveUrl) {
    // Lazily load Sass when a Sass file is found
    if (sassWorkerPool === undefined) {
        const sassService = await Promise.resolve().then(() => __importStar(require('../../../sass/sass-service')));
        sassWorkerPool = new sassService.SassWorkerImplementation(true);
    }
    const warnings = [];
    try {
        const { css, sourceMap, loadedUrls } = await sassWorkerPool.compileStringAsync(data, {
            url: (0, node_url_1.pathToFileURL)(filePath),
            style: 'expanded',
            syntax,
            loadPaths: options.loadPaths,
            sourceMap: options.sourcemap,
            sourceMapIncludeSources: options.sourcemap,
            quietDeps: true,
            importers: [
                {
                    findFileUrl: async (url, { previousResolvedModules }) => {
                        let result = await resolveUrl(url);
                        if (result.path) {
                            return (0, node_url_1.pathToFileURL)(result.path);
                        }
                        // Check for package deep imports
                        const parts = url.split('/');
                        const hasScope = parts.length >= 2 && parts[0].startsWith('@');
                        const [nameOrScope, nameOrFirstPath, ...pathPart] = parts;
                        const packageName = hasScope ? `${nameOrScope}/${nameOrFirstPath}` : nameOrScope;
                        let packageResult = await resolveUrl(packageName + '/package.json');
                        if (packageResult.path) {
                            return (0, node_url_1.pathToFileURL)((0, node_path_1.join)((0, node_path_1.dirname)(packageResult.path), !hasScope && nameOrFirstPath ? nameOrFirstPath : '', ...pathPart));
                        }
                        // Check with Yarn PnP workaround using previous resolved modules.
                        // This is done last to avoid a performance penalty for common cases.
                        result = await resolveUrl(url, previousResolvedModules);
                        if (result.path) {
                            return (0, node_url_1.pathToFileURL)(result.path);
                        }
                        packageResult = await resolveUrl(packageName + '/package.json', previousResolvedModules);
                        if (packageResult.path) {
                            return (0, node_url_1.pathToFileURL)((0, node_path_1.join)((0, node_path_1.dirname)(packageResult.path), !hasScope && nameOrFirstPath ? nameOrFirstPath : '', ...pathPart));
                        }
                        // Not found
                        return null;
                    },
                },
            ],
            logger: {
                warn: (text, { deprecation, span }) => {
                    warnings.push({
                        text: deprecation ? 'Deprecation' : text,
                        location: span && {
                            file: span.url && (0, node_url_1.fileURLToPath)(span.url),
                            lineText: span.context,
                            // Sass line numbers are 0-based while esbuild's are 1-based
                            line: span.start.line + 1,
                            column: span.start.column,
                        },
                        notes: deprecation ? [{ text }] : undefined,
                    });
                },
            },
        });
        return {
            loader: 'css',
            contents: sourceMap ? `${css}\n${sourceMapToUrlComment(sourceMap, (0, node_path_1.dirname)(filePath))}` : css,
            watchFiles: loadedUrls.map((url) => (0, node_url_1.fileURLToPath)(url)),
            warnings,
        };
    }
    catch (error) {
        if (isSassException(error)) {
            const file = error.span.url ? (0, node_url_1.fileURLToPath)(error.span.url) : undefined;
            return {
                loader: 'css',
                errors: [
                    {
                        text: error.message,
                    },
                ],
                warnings,
                watchFiles: file ? [file] : undefined,
            };
        }
        throw error;
    }
}
function sourceMapToUrlComment(sourceMap, root) {
    // Remove `file` protocol from all sourcemap sources and adjust to be relative to the input file.
    // This allows esbuild to correctly process the paths.
    sourceMap.sources = sourceMap.sources.map((source) => (0, node_path_1.relative)(root, (0, node_url_1.fileURLToPath)(source)));
    const urlSourceMap = Buffer.from(JSON.stringify(sourceMap), 'utf-8').toString('base64');
    return `/*# sourceMappingURL=data:application/json;charset=utf-8;base64,${urlSourceMap} */`;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Fzcy1wbHVnaW4uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy9idWlsZGVycy9icm93c2VyLWVzYnVpbGQvc3R5bGVzaGVldHMvc2Fzcy1wbHVnaW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFHSCw4REFBaUM7QUFDakMsK0NBQTRDO0FBQzVDLHlDQUE2RDtBQUM3RCx1Q0FBd0Q7QUFjeEQsSUFBSSxjQUFvRCxDQUFDO0FBRXpELFNBQVMsZUFBZSxDQUFDLEtBQWM7SUFDckMsT0FBTyxDQUFDLENBQUMsS0FBSyxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsSUFBSSxhQUFhLElBQUksS0FBSyxDQUFDO0FBQ3hFLENBQUM7QUFFRCxTQUFnQixzQkFBc0I7SUFDcEMsY0FBYyxFQUFFLEtBQUssRUFBRSxDQUFDO0lBQ3hCLGNBQWMsR0FBRyxTQUFTLENBQUM7QUFDN0IsQ0FBQztBQUhELHdEQUdDO0FBRUQsU0FBZ0IsZ0JBQWdCLENBQUMsT0FBMEIsRUFBRSxLQUF1QjtJQUNsRixPQUFPO1FBQ0wsSUFBSSxFQUFFLGNBQWM7UUFDcEIsS0FBSyxDQUFDLEtBQWtCO1lBQ3RCLE1BQU0sVUFBVSxHQUFHLEtBQUssRUFBRSxHQUFXLEVBQUUsdUJBQXFDLEVBQUUsRUFBRTtnQkFDOUUsSUFBSSxNQUFNLEdBQUcsTUFBTSxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRTtvQkFDcEMsSUFBSSxFQUFFLGFBQWE7b0JBQ25CLHNFQUFzRTtvQkFDdEUsa0VBQWtFO29CQUNsRSxVQUFVLEVBQUUsS0FBSyxDQUFDLGNBQWMsQ0FBQyxhQUFhO2lCQUMvQyxDQUFDLENBQUM7Z0JBRUgsK0VBQStFO2dCQUMvRSxJQUFJLENBQUMsTUFBTSxDQUFDLElB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SUFBQyxPQUFPLEtBQUssRUFBRTtRQUNkLElBQUksZUFBZSxDQUFDLEtBQUssQ0FBQyxFQUFFO1lBQzFCLE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFBLHdCQUFhLEVBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO1lBRXhFLE9BQU87Z0JBQ0wsTUFBTSxFQUFFLEtBQUs7Z0JBQ2IsTUFBTSxFQUFFO29CQUNOO3dCQUNFLElBQUksRUFBRSxLQUFLLENBQUMsT0FBTztxQkFDcEI7aUJBQ0Y7Z0JBQ0QsUUFBUTtnQkFDUixVQUFVLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTO2FBQ3RDLENBQUM7U0FDSDtRQUVELE1BQU0sS0FBSyxDQUFDO0tBQ2I7QUFDSCxDQUFDO0FBRUQsU0FBUyxxQkFBcUIsQ0FDNUIsU0FBeUQsRUFDekQsSUFBWTtJQUVaLGlHQUFpRztJQUNqRyxzREFBc0Q7SUFDdEQsU0FBUyxDQUFDLE9BQU8sR0FBRyxTQUFTLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsSUFBQSxvQkFBUSxFQUFDLElBQUksRUFBRSxJQUFBLHdCQUFhLEVBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBRTdGLE1BQU0sWUFBWSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7SUFFeEYsT0FBTyxtRUFBbUUsWUFBWSxLQUFLLENBQUM7QUFDOUYsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgdHlwZSB7IE9uTG9hZFJlc3VsdCwgUGFydGlhbE1lc3NhZ2UsIFBsdWdpbiwgUGx1Z2luQnVpbGQsIFJlc29sdmVSZXN1bHQgfSBmcm9tICdlc2J1aWxkJztcbmltcG9ydCBhc3NlcnQgZnJvbSAnbm9kZTphc3NlcnQnO1xuaW1wb3J0IHsgcmVhZEZpbGUgfSBmcm9tICdub2RlOmZzL3Byb21pc2VzJztcbmltcG9ydCB7IGRpcm5hbWUsIGV4dG5hbWUsIGpvaW4sIHJlbGF0aXZlIH0gZnJvbSAnbm9kZTpwYXRoJztcbmltcG9ydCB7IGZpbGVVUkxUb1BhdGgsIHBhdGhUb0ZpbGVVUkwgfSBmcm9tICdub2RlOnVybCc7XG5pbXBvcnQgdHlwZSB7IENvbXBpbGVSZXN1bHQsIEV4Y2VwdGlvbiwgU3ludGF4IH0gZnJvbSAnc2Fzcyc7XG5pbXBvcnQgdHlwZSB7XG4gIEZpbGVJbXBvcnRlcldpdGhSZXF1ZXN0Q29udGV4dE9wdGlvbnMsXG4gIFNhc3NXb3JrZXJJbXBsZW1lbnRhdGlvbixcbn0gZnJvbSAnLi4vLi4vLi4vc2Fzcy9zYXNzLXNlcnZpY2UnO1xuaW1wb3J0IHR5cGUgeyBMb2FkUmVzdWx0Q2FjaGUgfSBmcm9tICcuLi9sb2FkLXJlc3VsdC1jYWNoZSc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2Fzc1BsdWdpbk9wdGlvbnMge1xuICBzb3VyY2VtYXA6IGJvb2xlYW47XG4gIGxvYWRQYXRocz86IHN0cmluZ1tdO1xuICBpbmxpbmVDb21wb25lbnREYXRhPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbn1cblxubGV0IHNhc3NXb3JrZXJQb29sOiBTYXNzV29ya2VySW1wbGVtZW50YXRpb24gfCB1bmRlZmluZWQ7XG5cbmZ1bmN0aW9uIGlzU2Fzc0V4Y2VwdGlvbihlcnJvcjogdW5rbm93bik6IGVycm9yIGlzIEV4Y2VwdGlvbiB7XG4gIHJldHVybiAhIWVycm9yICYmIHR5cGVvZiBlcnJvciA9PT0gJ29iamVjdCcgJiYgJ3Nhc3NNZXNzYWdlJyBpbiBlcnJvcjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNodXRkb3duU2Fzc1dvcmtlclBvb2woKTogdm9pZCB7XG4gIHNhc3NXb3JrZXJQb29sPy5jbG9zZSgpO1xuICBzYXNzV29ya2VyUG9vbCA9IHVuZGVmaW5lZDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVNhc3NQbHVnaW4ob3B0aW9uczogU2Fzc1BsdWdpbk9wdGlvbnMsIGNhY2hlPzogTG9hZFJlc3VsdENhY2hlKTogUGx1Z2luIHtcbiAgcmV0dXJuIHtcbiAgICBuYW1lOiAnYW5ndWxhci1zYXNzJyxcbiAgICBzZXR1cChidWlsZDogUGx1Z2luQnVpbGQpOiB2b2lkIHtcbiAgICAgIGNvbnN0IHJlc29sdmVVcmwgPSBhc3luYyAodXJsOiBzdHJpbmcsIHByZXZpb3VzUmVzb2x2ZWRNb2R1bGVzPzogU2V0PHN0cmluZz4pID0+IHtcbiAgICAgICAgbGV0IHJlc3VsdCA9IGF3YWl0IGJ1aWxkLnJlc29sdmUodXJsLCB7XG4gICAgICAgICAga2luZDogJ2ltcG9ydC1ydWxlJyxcbiAgICAgICAgICAvLyBUaGlzIHNob3VsZCBpZGVhbGx5IGJlIHRoZSBkaXJlY3Rvcnkgb2YgdGhlIGltcG9ydGVyIGZpbGUgZnJvbSBTYXNzXG4gICAgICAgICAgLy8gYnV0IHRoYXQgaXMgbm90IGN1cnJlbnRseSBhdmFpbGFibGUgZnJvbSB0aGUgU2FzcyBpbXBvcnRlciBBUEkuXG4gICAgICAgICAgcmVzb2x2ZURpcjogYnVpbGQuaW5pdGlhbE9wdGlvbnMuYWJzV29ya2luZ0RpcixcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gV29ya2Fyb3VuZCB0byBzdXBwb3J0IFlhcm4gUG5QIHdpdGhvdXQgYWNjZXNzIHRvIHRoZSBpbXBvcnRlciBmaWxlIGZyb20gU2Fzc1xuICAgICAgICBpZiAoIXJlc3VsdC5wYXRoICYmIHByZXZpb3VzUmVzb2x2ZWRNb2R1bGVzPy5zaXplKSB7XG4gICAgICAgICAgZm9yIChjb25zdCBwcmV2aW91cyBvZiBwcmV2aW91c1Jlc29sdmVkTW9kdWxlcykge1xuICAgICAgICAgICAgcmVzdWx0ID0gYXdhaXQgYnVpbGQucmVzb2x2ZSh1cmwsIHtcbiAgICAgICAgICAgICAga2luZDogJ2ltcG9ydC1ydWxlJyxcbiAgICAgICAgICAgICAgcmVzb2x2ZURpcjogcHJldmlvdXMsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmIChyZXN1bHQucGF0aCkge1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfTtcblxuICAgICAgYnVpbGQub25Mb2FkKHsgZmlsdGVyOiAvXnNbYWNdc3M7LywgbmFtZXNwYWNlOiAnYW5ndWxhcjpzdHlsZXMvY29tcG9uZW50JyB9LCBhc3luYyAoYXJncykgPT4ge1xuICAgICAgICBjb25zdCBkYXRhID0gb3B0aW9ucy5pbmxpbmVDb21wb25lbnREYXRhPy5bYXJncy5wYXRoXTtcbiAgICAgICAgYXNzZXJ0KFxuICAgICAgICAgIHR5cGVvZiBkYXRhID09PSAnc3RyaW5nJyxcbiAgICAgICAgICBgY29tcG9uZW50IHN0eWxlIG5hbWUgc2hvdWxkIGFsd2F5cyBiZSBmb3VuZCBbJHthcmdzLnBhdGh9XWAsXG4gICAgICAgICk7XG5cbiAgICAgICAgbGV0IHJlc3VsdCA9IGNhY2hlPy5nZXQoZGF0YSk7XG4gICAgICAgIGlmIChyZXN1bHQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIGNvbnN0IFtsYW5ndWFnZSwgLCBmaWxlUGF0aF0gPSBhcmdzLnBhdGguc3BsaXQoJzsnLCAzKTtcbiAgICAgICAgICBjb25zdCBzeW50YXggPSBsYW5ndWFnZSA9PT0gJ3Nhc3MnID8gJ2luZGVudGVkJyA6ICdzY3NzJztcblxuICAgICAgICAgIHJlc3VsdCA9IGF3YWl0IGNvbXBpbGVTdHJpbmcoZGF0YSwgZmlsZVBhdGgsIHN5bnRheCwgb3B0aW9ucywgcmVzb2x2ZVVybCk7XG4gICAgICAgICAgaWYgKHJlc3VsdC5lcnJvcnMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgLy8gQ2FjaGUgdGhlIHJlc3VsdCBpZiB0aGVyZSB3ZXJlIG5vIGVycm9yc1xuICAgICAgICAgICAgYXdhaXQgY2FjaGU/LnB1dChkYXRhLCByZXN1bHQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICB9KTtcblxuICAgICAgYnVpbGQub25Mb2FkKHsgZmlsdGVyOiAvXFwuc1thY11zcyQvIH0sIGFzeW5jIChhcmdzKSA9PiB7XG4gICAgICAgIGxldCByZXN1bHQgPSBjYWNoZT8uZ2V0KGFyZ3MucGF0aCk7XG4gICAgICAgIGlmIChyZXN1bHQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZWFkRmlsZShhcmdzLnBhdGgsICd1dGYtOCcpO1xuICAgICAgICAgIGNvbnN0IHN5bnRheCA9IGV4dG5hbWUoYXJncy5wYXRoKS50b0xvd2VyQ2FzZSgpID09PSAnLnNhc3MnID8gJ2luZGVudGVkJyA6ICdzY3NzJztcblxuICAgICAgICAgIHJlc3VsdCA9IGF3YWl0IGNvbXBpbGVTdHJpbmcoZGF0YSwgYXJncy5wYXRoLCBzeW50YXgsIG9wdGlvbnMsIHJlc29sdmVVcmwpO1xuICAgICAgICAgIGlmIChyZXN1bHQuZXJyb3JzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIC8vIENhY2hlIHRoZSByZXN1bHQgaWYgdGhlcmUgd2VyZSBubyBlcnJvcnNcbiAgICAgICAgICAgIGF3YWl0IGNhY2hlPy5wdXQoYXJncy5wYXRoLCByZXN1bHQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICB9KTtcbiAgICB9LFxuICB9O1xufVxuXG5hc3luYyBmdW5jdGlvbiBjb21waWxlU3RyaW5nKFxuICBkYXRhOiBzdHJpbmcsXG4gIGZpbGVQYXRoOiBzdHJpbmcsXG4gIHN5bnRheDogU3ludGF4LFxuICBvcHRpb25zOiBTYXNzUGx1Z2luT3B0aW9ucyxcbiAgcmVzb2x2ZVVybDogKHVybDogc3RyaW5nLCBwcmV2aW91c1Jlc29sdmVkTW9kdWxlcz86IFNldDxzdHJpbmc+KSA9PiBQcm9taXNlPFJlc29sdmVSZXN1bHQ+LFxuKTogUHJvbWlzZTxPbkxvYWRSZXN1bHQ+IHtcbiAgLy8gTGF6aWx5IGxvYWQgU2FzcyB3aGVuIGEgU2FzcyBmaWxlIGlzIGZvdW5kXG4gIGlmIChzYXNzV29ya2VyUG9vbCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgY29uc3Qgc2Fzc1NlcnZpY2UgPSBhd2FpdCBpbXBvcnQoJy4uLy4uLy4uL3Nhc3Mvc2Fzcy1zZXJ2aWNlJyk7XG4gICAgc2Fzc1dvcmtlclBvb2wgPSBuZXcgc2Fzc1NlcnZpY2UuU2Fzc1dvcmtlckltcGxlbWVudGF0aW9uKHRydWUpO1xuICB9XG5cbiAgY29uc3Qgd2FybmluZ3M6IFBhcnRpYWxNZXNzYWdlW10gPSBbXTtcbiAgdHJ5IHtcbiAgICBjb25zdCB7IGNzcywgc291cmNlTWFwLCBsb2FkZWRVcmxzIH0gPSBhd2FpdCBzYXNzV29ya2VyUG9vbC5jb21waWxlU3RyaW5nQXN5bmMoZGF0YSwge1xuICAgICAgdXJsOiBwYXRoVG9GaWxlVVJMKGZpbGVQYXRoKSxcbiAgICAgIHN0eWxlOiAnZXhwYW5kZWQnLFxuICAgICAgc3ludGF4LFxuICAgICAgbG9hZFBhdGhzOiBvcHRpb25zLmxvYWRQYXRocyxcbiAgICAgIHNvdXJjZU1hcDogb3B0aW9ucy5zb3VyY2VtYXAsXG4gICAgICBzb3VyY2VNYXBJbmNsdWRlU291cmNlczogb3B0aW9ucy5zb3VyY2VtYXAsXG4gICAgICBxdWlldERlcHM6IHRydWUsXG4gICAgICBpbXBvcnRlcnM6IFtcbiAgICAgICAge1xuICAgICAgICAgIGZpbmRGaWxlVXJsOiBhc3luYyAoXG4gICAgICAgICAgICB1cmwsXG4gICAgICAgICAgICB7IHByZXZpb3VzUmVzb2x2ZWRNb2R1bGVzIH06IEZpbGVJbXBvcnRlcldpdGhSZXF1ZXN0Q29udGV4dE9wdGlvbnMsXG4gICAgICAgICAgKTogUHJvbWlzZTxVUkwgfCBudWxsPiA9PiB7XG4gICAgICAgICAgICBsZXQgcmVzdWx0ID0gYXdhaXQgcmVzb2x2ZVVybCh1cmwpO1xuICAgICAgICAgICAgaWYgKHJlc3VsdC5wYXRoKSB7XG4gICAgICAgICAgICAgIHJldHVybiBwYXRoVG9GaWxlVVJMKHJlc3VsdC5wYXRoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gQ2hlY2sgZm9yIHBhY2thZ2UgZGVlcCBpbXBvcnRzXG4gICAgICAgICAgICBjb25zdCBwYXJ0cyA9IHVybC5zcGxpdCgnLycpO1xuICAgICAgICAgICAgY29uc3QgaGFzU2NvcGUgPSBwYXJ0cy5sZW5ndGggPj0gMiAmJiBwYXJ0c1swXS5zdGFydHNXaXRoKCdAJyk7XG4gICAgICAgICAgICBjb25zdCBbbmFtZU9yU2NvcGUsIG5hbWVPckZpcnN0UGF0aCwgLi4ucGF0aFBhcnRdID0gcGFydHM7XG4gICAgICAgICAgICBjb25zdCBwYWNrYWdlTmFtZSA9IGhhc1Njb3BlID8gYCR7bmFtZU9yU2NvcGV9LyR7bmFtZU9yRmlyc3RQYXRofWAgOiBuYW1lT3JTY29wZTtcblxuICAgICAgICAgICAgbGV0IHBhY2thZ2VSZXN1bHQgPSBhd2FpdCByZXNvbHZlVXJsKHBhY2thZ2VOYW1lICsgJy9wYWNrYWdlLmpzb24nKTtcblxuICAgICAgICAgICAgaWYgKHBhY2thZ2VSZXN1bHQucGF0aCkge1xuICAgICAgICAgICAgICByZXR1cm4gcGF0aFRvRmlsZVVSTChcbiAgICAgICAgICAgICAgICBqb2luKFxuICAgICAgICAgICAgICAgICAgZGlybmFtZShwYWNrYWdlUmVzdWx0LnBhdGgpLFxuICAgICAgICAgICAgICAgICAgIWhhc1Njb3BlICYmIG5hbWVPckZpcnN0UGF0aCA/IG5hbWVPckZpcnN0UGF0aCA6ICcnLFxuICAgICAgICAgICAgICAgICAgLi4ucGF0aFBhcnQsXG4gICAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gQ2hlY2sgd2l0aCBZYXJuIFBuUCB3b3JrYXJvdW5kIHVzaW5nIHByZXZpb3VzIHJlc29sdmVkIG1vZHVsZXMuXG4gICAgICAgICAgICAvLyBUaGlzIGlzIGRvbmUgbGFzdCB0byBhdm9pZCBhIHBlcmZvcm1hbmNlIHBlbmFsdHkgZm9yIGNvbW1vbiBjYXNlcy5cblxuICAgICAgICAgICAgcmVzdWx0ID0gYXdhaXQgcmVzb2x2ZVVybCh1cmwsIHByZXZpb3VzUmVzb2x2ZWRNb2R1bGVzKTtcbiAgICAgICAgICAgIGlmIChyZXN1bHQucGF0aCkge1xuICAgICAgICAgICAgICByZXR1cm4gcGF0aFRvRmlsZVVSTChyZXN1bHQucGF0aCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHBhY2thZ2VSZXN1bHQgPSBhd2FpdCByZXNvbHZlVXJsKFxuICAgICAgICAgICAgICBwYWNrYWdlTmFtZSArICcvcGFja2FnZS5qc29uJyxcbiAgICAgICAgICAgICAgcHJldmlvdXNSZXNvbHZlZE1vZHVsZXMsXG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICBpZiAocGFja2FnZVJlc3VsdC5wYXRoKSB7XG4gICAgICAgICAgICAgIHJldHVybiBwYXRoVG9GaWxlVVJMKFxuICAgICAgICAgICAgICAgIGpvaW4oXG4gICAgICAgICAgICAgICAgICBkaXJuYW1lKHBhY2thZ2VSZXN1bHQucGF0aCksXG4gICAgICAgICAgICAgICAgICAhaGFzU2NvcGUgJiYgbmFtZU9yRmlyc3RQYXRoID8gbmFtZU9yRmlyc3RQYXRoIDogJycsXG4gICAgICAgICAgICAgICAgICAuLi5wYXRoUGFydCxcbiAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBOb3QgZm91bmRcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgICAgbG9nZ2VyOiB7XG4gICAgICAgIHdhcm46ICh0ZXh0LCB7IGRlcHJlY2F0aW9uLCBzcGFuIH0pID0+IHtcbiAgICAgICAgICB3YXJuaW5ncy5wdXNoKHtcbiAgICAgICAgICAgIHRleHQ6IGRlcHJlY2F0aW9uID8gJ0RlcHJlY2F0aW9uJyA6IHRleHQsXG4gICAgICAgICAgICBsb2NhdGlvbjogc3BhbiAmJiB7XG4gICAgICAgICAgICAgIGZpbGU6IHNwYW4udXJsICYmIGZpbGVVUkxUb1BhdGgoc3Bhbi51cmwpLFxuICAgICAgICAgICAgICBsaW5lVGV4dDogc3Bhbi5jb250ZXh0LFxuICAgICAgICAgICAgICAvLyBTYXNzIGxpbmUgbnVtYmVycyBhcmUgMC1iYXNlZCB3aGlsZSBlc2J1aWxkJ3MgYXJlIDEtYmFzZWRcbiAgICAgICAgICAgICAgbGluZTogc3Bhbi5zdGFydC5saW5lICsgMSxcbiAgICAgICAgICAgICAgY29sdW1uOiBzcGFuLnN0YXJ0LmNvbHVtbixcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBub3RlczogZGVwcmVjYXRpb24gPyBbeyB0ZXh0IH1dIDogdW5kZWZpbmVkLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIHJldHVybiB7XG4gICAgICBsb2FkZXI6ICdjc3MnLFxuICAgICAgY29udGVudHM6IHNvdXJjZU1hcCA/IGAke2Nzc31cXG4ke3NvdXJjZU1hcFRvVXJsQ29tbWVudChzb3VyY2VNYXAsIGRpcm5hbWUoZmlsZVBhdGgpKX1gIDogY3NzLFxuICAgICAgd2F0Y2hGaWxlczogbG9hZGVkVXJscy5tYXAoKHVybCkgPT4gZmlsZVVSTFRvUGF0aCh1cmwpKSxcbiAgICAgIHdhcm5pbmdzLFxuICAgIH07XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgaWYgKGlzU2Fzc0V4Y2VwdGlvbihlcnJvcikpIHtcbiAgICAgIGNvbnN0IGZpbGUgPSBlcnJvci5zcGFuLnVybCA/IGZpbGVVUkxUb1BhdGgoZXJyb3Iuc3Bhbi51cmwpIDogdW5kZWZpbmVkO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBsb2FkZXI6ICdjc3MnLFxuICAgICAgICBlcnJvcnM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICB0ZXh0OiBlcnJvci5tZXNzYWdlLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICAgIHdhcm5pbmdzLFxuICAgICAgICB3YXRjaEZpbGVzOiBmaWxlID8gW2ZpbGVdIDogdW5kZWZpbmVkLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICB0aHJvdyBlcnJvcjtcbiAgfVxufVxuXG5mdW5jdGlvbiBzb3VyY2VNYXBUb1VybENvbW1lbnQoXG4gIHNvdXJjZU1hcDogRXhjbHVkZTxDb21waWxlUmVzdWx0Wydzb3VyY2VNYXAnXSwgdW5kZWZpbmVkPixcbiAgcm9vdDogc3RyaW5nLFxuKTogc3RyaW5nIHtcbiAgLy8gUmVtb3ZlIGBmaWxlYCBwcm90b2NvbCBmcm9tIGFsbCBzb3VyY2VtYXAgc291cmNlcyBhbmQgYWRqdXN0IHRvIGJlIHJlbGF0aXZlIHRvIHRoZSBpbnB1dCBmaWxlLlxuICAvLyBUaGlzIGFsbG93cyBlc2J1aWxkIHRvIGNvcnJlY3RseSBwcm9jZXNzIHRoZSBwYXRocy5cbiAgc291cmNlTWFwLnNvdXJjZXMgPSBzb3VyY2VNYXAuc291cmNlcy5tYXAoKHNvdXJjZSkgPT4gcmVsYXRpdmUocm9vdCwgZmlsZVVSTFRvUGF0aChzb3VyY2UpKSk7XG5cbiAgY29uc3QgdXJsU291cmNlTWFwID0gQnVmZmVyLmZyb20oSlNPTi5zdHJpbmdpZnkoc291cmNlTWFwKSwgJ3V0Zi04JykudG9TdHJpbmcoJ2Jhc2U2NCcpO1xuXG4gIHJldHVybiBgLyojIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2NoYXJzZXQ9dXRmLTg7YmFzZTY0LCR7dXJsU291cmNlTWFwfSAqL2A7XG59XG4iXX0=