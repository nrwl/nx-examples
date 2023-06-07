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
exports.createCssPlugin = void 0;
const autoprefixer_1 = __importDefault(require("autoprefixer"));
const node_assert_1 = __importDefault(require("node:assert"));
const promises_1 = require("node:fs/promises");
/**
 * The lazy-loaded instance of the postcss stylesheet postprocessor.
 * It is only imported and initialized if postcss is needed.
 */
let postcss;
/**
 * Creates an esbuild plugin to process CSS stylesheets.
 * @param options An object containing the plugin options.
 * @returns An esbuild Plugin instance.
 */
function createCssPlugin(options) {
    return {
        name: 'angular-css',
        async setup(build) {
            const autoprefixer = (0, autoprefixer_1.default)({
                overrideBrowserslist: options.browsers,
                ignoreUnknownVersions: true,
            });
            // Autoprefixer currently does not contain a method to check if autoprefixer is required
            // based on the provided list of browsers. However, it does contain a method that returns
            // informational text that can be used as a replacement. The text "Awesome!" will be present
            // when autoprefixer determines no actions are needed.
            // ref: https://github.com/postcss/autoprefixer/blob/e2f5c26ff1f3eaca95a21873723ce1cdf6e59f0e/lib/info.js#L118
            const autoprefixerInfo = autoprefixer.info({ from: build.initialOptions.absWorkingDir });
            const skipAutoprefixer = autoprefixerInfo.includes('Awesome!');
            if (skipAutoprefixer && !options.tailwindConfiguration) {
                return;
            }
            postcss ?? (postcss = (await Promise.resolve().then(() => __importStar(require('postcss')))).default);
            const postcssProcessor = postcss();
            if (options.tailwindConfiguration) {
                const tailwind = await Promise.resolve(`${options.tailwindConfiguration.package}`).then(s => __importStar(require(s)));
                postcssProcessor.use(tailwind.default({ config: options.tailwindConfiguration.file }));
            }
            if (!skipAutoprefixer) {
                postcssProcessor.use(autoprefixer);
            }
            // Add a load callback to support inline Component styles
            build.onLoad({ filter: /^css;/, namespace: 'angular:styles/component' }, async (args) => {
                const data = options.inlineComponentData?.[args.path];
                (0, node_assert_1.default)(typeof data === 'string', `component style name should always be found [${args.path}]`);
                const [, , filePath] = args.path.split(';', 3);
                return compileString(data, filePath, postcssProcessor, options);
            });
            // Add a load callback to support files from disk
            build.onLoad({ filter: /\.css$/ }, async (args) => {
                const data = await (0, promises_1.readFile)(args.path, 'utf-8');
                return compileString(data, args.path, postcssProcessor, options);
            });
        },
    };
}
exports.createCssPlugin = createCssPlugin;
/**
 * Compiles the provided CSS stylesheet data using a provided postcss processor and provides an
 * esbuild load result that can be used directly by an esbuild Plugin.
 * @param data The stylesheet content to process.
 * @param filename The name of the file that contains the data.
 * @param postcssProcessor A postcss processor instance to use.
 * @param options The plugin options to control the processing.
 * @returns An esbuild OnLoaderResult object with the processed content, warnings, and/or errors.
 */
