"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DevToolsIgnorePlugin = void 0;
const webpack_1 = require("webpack");
// Following the naming conventions from
// https://sourcemaps.info/spec.html#h.ghqpj1ytqjbm
const IGNORE_LIST = 'x_google_ignoreList';
const PLUGIN_NAME = 'devtools-ignore-plugin';
/**
 * This plugin adds a field to source maps that identifies which sources are
 * vendored or runtime-injected (aka third-party) sources. These are consumed by
 * Chrome DevTools to automatically ignore-list sources.
 */
class DevToolsIgnorePlugin {
    apply(compiler) {
        const { RawSource } = compiler.webpack.sources;
        compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation) => {
            compilation.hooks.processAssets.tap({
                name: PLUGIN_NAME,
                stage: webpack_1.Compilation.PROCESS_ASSETS_STAGE_DEV_TOOLING,
                additionalAssets: true,
            }, (assets) => {
                for (const [name, asset] of Object.entries(assets)) {
                    // Instead of using `asset.map()` to fetch the source maps from
                    // SourceMapSource assets, process them directly as a RawSource.
                    // This is because `.map()` is slow and can take several seconds.
                    if (!name.endsWith('.map')) {
                        // Ignore non source map files.
                        continue;
                    }
                    const mapContent = asset.source().toString();
                    if (!mapContent) {
                        continue;
                    }
                    const map = JSON.parse(mapContent);
                    const ignoreList = [];
                    for (const [index, path] of map.sources.entries()) {
                        if (path.includes('/node_modules/') || path.startsWith('webpack/')) {
                            ignoreList.push(index);
                        }
                    }
                    map[IGNORE_LIST] = ignoreList;
                    compilation.updateAsset(name, new RawSource(JSON.stringify(map)));
                }
            });
        });
    }
}
exports.DevToolsIgnorePlugin = DevToolsIgnorePlugin;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGV2dG9vbHMtaWdub3JlLXBsdWdpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2J1aWxkX2FuZ3VsYXIvc3JjL3dlYnBhY2svcGx1Z2lucy9kZXZ0b29scy1pZ25vcmUtcGx1Z2luLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7OztBQUVILHFDQUFnRDtBQUVoRCx3Q0FBd0M7QUFDeEMsbURBQW1EO0FBQ25ELE1BQU0sV0FBVyxHQUFHLHFCQUFxQixDQUFDO0FBRTFDLE1BQU0sV0FBVyxHQUFHLHdCQUF3QixDQUFDO0FBTzdDOzs7O0dBSUc7QUFDSCxNQUFhLG9CQUFvQjtJQUMvQixLQUFLLENBQUMsUUFBa0I7UUFDdEIsTUFBTSxFQUFFLFNBQVMsRUFBRSxHQUFHLFFBQVEsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDO1FBRS9DLFFBQVEsQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxXQUFXLEVBQUUsRUFBRTtZQUMxRCxXQUFXLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQ2pDO2dCQUNFLElBQUksRUFBRSxXQUFXO2dCQUNqQixLQUFLLEVBQUUscUJBQVcsQ0FBQyxnQ0FBZ0M7Z0JBQ25ELGdCQUFnQixFQUFFLElBQUk7YUFDdkIsRUFDRCxDQUFDLE1BQU0sRUFBRSxFQUFFO2dCQUNULEtBQUssTUFBTSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsSUFBSSxNQUFNLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFO29CQUNsRCwrREFBK0Q7b0JBQy9ELGdFQUFnRTtvQkFDaEUsaUVBQWlFO29CQUNqRSxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsRUFBRTt3QkFDMUIsK0JBQStCO3dCQUMvQixTQUFTO3FCQUNWO29CQUVELE1BQU0sVUFBVSxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQztvQkFDN0MsSUFBSSxDQUFDLFVBQVUsRUFBRTt3QkFDZixTQUFTO3FCQUNWO29CQUVELE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFjLENBQUM7b0JBQ2hELE1BQU0sVUFBVSxHQUFHLEVBQUUsQ0FBQztvQkFFdEIsS0FBSyxNQUFNLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLEVBQUU7d0JBQ2pELElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLEVBQUU7NEJBQ2xFLFVBQVUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7eUJBQ3hCO3FCQUNGO29CQUVELEdBQUcsQ0FBQyxXQUFXLENBQUMsR0FBRyxVQUFVLENBQUM7b0JBQzlCLFdBQVcsQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLElBQUksU0FBUyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO2lCQUNuRTtZQUNILENBQUMsQ0FDRixDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUExQ0Qsb0RBMENDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7IENvbXBpbGF0aW9uLCBDb21waWxlciB9IGZyb20gJ3dlYnBhY2snO1xuXG4vLyBGb2xsb3dpbmcgdGhlIG5hbWluZyBjb252ZW50aW9ucyBmcm9tXG4vLyBodHRwczovL3NvdXJjZW1hcHMuaW5mby9zcGVjLmh0bWwjaC5naHFwajF5dHFqYm1cbmNvbnN0IElHTk9SRV9MSVNUID0gJ3hfZ29vZ2xlX2lnbm9yZUxpc3QnO1xuXG5jb25zdCBQTFVHSU5fTkFNRSA9ICdkZXZ0b29scy1pZ25vcmUtcGx1Z2luJztcblxuaW50ZXJmYWNlIFNvdXJjZU1hcCB7XG4gIHNvdXJjZXM6IHN0cmluZ1tdO1xuICBbSUdOT1JFX0xJU1RdOiBudW1iZXJbXTtcbn1cblxuLyoqXG4gKiBUaGlzIHBsdWdpbiBhZGRzIGEgZmllbGQgdG8gc291cmNlIG1hcHMgdGhhdCBpZGVudGlmaWVzIHdoaWNoIHNvdXJjZXMgYXJlXG4gKiB2ZW5kb3JlZCBvciBydW50aW1lLWluamVjdGVkIChha2EgdGhpcmQtcGFydHkpIHNvdXJjZXMuIFRoZXNlIGFyZSBjb25zdW1lZCBieVxuICogQ2hyb21lIERldlRvb2xzIHRvIGF1dG9tYXRpY2FsbHkgaWdub3JlLWxpc3Qgc291cmNlcy5cbiAqL1xuZXhwb3J0IGNsYXNzIERldlRvb2xzSWdub3JlUGx1Z2luIHtcbiAgYXBwbHkoY29tcGlsZXI6IENvbXBpbGVyKSB7XG4gICAgY29uc3QgeyBSYXdTb3VyY2UgfSA9IGNvbXBpbGVyLndlYnBhY2suc291cmNlcztcblxuICAgIGNvbXBpbGVyLmhvb2tzLmNvbXBpbGF0aW9uLnRhcChQTFVHSU5fTkFNRSwgKGNvbXBpbGF0aW9uKSA9PiB7XG4gICAgICBjb21waWxhdGlvbi5ob29rcy5wcm9jZXNzQXNzZXRzLnRhcChcbiAgICAgICAge1xuICAgICAgICAgIG5hbWU6IFBMVUdJTl9OQU1FLFxuICAgICAgICAgIHN0YWdlOiBDb21waWxhdGlvbi5QUk9DRVNTX0FTU0VUU19TVEFHRV9ERVZfVE9PTElORyxcbiAgICAgICAgICBhZGRpdGlvbmFsQXNzZXRzOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgICAoYXNzZXRzKSA9PiB7XG4gICAgICAgICAgZm9yIChjb25zdCBbbmFtZSwgYXNzZXRdIG9mIE9iamVjdC5lbnRyaWVzKGFzc2V0cykpIHtcbiAgICAgICAgICAgIC8vIEluc3RlYWQgb2YgdXNpbmcgYGFzc2V0Lm1hcCgpYCB0byBmZXRjaCB0aGUgc291cmNlIG1hcHMgZnJvbVxuICAgICAgICAgICAgLy8gU291cmNlTWFwU291cmNlIGFzc2V0cywgcHJvY2VzcyB0aGVtIGRpcmVjdGx5IGFzIGEgUmF3U291cmNlLlxuICAgICAgICAgICAgLy8gVGhpcyBpcyBiZWNhdXNlIGAubWFwKClgIGlzIHNsb3cgYW5kIGNhbiB0YWtlIHNldmVyYWwgc2Vjb25kcy5cbiAgICAgICAgICAgIGlmICghbmFtZS5lbmRzV2l0aCgnLm1hcCcpKSB7XG4gICAgICAgICAgICAgIC8vIElnbm9yZSBub24gc291cmNlIG1hcCBmaWxlcy5cbiAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IG1hcENvbnRlbnQgPSBhc3NldC5zb3VyY2UoKS50b1N0cmluZygpO1xuICAgICAgICAgICAgaWYgKCFtYXBDb250ZW50KSB7XG4gICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBtYXAgPSBKU09OLnBhcnNlKG1hcENvbnRlbnQpIGFzIFNvdXJjZU1hcDtcbiAgICAgICAgICAgIGNvbnN0IGlnbm9yZUxpc3QgPSBbXTtcblxuICAgICAgICAgICAgZm9yIChjb25zdCBbaW5kZXgsIHBhdGhdIG9mIG1hcC5zb3VyY2VzLmVudHJpZXMoKSkge1xuICAgICAgICAgICAgICBpZiAocGF0aC5pbmNsdWRlcygnL25vZGVfbW9kdWxlcy8nKSB8fCBwYXRoLnN0YXJ0c1dpdGgoJ3dlYnBhY2svJykpIHtcbiAgICAgICAgICAgICAgICBpZ25vcmVMaXN0LnB1c2goaW5kZXgpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG1hcFtJR05PUkVfTElTVF0gPSBpZ25vcmVMaXN0O1xuICAgICAgICAgICAgY29tcGlsYXRpb24udXBkYXRlQXNzZXQobmFtZSwgbmV3IFJhd1NvdXJjZShKU09OLnN0cmluZ2lmeShtYXApKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgKTtcbiAgICB9KTtcbiAgfVxufVxuIl19