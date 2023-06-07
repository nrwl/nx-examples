"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NamedChunksPlugin = void 0;
const webpack_1 = require("webpack");
// `ImportDependency` is not part of Webpack's depenencies typings.
const ImportDependency = require('webpack/lib/dependencies/ImportDependency');
const PLUGIN_NAME = 'named-chunks-plugin';
/**
 * Webpack will not populate the chunk `name` property unless `webpackChunkName` magic comment is used.
 * This however will also effect the filename which is not desired when using `deterministic` chunkIds.
 * This plugin will populate the chunk `name` which is mainly used so that users can set bundle budgets on lazy chunks.
 */
class NamedChunksPlugin {
    apply(compiler) {
        compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation) => {
            compilation.hooks.chunkAsset.tap(PLUGIN_NAME, (chunk) => {
                if (chunk.name) {
                    return;
                }
                if ([...chunk.files.values()].every((f) => f.endsWith('.css'))) {
                    // If all chunk files are CSS files skip.
                    // This happens when using `import('./styles.css')` in a lazy loaded module.
                    return undefined;
                }
                const name = this.generateName(chunk);
                if (name) {
                    chunk.name = name;
                }
            });
        });
    }
    generateName(chunk) {
        for (const group of chunk.groupsIterable) {
            const [block] = group.getBlocks();
            if (!(block instanceof webpack_1.AsyncDependenciesBlock)) {
                continue;
            }
            if (block.groupOptions.name) {
                // Ignore groups which have been named already.
                return undefined;
            }
            for (const dependency of block.dependencies) {
                if (dependency instanceof ImportDependency) {
                    return webpack_1.Template.toPath(dependency.request);
                }
            }
        }
        return undefined;
    }
}
exports.NamedChunksPlugin = NamedChunksPlugin;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmFtZWQtY2h1bmtzLXBsdWdpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2J1aWxkX2FuZ3VsYXIvc3JjL3dlYnBhY2svcGx1Z2lucy9uYW1lZC1jaHVua3MtcGx1Z2luLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7OztBQUVILHFDQUEwRjtBQUUxRixtRUFBbUU7QUFDbkUsTUFBTSxnQkFBZ0IsR0FBeUMsT0FBTyxDQUFDLDJDQUEyQyxDQUFDLENBQUM7QUFFcEgsTUFBTSxXQUFXLEdBQUcscUJBQXFCLENBQUM7QUFFMUM7Ozs7R0FJRztBQUNILE1BQWEsaUJBQWlCO0lBQzVCLEtBQUssQ0FBQyxRQUFrQjtRQUN0QixRQUFRLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLENBQUMsV0FBVyxFQUFFLEVBQUU7WUFDMUQsV0FBVyxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxDQUFDLEtBQUssRUFBRSxFQUFFO2dCQUN0RCxJQUFJLEtBQUssQ0FBQyxJQUFJLEVBQUU7b0JBQ2QsT0FBTztpQkFDUjtnQkFFRCxJQUFJLENBQUMsR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUU7b0JBQzlELHlDQUF5QztvQkFDekMsNEVBQTRFO29CQUM1RSxPQUFPLFNBQVMsQ0FBQztpQkFDbEI7Z0JBRUQsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDdEMsSUFBSSxJQUFJLEVBQUU7b0JBQ1IsS0FBSyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7aUJBQ25CO1lBQ0gsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFTyxZQUFZLENBQUMsS0FBWTtRQUMvQixLQUFLLE1BQU0sS0FBSyxJQUFJLEtBQUssQ0FBQyxjQUFjLEVBQUU7WUFDeEMsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLEtBQUssQ0FBQyxTQUFTLEVBQUUsQ0FBQztZQUNsQyxJQUFJLENBQUMsQ0FBQyxLQUFLLFlBQVksZ0NBQXNCLENBQUMsRUFBRTtnQkFDOUMsU0FBUzthQUNWO1lBRUQsSUFBSSxLQUFLLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRTtnQkFDM0IsK0NBQStDO2dCQUMvQyxPQUFPLFNBQVMsQ0FBQzthQUNsQjtZQUVELEtBQUssTUFBTSxVQUFVLElBQUksS0FBSyxDQUFDLFlBQVksRUFBRTtnQkFDM0MsSUFBSSxVQUFVLFlBQVksZ0JBQWdCLEVBQUU7b0JBQzFDLE9BQU8sa0JBQVEsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2lCQUM1QzthQUNGO1NBQ0Y7UUFFRCxPQUFPLFNBQVMsQ0FBQztJQUNuQixDQUFDO0NBQ0Y7QUEzQ0QsOENBMkNDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7IEFzeW5jRGVwZW5kZW5jaWVzQmxvY2ssIENodW5rLCBDb21waWxlciwgVGVtcGxhdGUsIGRlcGVuZGVuY2llcyB9IGZyb20gJ3dlYnBhY2snO1xuXG4vLyBgSW1wb3J0RGVwZW5kZW5jeWAgaXMgbm90IHBhcnQgb2YgV2VicGFjaydzIGRlcGVuZW5jaWVzIHR5cGluZ3MuXG5jb25zdCBJbXBvcnREZXBlbmRlbmN5OiB0eXBlb2YgZGVwZW5kZW5jaWVzLk1vZHVsZURlcGVuZGVuY3kgPSByZXF1aXJlKCd3ZWJwYWNrL2xpYi9kZXBlbmRlbmNpZXMvSW1wb3J0RGVwZW5kZW5jeScpO1xuXG5jb25zdCBQTFVHSU5fTkFNRSA9ICduYW1lZC1jaHVua3MtcGx1Z2luJztcblxuLyoqXG4gKiBXZWJwYWNrIHdpbGwgbm90IHBvcHVsYXRlIHRoZSBjaHVuayBgbmFtZWAgcHJvcGVydHkgdW5sZXNzIGB3ZWJwYWNrQ2h1bmtOYW1lYCBtYWdpYyBjb21tZW50IGlzIHVzZWQuXG4gKiBUaGlzIGhvd2V2ZXIgd2lsbCBhbHNvIGVmZmVjdCB0aGUgZmlsZW5hbWUgd2hpY2ggaXMgbm90IGRlc2lyZWQgd2hlbiB1c2luZyBgZGV0ZXJtaW5pc3RpY2AgY2h1bmtJZHMuXG4gKiBUaGlzIHBsdWdpbiB3aWxsIHBvcHVsYXRlIHRoZSBjaHVuayBgbmFtZWAgd2hpY2ggaXMgbWFpbmx5IHVzZWQgc28gdGhhdCB1c2VycyBjYW4gc2V0IGJ1bmRsZSBidWRnZXRzIG9uIGxhenkgY2h1bmtzLlxuICovXG5leHBvcnQgY2xhc3MgTmFtZWRDaHVua3NQbHVnaW4ge1xuICBhcHBseShjb21waWxlcjogQ29tcGlsZXIpIHtcbiAgICBjb21waWxlci5ob29rcy5jb21waWxhdGlvbi50YXAoUExVR0lOX05BTUUsIChjb21waWxhdGlvbikgPT4ge1xuICAgICAgY29tcGlsYXRpb24uaG9va3MuY2h1bmtBc3NldC50YXAoUExVR0lOX05BTUUsIChjaHVuaykgPT4ge1xuICAgICAgICBpZiAoY2h1bmsubmFtZSkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChbLi4uY2h1bmsuZmlsZXMudmFsdWVzKCldLmV2ZXJ5KChmKSA9PiBmLmVuZHNXaXRoKCcuY3NzJykpKSB7XG4gICAgICAgICAgLy8gSWYgYWxsIGNodW5rIGZpbGVzIGFyZSBDU1MgZmlsZXMgc2tpcC5cbiAgICAgICAgICAvLyBUaGlzIGhhcHBlbnMgd2hlbiB1c2luZyBgaW1wb3J0KCcuL3N0eWxlcy5jc3MnKWAgaW4gYSBsYXp5IGxvYWRlZCBtb2R1bGUuXG4gICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG5hbWUgPSB0aGlzLmdlbmVyYXRlTmFtZShjaHVuayk7XG4gICAgICAgIGlmIChuYW1lKSB7XG4gICAgICAgICAgY2h1bmsubmFtZSA9IG5hbWU7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBnZW5lcmF0ZU5hbWUoY2h1bms6IENodW5rKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgICBmb3IgKGNvbnN0IGdyb3VwIG9mIGNodW5rLmdyb3Vwc0l0ZXJhYmxlKSB7XG4gICAgICBjb25zdCBbYmxvY2tdID0gZ3JvdXAuZ2V0QmxvY2tzKCk7XG4gICAgICBpZiAoIShibG9jayBpbnN0YW5jZW9mIEFzeW5jRGVwZW5kZW5jaWVzQmxvY2spKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAoYmxvY2suZ3JvdXBPcHRpb25zLm5hbWUpIHtcbiAgICAgICAgLy8gSWdub3JlIGdyb3VwcyB3aGljaCBoYXZlIGJlZW4gbmFtZWQgYWxyZWFkeS5cbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgIH1cblxuICAgICAgZm9yIChjb25zdCBkZXBlbmRlbmN5IG9mIGJsb2NrLmRlcGVuZGVuY2llcykge1xuICAgICAgICBpZiAoZGVwZW5kZW5jeSBpbnN0YW5jZW9mIEltcG9ydERlcGVuZGVuY3kpIHtcbiAgICAgICAgICByZXR1cm4gVGVtcGxhdGUudG9QYXRoKGRlcGVuZGVuY3kucmVxdWVzdCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG59XG4iXX0=