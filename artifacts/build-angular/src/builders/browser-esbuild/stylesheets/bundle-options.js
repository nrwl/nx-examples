"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bundleComponentStylesheet = exports.createStylesheetBundleOptions = void 0;
const node_path_1 = __importDefault(require("node:path"));
const esbuild_1 = require("../esbuild");
const css_plugin_1 = require("./css-plugin");
const css_resource_plugin_1 = require("./css-resource-plugin");
const less_plugin_1 = require("./less-plugin");
const sass_plugin_1 = require("./sass-plugin");
/**
 * A counter for component styles used to generate unique build-time identifiers for each stylesheet.
 */
let componentStyleCounter = 0;
function createStylesheetBundleOptions(options, cache, inlineComponentData) {
    // Ensure preprocessor include paths are absolute based on the workspace root
    const includePaths = options.includePaths?.map((includePath) => node_path_1.default.resolve(options.workspaceRoot, includePath));
    return {
        absWorkingDir: options.workspaceRoot,
        bundle: true,
        entryNames: options.outputNames?.bundles,
        assetNames: options.outputNames?.media,
        logLevel: 'silent',
        minify: options.optimization,
        metafile: true,
        sourcemap: options.sourcemap,
        outdir: options.workspaceRoot,
        write: false,
        platform: 'browser',
        target: options.target,
        preserveSymlinks: options.preserveSymlinks,
        external: options.externalDependencies,
        conditions: ['style', 'sass'],
        mainFields: ['style', 'sass'],
        plugins: [
            (0, sass_plugin_1.createSassPlugin)({
                sourcemap: !!options.sourcemap,
                loadPaths: includePaths,
                inlineComponentData,
            }, cache),
            (0, less_plugin_1.createLessPlugin)({
                sourcemap: !!options.sourcemap,
                includePaths,
                inlineComponentData,
            }),
            (0, css_plugin_1.createCssPlugin)({
                sourcemap: !!options.sourcemap,
                inlineComponentData,
                browsers: options.browsers,
                tailwindConfiguration: options.tailwindConfiguration,
            }),
            (0, css_resource_plugin_1.createCssResourcePlugin)(),
        ],
    };
}
exports.createStylesheetBundleOptions = createStylesheetBundleOptions;
/**
 * Bundles a component stylesheet. The stylesheet can be either an inline stylesheet that
 * is contained within the Component's metadata definition or an external file referenced
 * from the Component's metadata definition.
 *
 * @param identifier A unique string identifier for the component stylesheet.
 * @param language The language of the stylesheet such as `css` or `scss`.
 * @param data The string content of the stylesheet.
 * @param filename The filename representing the source of the stylesheet content.
 * @param inline If true, the stylesheet source is within the component metadata;
 * if false, the source is a stylesheet file.
 * @param options An object containing the stylesheet bundling options.
 * @returns An object containing the output of the bundling operation.
 */
