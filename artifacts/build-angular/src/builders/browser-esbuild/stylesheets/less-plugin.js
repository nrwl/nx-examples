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
exports.createLessPlugin = void 0;
const node_assert_1 = __importDefault(require("node:assert"));
const promises_1 = require("node:fs/promises");
/**
 * The lazy-loaded instance of the less stylesheet preprocessor.
 * It is only imported and initialized if a less stylesheet is used.
 */
let lessPreprocessor;
function isLessException(error) {
    return !!error && typeof error === 'object' && 'column' in error;
}
function createLessPlugin(options) {
    return {
        name: 'angular-less',
        setup(build) {
            // Add a load callback to support inline Component styles
            build.onLoad({ filter: /^less;/, namespace: 'angular:styles/component' }, async (args) => {
                const data = options.inlineComponentData?.[args.path];
                (0, node_assert_1.default)(typeof data === 'string', `component style name should always be found [${args.path}]`);
                const [, , filePath] = args.path.split(';', 3);
                return compileString(data, filePath, options, build.resolve.bind(build));
            });
            // Add a load callback to support files from disk
            build.onLoad({ filter: /\.less$/ }, async (args) => {
                const data = await (0, promises_1.readFile)(args.path, 'utf-8');
                return compileString(data, args.path, options, build.resolve.bind(build));
            });
        },
    };
}
exports.createLessPlugin = createLessPlugin;
async function compileString(data, filename, options, resolver) {
    const less = (lessPreprocessor ?? (lessPreprocessor = (await Promise.resolve().then(() => __importStar(require('less')))).default));
    const resolverPlugin = {
        install({ FileManager }, pluginManager) {
            const resolverFileManager = new (class extends FileManager {
                supportsSync() {
                    return false;
                }
                supports() {
                    return true;
                }
                async loadFile(filename, currentDirectory, options, environment) {
                    // Attempt direct loading as a relative path to avoid resolution overhead
                    try {
                        return await super.loadFile(filename, currentDirectory, options, environment);
                    }
                    catch (error) {
                        // Attempt a full resolution if not found
                        const fullResult = await resolver(filename, {
                            kind: 'import-rule',
                            resolveDir: currentDirectory,
                        });
                        if (fullResult.path) {
                            return {
                                filename: fullResult.path,
                                contents: await (0, promises_1.readFile)(fullResult.path, 'utf-8'),
                            };
                        }
                        // Otherwise error by throwing the failing direct result
                        throw error;
                    }
                }
            })();
            pluginManager.addFileManager(resolverFileManager);
        },
    };
    try {
        const result = await less.render(data, {
            filename,
            paths: options.includePaths,
            plugins: [resolverPlugin],
            rewriteUrls: 'all',
            sourceMap: options.sourcemap
                ? {
                    sourceMapFileInline: true,
                    outputSourceFiles: true,
                }
                : undefined,
        });
        return {
            contents: result.css,
            loader: 'css',
        };
    }
    catch (error) {
        if (isLessException(error)) {
            return {
                errors: [
                    {
                        text: error.message,
                        location: {
                            file: error.filename,
                            line: error.line,
                            column: error.column,
                            // Middle element represents the line containing the error
                            lineText: error.extract && error.extract[Math.trunc(error.extract.length / 2)],
                        },
                    },
                ],
                loader: 'css',
            };
        }
        throw error;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGVzcy1wbHVnaW4uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy9idWlsZGVycy9icm93c2VyLWVzYnVpbGQvc3R5bGVzaGVldHMvbGVzcy1wbHVnaW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFHSCw4REFBaUM7QUFDakMsK0NBQTRDO0FBRTVDOzs7R0FHRztBQUNILElBQUksZ0JBQW1ELENBQUM7QUFleEQsU0FBUyxlQUFlLENBQUMsS0FBYztJQUNyQyxPQUFPLENBQUMsQ0FBQyxLQUFLLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxJQUFJLFFBQVEsSUFBSSxLQUFLLENBQUM7QUFDbkUsQ0FBQztBQUVELFNBQWdCLGdCQUFnQixDQUFDLE9BQTBCO0lBQ3pELE9BQU87UUFDTCxJQUFJLEVBQUUsY0FBYztRQUNwQixLQUFLLENBQUMsS0FBa0I7WUFDdEIseURBQXlEO1lBQ3pELEtBQUssQ0FBQyxNQUFNLENBQUMsRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLFNBQVMsRUFBRSwwQkFBMEIsRUFBRSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsRUFBRTtnQkFDdkYsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLG1CQUFtQixFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUN0RCxJQUFBLHFCQUFNLEVBQ0osT0FBTyxJQUFJLEtBQUssUUFBUSxFQUN4QixnREFBZ0QsSUFBSSxDQUFDLElBQUksR0FBRyxDQUM3RCxDQUFDO2dCQUVGLE1BQU0sQ0FBQyxFQUFFLEFBQUQsRUFBRyxRQUFRLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBRS9DLE9B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LEtBQUs7U0FDZCxDQUFDO0tBQ0g7SUFBQyxPQUFPLEtBQUssRUFBRTtRQUNkLElBQUksZUFBZSxDQUFDLEtBQUssQ0FBQyxFQUFFO1lBQzFCLE9BQU87Z0JBQ0wsTUFBTSxFQUFFO29CQUNOO3dCQUNFLElBQUksRUFBRSxLQUFLLENBQUMsT0FBTzt3QkFDbkIsUUFBUSxFQUFFOzRCQUNSLElBQUksRUFBRSxLQUFLLENBQUMsUUFBUTs0QkFDcEIsSUFBSSxFQUFFLEtBQUssQ0FBQyxJQUFJOzRCQUNoQixNQUFNLEVBQUUsS0FBSyxDQUFDLE1BQU07NEJBQ3BCLDBEQUEwRDs0QkFDMUQsUUFBUSxFQUFFLEtBQUssQ0FBQyxPQUFPLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO3lCQUMvRTtxQkFDRjtpQkFDRjtnQkFDRCxNQUFNLEVBQUUsS0FBSzthQUNkLENBQUM7U0FDSDtRQUVELE1BQU0sS0FBSyxDQUFDO0tBQ2I7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB0eXBlIHsgT25Mb2FkUmVzdWx0LCBQbHVnaW4sIFBsdWdpbkJ1aWxkIH0gZnJvbSAnZXNidWlsZCc7XG5pbXBvcnQgYXNzZXJ0IGZyb20gJ25vZGU6YXNzZXJ0JztcbmltcG9ydCB7IHJlYWRGaWxlIH0gZnJvbSAnbm9kZTpmcy9wcm9taXNlcyc7XG5cbi8qKlxuICogVGhlIGxhenktbG9hZGVkIGluc3RhbmNlIG9mIHRoZSBsZXNzIHN0eWxlc2hlZXQgcHJlcHJvY2Vzc29yLlxuICogSXQgaXMgb25seSBpbXBvcnRlZCBhbmQgaW5pdGlhbGl6ZWQgaWYgYSBsZXNzIHN0eWxlc2hlZXQgaXMgdXNlZC5cbiAqL1xubGV0IGxlc3NQcmVwcm9jZXNzb3I6IHR5cGVvZiBpbXBvcnQoJ2xlc3MnKSB8IHVuZGVmaW5lZDtcblxuZXhwb3J0IGludGVyZmFjZSBMZXNzUGx1Z2luT3B0aW9ucyB7XG4gIHNvdXJjZW1hcDogYm9vbGVhbjtcbiAgaW5jbHVkZVBhdGhzPzogc3RyaW5nW107XG4gIGlubGluZUNvbXBvbmVudERhdGE/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xufVxuXG5pbnRlcmZhY2UgTGVzc0V4Y2VwdGlvbiBleHRlbmRzIEVycm9yIHtcbiAgZmlsZW5hbWU6IHN0cmluZztcbiAgbGluZTogbnVtYmVyO1xuICBjb2x1bW46IG51bWJlcjtcbiAgZXh0cmFjdD86IHN0cmluZ1tdO1xufVxuXG5mdW5jdGlvbiBpc0xlc3NFeGNlcHRpb24oZXJyb3I6IHVua25vd24pOiBlcnJvciBpcyBMZXNzRXhjZXB0aW9uIHtcbiAgcmV0dXJuICEhZXJyb3IgJiYgdHlwZW9mIGVycm9yID09PSAnb2JqZWN0JyAmJiAnY29sdW1uJyBpbiBlcnJvcjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUxlc3NQbHVnaW4ob3B0aW9uczogTGVzc1BsdWdpbk9wdGlvbnMpOiBQbHVnaW4ge1xuICByZXR1cm4ge1xuICAgIG5hbWU6ICdhbmd1bGFyLWxlc3MnLFxuICAgIHNldHVwKGJ1aWxkOiBQbHVnaW5CdWlsZCk6IHZvaWQge1xuICAgICAgLy8gQWRkIGEgbG9hZCBjYWxsYmFjayB0byBzdXBwb3J0IGlubGluZSBDb21wb25lbnQgc3R5bGVzXG4gICAgICBidWlsZC5vbkxvYWQoeyBmaWx0ZXI6IC9ebGVzczsvLCBuYW1lc3BhY2U6ICdhbmd1bGFyOnN0eWxlcy9jb21wb25lbnQnIH0sIGFzeW5jIChhcmdzKSA9PiB7XG4gICAgICAgIGNvbnN0IGRhdGEgPSBvcHRpb25zLmlubGluZUNvbXBvbmVudERhdGE/LlthcmdzLnBhdGhdO1xuICAgICAgICBhc3NlcnQoXG4gICAgICAgICAgdHlwZW9mIGRhdGEgPT09ICdzdHJpbmcnLFxuICAgICAgICAgIGBjb21wb25lbnQgc3R5bGUgbmFtZSBzaG91bGQgYWx3YXlzIGJlIGZvdW5kIFske2FyZ3MucGF0aH1dYCxcbiAgICAgICAgKTtcblxuICAgICAgICBjb25zdCBbLCAsIGZpbGVQYXRoXSA9IGFyZ3MucGF0aC5zcGxpdCgnOycsIDMpO1xuXG4gICAgICAgIHJldHVybiBjb21waWxlU3RyaW5nKGRhdGEsIGZpbGVQYXRoLCBvcHRpb25zLCBidWlsZC5yZXNvbHZlLmJpbmQoYnVpbGQpKTtcbiAgICAgIH0pO1xuXG4gICAgICAvLyBBZGQgYSBsb2FkIGNhbGxiYWNrIHRvIHN1cHBvcnQgZmlsZXMgZnJvbSBkaXNrXG4gICAgICBidWlsZC5vbkxvYWQoeyBmaWx0ZXI6IC9cXC5sZXNzJC8gfSwgYXN5bmMgKGFyZ3MpID0+IHtcbiAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlYWRGaWxlKGFyZ3MucGF0aCwgJ3V0Zi04Jyk7XG5cbiAgICAgICAgcmV0dXJuIGNvbXBpbGVTdHJpbmcoZGF0YSwgYXJncy5wYXRoLCBvcHRpb25zLCBidWlsZC5yZXNvbHZlLmJpbmQoYnVpbGQpKTtcbiAgICAgIH0pO1xuICAgIH0sXG4gIH07XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNvbXBpbGVTdHJpbmcoXG4gIGRhdGE6IHN0cmluZyxcbiAgZmlsZW5hbWU6IHN0cmluZyxcbiAgb3B0aW9uczogTGVzc1BsdWdpbk9wdGlvbnMsXG4gIHJlc29sdmVyOiBQbHVnaW5CdWlsZFsncmVzb2x2ZSddLFxuKTogUHJvbWlzZTxPbkxvYWRSZXN1bHQ+IHtcbiAgY29uc3QgbGVzcyA9IChsZXNzUHJlcHJvY2Vzc29yID8/PSAoYXdhaXQgaW1wb3J0KCdsZXNzJykpLmRlZmF1bHQpO1xuXG4gIGNvbnN0IHJlc29sdmVyUGx1Z2luOiBMZXNzLlBsdWdpbiA9IHtcbiAgICBpbnN0YWxsKHsgRmlsZU1hbmFnZXIgfSwgcGx1Z2luTWFuYWdlcik6IHZvaWQge1xuICAgICAgY29uc3QgcmVzb2x2ZXJGaWxlTWFuYWdlciA9IG5ldyAoY2xhc3MgZXh0ZW5kcyBGaWxlTWFuYWdlciB7XG4gICAgICAgIG92ZXJyaWRlIHN1cHBvcnRzU3luYygpOiBib29sZWFuIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBvdmVycmlkZSBzdXBwb3J0cygpOiBib29sZWFuIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIG92ZXJyaWRlIGFzeW5jIGxvYWRGaWxlKFxuICAgICAgICAgIGZpbGVuYW1lOiBzdHJpbmcsXG4gICAgICAgICAgY3VycmVudERpcmVjdG9yeTogc3RyaW5nLFxuICAgICAgICAgIG9wdGlvbnM6IExlc3MuTG9hZEZpbGVPcHRpb25zLFxuICAgICAgICAgIGVudmlyb25tZW50OiBMZXNzLkVudmlyb25tZW50LFxuICAgICAgICApOiBQcm9taXNlPExlc3MuRmlsZUxvYWRSZXN1bHQ+IHtcbiAgICAgICAgICAvLyBBdHRlbXB0IGRpcmVjdCBsb2FkaW5nIGFzIGEgcmVsYXRpdmUgcGF0aCB0byBhdm9pZCByZXNvbHV0aW9uIG92ZXJoZWFkXG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldHVybiBhd2FpdCBzdXBlci5sb2FkRmlsZShmaWxlbmFtZSwgY3VycmVudERpcmVjdG9yeSwgb3B0aW9ucywgZW52aXJvbm1lbnQpO1xuICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAvLyBBdHRlbXB0IGEgZnVsbCByZXNvbHV0aW9uIGlmIG5vdCBmb3VuZFxuICAgICAgICAgICAgY29uc3QgZnVsbFJlc3VsdCA9IGF3YWl0IHJlc29sdmVyKGZpbGVuYW1lLCB7XG4gICAgICAgICAgICAgIGtpbmQ6ICdpbXBvcnQtcnVsZScsXG4gICAgICAgICAgICAgIHJlc29sdmVEaXI6IGN1cnJlbnREaXJlY3RvcnksXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmIChmdWxsUmVzdWx0LnBhdGgpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBmaWxlbmFtZTogZnVsbFJlc3VsdC5wYXRoLFxuICAgICAgICAgICAgICAgIGNvbnRlbnRzOiBhd2FpdCByZWFkRmlsZShmdWxsUmVzdWx0LnBhdGgsICd1dGYtOCcpLFxuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gT3RoZXJ3aXNlIGVycm9yIGJ5IHRocm93aW5nIHRoZSBmYWlsaW5nIGRpcmVjdCByZXN1bHRcbiAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSkoKTtcblxuICAgICAgcGx1Z2luTWFuYWdlci5hZGRGaWxlTWFuYWdlcihyZXNvbHZlckZpbGVNYW5hZ2VyKTtcbiAgICB9LFxuICB9O1xuXG4gIHRyeSB7XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgbGVzcy5yZW5kZXIoZGF0YSwge1xuICAgICAgZmlsZW5hbWUsXG4gICAgICBwYXRoczogb3B0aW9ucy5pbmNsdWRlUGF0aHMsXG4gICAgICBwbHVnaW5zOiBbcmVzb2x2ZXJQbHVnaW5dLFxuICAgICAgcmV3cml0ZVVybHM6ICdhbGwnLFxuICAgICAgc291cmNlTWFwOiBvcHRpb25zLnNvdXJjZW1hcFxuICAgICAgICA/IHtcbiAgICAgICAgICAgIHNvdXJjZU1hcEZpbGVJbmxpbmU6IHRydWUsXG4gICAgICAgICAgICBvdXRwdXRTb3VyY2VGaWxlczogdHJ1ZSxcbiAgICAgICAgICB9XG4gICAgICAgIDogdW5kZWZpbmVkLFxuICAgIH0gYXMgTGVzcy5PcHRpb25zKTtcblxuICAgIHJldHVybiB7XG4gICAgICBjb250ZW50czogcmVzdWx0LmNzcyxcbiAgICAgIGxvYWRlcjogJ2NzcycsXG4gICAgfTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBpZiAoaXNMZXNzRXhjZXB0aW9uKGVycm9yKSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgZXJyb3JzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgdGV4dDogZXJyb3IubWVzc2FnZSxcbiAgICAgICAgICAgIGxvY2F0aW9uOiB7XG4gICAgICAgICAgICAgIGZpbGU6IGVycm9yLmZpbGVuYW1lLFxuICAgICAgICAgICAgICBsaW5lOiBlcnJvci5saW5lLFxuICAgICAgICAgICAgICBjb2x1bW46IGVycm9yLmNvbHVtbixcbiAgICAgICAgICAgICAgLy8gTWlkZGxlIGVsZW1lbnQgcmVwcmVzZW50cyB0aGUgbGluZSBjb250YWluaW5nIHRoZSBlcnJvclxuICAgICAgICAgICAgICBsaW5lVGV4dDogZXJyb3IuZXh0cmFjdCAmJiBlcnJvci5leHRyYWN0W01hdGgudHJ1bmMoZXJyb3IuZXh0cmFjdC5sZW5ndGggLyAyKV0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICAgIGxvYWRlcjogJ2NzcycsXG4gICAgICB9O1xuICAgIH1cblxuICAgIHRocm93IGVycm9yO1xuICB9XG59XG4iXX0=