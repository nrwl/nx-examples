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
exports.FindTestsPlugin = void 0;
const assert_1 = __importDefault(require("assert"));
const fs_1 = require("fs");
const glob_1 = __importStar(require("glob"));
const mini_css_extract_plugin_1 = require("mini-css-extract-plugin");
const path_1 = require("path");
const util_1 = require("util");
const globPromise = (0, util_1.promisify)(glob_1.default);
/**
 * The name of the plugin provided to Webpack when tapping Webpack compiler hooks.
 */
const PLUGIN_NAME = 'angular-find-tests-plugin';
class FindTestsPlugin {
    constructor(options) {
        this.options = options;
    }
    apply(compiler) {
        const { include = ['**/*.spec.ts'], exclude = [], projectSourceRoot, workspaceRoot, } = this.options;
        const webpackOptions = compiler.options;
        const entry = typeof webpackOptions.entry === 'function' ? webpackOptions.entry() : webpackOptions.entry;
        let originalImport;
        // Add tests files are part of the entry-point.
        webpackOptions.entry = async () => {
            const specFiles = await findTests(include, exclude, workspaceRoot, projectSourceRoot);
            const entrypoints = await entry;
            const entrypoint = entrypoints['main'];
            if (!entrypoint.import) {
                throw new Error(`Cannot find 'main' entrypoint.`);
            }
            if (specFiles.length) {
                originalImport ?? (originalImport = entrypoint.import);
                entrypoint.import = [...originalImport, ...specFiles];
            }
            else {
                (0, assert_1.default)(this.compilation, 'Compilation cannot be undefined.');
                this.compilation
                    .getLogger(mini_css_extract_plugin_1.pluginName)
                    .error(`Specified patterns: "${include.join(', ')}" did not match any spec files.`);
            }
            return entrypoints;
        };
        compiler.hooks.thisCompilation.tap(PLUGIN_NAME, (compilation) => {
            this.compilation = compilation;
            compilation.contextDependencies.add(projectSourceRoot);
        });
    }
}
exports.FindTestsPlugin = FindTestsPlugin;
// go through all patterns and find unique list of files
async function findTests(include, exclude, workspaceRoot, projectSourceRoot) {
    const matchingTestsPromises = include.map((pattern) => findMatchingTests(pattern, exclude, workspaceRoot, projectSourceRoot));
    const files = await Promise.all(matchingTestsPromises);
    // Unique file names
    return [...new Set(files.flat())];
}
const normalizePath = (path) => path.replace(/\\/g, '/');
async function findMatchingTests(pattern, ignore, workspaceRoot, projectSourceRoot) {
    // normalize pattern, glob lib only accepts forward slashes
    let normalizedPattern = normalizePath(pattern);
    if (normalizedPattern.charAt(0) === '/') {
        normalizedPattern = normalizedPattern.substring(1);
    }
    const relativeProjectRoot = normalizePath((0, path_1.relative)(workspaceRoot, projectSourceRoot) + '/');
    // remove relativeProjectRoot to support relative paths from root
    // such paths are easy to get when running scripts via IDEs
    if (normalizedPattern.startsWith(relativeProjectRoot)) {
        normalizedPattern = normalizedPattern.substring(relativeProjectRoot.length);
    }
    // special logic when pattern does not look like a glob
    if (!(0, glob_1.hasMagic)(normalizedPattern)) {
        if (await isDirectory((0, path_1.join)(projectSourceRoot, normalizedPattern))) {
            normalizedPattern = `${normalizedPattern}/**/*.spec.@(ts|tsx)`;
        }
        else {
            // see if matching spec file exists
            const fileExt = (0, path_1.extname)(normalizedPattern);
            // Replace extension to `.spec.ext`. Example: `src/app/app.component.ts`-> `src/app/app.component.spec.ts`
            const potentialSpec = (0, path_1.join)(projectSourceRoot, (0, path_1.dirname)(normalizedPattern), `${(0, path_1.basename)(normalizedPattern, fileExt)}.spec${fileExt}`);
            if (await exists(potentialSpec)) {
                return [potentialSpec];
            }
        }
    }
    return globPromise(normalizedPattern, {
        cwd: projectSourceRoot,
        root: projectSourceRoot,
        nomount: true,
        absolute: true,
        ignore: ['**/node_modules/**', ...ignore],
    });
}
async function isDirectory(path) {
    try {
        const stats = await fs_1.promises.stat(path);
        return stats.isDirectory();
    }
    catch {
        return false;
    }
}
async function exists(path) {
    try {
        await fs_1.promises.access(path, fs_1.constants.F_OK);
        return true;
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmluZC10ZXN0cy1wbHVnaW4uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy9idWlsZGVycy9rYXJtYS9maW5kLXRlc3RzLXBsdWdpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVILG9EQUE0QjtBQUM1QiwyQkFBeUQ7QUFDekQsNkNBQXNDO0FBQ3RDLHFFQUFxRDtBQUNyRCwrQkFBa0U7QUFDbEUsK0JBQWlDO0FBR2pDLE1BQU0sV0FBVyxHQUFHLElBQUEsZ0JBQVMsRUFBQyxjQUFJLENBQUMsQ0FBQztBQUVwQzs7R0FFRztBQUNILE1BQU0sV0FBVyxHQUFHLDJCQUEyQixDQUFDO0FBU2hELE1BQWEsZUFBZTtJQUcxQixZQUFvQixPQUErQjtRQUEvQixZQUFPLEdBQVAsT0FBTyxDQUF3QjtJQUFHLENBQUM7SUFFdkQsS0FBSyxDQUFDLFFBQWtCO1FBQ3RCLE1BQU0sRUFDSixPQUFPLEdBQUcsQ0FBQyxjQUFjLENBQUMsRUFDMUIsT0FBTyxHQUFHLEVBQUUsRUFDWixpQkFBaUIsRUFDakIsYUFBYSxHQUNkLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQztRQUNqQixNQUFNLGNBQWMsR0FBRyxRQUFRLENBQUMsT0FBTyxDQUFDO1FBQ3hDLE1BQU0sS0FBSyxHQUNULE9BQU8sY0FBYyxDQUFDLEtBQUssS0FBSyxVQUFVLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQztRQUU3RixJQUFJLGNBQW9DLENBQUM7UUFFekMsK0NBQStDO1FBQy9DLGNBQWMsQ0FBQyxLQUFLLEdBQUcsS0FBSyxJQUFJLEVBQUU7WUFDaEMsTUFBTSxTQUFTLEdBQUcsTUFBTSxTQUFTLENBQUMs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QUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsY0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRXRDLE9BQU8sSUFBSSxDQUFDO0tBQ2I7SUFBQyxNQUFNO1FBQ04sT0FBTyxLQUFLLENBQUM7S0FDZDtBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IGFzc2VydCBmcm9tICdhc3NlcnQnO1xuaW1wb3J0IHsgUGF0aExpa2UsIGNvbnN0YW50cywgcHJvbWlzZXMgYXMgZnMgfSBmcm9tICdmcyc7XG5pbXBvcnQgZ2xvYiwgeyBoYXNNYWdpYyB9IGZyb20gJ2dsb2InO1xuaW1wb3J0IHsgcGx1Z2luTmFtZSB9IGZyb20gJ21pbmktY3NzLWV4dHJhY3QtcGx1Z2luJztcbmltcG9ydCB7IGJhc2VuYW1lLCBkaXJuYW1lLCBleHRuYW1lLCBqb2luLCByZWxhdGl2ZSB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgcHJvbWlzaWZ5IH0gZnJvbSAndXRpbCc7XG5pbXBvcnQgdHlwZSB7IENvbXBpbGF0aW9uLCBDb21waWxlciB9IGZyb20gJ3dlYnBhY2snO1xuXG5jb25zdCBnbG9iUHJvbWlzZSA9IHByb21pc2lmeShnbG9iKTtcblxuLyoqXG4gKiBUaGUgbmFtZSBvZiB0aGUgcGx1Z2luIHByb3ZpZGVkIHRvIFdlYnBhY2sgd2hlbiB0YXBwaW5nIFdlYnBhY2sgY29tcGlsZXIgaG9va3MuXG4gKi9cbmNvbnN0IFBMVUdJTl9OQU1FID0gJ2FuZ3VsYXItZmluZC10ZXN0cy1wbHVnaW4nO1xuXG5leHBvcnQgaW50ZXJmYWNlIEZpbmRUZXN0c1BsdWdpbk9wdGlvbnMge1xuICBpbmNsdWRlPzogc3RyaW5nW107XG4gIGV4Y2x1ZGU/OiBzdHJpbmdbXTtcbiAgd29ya3NwYWNlUm9vdDogc3RyaW5nO1xuICBwcm9qZWN0U291cmNlUm9vdDogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgRmluZFRlc3RzUGx1Z2luIHtcbiAgcHJpdmF0ZSBjb21waWxhdGlvbjogQ29tcGlsYXRpb24gfCB1bmRlZmluZWQ7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBvcHRpb25zOiBGaW5kVGVzdHNQbHVnaW5PcHRpb25zKSB7fVxuXG4gIGFwcGx5KGNvbXBpbGVyOiBDb21waWxlcik6IHZvaWQge1xuICAgIGNvbnN0IHtcbiAgICAgIGluY2x1ZGUgPSBbJyoqLyouc3BlYy50cyddLFxuICAgICAgZXhjbHVkZSA9IFtdLFxuICAgICAgcHJvamVjdFNvdXJjZVJvb3QsXG4gICAgICB3b3Jrc3BhY2VSb290LFxuICAgIH0gPSB0aGlzLm9wdGlvbnM7XG4gICAgY29uc3Qgd2VicGFja09wdGlvbnMgPSBjb21waWxlci5vcHRpb25zO1xuICAgIGNvbnN0IGVudHJ5ID1cbiAgICAgIHR5cGVvZiB3ZWJwYWNrT3B0aW9ucy5lbnRyeSA9PT0gJ2Z1bmN0aW9uJyA/IHdlYnBhY2tPcHRpb25zLmVudHJ5KCkgOiB3ZWJwYWNrT3B0aW9ucy5lbnRyeTtcblxuICAgIGxldCBvcmlnaW5hbEltcG9ydDogc3RyaW5nW10gfCB1bmRlZmluZWQ7XG5cbiAgICAvLyBBZGQgdGVzdHMgZmlsZXMgYXJlIHBhcnQgb2YgdGhlIGVudHJ5LXBvaW50LlxuICAgIHdlYnBhY2tPcHRpb25zLmVudHJ5ID0gYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3Qgc3BlY0ZpbGVzID0gYXdhaXQgZmluZFRlc3RzKGluY2x1ZGUsIGV4Y2x1ZGUsIHdvcmtzcGFjZVJvb3QsIHByb2plY3RTb3VyY2VSb290KTtcbiAgICAgIGNvbnN0IGVudHJ5cG9pbnRzID0gYXdhaXQgZW50cnk7XG4gICAgICBjb25zdCBlbnRyeXBvaW50ID0gZW50cnlwb2ludHNbJ21haW4nXTtcbiAgICAgIGlmICghZW50cnlwb2ludC5pbXBvcnQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBDYW5ub3QgZmluZCAnbWFpbicgZW50cnlwb2ludC5gKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHNwZWNGaWxlcy5sZW5ndGgpIHtcbiAgICAgICAgb3JpZ2luYWxJbXBvcnQgPz89IGVudHJ5cG9pbnQuaW1wb3J0O1xuICAgICAgICBlbnRyeXBvaW50LmltcG9ydCA9IFsuLi5vcmlnaW5hbEltcG9ydCwgLi4uc3BlY0ZpbGVzXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGFzc2VydCh0aGlzLmNvbXBpbGF0aW9uLCAnQ29tcGlsYXRpb24gY2Fubm90IGJlIHVuZGVmaW5lZC4nKTtcbiAgICAgICAgdGhpcy5jb21waWxhdGlvblxuICAgICAgICAgIC5nZXRMb2dnZXIocGx1Z2luTmFtZSlcbiAgICAgICAgICAuZXJyb3IoYFNwZWNpZmllZCBwYXR0ZXJuczogXCIke2luY2x1ZGUuam9pbignLCAnKX1cIiBkaWQgbm90IG1hdGNoIGFueSBzcGVjIGZpbGVzLmApO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gZW50cnlwb2ludHM7XG4gICAgfTtcblxuICAgIGNvbXBpbGVyLmhvb2tzLnRoaXNDb21waWxhdGlvbi50YXAoUExVR0lOX05BTUUsIChjb21waWxhdGlvbikgPT4ge1xuICAgICAgdGhpcy5jb21waWxhdGlvbiA9IGNvbXBpbGF0aW9uO1xuICAgICAgY29tcGlsYXRpb24uY29udGV4dERlcGVuZGVuY2llcy5hZGQocHJvamVjdFNvdXJjZVJvb3QpO1xuICAgIH0pO1xuICB9XG59XG5cbi8vIGdvIHRocm91Z2ggYWxsIHBhdHRlcm5zIGFuZCBmaW5kIHVuaXF1ZSBsaXN0IG9mIGZpbGVzXG5hc3luYyBmdW5jdGlvbiBmaW5kVGVzdHMoXG4gIGluY2x1ZGU6IHN0cmluZ1tdLFxuICBleGNsdWRlOiBzdHJpbmdbXSxcbiAgd29ya3NwYWNlUm9vdDogc3RyaW5nLFxuICBwcm9qZWN0U291cmNlUm9vdDogc3RyaW5nLFxuKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICBjb25zdCBtYXRjaGluZ1Rlc3RzUHJvbWlzZXMgPSBpbmNsdWRlLm1hcCgocGF0dGVybikgPT5cbiAgICBmaW5kTWF0Y2hpbmdUZXN0cyhwYXR0ZXJuLCBleGNsdWRlLCB3b3Jrc3BhY2VSb290LCBwcm9qZWN0U291cmNlUm9vdCksXG4gICk7XG4gIGNvbnN0IGZpbGVzID0gYXdhaXQgUHJvbWlzZS5hbGwobWF0Y2hpbmdUZXN0c1Byb21pc2VzKTtcblxuICAvLyBVbmlxdWUgZmlsZSBuYW1lc1xuICByZXR1cm4gWy4uLm5ldyBTZXQoZmlsZXMuZmxhdCgpKV07XG59XG5cbmNvbnN0IG5vcm1hbGl6ZVBhdGggPSAocGF0aDogc3RyaW5nKTogc3RyaW5nID0+IHBhdGgucmVwbGFjZSgvXFxcXC9nLCAnLycpO1xuXG5hc3luYyBmdW5jdGlvbiBmaW5kTWF0Y2hpbmdUZXN0cyhcbiAgcGF0dGVybjogc3RyaW5nLFxuICBpZ25vcmU6IHN0cmluZ1tdLFxuICB3b3Jrc3BhY2VSb290OiBzdHJpbmcsXG4gIHByb2plY3RTb3VyY2VSb290OiBzdHJpbmcsXG4pOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gIC8vIG5vcm1hbGl6ZSBwYXR0ZXJuLCBnbG9iIGxpYiBvbmx5IGFjY2VwdHMgZm9yd2FyZCBzbGFzaGVzXG4gIGxldCBub3JtYWxpemVkUGF0dGVybiA9IG5vcm1hbGl6ZVBhdGgocGF0dGVybik7XG4gIGlmIChub3JtYWxpemVkUGF0dGVybi5jaGFyQXQoMCkgPT09ICcvJykge1xuICAgIG5vcm1hbGl6ZWRQYXR0ZXJuID0gbm9ybWFsaXplZFBhdHRlcm4uc3Vic3RyaW5nKDEpO1xuICB9XG5cbiAgY29uc3QgcmVsYXRpdmVQcm9qZWN0Um9vdCA9IG5vcm1hbGl6ZVBhdGgocmVsYXRpdmUod29ya3NwYWNlUm9vdCwgcHJvamVjdFNvdXJjZVJvb3QpICsgJy8nKTtcblxuICAvLyByZW1vdmUgcmVsYXRpdmVQcm9qZWN0Um9vdCB0byBzdXBwb3J0IHJlbGF0aXZlIHBhdGhzIGZyb20gcm9vdFxuICAvLyBzdWNoIHBhdGhzIGFyZSBlYXN5IHRvIGdldCB3aGVuIHJ1bm5pbmcgc2NyaXB0cyB2aWEgSURFc1xuICBpZiAobm9ybWFsaXplZFBhdHRlcm4uc3RhcnRzV2l0aChyZWxhdGl2ZVByb2plY3RSb290KSkge1xuICAgIG5vcm1hbGl6ZWRQYXR0ZXJuID0gbm9ybWFsaXplZFBhdHRlcm4uc3Vic3RyaW5nKHJlbGF0aXZlUHJvamVjdFJvb3QubGVuZ3RoKTtcbiAgfVxuXG4gIC8vIHNwZWNpYWwgbG9naWMgd2hlbiBwYXR0ZXJuIGRvZXMgbm90IGxvb2sgbGlrZSBhIGdsb2JcbiAgaWYgKCFoYXNNYWdpYyhub3JtYWxpemVkUGF0dGVybikpIHtcbiAgICBpZiAoYXdhaXQgaXNEaXJlY3Rvcnkoam9pbihwcm9qZWN0U291cmNlUm9vdCwgbm9ybWFsaXplZFBhdHRlcm4pKSkge1xuICAgICAgbm9ybWFsaXplZFBhdHRlcm4gPSBgJHtub3JtYWxpemVkUGF0dGVybn0vKiovKi5zcGVjLkAodHN8dHN4KWA7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIHNlZSBpZiBtYXRjaGluZyBzcGVjIGZpbGUgZXhpc3RzXG4gICAgICBjb25zdCBmaWxlRXh0ID0gZXh0bmFtZShub3JtYWxpemVkUGF0dGVybik7XG4gICAgICAvLyBSZXBsYWNlIGV4dGVuc2lvbiB0byBgLnNwZWMuZXh0YC4gRXhhbXBsZTogYHNyYy9hcHAvYXBwLmNvbXBvbmVudC50c2AtPiBgc3JjL2FwcC9hcHAuY29tcG9uZW50LnNwZWMudHNgXG4gICAgICBjb25zdCBwb3RlbnRpYWxTcGVjID0gam9pbihcbiAgICAgICAgcHJvamVjdFNvdXJjZVJvb3QsXG4gICAgICAgIGRpcm5hbWUobm9ybWFsaXplZFBhdHRlcm4pLFxuICAgICAgICBgJHtiYXNlbmFtZShub3JtYWxpemVkUGF0dGVybiwgZmlsZUV4dCl9LnNwZWMke2ZpbGVFeHR9YCxcbiAgICAgICk7XG5cbiAgICAgIGlmIChhd2FpdCBleGlzdHMocG90ZW50aWFsU3BlYykpIHtcbiAgICAgICAgcmV0dXJuIFtwb3RlbnRpYWxTcGVjXTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gZ2xvYlByb21pc2Uobm9ybWFsaXplZFBhdHRlcm4sIHtcbiAgICBjd2Q6IHByb2plY3RTb3VyY2VSb290LFxuICAgIHJvb3Q6IHByb2plY3RTb3VyY2VSb290LFxuICAgIG5vbW91bnQ6IHRydWUsXG4gICAgYWJzb2x1dGU6IHRydWUsXG4gICAgaWdub3JlOiBbJyoqL25vZGVfbW9kdWxlcy8qKicsIC4uLmlnbm9yZV0sXG4gIH0pO1xufVxuXG5hc3luYyBmdW5jdGlvbiBpc0RpcmVjdG9yeShwYXRoOiBQYXRoTGlrZSk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICB0cnkge1xuICAgIGNvbnN0IHN0YXRzID0gYXdhaXQgZnMuc3RhdChwYXRoKTtcblxuICAgIHJldHVybiBzdGF0cy5pc0RpcmVjdG9yeSgpO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gZXhpc3RzKHBhdGg6IFBhdGhMaWtlKTogUHJvbWlzZTxib29sZWFuPiB7XG4gIHRyeSB7XG4gICAgYXdhaXQgZnMuYWNjZXNzKHBhdGgsIGNvbnN0YW50cy5GX09LKTtcblxuICAgIHJldHVybiB0cnVlO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cbiJdfQ==