async function bundleComponentStylesheet(language, data, filename, inline, options, cache) {
    const namespace = 'angular:styles/component';
    const entry = [language, componentStyleCounter++, filename].join(';');
    const buildOptions = createStylesheetBundleOptions(options, cache, { [entry]: data });
    buildOptions.entryPoints = [`${namespace};${entry}`];
    buildOptions.plugins.push({
        name: 'angular-component-styles',
        setup(build) {
            build.onResolve({ filter: /^angular:styles\/component;/ }, (args) => {
                if (args.kind !== 'entry-point') {
                    return null;
                }
                if (inline) {
                    return {
                        path: entry,
                        namespace,
                    };
                }
                else {
                    return {
                        path: filename,
                    };
                }
            });
            build.onLoad({ filter: /^css;/, namespace }, async () => {
                return {
                    contents: data,
                    loader: 'css',
                    resolveDir: node_path_1.default.dirname(filename),
                };
            });
        },
    });
    // Execute esbuild
    const context = new esbuild_1.BundlerContext(options.workspaceRoot, false, buildOptions);
    const result = await context.bundle();
    // Extract the result of the bundling from the output files
    let contents = '';
    let map;
    let outputPath;
    const resourceFiles = [];
    if (!result.errors) {
        for (const outputFile of result.outputFiles) {
            const filename = node_path_1.default.basename(outputFile.path);
            if (filename.endsWith('.css')) {
                outputPath = outputFile.path;
                contents = outputFile.text;
            }
            else if (filename.endsWith('.css.map')) {
                map = outputFile.text;
            }
            else {
                // The output files could also contain resources (images/fonts/etc.) that were referenced
                resourceFiles.push(outputFile);
            }
        }
    }
    let metafile;
    if (!result.errors) {
        metafile = result.metafile;
        // Remove entryPoint fields from outputs to prevent the internal component styles from being
        // treated as initial files. Also mark the entry as a component resource for stat reporting.
        Object.values(metafile.outputs).forEach((output) => {
            delete output.entryPoint;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            output['ng-component'] = true;
        });
    }
    return {
        errors: result.errors,
        warnings: result.warnings,
        contents,
        map,
        path: outputPath,
        resourceFiles,
        metafile,
    };
}
exports.bundleComponentStylesheet = bundleComponentStylesheet;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVuZGxlLW9wdGlvbnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy9idWlsZGVycy9icm93c2VyLWVzYnVpbGQvc3R5bGVzaGVldHMvYnVuZGxlLW9wdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7O0FBR0gsMERBQTZCO0FBQzdCLHdDQUE0QztBQUU1Qyw2Q0FBK0M7QUFDL0MsK0RBQWdFO0FBQ2hFLCtDQUFpRDtBQUNqRCwrQ0FBaUQ7QUFFakQ7O0dBRUc7QUFDSCxJQUFJLHFCQUFxQixHQUFHLENBQUMsQ0FBQztBQWU5QixTQUFnQiw2QkFBNkIsQ0FDM0MsT0FBZ0MsRUFDaEMsS0FBdUIsRUFDdkIsbUJBQTRDO0lBRTVDLDZFQUE2RTtJQUM3RSxNQUFNLFlBQVksR0FBRyxPQUFPLENBQUMsWUFBWSxFQUFFLEdBQUcsQ0FBQyxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQzdELG1CQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUUsV0FBVyxDQUFDLENBQ2pELENBQUM7SUFFRixPQUFPO1FBQ0wsYUFBYSxFQUFFLE9BQU8sQ0FBQyxhQUFhO1FBQ3BDLE1BQU0sRUFBRSxJQUFJO1FBQ1osVUFBVSxFQUFFLE9BQU8sQ0FBQyxXQUFXLEVBQUUsT0FBTztRQUN4QyxVQUFVLEVBQUUsT0FBTyxDQUFDLFdBQVcsRUFBRSxLQUFLO1FBQ3RDLFFBQVEsRUFBRSxRQUFRO1FBQ2xCLE1BQU0sRUFBRSxPQUFPLENBQUMsWUFBWTtRQUM1QixRQUFRLEVBQUUsSUFBSTtRQUNkLFNBQVMsRUFBRSxPQUFPLENBQUMsU0FBUztRQUM1QixNQUFNLEVBQUUsT0FBTyxDQUFDLGFBQWE7UUFDN0IsS0FBSyxFQUFFLEtBQUs7UUFDWixRQUFRLEVBQUUsU0FBUztRQUNuQixNQUFNLEVB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QUFRLEVBQUUsTUFBTSxDQUFDLFFBQVE7UUFDekIsUUFBUTtRQUNSLEdBQUc7UUFDSCxJQUFJLEVBQUUsVUFBVTtRQUNoQixhQUFhO1FBQ2IsUUFBUTtLQUNULENBQUM7QUFDSixDQUFDO0FBdkZELDhEQXVGQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgdHlwZSB7IEJ1aWxkT3B0aW9ucywgT3V0cHV0RmlsZSB9IGZyb20gJ2VzYnVpbGQnO1xuaW1wb3J0IHBhdGggZnJvbSAnbm9kZTpwYXRoJztcbmltcG9ydCB7IEJ1bmRsZXJDb250ZXh0IH0gZnJvbSAnLi4vZXNidWlsZCc7XG5pbXBvcnQgeyBMb2FkUmVzdWx0Q2FjaGUgfSBmcm9tICcuLi9sb2FkLXJlc3VsdC1jYWNoZSc7XG5pbXBvcnQgeyBjcmVhdGVDc3NQbHVnaW4gfSBmcm9tICcuL2Nzcy1wbHVnaW4nO1xuaW1wb3J0IHsgY3JlYXRlQ3NzUmVzb3VyY2VQbHVnaW4gfSBmcm9tICcuL2Nzcy1yZXNvdXJjZS1wbHVnaW4nO1xuaW1wb3J0IHsgY3JlYXRlTGVzc1BsdWdpbiB9IGZyb20gJy4vbGVzcy1wbHVnaW4nO1xuaW1wb3J0IHsgY3JlYXRlU2Fzc1BsdWdpbiB9IGZyb20gJy4vc2Fzcy1wbHVnaW4nO1xuXG4vKipcbiAqIEEgY291bnRlciBmb3IgY29tcG9uZW50IHN0eWxlcyB1c2VkIHRvIGdlbmVyYXRlIHVuaXF1ZSBidWlsZC10aW1lIGlkZW50aWZpZXJzIGZvciBlYWNoIHN0eWxlc2hlZXQuXG4gKi9cbmxldCBjb21wb25lbnRTdHlsZUNvdW50ZXIgPSAwO1xuXG5leHBvcnQgaW50ZXJmYWNlIEJ1bmRsZVN0eWxlc2hlZXRPcHRpb25zIHtcbiAgd29ya3NwYWNlUm9vdDogc3RyaW5nO1xuICBvcHRpbWl6YXRpb246IGJvb2xlYW47XG4gIHByZXNlcnZlU3ltbGlua3M/OiBib29sZWFuO1xuICBzb3VyY2VtYXA6IGJvb2xlYW4gfCAnZXh0ZXJuYWwnIHwgJ2lubGluZSc7XG4gIG91dHB1dE5hbWVzPzogeyBidW5kbGVzPzogc3RyaW5nOyBtZWRpYT86IHN0cmluZyB9O1xuICBpbmNsdWRlUGF0aHM/OiBzdHJpbmdbXTtcbiAgZXh0ZXJuYWxEZXBlbmRlbmNpZXM/OiBzdHJpbmdbXTtcbiAgdGFyZ2V0OiBzdHJpbmdbXTtcbiAgYnJvd3NlcnM6IHN0cmluZ1tdO1xuICB0YWlsd2luZENvbmZpZ3VyYXRpb24/OiB7IGZpbGU6IHN0cmluZzsgcGFja2FnZTogc3RyaW5nIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVTdHlsZXNoZWV0QnVuZGxlT3B0aW9ucyhcbiAgb3B0aW9uczogQnVuZGxlU3R5bGVzaGVldE9wdGlvbnMsXG4gIGNhY2hlPzogTG9hZFJlc3VsdENhY2hlLFxuICBpbmxpbmVDb21wb25lbnREYXRhPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPixcbik6IEJ1aWxkT3B0aW9ucyAmIHsgcGx1Z2luczogTm9uTnVsbGFibGU8QnVpbGRPcHRpb25zWydwbHVnaW5zJ10+IH0ge1xuICAvLyBFbnN1cmUgcHJlcHJvY2Vzc29yIGluY2x1ZGUgcGF0aHMgYXJlIGFic29sdXRlIGJhc2VkIG9uIHRoZSB3b3Jrc3BhY2Ugcm9vdFxuICBjb25zdCBpbmNsdWRlUGF0aHMgPSBvcHRpb25zLmluY2x1ZGVQYXRocz8ubWFwKChpbmNsdWRlUGF0aCkgPT5cbiAgICBwYXRoLnJlc29sdmUob3B0aW9ucy53b3Jrc3BhY2VSb290LCBpbmNsdWRlUGF0aCksXG4gICk7XG5cbiAgcmV0dXJuIHtcbiAgICBhYnNXb3JraW5nRGlyOiBvcHRpb25zLndvcmtzcGFjZVJvb3QsXG4gICAgYnVuZGxlOiB0cnVlLFxuICAgIGVudHJ5TmFtZXM6IG9wdGlvbnMub3V0cHV0TmFtZXM/LmJ1bmRsZXMsXG4gICAgYXNzZXROYW1lczogb3B0aW9ucy5vdXRwdXROYW1lcz8ubWVkaWEsXG4gICAgbG9nTGV2ZWw6ICdzaWxlbnQnLFxuICAgIG1pbmlmeTogb3B0aW9ucy5vcHRpbWl6YXRpb24sXG4gICAgbWV0YWZpbGU6IHRydWUsXG4gICAgc291cmNlbWFwOiBvcHRpb25zLnNvdXJjZW1hcCxcbiAgICBvdXRkaXI6IG9wdGlvbnMud29ya3NwYWNlUm9vdCxcbiAgICB3cml0ZTogZmFsc2UsXG4gICAgcGxhdGZvcm06ICdicm93c2VyJyxcbiAgICB0YXJnZXQ6IG9wdGlvbnMudGFyZ2V0LFxuICAgIHByZXNlcnZlU3ltbGlua3M6IG9wdGlvbnMucHJlc2VydmVTeW1saW5rcyxcbiAgICBleHRlcm5hbDogb3B0aW9ucy5leHRlcm5hbERlcGVuZGVuY2llcyxcbiAgICBjb25kaXRpb25zOiBbJ3N0eWxlJywgJ3Nhc3MnXSxcbiAgICBtYWluRmllbGRzOiBbJ3N0eWxlJywgJ3Nhc3MnXSxcbiAgICBwbHVnaW5zOiBbXG4gICAgICBjcmVhdGVTYXNzUGx1Z2luKFxuICAgICAgICB7XG4gICAgICAgICAgc291cmNlbWFwOiAhIW9wdGlvbnMuc291cmNlbWFwLFxuICAgICAgICAgIGxvYWRQYXRoczogaW5jbHVkZVBhdGhzLFxuICAgICAgICAgIGlubGluZUNvbXBvbmVudERhdGEsXG4gICAgICAgIH0sXG4gICAgICAgIGNhY2hlLFxuICAgICAgKSxcbiAgICAgIGNyZWF0ZUxlc3NQbHVnaW4oe1xuICAgICAgICBzb3VyY2VtYXA6ICEhb3B0aW9ucy5zb3VyY2VtYXAsXG4gICAgICAgIGluY2x1ZGVQYXRocyxcbiAgICAgICAgaW5saW5lQ29tcG9uZW50RGF0YSxcbiAgICAgIH0pLFxuICAgICAgY3JlYXRlQ3NzUGx1Z2luKHtcbiAgICAgICAgc291cmNlbWFwOiAhIW9wdGlvbnMuc291cmNlbWFwLFxuICAgICAgICBpbmxpbmVDb21wb25lbnREYXRhLFxuICAgICAgICBicm93c2Vyczogb3B0aW9ucy5icm93c2VycyxcbiAgICAgICAgdGFpbHdpbmRDb25maWd1cmF0aW9uOiBvcHRpb25zLnRhaWx3aW5kQ29uZmlndXJhdGlvbixcbiAgICAgIH0pLFxuICAgICAgY3JlYXRlQ3NzUmVzb3VyY2VQbHVnaW4oKSxcbiAgICBdLFxuICB9O1xufVxuXG4vKipcbiAqIEJ1bmRsZXMgYSBjb21wb25lbnQgc3R5bGVzaGVldC4gVGhlIHN0eWxlc2hlZXQgY2FuIGJlIGVpdGhlciBhbiBpbmxpbmUgc3R5bGVzaGVldCB0aGF0XG4gKiBpcyBjb250YWluZWQgd2l0aGluIHRoZSBDb21wb25lbnQncyBtZXRhZGF0YSBkZWZpbml0aW9uIG9yIGFuIGV4dGVybmFsIGZpbGUgcmVmZXJlbmNlZFxuICogZnJvbSB0aGUgQ29tcG9uZW50J3MgbWV0YWRhdGEgZGVmaW5pdGlvbi5cbiAqXG4gKiBAcGFyYW0gaWRlbnRpZmllciBBIHVuaXF1ZSBzdHJpbmcgaWRlbnRpZmllciBmb3IgdGhlIGNvbXBvbmVudCBzdHlsZXNoZWV0LlxuICogQHBhcmFtIGxhbmd1YWdlIFRoZSBsYW5ndWFnZSBvZiB0aGUgc3R5bGVzaGVldCBzdWNoIGFzIGBjc3NgIG9yIGBzY3NzYC5cbiAqIEBwYXJhbSBkYXRhIFRoZSBzdHJpbmcgY29udGVudCBvZiB0aGUgc3R5bGVzaGVldC5cbiAqIEBwYXJhbSBmaWxlbmFtZSBUaGUgZmlsZW5hbWUgcmVwcmVzZW50aW5nIHRoZSBzb3VyY2Ugb2YgdGhlIHN0eWxlc2hlZXQgY29udGVudC5cbiAqIEBwYXJhbSBpbmxpbmUgSWYgdHJ1ZSwgdGhlIHN0eWxlc2hlZXQgc291cmNlIGlzIHdpdGhpbiB0aGUgY29tcG9uZW50IG1ldGFkYXRhO1xuICogaWYgZmFsc2UsIHRoZSBzb3VyY2UgaXMgYSBzdHlsZXNoZWV0IGZpbGUuXG4gKiBAcGFyYW0gb3B0aW9ucyBBbiBvYmplY3QgY29udGFpbmluZyB0aGUgc3R5bGVzaGVldCBidW5kbGluZyBvcHRpb25zLlxuICogQHJldHVybnMgQW4gb2JqZWN0IGNvbnRhaW5pbmcgdGhlIG91dHB1dCBvZiB0aGUgYnVuZGxpbmcgb3BlcmF0aW9uLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gYnVuZGxlQ29tcG9uZW50U3R5bGVzaGVldChcbiAgbGFuZ3VhZ2U6IHN0cmluZyxcbiAgZGF0YTogc3RyaW5nLFxuICBmaWxlbmFtZTogc3RyaW5nLFxuICBpbmxpbmU6IGJvb2xlYW4sXG4gIG9wdGlvbnM6IEJ1bmRsZVN0eWxlc2hlZXRPcHRpb25zLFxuICBjYWNoZT86IExvYWRSZXN1bHRDYWNoZSxcbikge1xuICBjb25zdCBuYW1lc3BhY2UgPSAnYW5ndWxhcjpzdHlsZXMvY29tcG9uZW50JztcbiAgY29uc3QgZW50cnkgPSBbbGFuZ3VhZ2UsIGNvbXBvbmVudFN0eWxlQ291bnRlcisrLCBmaWxlbmFtZV0uam9pbignOycpO1xuXG4gIGNvbnN0IGJ1aWxkT3B0aW9ucyA9IGNyZWF0ZVN0eWxlc2hlZXRCdW5kbGVPcHRpb25zKG9wdGlvbnMsIGNhY2hlLCB7IFtlbnRyeV06IGRhdGEgfSk7XG4gIGJ1aWxkT3B0aW9ucy5lbnRyeVBvaW50cyA9IFtgJHtuYW1lc3BhY2V9OyR7ZW50cnl9YF07XG4gIGJ1aWxkT3B0aW9ucy5wbHVnaW5zLnB1c2goe1xuICAgIG5hbWU6ICdhbmd1bGFyLWNvbXBvbmVudC1zdHlsZXMnLFxuICAgIHNldHVwKGJ1aWxkKSB7XG4gICAgICBidWlsZC5vblJlc29sdmUoeyBmaWx0ZXI6IC9eYW5ndWxhcjpzdHlsZXNcXC9jb21wb25lbnQ7LyB9LCAoYXJncykgPT4ge1xuICAgICAgICBpZiAoYXJncy5raW5kICE9PSAnZW50cnktcG9pbnQnKSB7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaW5saW5lKSB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHBhdGg6IGVudHJ5LFxuICAgICAgICAgICAgbmFtZXNwYWNlLFxuICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHBhdGg6IGZpbGVuYW1lLFxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgYnVpbGQub25Mb2FkKHsgZmlsdGVyOiAvXmNzczsvLCBuYW1lc3BhY2UgfSwgYXN5bmMgKCkgPT4ge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGNvbnRlbnRzOiBkYXRhLFxuICAgICAgICAgIGxvYWRlcjogJ2NzcycsXG4gICAgICAgICAgcmVzb2x2ZURpcjogcGF0aC5kaXJuYW1lKGZpbGVuYW1lKSxcbiAgICAgICAgfTtcbiAgICAgIH0pO1xuICAgIH0sXG4gIH0pO1xuXG4gIC8vIEV4ZWN1dGUgZXNidWlsZFxuICBjb25zdCBjb250ZXh0ID0gbmV3IEJ1bmRsZXJDb250ZXh0KG9wdGlvbnMud29ya3NwYWNlUm9vdCwgZmFsc2UsIGJ1aWxkT3B0aW9ucyk7XG4gIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGNvbnRleHQuYnVuZGxlKCk7XG5cbiAgLy8gRXh0cmFjdCB0aGUgcmVzdWx0IG9mIHRoZSBidW5kbGluZyBmcm9tIHRoZSBvdXRwdXQgZmlsZXNcbiAgbGV0IGNvbnRlbnRzID0gJyc7XG4gIGxldCBtYXA7XG4gIGxldCBvdXRwdXRQYXRoO1xuICBjb25zdCByZXNvdXJjZUZpbGVzOiBPdXRwdXRGaWxlW10gPSBbXTtcbiAgaWYgKCFyZXN1bHQuZXJyb3JzKSB7XG4gICAgZm9yIChjb25zdCBvdXRwdXRGaWxlIG9mIHJlc3VsdC5vdXRwdXRGaWxlcykge1xuICAgICAgY29uc3QgZmlsZW5hbWUgPSBwYXRoLmJhc2VuYW1lKG91dHB1dEZpbGUucGF0aCk7XG4gICAgICBpZiAoZmlsZW5hbWUuZW5kc1dpdGgoJy5jc3MnKSkge1xuICAgICAgICBvdXRwdXRQYXRoID0gb3V0cHV0RmlsZS5wYXRoO1xuICAgICAgICBjb250ZW50cyA9IG91dHB1dEZpbGUudGV4dDtcbiAgICAgIH0gZWxzZSBpZiAoZmlsZW5hbWUuZW5kc1dpdGgoJy5jc3MubWFwJykpIHtcbiAgICAgICAgbWFwID0gb3V0cHV0RmlsZS50ZXh0O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gVGhlIG91dHB1dCBmaWxlcyBjb3VsZCBhbHNvIGNvbnRhaW4gcmVzb3VyY2VzIChpbWFnZXMvZm9udHMvZXRjLikgdGhhdCB3ZXJlIHJlZmVyZW5jZWRcbiAgICAgICAgcmVzb3VyY2VGaWxlcy5wdXNoKG91dHB1dEZpbGUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGxldCBtZXRhZmlsZTtcbiAgaWYgKCFyZXN1bHQuZXJyb3JzKSB7XG4gICAgbWV0YWZpbGUgPSByZXN1bHQubWV0YWZpbGU7XG4gICAgLy8gUmVtb3ZlIGVudHJ5UG9pbnQgZmllbGRzIGZyb20gb3V0cHV0cyB0byBwcmV2ZW50IHRoZSBpbnRlcm5hbCBjb21wb25lbnQgc3R5bGVzIGZyb20gYmVpbmdcbiAgICAvLyB0cmVhdGVkIGFzIGluaXRpYWwgZmlsZXMuIEFsc28gbWFyayB0aGUgZW50cnkgYXMgYSBjb21wb25lbnQgcmVzb3VyY2UgZm9yIHN0YXQgcmVwb3J0aW5nLlxuICAgIE9iamVjdC52YWx1ZXMobWV0YWZpbGUub3V0cHV0cykuZm9yRWFjaCgob3V0cHV0KSA9PiB7XG4gICAgICBkZWxldGUgb3V0cHV0LmVudHJ5UG9pbnQ7XG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuICAgICAgKG91dHB1dCBhcyBhbnkpWyduZy1jb21wb25lbnQnXSA9IHRydWU7XG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGVycm9yczogcmVzdWx0LmVycm9ycyxcbiAgICB3YXJuaW5nczogcmVzdWx0Lndhcm5pbmdzLFxuICAgIGNvbnRlbnRzLFxuICAgIG1hcCxcbiAgICBwYXRoOiBvdXRwdXRQYXRoLFxuICAgIHJlc291cmNlRmlsZXMsXG4gICAgbWV0YWZpbGUsXG4gIH07XG59XG4iXX0=