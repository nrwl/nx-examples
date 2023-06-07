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
exports.createGlobalScriptsBundleOptions = void 0;
const magic_string_1 = __importStar(require("magic-string"));
const node_assert_1 = __importDefault(require("node:assert"));
const promises_1 = require("node:fs/promises");
const sourcemap_ignorelist_plugin_1 = require("./sourcemap-ignorelist-plugin");
/**
 * Create an esbuild 'build' options object for all global scripts defined in the user provied
 * build options.
 * @param options The builder's user-provider normalized options.
 * @returns An esbuild BuildOptions object.
 */
function createGlobalScriptsBundleOptions(options, initial) {
    const { globalScripts, optimizationOptions, outputNames, preserveSymlinks, sourcemapOptions, workspaceRoot, } = options;
    const namespace = 'angular:script/global';
    const entryPoints = {};
    let found = false;
    for (const script of globalScripts) {
        if (script.initial === initial) {
            found = true;
            entryPoints[script.name] = `${namespace}:${script.name}`;
        }
    }
    // Skip if there are no entry points for the style loading type
    if (found === false) {
        return;
    }
    return {
        absWorkingDir: workspaceRoot,
        bundle: false,
        splitting: false,
        entryPoints,
        entryNames: initial ? outputNames.bundles : '[name]',
        assetNames: outputNames.media,
        mainFields: ['script', 'browser', 'main'],
        conditions: ['script'],
        resolveExtensions: ['.mjs', '.js'],
        logLevel: options.verbose ? 'debug' : 'silent',
        metafile: true,
        minify: optimizationOptions.scripts,
        outdir: workspaceRoot,
        sourcemap: sourcemapOptions.scripts && (sourcemapOptions.hidden ? 'external' : true),
        write: false,
        platform: 'neutral',
        preserveSymlinks,
        plugins: [
            (0, sourcemap_ignorelist_plugin_1.createSourcemapIngorelistPlugin)(),
            {
                name: 'angular-global-scripts',
                setup(build) {
                    build.onResolve({ filter: /^angular:script\/global:/ }, (args) => {
                        if (args.kind !== 'entry-point') {
                            return null;
                        }
                        return {
                            // Add the `js` extension here so that esbuild generates an output file with the extension
                            path: args.path.slice(namespace.length + 1) + '.js',
                            namespace,
                        };
                    });
                    // All references within a global script should be considered external. This maintains the runtime
                    // behavior of the script as if it were added directly to a script element for referenced imports.
                    build.onResolve({ filter: /./, namespace }, ({ path }) => {
                        return {
                            path,
                            external: true,
                        };
                    });
                    build.onLoad({ filter: /./, namespace }, async (args) => {
                        const files = globalScripts.find(({ name }) => name === args.path.slice(0, -3))?.files;
                        (0, node_assert_1.default)(files, `Invalid operation: global scripts name not found [${args.path}]`);
                        // Global scripts are concatenated using magic-string instead of bundled via esbuild.
                        const bundleContent = new magic_string_1.Bundle();
                        for (const filename of files) {
                            const resolveResult = await build.resolve(filename, {
                                kind: 'entry-point',
                                resolveDir: workspaceRoot,
                            });
                            if (resolveResult.errors.length) {
                                // Remove resolution failure notes about marking as external since it doesn't apply
                                // to global scripts.
                                resolveResult.errors.forEach((error) => (error.notes = []));
                                return {
                                    errors: resolveResult.errors,
                                    warnings: resolveResult.warnings,
                                };
                            }
                            const fileContent = await (0, promises_1.readFile)(resolveResult.path, 'utf-8');
                            bundleContent.addSource(new magic_string_1.default(fileContent, { filename }));
                        }
                        return {
                            contents: bundleContent.toString(),
                            loader: 'js',
                        };
                    });
                },
            },
        ],
    };
}
exports.createGlobalScriptsBundleOptions = createGlobalScriptsBundleOptions;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2xvYmFsLXNjcmlwdHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy9idWlsZGVycy9icm93c2VyLWVzYnVpbGQvZ2xvYmFsLXNjcmlwdHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFHSCw2REFBbUQ7QUFDbkQsOERBQWlDO0FBQ2pDLCtDQUE0QztBQUU1QywrRUFBZ0Y7QUFFaEY7Ozs7O0dBS0c7QUFDSCxTQUFnQixnQ0FBZ0MsQ0FDOUMsT0FBaUMsRUFDakMsT0FBZ0I7SUFFaEIsTUFBTSxFQUNKLGFBQWEsRUFDYixtQkFBbUIsRUFDbkIsV0FBVyxFQUNYLGdCQUFnQixFQUNoQixnQkFBZ0IsRUFDaEIsYUFBYSxHQUNkLEdBQUcsT0FBTyxDQUFDO0lBRVosTUFBTSxTQUFTLEdBQUcsdUJBQXVCLENBQUM7SUFDMUMsTUFBTSxXQUFXLEdBQTJCLEVBQUUsQ0FBQztJQUMvQyxJQUFJLEtBQUssR0FBRyxLQUFLLENBQUM7SUFDbEIsS0FBSyxNQUFNLE1BQU0sSUFBSSxhQUFhLEVBQUU7UUFDbEMsSUFBSSxNQUFNLENBQUMsT0FBTyxLQUFLLE9BQU8sRUFBRTtZQUM5QixLQUFLLEdBQUcsSUFBSSxDQUFDO1lBQ2IsV0FBVyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxHQUFHLFNBQVMsSUFBSSxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUM7U0FDMUQ7S0FDRjtJQUVELCtEQUErRDtJQUMvRCxJQUFJLEtBQUssS0FBSyxLQUFLLEVBQUU7UUFDbkIsT0FBTztLQUNSO0lBRUQsT0FBTztRQUNMLGFBQWEsRUFBRSxhQUFhO1FBQzVCLE1BQU0sRUFBRSxLQUFLO1FBQ2IsU0FBUyxFQUFFLEtBQUs7UUFDaEIsV0FBVztRQUNYLFVBQVUsRUFB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RUFBRSxDQUFDLENBQUMsQ0FBQztnQ0FFNUQsT0FBTztvQ0FDTCxNQUFNLEVBQUUsYUFBYSxDQUFDLE1BQU07b0NBQzVCLFFBQVEsRUFBRSxhQUFhLENBQUMsUUFBUTtpQ0FDakMsQ0FBQzs2QkFDSDs0QkFFRCxNQUFNLFdBQVcsR0FBRyxNQUFNLElBQUEsbUJBQVEsRUFBQyxhQUFhLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDOzRCQUNoRSxhQUFhLENBQUMsU0FBUyxDQUFDLElBQUksc0JBQVcsQ0FBQyxXQUFXLEVBQUUsRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUM7eUJBQ3JFO3dCQUVELE9BQU87NEJBQ0wsUUFBUSxFQUFFLGFBQWEsQ0FBQyxRQUFRLEVBQUU7NEJBQ2xDLE1BQU0sRUFBRSxJQUFJO3lCQUNiLENBQUM7b0JBQ0osQ0FBQyxDQUFDLENBQUM7Z0JBQ0wsQ0FBQzthQUNGO1NBQ0Y7S0FDRixDQUFDO0FBQ0osQ0FBQztBQTFHRCw0RUEwR0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHR5cGUgeyBCdWlsZE9wdGlvbnMgfSBmcm9tICdlc2J1aWxkJztcbmltcG9ydCBNYWdpY1N0cmluZywgeyBCdW5kbGUgfSBmcm9tICdtYWdpYy1zdHJpbmcnO1xuaW1wb3J0IGFzc2VydCBmcm9tICdub2RlOmFzc2VydCc7XG5pbXBvcnQgeyByZWFkRmlsZSB9IGZyb20gJ25vZGU6ZnMvcHJvbWlzZXMnO1xuaW1wb3J0IHsgTm9ybWFsaXplZEJyb3dzZXJPcHRpb25zIH0gZnJvbSAnLi9vcHRpb25zJztcbmltcG9ydCB7IGNyZWF0ZVNvdXJjZW1hcEluZ29yZWxpc3RQbHVnaW4gfSBmcm9tICcuL3NvdXJjZW1hcC1pZ25vcmVsaXN0LXBsdWdpbic7XG5cbi8qKlxuICogQ3JlYXRlIGFuIGVzYnVpbGQgJ2J1aWxkJyBvcHRpb25zIG9iamVjdCBmb3IgYWxsIGdsb2JhbCBzY3JpcHRzIGRlZmluZWQgaW4gdGhlIHVzZXIgcHJvdmllZFxuICogYnVpbGQgb3B0aW9ucy5cbiAqIEBwYXJhbSBvcHRpb25zIFRoZSBidWlsZGVyJ3MgdXNlci1wcm92aWRlciBub3JtYWxpemVkIG9wdGlvbnMuXG4gKiBAcmV0dXJucyBBbiBlc2J1aWxkIEJ1aWxkT3B0aW9ucyBvYmplY3QuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVHbG9iYWxTY3JpcHRzQnVuZGxlT3B0aW9ucyhcbiAgb3B0aW9uczogTm9ybWFsaXplZEJyb3dzZXJPcHRpb25zLFxuICBpbml0aWFsOiBib29sZWFuLFxuKTogQnVpbGRPcHRpb25zIHwgdW5kZWZpbmVkIHtcbiAgY29uc3Qge1xuICAgIGdsb2JhbFNjcmlwdHMsXG4gICAgb3B0aW1pemF0aW9uT3B0aW9ucyxcbiAgICBvdXRwdXROYW1lcyxcbiAgICBwcmVzZXJ2ZVN5bWxpbmtzLFxuICAgIHNvdXJjZW1hcE9wdGlvbnMsXG4gICAgd29ya3NwYWNlUm9vdCxcbiAgfSA9IG9wdGlvbnM7XG5cbiAgY29uc3QgbmFtZXNwYWNlID0gJ2FuZ3VsYXI6c2NyaXB0L2dsb2JhbCc7XG4gIGNvbnN0IGVudHJ5UG9pbnRzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge307XG4gIGxldCBmb3VuZCA9IGZhbHNlO1xuICBmb3IgKGNvbnN0IHNjcmlwdCBvZiBnbG9iYWxTY3JpcHRzKSB7XG4gICAgaWYgKHNjcmlwdC5pbml0aWFsID09PSBpbml0aWFsKSB7XG4gICAgICBmb3VuZCA9IHRydWU7XG4gICAgICBlbnRyeVBvaW50c1tzY3JpcHQubmFtZV0gPSBgJHtuYW1lc3BhY2V9OiR7c2NyaXB0Lm5hbWV9YDtcbiAgICB9XG4gIH1cblxuICAvLyBTa2lwIGlmIHRoZXJlIGFyZSBubyBlbnRyeSBwb2ludHMgZm9yIHRoZSBzdHlsZSBsb2FkaW5nIHR5cGVcbiAgaWYgKGZvdW5kID09PSBmYWxzZSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgYWJzV29ya2luZ0Rpcjogd29ya3NwYWNlUm9vdCxcbiAgICBidW5kbGU6IGZhbHNlLFxuICAgIHNwbGl0dGluZzogZmFsc2UsXG4gICAgZW50cnlQb2ludHMsXG4gICAgZW50cnlOYW1lczogaW5pdGlhbCA/IG91dHB1dE5hbWVzLmJ1bmRsZXMgOiAnW25hbWVdJyxcbiAgICBhc3NldE5hbWVzOiBvdXRwdXROYW1lcy5tZWRpYSxcbiAgICBtYWluRmllbGRzOiBbJ3NjcmlwdCcsICdicm93c2VyJywgJ21haW4nXSxcbiAgICBjb25kaXRpb25zOiBbJ3NjcmlwdCddLFxuICAgIHJlc29sdmVFeHRlbnNpb25zOiBbJy5tanMnLCAnLmpzJ10sXG4gICAgbG9nTGV2ZWw6IG9wdGlvbnMudmVyYm9zZSA/ICdkZWJ1ZycgOiAnc2lsZW50JyxcbiAgICBtZXRhZmlsZTogdHJ1ZSxcbiAgICBtaW5pZnk6IG9wdGltaXphdGlvbk9wdGlvbnMuc2NyaXB0cyxcbiAgICBvdXRkaXI6IHdvcmtzcGFjZVJvb3QsXG4gICAgc291cmNlbWFwOiBzb3VyY2VtYXBPcHRpb25zLnNjcmlwdHMgJiYgKHNvdXJjZW1hcE9wdGlvbnMuaGlkZGVuID8gJ2V4dGVybmFsJyA6IHRydWUpLFxuICAgIHdyaXRlOiBmYWxzZSxcbiAgICBwbGF0Zm9ybTogJ25ldXRyYWwnLFxuICAgIHByZXNlcnZlU3ltbGlua3MsXG4gICAgcGx1Z2luczogW1xuICAgICAgY3JlYXRlU291cmNlbWFwSW5nb3JlbGlzdFBsdWdpbigpLFxuICAgICAge1xuICAgICAgICBuYW1lOiAnYW5ndWxhci1nbG9iYWwtc2NyaXB0cycsXG4gICAgICAgIHNldHVwKGJ1aWxkKSB7XG4gICAgICAgICAgYnVpbGQub25SZXNvbHZlKHsgZmlsdGVyOiAvXmFuZ3VsYXI6c2NyaXB0XFwvZ2xvYmFsOi8gfSwgKGFyZ3MpID0+IHtcbiAgICAgICAgICAgIGlmIChhcmdzLmtpbmQgIT09ICdlbnRyeS1wb2ludCcpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgIC8vIEFkZCB0aGUgYGpzYCBleHRlbnNpb24gaGVyZSBzbyB0aGF0IGVzYnVpbGQgZ2VuZXJhdGVzIGFuIG91dHB1dCBmaWxlIHdpdGggdGhlIGV4dGVuc2lvblxuICAgICAgICAgICAgICBwYXRoOiBhcmdzLnBhdGguc2xpY2UobmFtZXNwYWNlLmxlbmd0aCArIDEpICsgJy5qcycsXG4gICAgICAgICAgICAgIG5hbWVzcGFjZSxcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgLy8gQWxsIHJlZmVyZW5jZXMgd2l0aGluIGEgZ2xvYmFsIHNjcmlwdCBzaG91bGQgYmUgY29uc2lkZXJlZCBleHRlcm5hbC4gVGhpcyBtYWludGFpbnMgdGhlIHJ1bnRpbWVcbiAgICAgICAgICAvLyBiZWhhdmlvciBvZiB0aGUgc2NyaXB0IGFzIGlmIGl0IHdlcmUgYWRkZWQgZGlyZWN0bHkgdG8gYSBzY3JpcHQgZWxlbWVudCBmb3IgcmVmZXJlbmNlZCBpbXBvcnRzLlxuICAgICAgICAgIGJ1aWxkLm9uUmVzb2x2ZSh7IGZpbHRlcjogLy4vLCBuYW1lc3BhY2UgfSwgKHsgcGF0aCB9KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICBwYXRoLFxuICAgICAgICAgICAgICBleHRlcm5hbDogdHJ1ZSxcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgYnVpbGQub25Mb2FkKHsgZmlsdGVyOiAvLi8sIG5hbWVzcGFjZSB9LCBhc3luYyAoYXJncykgPT4ge1xuICAgICAgICAgICAgY29uc3QgZmlsZXMgPSBnbG9iYWxTY3JpcHRzLmZpbmQoKHsgbmFtZSB9KSA9PiBuYW1lID09PSBhcmdzLnBhdGguc2xpY2UoMCwgLTMpKT8uZmlsZXM7XG4gICAgICAgICAgICBhc3NlcnQoZmlsZXMsIGBJbnZhbGlkIG9wZXJhdGlvbjogZ2xvYmFsIHNjcmlwdHMgbmFtZSBub3QgZm91bmQgWyR7YXJncy5wYXRofV1gKTtcblxuICAgICAgICAgICAgLy8gR2xvYmFsIHNjcmlwdHMgYXJlIGNvbmNhdGVuYXRlZCB1c2luZyBtYWdpYy1zdHJpbmcgaW5zdGVhZCBvZiBidW5kbGVkIHZpYSBlc2J1aWxkLlxuICAgICAgICAgICAgY29uc3QgYnVuZGxlQ29udGVudCA9IG5ldyBCdW5kbGUoKTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgZmlsZW5hbWUgb2YgZmlsZXMpIHtcbiAgICAgICAgICAgICAgY29uc3QgcmVzb2x2ZVJlc3VsdCA9IGF3YWl0IGJ1aWxkLnJlc29sdmUoZmlsZW5hbWUsIHtcbiAgICAgICAgICAgICAgICBraW5kOiAnZW50cnktcG9pbnQnLFxuICAgICAgICAgICAgICAgIHJlc29sdmVEaXI6IHdvcmtzcGFjZVJvb3QsXG4gICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgIGlmIChyZXNvbHZlUmVzdWx0LmVycm9ycy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAvLyBSZW1vdmUgcmVzb2x1dGlvbiBmYWlsdXJlIG5vdGVzIGFib3V0IG1hcmtpbmcgYXMgZXh0ZXJuYWwgc2luY2UgaXQgZG9lc24ndCBhcHBseVxuICAgICAgICAgICAgICAgIC8vIHRvIGdsb2JhbCBzY3JpcHRzLlxuICAgICAgICAgICAgICAgIHJlc29sdmVSZXN1bHQuZXJyb3JzLmZvckVhY2goKGVycm9yKSA9PiAoZXJyb3Iubm90ZXMgPSBbXSkpO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgIGVycm9yczogcmVzb2x2ZVJlc3VsdC5lcnJvcnMsXG4gICAgICAgICAgICAgICAgICB3YXJuaW5nczogcmVzb2x2ZVJlc3VsdC53YXJuaW5ncyxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgY29uc3QgZmlsZUNvbnRlbnQgPSBhd2FpdCByZWFkRmlsZShyZXNvbHZlUmVzdWx0LnBhdGgsICd1dGYtOCcpO1xuICAgICAgICAgICAgICBidW5kbGVDb250ZW50LmFkZFNvdXJjZShuZXcgTWFnaWNTdHJpbmcoZmlsZUNvbnRlbnQsIHsgZmlsZW5hbWUgfSkpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICBjb250ZW50czogYnVuZGxlQ29udGVudC50b1N0cmluZygpLFxuICAgICAgICAgICAgICBsb2FkZXI6ICdqcycsXG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgfSxcbiAgICBdLFxuICB9O1xufVxuIl19