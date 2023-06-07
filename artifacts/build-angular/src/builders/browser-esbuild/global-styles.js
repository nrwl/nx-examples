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
exports.createGlobalStylesBundleOptions = void 0;
const node_assert_1 = __importDefault(require("node:assert"));
const bundle_options_1 = require("./stylesheets/bundle-options");
function createGlobalStylesBundleOptions(options, target, browsers, initial, cache) {
    const { workspaceRoot, optimizationOptions, sourcemapOptions, outputNames, globalStyles, preserveSymlinks, externalDependencies, stylePreprocessorOptions, tailwindConfiguration, } = options;
    const namespace = 'angular:styles/global';
    const entryPoints = {};
    let found = false;
    for (const style of globalStyles) {
        if (style.initial === initial) {
            found = true;
            entryPoints[style.name] = `${namespace};${style.name}`;
        }
    }
    // Skip if there are no entry points for the style loading type
    if (found === false) {
        return;
    }
    const buildOptions = (0, bundle_options_1.createStylesheetBundleOptions)({
        workspaceRoot,
        optimization: !!optimizationOptions.styles.minify,
        sourcemap: !!sourcemapOptions.styles,
        preserveSymlinks,
        target,
        externalDependencies,
        outputNames: initial
            ? outputNames
            : {
                ...outputNames,
                bundles: '[name]',
            },
        includePaths: stylePreprocessorOptions?.includePaths,
        browsers,
        tailwindConfiguration,
    }, cache);
    buildOptions.legalComments = options.extractLicenses ? 'none' : 'eof';
    buildOptions.entryPoints = entryPoints;
    buildOptions.plugins.unshift({
        name: 'angular-global-styles',
        setup(build) {
            build.onResolve({ filter: /^angular:styles\/global;/ }, (args) => {
                if (args.kind !== 'entry-point') {
                    return null;
                }
                return {
                    path: args.path.split(';', 2)[1],
                    namespace,
                };
            });
            build.onLoad({ filter: /./, namespace }, (args) => {
                const files = globalStyles.find(({ name }) => name === args.path)?.files;
                (0, node_assert_1.default)(files, `global style name should always be found [${args.path}]`);
                return {
                    contents: files.map((file) => `@import '${file.replace(/\\/g, '/')}';`).join('\n'),
                    loader: 'css',
                    resolveDir: workspaceRoot,
                };
            });
        },
    });
    return buildOptions;
}
exports.createGlobalStylesBundleOptions = createGlobalStylesBundleOptions;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2xvYmFsLXN0eWxlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2J1aWxkX2FuZ3VsYXIvc3JjL2J1aWxkZXJzL2Jyb3dzZXItZXNidWlsZC9nbG9iYWwtc3R5bGVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7Ozs7OztBQUdILDhEQUFpQztBQUdqQyxpRUFBNkU7QUFFN0UsU0FBZ0IsK0JBQStCLENBQzdDLE9BQWlDLEVBQ2pDLE1BQWdCLEVBQ2hCLFFBQWtCLEVBQ2xCLE9BQWdCLEVBQ2hCLEtBQXVCO0lBRXZCLE1BQU0sRUFDSixhQUFhLEVBQ2IsbUJBQW1CLEVBQ25CLGdCQUFnQixFQUNoQixXQUFXLEVBQ1gsWUFBWSxFQUNaLGdCQUFnQixFQUNoQixvQkFBb0IsRUFDcEIsd0JBQXdCLEVBQ3hCLHFCQUFxQixHQUN0QixHQUFHLE9BQU8sQ0FBQztJQUVaLE1BQU0sU0FBUyxHQUFHLHVCQUF1QixDQUFDO0lBQzFDLE1BQU0sV0FBVyxHQUEyQixFQUFFLENBQUM7SUFDL0MsSUFBSSxLQUFLLEdBQUcsS0FBSyxDQUFDO0lBQ2xCLEtBQUssTUFBTSxLQUFLLElBQUksWUFBWSxFQUFFO1FBQ2hDLElBQUksS0FBSyxDQUFDLE9BQU8sS0FBSyxPQUFPLEVBQUU7WUFDN0IsS0FBSyxHQUFHLElBQUksQ0FBQztZQUNiLFdBQVcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxTQUFTLElBQUksS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDO1NBQ3hEO0tBQ0Y7SUFFRCwrREFBK0Q7SUFDL0QsSUFBSSxLQUFLLEtBQUssS0FBSyxFQUFFO1FBQ25CLE9BQU87S0FDUjtJQUVELE1BQU0sWUFBWSxHQUFHLElBQUEsOENBQTZCLEVBQ2hEO1FBQ0UsYUFBYTtRQUNiLFlBQVksRUFBRSxDQUFDLENBQUMsbUJBQW1CLENBQUMsTUFBTSxDQUFDLE1BQU07UUFDakQsU0FBUyxFQUFFLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNO1FBQ3BDLGdCQUFnQjtRQUNoQixNQUFNO1FBQ04sb0JBQW9CO1FBQ3BCLFdBQVcsRUFBRSxPQUFPO1lBQ2xCLENBQUMsQ0FBQyxXQUFXO1lBQ2IsQ0FBQyxDQUFDO2dCQUNFLEdBQUcsV0FBVztnQkFDZCxPQUFPLEVBQUUsUUFBUTthQUNsQjtRQUNMLFlBQVksRUFBRSx3QkFBd0IsRUFBRSxZQUFZO1FBQ3BELFFBQVE7UUFDUixxQkFBcUI7S0FDdEIsRUFDRCxLQUFLLENBQ04sQ0FBQztJQUNGLFlBQVksQ0FBQyxhQUFhLEdBQUcsT0FBTyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7SUFDdEUsWUFBWSxDQUFDLFdBQVcsR0FBRyxXQUFXLENBQUM7SUFFdkMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUM7UUFDM0IsSUFBSSxFQUFFLHVCQUF1QjtRQUM3QixLQUFLLENBQUMsS0FBSztZQUNULEtBQUssQ0FBQyxTQUFTLENBQUMsRUFBRSxNQUFNLEVBQUUsMEJBQTBCLEVBQUUsRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFO2dCQUMvRCxJQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssYUFBYSxFQUFFO29CQUMvQixPQUFPLElBQUksQ0FBQztpQkFDYjtnQkFFRCxPQUFPO29CQUNMLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNoQyxTQUFTO2lCQUNWLENBQUM7WUFDSixDQUFDLENBQUMsQ0FBQztZQUNILEtBQUssQ0FBQyxNQUFNLENBQUMsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLFNBQVMsRUFBRSxFQUFFLENBQUMsSUFBSSxFQUFFLEVBQUU7Z0JBQ2hELE1BQU0sS0FBSyxHQUFHLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsQ0FBQyxJQUFJLEtBQUssSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssQ0FBQztnQkFDekUsSUFBQSxxQkFBTSxFQUFDLEtBQUssRUFBRSw2Q0FBNkMsSUFBSSxDQUFDLElBQUksR0FBRyxDQUFDLENBQUM7Z0JBRXpFLE9BQU87b0JBQ0wsUUFBUSxFQUFFLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLFlBQVksSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7b0JBQ2xGLE1BQU0sRUFBRSxLQUFLO29CQUNiLFVBQVUsRUFBRSxhQUFhO2lCQUMxQixDQUFDO1lBQ0osQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO0tBQ0YsQ0FBQyxDQUFDO0lBRUgsT0FBTyxZQUFZLENBQUM7QUFDdEIsQ0FBQztBQXBGRCwwRUFvRkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHR5cGUgeyBCdWlsZE9wdGlvbnMgfSBmcm9tICdlc2J1aWxkJztcbmltcG9ydCBhc3NlcnQgZnJvbSAnbm9kZTphc3NlcnQnO1xuaW1wb3J0IHsgTG9hZFJlc3VsdENhY2hlIH0gZnJvbSAnLi9sb2FkLXJlc3VsdC1jYWNoZSc7XG5pbXBvcnQgeyBOb3JtYWxpemVkQnJvd3Nlck9wdGlvbnMgfSBmcm9tICcuL29wdGlvbnMnO1xuaW1wb3J0IHsgY3JlYXRlU3R5bGVzaGVldEJ1bmRsZU9wdGlvbnMgfSBmcm9tICcuL3N0eWxlc2hlZXRzL2J1bmRsZS1vcHRpb25zJztcblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUdsb2JhbFN0eWxlc0J1bmRsZU9wdGlvbnMoXG4gIG9wdGlvbnM6IE5vcm1hbGl6ZWRCcm93c2VyT3B0aW9ucyxcbiAgdGFyZ2V0OiBzdHJpbmdbXSxcbiAgYnJvd3NlcnM6IHN0cmluZ1tdLFxuICBpbml0aWFsOiBib29sZWFuLFxuICBjYWNoZT86IExvYWRSZXN1bHRDYWNoZSxcbik6IEJ1aWxkT3B0aW9ucyB8IHVuZGVmaW5lZCB7XG4gIGNvbnN0IHtcbiAgICB3b3Jrc3BhY2VSb290LFxuICAgIG9wdGltaXphdGlvbk9wdGlvbnMsXG4gICAgc291cmNlbWFwT3B0aW9ucyxcbiAgICBvdXRwdXROYW1lcyxcbiAgICBnbG9iYWxTdHlsZXMsXG4gICAgcHJlc2VydmVTeW1saW5rcyxcbiAgICBleHRlcm5hbERlcGVuZGVuY2llcyxcbiAgICBzdHlsZVByZXByb2Nlc3Nvck9wdGlvbnMsXG4gICAgdGFpbHdpbmRDb25maWd1cmF0aW9uLFxuICB9ID0gb3B0aW9ucztcblxuICBjb25zdCBuYW1lc3BhY2UgPSAnYW5ndWxhcjpzdHlsZXMvZ2xvYmFsJztcbiAgY29uc3QgZW50cnlQb2ludHM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7fTtcbiAgbGV0IGZvdW5kID0gZmFsc2U7XG4gIGZvciAoY29uc3Qgc3R5bGUgb2YgZ2xvYmFsU3R5bGVzKSB7XG4gICAgaWYgKHN0eWxlLmluaXRpYWwgPT09IGluaXRpYWwpIHtcbiAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgIGVudHJ5UG9pbnRzW3N0eWxlLm5hbWVdID0gYCR7bmFtZXNwYWNlfTske3N0eWxlLm5hbWV9YDtcbiAgICB9XG4gIH1cblxuICAvLyBTa2lwIGlmIHRoZXJlIGFyZSBubyBlbnRyeSBwb2ludHMgZm9yIHRoZSBzdHlsZSBsb2FkaW5nIHR5cGVcbiAgaWYgKGZvdW5kID09PSBmYWxzZSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IGJ1aWxkT3B0aW9ucyA9IGNyZWF0ZVN0eWxlc2hlZXRCdW5kbGVPcHRpb25zKFxuICAgIHtcbiAgICAgIHdvcmtzcGFjZVJvb3QsXG4gICAgICBvcHRpbWl6YXRpb246ICEhb3B0aW1pemF0aW9uT3B0aW9ucy5zdHlsZXMubWluaWZ5LFxuICAgICAgc291cmNlbWFwOiAhIXNvdXJjZW1hcE9wdGlvbnMuc3R5bGVzLFxuICAgICAgcHJlc2VydmVTeW1saW5rcyxcbiAgICAgIHRhcmdldCxcbiAgICAgIGV4dGVybmFsRGVwZW5kZW5jaWVzLFxuICAgICAgb3V0cHV0TmFtZXM6IGluaXRpYWxcbiAgICAgICAgPyBvdXRwdXROYW1lc1xuICAgICAgICA6IHtcbiAgICAgICAgICAgIC4uLm91dHB1dE5hbWVzLFxuICAgICAgICAgICAgYnVuZGxlczogJ1tuYW1lXScsXG4gICAgICAgICAgfSxcbiAgICAgIGluY2x1ZGVQYXRoczogc3R5bGVQcmVwcm9jZXNzb3JPcHRpb25zPy5pbmNsdWRlUGF0aHMsXG4gICAgICBicm93c2VycyxcbiAgICAgIHRhaWx3aW5kQ29uZmlndXJhdGlvbixcbiAgICB9LFxuICAgIGNhY2hlLFxuICApO1xuICBidWlsZE9wdGlvbnMubGVnYWxDb21tZW50cyA9IG9wdGlvbnMuZXh0cmFjdExpY2Vuc2VzID8gJ25vbmUnIDogJ2VvZic7XG4gIGJ1aWxkT3B0aW9ucy5lbnRyeVBvaW50cyA9IGVudHJ5UG9pbnRzO1xuXG4gIGJ1aWxkT3B0aW9ucy5wbHVnaW5zLnVuc2hpZnQoe1xuICAgIG5hbWU6ICdhbmd1bGFyLWdsb2JhbC1zdHlsZXMnLFxuICAgIHNldHVwKGJ1aWxkKSB7XG4gICAgICBidWlsZC5vblJlc29sdmUoeyBmaWx0ZXI6IC9eYW5ndWxhcjpzdHlsZXNcXC9nbG9iYWw7LyB9LCAoYXJncykgPT4ge1xuICAgICAgICBpZiAoYXJncy5raW5kICE9PSAnZW50cnktcG9pbnQnKSB7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHBhdGg6IGFyZ3MucGF0aC5zcGxpdCgnOycsIDIpWzFdLFxuICAgICAgICAgIG5hbWVzcGFjZSxcbiAgICAgICAgfTtcbiAgICAgIH0pO1xuICAgICAgYnVpbGQub25Mb2FkKHsgZmlsdGVyOiAvLi8sIG5hbWVzcGFjZSB9LCAoYXJncykgPT4ge1xuICAgICAgICBjb25zdCBmaWxlcyA9IGdsb2JhbFN0eWxlcy5maW5kKCh7IG5hbWUgfSkgPT4gbmFtZSA9PT0gYXJncy5wYXRoKT8uZmlsZXM7XG4gICAgICAgIGFzc2VydChmaWxlcywgYGdsb2JhbCBzdHlsZSBuYW1lIHNob3VsZCBhbHdheXMgYmUgZm91bmQgWyR7YXJncy5wYXRofV1gKTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGNvbnRlbnRzOiBmaWxlcy5tYXAoKGZpbGUpID0+IGBAaW1wb3J0ICcke2ZpbGUucmVwbGFjZSgvXFxcXC9nLCAnLycpfSc7YCkuam9pbignXFxuJyksXG4gICAgICAgICAgbG9hZGVyOiAnY3NzJyxcbiAgICAgICAgICByZXNvbHZlRGlyOiB3b3Jrc3BhY2VSb290LFxuICAgICAgICB9O1xuICAgICAgfSk7XG4gICAgfSxcbiAgfSk7XG5cbiAgcmV0dXJuIGJ1aWxkT3B0aW9ucztcbn1cbiJdfQ==