async function compileString(data, filename, postcssProcessor, options) {
    try {
        const result = await postcssProcessor.process(data, {
            from: filename,
            to: filename,
            map: options.sourcemap && {
                inline: true,
                sourcesContent: true,
            },
        });
        const rawWarnings = result.warnings();
        let warnings;
        if (rawWarnings.length > 0) {
            const lineMappings = new Map();
            warnings = rawWarnings.map((warning) => {
                const file = warning.node.source?.input.file;
                if (file === undefined) {
                    return { text: warning.text };
                }
                let lines = lineMappings.get(file);
                if (lines === undefined) {
                    lines = warning.node.source?.input.css.split(/\r?\n/);
                    lineMappings.set(file, lines ?? null);
                }
                return {
                    text: warning.text,
                    location: {
                        file,
                        line: warning.line,
                        column: warning.column - 1,
                        lineText: lines?.[warning.line - 1],
                    },
                };
            });
        }
        return {
            contents: result.css,
            loader: 'css',
            warnings,
        };
    }
    catch (error) {
        postcss ?? (postcss = (await Promise.resolve().then(() => __importStar(require('postcss')))).default);
        if (error instanceof postcss.CssSyntaxError) {
            const lines = error.source?.split(/\r?\n/);
            return {
                errors: [
                    {
                        text: error.reason,
                        location: {
                            file: error.file,
                            line: error.line,
                            column: error.column && error.column - 1,
                            lineText: error.line === undefined ? undefined : lines?.[error.line - 1],
                        },
                    },
                ],
            };
        }
        throw error;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3NzLXBsdWdpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2J1aWxkX2FuZ3VsYXIvc3JjL2J1aWxkZXJzL2Jyb3dzZXItZXNidWlsZC9zdHlsZXNoZWV0cy9jc3MtcGx1Z2luLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUgsZ0VBQW9EO0FBRXBELDhEQUFpQztBQUNqQywrQ0FBNEM7QUFFNUM7OztHQUdHO0FBQ0gsSUFBSSxPQUF3RCxDQUFDO0FBMEI3RDs7OztHQUlHO0FBQ0gsU0FBZ0IsZUFBZSxDQUFDLE9BQXlCO0lBQ3ZELE9BQU87UUFDTCxJQUFJLEVBQUUsYUFBYTtRQUNuQixLQUFLLENBQUMsS0FBSyxDQUFDLEtBQWtCO1lBQzVCLE1BQU0sWUFBWSxHQUFHLElBQUEsc0JBQXdCLEVBQUM7Z0JBQzVDLG9CQUFvQixFQUFFLE9BQU8sQ0FBQyxRQUFRO2dCQUN0QyxxQkFBcUIsRUFBRSxJQUFJO2FBQzVCLENBQUMsQ0FBQztZQUVILHdGQUF3RjtZQUN4Rix5RkFBeUY7WUFDekYsNEZBQTRGO1lBQzVGLHNEQUFzRDtZQUN0RCw4R0FBOEc7WUFDOUcsTUFBTSxnQkFBZ0IsR0FBRyxZQUFZLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQyxjQUFjLENBQUMsYUFBYSxFQUFFLENBQUMsQ0FBQztZQUN6RixNQUFNLGdCQUFnQixHQUFHLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUUvRCxJQUFJLGdCQUFnQixJQUFJLENBQUMsT0FBTyxDQUFDLHFCQUFxQixFQUFFO2dCQUN0RCxPQUFPO2FBQ1I7WUFFRCxPQUFPLEtBQVAsT0FBTyxHQUFLLENBQUMsd0RBQWEsU0FBUyxHQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUM7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QU0sRUFBRSxLQUFLLENBQUMsTUFBTSxJQUFJLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQzs0QkFDeEMsUUFBUSxFQUFFLEtBQUssQ0FBQyxJQUFJLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDO3lCQUN6RTtxQkFDRjtpQkFDRjthQUNGLENBQUM7U0FDSDtRQUVELE1BQU0sS0FBSyxDQUFDO0tBQ2I7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCBjcmVhdGVBdXRvUHJlZml4ZXJQbHVnaW4gZnJvbSAnYXV0b3ByZWZpeGVyJztcbmltcG9ydCB0eXBlIHsgT25Mb2FkUmVzdWx0LCBQbHVnaW4sIFBsdWdpbkJ1aWxkIH0gZnJvbSAnZXNidWlsZCc7XG5pbXBvcnQgYXNzZXJ0IGZyb20gJ25vZGU6YXNzZXJ0JztcbmltcG9ydCB7IHJlYWRGaWxlIH0gZnJvbSAnbm9kZTpmcy9wcm9taXNlcyc7XG5cbi8qKlxuICogVGhlIGxhenktbG9hZGVkIGluc3RhbmNlIG9mIHRoZSBwb3N0Y3NzIHN0eWxlc2hlZXQgcG9zdHByb2Nlc3Nvci5cbiAqIEl0IGlzIG9ubHkgaW1wb3J0ZWQgYW5kIGluaXRpYWxpemVkIGlmIHBvc3Rjc3MgaXMgbmVlZGVkLlxuICovXG5sZXQgcG9zdGNzczogdHlwZW9mIGltcG9ydCgncG9zdGNzcycpWydkZWZhdWx0J10gfCB1bmRlZmluZWQ7XG5cbi8qKlxuICogQW4gb2JqZWN0IGNvbnRhaW5pbmcgdGhlIHBsdWdpbiBvcHRpb25zIHRvIHVzZSB3aGVuIHByb2Nlc3NpbmcgQ1NTIHN0eWxlc2hlZXRzLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIENzc1BsdWdpbk9wdGlvbnMge1xuICAvKipcbiAgICogQ29udHJvbHMgdGhlIHVzZSBhbmQgY3JlYXRpb24gb2Ygc291cmNlbWFwcyB3aGVuIHByb2Nlc3NpbmcgdGhlIHN0eWxlc2hlZXRzLlxuICAgKiBJZiB0cnVlLCBzb3VyY2VtYXAgcHJvY2Vzc2luZyBpcyBlbmFibGVkOyBpZiBmYWxzZSwgZGlzYWJsZWQuXG4gICAqL1xuICBzb3VyY2VtYXA6IGJvb2xlYW47XG4gIC8qKlxuICAgKiBPcHRpb25hbCBjb21wb25lbnQgZGF0YSBmb3IgYW55IGlubGluZSBzdHlsZXMgZnJvbSBDb21wb25lbnQgZGVjb3JhdG9yIGBzdHlsZXNgIGZpZWxkcy5cbiAgICogVGhlIGtleSBpcyBhbiBpbnRlcm5hbCBhbmd1bGFyIHJlc291cmNlIFVSSSBhbmQgdGhlIHZhbHVlIGlzIHRoZSBzdHlsZXNoZWV0IGNvbnRlbnQuXG4gICAqL1xuICBpbmxpbmVDb21wb25lbnREYXRhPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbiAgLyoqXG4gICAqIFRoZSBicm93c2VycyB0byBzdXBwb3J0IGluIGJyb3dzZXJzbGlzdCBmb3JtYXQgd2hlbiBwcm9jZXNzaW5nIHN0eWxlc2hlZXRzLlxuICAgKiBTb21lIHBvc3Rjc3MgcGx1Z2lucyBzdWNoIGFzIGF1dG9wcmVmaXhlciByZXF1aXJlIHRoZSByYXcgYnJvd3NlcnNsaXN0IGluZm9ybWF0aW9uIGluc3RlYWRcbiAgICogb2YgdGhlIGVzYnVpbGQgZm9ybWF0dGVkIHRhcmdldC5cbiAgICovXG4gIGJyb3dzZXJzOiBzdHJpbmdbXTtcblxuICB0YWlsd2luZENvbmZpZ3VyYXRpb24/OiB7IGZpbGU6IHN0cmluZzsgcGFja2FnZTogc3RyaW5nIH07XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBlc2J1aWxkIHBsdWdpbiB0byBwcm9jZXNzIENTUyBzdHlsZXNoZWV0cy5cbiAqIEBwYXJhbSBvcHRpb25zIEFuIG9iamVjdCBjb250YWluaW5nIHRoZSBwbHVnaW4gb3B0aW9ucy5cbiAqIEByZXR1cm5zIEFuIGVzYnVpbGQgUGx1Z2luIGluc3RhbmNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlQ3NzUGx1Z2luKG9wdGlvbnM6IENzc1BsdWdpbk9wdGlvbnMpOiBQbHVnaW4ge1xuICByZXR1cm4ge1xuICAgIG5hbWU6ICdhbmd1bGFyLWNzcycsXG4gICAgYXN5bmMgc2V0dXAoYnVpbGQ6IFBsdWdpbkJ1aWxkKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICBjb25zdCBhdXRvcHJlZml4ZXIgPSBjcmVhdGVBdXRvUHJlZml4ZXJQbHVnaW4oe1xuICAgICAgICBvdmVycmlkZUJyb3dzZXJzbGlzdDogb3B0aW9ucy5icm93c2VycyxcbiAgICAgICAgaWdub3JlVW5rbm93blZlcnNpb25zOiB0cnVlLFxuICAgICAgfSk7XG5cbiAgICAgIC8vIEF1dG9wcmVmaXhlciBjdXJyZW50bHkgZG9lcyBub3QgY29udGFpbiBhIG1ldGhvZCB0byBjaGVjayBpZiBhdXRvcHJlZml4ZXIgaXMgcmVxdWlyZWRcbiAgICAgIC8vIGJhc2VkIG9uIHRoZSBwcm92aWRlZCBsaXN0IG9mIGJyb3dzZXJzLiBIb3dldmVyLCBpdCBkb2VzIGNvbnRhaW4gYSBtZXRob2QgdGhhdCByZXR1cm5zXG4gICAgICAvLyBpbmZvcm1hdGlvbmFsIHRleHQgdGhhdCBjYW4gYmUgdXNlZCBhcyBhIHJlcGxhY2VtZW50LiBUaGUgdGV4dCBcIkF3ZXNvbWUhXCIgd2lsbCBiZSBwcmVzZW50XG4gICAgICAvLyB3aGVuIGF1dG9wcmVmaXhlciBkZXRlcm1pbmVzIG5vIGFjdGlvbnMgYXJlIG5lZWRlZC5cbiAgICAgIC8vIHJlZjogaHR0cHM6Ly9naXRodWIuY29tL3Bvc3Rjc3MvYXV0b3ByZWZpeGVyL2Jsb2IvZTJmNWMyNmZmMWYzZWFjYTk1YTIxODczNzIzY2UxY2RmNmU1OWYwZS9saWIvaW5mby5qcyNMMTE4XG4gICAgICBjb25zdCBhdXRvcHJlZml4ZXJJbmZvID0gYXV0b3ByZWZpeGVyLmluZm8oeyBmcm9tOiBidWlsZC5pbml0aWFsT3B0aW9ucy5hYnNXb3JraW5nRGlyIH0pO1xuICAgICAgY29uc3Qgc2tpcEF1dG9wcmVmaXhlciA9IGF1dG9wcmVmaXhlckluZm8uaW5jbHVkZXMoJ0F3ZXNvbWUhJyk7XG5cbiAgICAgIGlmIChza2lwQXV0b3ByZWZpeGVyICYmICFvcHRpb25zLnRhaWx3aW5kQ29uZmlndXJhdGlvbikge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHBvc3Rjc3MgPz89IChhd2FpdCBpbXBvcnQoJ3Bvc3Rjc3MnKSkuZGVmYXVsdDtcbiAgICAgIGNvbnN0IHBvc3Rjc3NQcm9jZXNzb3IgPSBwb3N0Y3NzKCk7XG4gICAgICBpZiAob3B0aW9ucy50YWlsd2luZENvbmZpZ3VyYXRpb24pIHtcbiAgICAgICAgY29uc3QgdGFpbHdpbmQgPSBhd2FpdCBpbXBvcnQob3B0aW9ucy50YWlsd2luZENvbmZpZ3VyYXRpb24ucGFja2FnZSk7XG4gICAgICAgIHBvc3Rjc3NQcm9jZXNzb3IudXNlKHRhaWx3aW5kLmRlZmF1bHQoeyBjb25maWc6IG9wdGlvbnMudGFpbHdpbmRDb25maWd1cmF0aW9uLmZpbGUgfSkpO1xuICAgICAgfVxuICAgICAgaWYgKCFza2lwQXV0b3ByZWZpeGVyKSB7XG4gICAgICAgIHBvc3Rjc3NQcm9jZXNzb3IudXNlKGF1dG9wcmVmaXhlcik7XG4gICAgICB9XG5cbiAgICAgIC8vIEFkZCBhIGxvYWQgY2FsbGJhY2sgdG8gc3VwcG9ydCBpbmxpbmUgQ29tcG9uZW50IHN0eWxlc1xuICAgICAgYnVpbGQub25Mb2FkKHsgZmlsdGVyOiAvXmNzczsvLCBuYW1lc3BhY2U6ICdhbmd1bGFyOnN0eWxlcy9jb21wb25lbnQnIH0sIGFzeW5jIChhcmdzKSA9PiB7XG4gICAgICAgIGNvbnN0IGRhdGEgPSBvcHRpb25zLmlubGluZUNvbXBvbmVudERhdGE/LlthcmdzLnBhdGhdO1xuICAgICAgICBhc3NlcnQoXG4gICAgICAgICAgdHlwZW9mIGRhdGEgPT09ICdzdHJpbmcnLFxuICAgICAgICAgIGBjb21wb25lbnQgc3R5bGUgbmFtZSBzaG91bGQgYWx3YXlzIGJlIGZvdW5kIFske2FyZ3MucGF0aH1dYCxcbiAgICAgICAgKTtcblxuICAgICAgICBjb25zdCBbLCAsIGZpbGVQYXRoXSA9IGFyZ3MucGF0aC5zcGxpdCgnOycsIDMpO1xuXG4gICAgICAgIHJldHVybiBjb21waWxlU3RyaW5nKGRhdGEsIGZpbGVQYXRoLCBwb3N0Y3NzUHJvY2Vzc29yLCBvcHRpb25zKTtcbiAgICAgIH0pO1xuXG4gICAgICAvLyBBZGQgYSBsb2FkIGNhbGxiYWNrIHRvIHN1cHBvcnQgZmlsZXMgZnJvbSBkaXNrXG4gICAgICBidWlsZC5vbkxvYWQoeyBmaWx0ZXI6IC9cXC5jc3MkLyB9LCBhc3luYyAoYXJncykgPT4ge1xuICAgICAgICBjb25zdCBkYXRhID0gYXdhaXQgcmVhZEZpbGUoYXJncy5wYXRoLCAndXRmLTgnKTtcblxuICAgICAgICByZXR1cm4gY29tcGlsZVN0cmluZyhkYXRhLCBhcmdzLnBhdGgsIHBvc3Rjc3NQcm9jZXNzb3IsIG9wdGlvbnMpO1xuICAgICAgfSk7XG4gICAgfSxcbiAgfTtcbn1cblxuLyoqXG4gKiBDb21waWxlcyB0aGUgcHJvdmlkZWQgQ1NTIHN0eWxlc2hlZXQgZGF0YSB1c2luZyBhIHByb3ZpZGVkIHBvc3Rjc3MgcHJvY2Vzc29yIGFuZCBwcm92aWRlcyBhblxuICogZXNidWlsZCBsb2FkIHJlc3VsdCB0aGF0IGNhbiBiZSB1c2VkIGRpcmVjdGx5IGJ5IGFuIGVzYnVpbGQgUGx1Z2luLlxuICogQHBhcmFtIGRhdGEgVGhlIHN0eWxlc2hlZXQgY29udGVudCB0byBwcm9jZXNzLlxuICogQHBhcmFtIGZpbGVuYW1lIFRoZSBuYW1lIG9mIHRoZSBmaWxlIHRoYXQgY29udGFpbnMgdGhlIGRhdGEuXG4gKiBAcGFyYW0gcG9zdGNzc1Byb2Nlc3NvciBBIHBvc3Rjc3MgcHJvY2Vzc29yIGluc3RhbmNlIHRvIHVzZS5cbiAqIEBwYXJhbSBvcHRpb25zIFRoZSBwbHVnaW4gb3B0aW9ucyB0byBjb250cm9sIHRoZSBwcm9jZXNzaW5nLlxuICogQHJldHVybnMgQW4gZXNidWlsZCBPbkxvYWRlclJlc3VsdCBvYmplY3Qgd2l0aCB0aGUgcHJvY2Vzc2VkIGNvbnRlbnQsIHdhcm5pbmdzLCBhbmQvb3IgZXJyb3JzLlxuICovXG5hc3luYyBmdW5jdGlvbiBjb21waWxlU3RyaW5nKFxuICBkYXRhOiBzdHJpbmcsXG4gIGZpbGVuYW1lOiBzdHJpbmcsXG4gIHBvc3Rjc3NQcm9jZXNzb3I6IGltcG9ydCgncG9zdGNzcycpLlByb2Nlc3NvcixcbiAgb3B0aW9uczogQ3NzUGx1Z2luT3B0aW9ucyxcbik6IFByb21pc2U8T25Mb2FkUmVzdWx0PiB7XG4gIHRyeSB7XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcG9zdGNzc1Byb2Nlc3Nvci5wcm9jZXNzKGRhdGEsIHtcbiAgICAgIGZyb206IGZpbGVuYW1lLFxuICAgICAgdG86IGZpbGVuYW1lLFxuICAgICAgbWFwOiBvcHRpb25zLnNvdXJjZW1hcCAmJiB7XG4gICAgICAgIGlubGluZTogdHJ1ZSxcbiAgICAgICAgc291cmNlc0NvbnRlbnQ6IHRydWUsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgY29uc3QgcmF3V2FybmluZ3MgPSByZXN1bHQud2FybmluZ3MoKTtcbiAgICBsZXQgd2FybmluZ3M7XG4gICAgaWYgKHJhd1dhcm5pbmdzLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IGxpbmVNYXBwaW5ncyA9IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmdbXSB8IG51bGw+KCk7XG4gICAgICB3YXJuaW5ncyA9IHJhd1dhcm5pbmdzLm1hcCgod2FybmluZykgPT4ge1xuICAgICAgICBjb25zdCBmaWxlID0gd2FybmluZy5ub2RlLnNvdXJjZT8uaW5wdXQuZmlsZTtcbiAgICAgICAgaWYgKGZpbGUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHJldHVybiB7IHRleHQ6IHdhcm5pbmcudGV4dCB9O1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGxpbmVzID0gbGluZU1hcHBpbmdzLmdldChmaWxlKTtcbiAgICAgICAgaWYgKGxpbmVzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBsaW5lcyA9IHdhcm5pbmcubm9kZS5zb3VyY2U/LmlucHV0LmNzcy5zcGxpdCgvXFxyP1xcbi8pO1xuICAgICAgICAgIGxpbmVNYXBwaW5ncy5zZXQoZmlsZSwgbGluZXMgPz8gbnVsbCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHRleHQ6IHdhcm5pbmcudGV4dCxcbiAgICAgICAgICBsb2NhdGlvbjoge1xuICAgICAgICAgICAgZmlsZSxcbiAgICAgICAgICAgIGxpbmU6IHdhcm5pbmcubGluZSxcbiAgICAgICAgICAgIGNvbHVtbjogd2FybmluZy5jb2x1bW4gLSAxLFxuICAgICAgICAgICAgbGluZVRleHQ6IGxpbmVzPy5bd2FybmluZy5saW5lIC0gMV0sXG4gICAgICAgICAgfSxcbiAgICAgICAgfTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBjb250ZW50czogcmVzdWx0LmNzcyxcbiAgICAgIGxvYWRlcjogJ2NzcycsXG4gICAgICB3YXJuaW5ncyxcbiAgICB9O1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHBvc3Rjc3MgPz89IChhd2FpdCBpbXBvcnQoJ3Bvc3Rjc3MnKSkuZGVmYXVsdDtcbiAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBwb3N0Y3NzLkNzc1N5bnRheEVycm9yKSB7XG4gICAgICBjb25zdCBsaW5lcyA9IGVycm9yLnNvdXJjZT8uc3BsaXQoL1xccj9cXG4vKTtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgZXJyb3JzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgdGV4dDogZXJyb3IucmVhc29uLFxuICAgICAgICAgICAgbG9jYXRpb246IHtcbiAgICAgICAgICAgICAgZmlsZTogZXJyb3IuZmlsZSxcbiAgICAgICAgICAgICAgbGluZTogZXJyb3IubGluZSxcbiAgICAgICAgICAgICAgY29sdW1uOiBlcnJvci5jb2x1bW4gJiYgZXJyb3IuY29sdW1uIC0gMSxcbiAgICAgICAgICAgICAgbGluZVRleHQ6IGVycm9yLmxpbmUgPT09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IGxpbmVzPy5bZXJyb3IubGluZSAtIDFdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICB0aHJvdyBlcnJvcjtcbiAgfVxufVxuIl19