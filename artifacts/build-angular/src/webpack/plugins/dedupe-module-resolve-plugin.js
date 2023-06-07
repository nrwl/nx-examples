"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DedupeModuleResolvePlugin = void 0;
const webpack_diagnostics_1 = require("../../utils/webpack-diagnostics");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getResourceData(resolveData) {
    const { descriptionFileData, relativePath } = resolveData.createData.resourceResolveData;
    return {
        packageName: descriptionFileData?.name,
        packageVersion: descriptionFileData?.version,
        relativePath,
        resource: resolveData.createData.resource,
    };
}
/**
 * DedupeModuleResolvePlugin is a webpack plugin which dedupes modules with the same name and versions
 * that are laid out in different parts of the node_modules tree.
 *
 * This is needed because Webpack relies on package managers to hoist modules and doesn't have any deduping logic.
 *
 * This is similar to how Webpack's 'NormalModuleReplacementPlugin' works
 * @see https://github.com/webpack/webpack/blob/4a1f068828c2ab47537d8be30d542cd3a1076db4/lib/NormalModuleReplacementPlugin.js#L9
 */
class DedupeModuleResolvePlugin {
    constructor(options) {
        this.options = options;
        this.modules = new Map();
    }
    apply(compiler) {
        compiler.hooks.compilation.tap('DedupeModuleResolvePlugin', (compilation, { normalModuleFactory }) => {
            normalModuleFactory.hooks.afterResolve.tap('DedupeModuleResolvePlugin', (result) => {
                if (!result) {
                    return;
                }
                const { packageName, packageVersion, relativePath, resource } = getResourceData(result);
                // Empty name or versions are no valid primary  entrypoints of a library
                if (!packageName || !packageVersion) {
                    return;
                }
                const moduleId = packageName + '@' + packageVersion + ':' + relativePath;
                const prevResolvedModule = this.modules.get(moduleId);
                if (!prevResolvedModule) {
                    // This is the first time we visit this module.
                    this.modules.set(moduleId, {
                        resource,
                        request: result.request,
                    });
                    return;
                }
                const { resource: prevResource, request: prevRequest } = prevResolvedModule;
                if (resource === prevResource) {
                    // No deduping needed.
                    // Current path and previously resolved path are the same.
                    return;
                }
                if (this.options?.verbose) {
                    (0, webpack_diagnostics_1.addWarning)(compilation, `[DedupeModuleResolvePlugin]: ${resource} -> ${prevResource}`);
                }
                // Alter current request with previously resolved module.
                const createData = result.createData;
                createData.resource = prevResource;
                createData.userRequest = prevRequest;
            });
        });
    }
}
exports.DedupeModuleResolvePlugin = DedupeModuleResolvePlugin;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVkdXBlLW1vZHVsZS1yZXNvbHZlLXBsdWdpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2J1aWxkX2FuZ3VsYXIvc3JjL3dlYnBhY2svcGx1Z2lucy9kZWR1cGUtbW9kdWxlLXJlc29sdmUtcGx1Z2luLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7OztBQUdILHlFQUE2RDtBQWE3RCw4REFBOEQ7QUFDOUQsU0FBUyxlQUFlLENBQUMsV0FBZ0I7SUFDdkMsTUFBTSxFQUFFLG1CQUFtQixFQUFFLFlBQVksRUFBRSxHQUFHLFdBQVcsQ0FBQyxVQUFVLENBQUMsbUJBQW1CLENBQUM7SUFFekYsT0FBTztRQUNMLFdBQVcsRUFBRSxtQkFBbUIsRUFBRSxJQUFJO1FBQ3RDLGNBQWMsRUFBRSxtQkFBbUIsRUFBRSxPQUFPO1FBQzVDLFlBQVk7UUFDWixRQUFRLEVBQUUsV0FBVyxDQUFDLFVBQVUsQ0FBQyxRQUFRO0tBQzFDLENBQUM7QUFDSixDQUFDO0FBRUQ7Ozs7Ozs7O0dBUUc7QUFDSCxNQUFhLHlCQUF5QjtJQUdwQyxZQUFvQixPQUEwQztRQUExQyxZQUFPLEdBQVAsT0FBTyxDQUFtQztRQUY5RCxZQUFPLEdBQUcsSUFBSSxHQUFHLEVBQWlELENBQUM7SUFFRixDQUFDO0lBRWxFLEtBQUssQ0FBQyxRQUFrQjtRQUN0QixRQUFRLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQzVCLDJCQUEyQixFQUMzQixDQUFDLFdBQVcsRUFBRSxFQUFFLG1CQUFtQixFQUFFLEVBQUUsRUFBRTtZQUN2QyxtQkFBbUIsQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQywyQkFBMkIsRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFO2dCQUNqRixJQUFJLENBQUMsTUFBTSxFQUFFO29CQUNYLE9BQU87aUJBQ1I7Z0JBRUQsTUFBTSxFQUFFLFdBQVcsRUFBRSxjQUFjLEVBQUUsWUFBWSxFQUFFLFFBQVEsRUFBRSxHQUFHLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFFeEYsd0VBQXdFO2dCQUN4RSxJQUFJLENBQUMsV0FBVyxJQUFJLENBQUMsY0FBYyxFQUFFO29CQUNuQyxPQUFPO2lCQUNSO2dCQUVELE1BQU0sUUFBUSxHQUFHLFdBQVcsR0FBRyxHQUFHLEdBQUcsY0FBYyxHQUFHLEdBQUcsR0FBRyxZQUFZLENBQUM7Z0JBQ3pFLE1BQU0sa0JBQWtCLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBRXRELElBQUksQ0FBQyxrQkFBa0IsRUFBRTtvQkFDdkIsK0NBQStDO29CQUMvQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUU7d0JBQ3pCLFFBQVE7d0JBQ1IsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPO3FCQUN4QixDQUFDLENBQUM7b0JBRUgsT0FBTztpQkFDUjtnQkFFRCxNQUFNLEVBQUUsUUFBUSxFQUFFLFlBQVksRUFBRSxPQUFPLEVBQUUsV0FBVyxFQUFFLEdBQUcsa0JBQWtCLENBQUM7Z0JBQzVFLElBQUksUUFBUSxLQUFLLFlBQVksRUFBRTtvQkFDN0Isc0JBQXNCO29CQUN0QiwwREFBMEQ7b0JBQzFELE9BQU87aUJBQ1I7Z0JBRUQsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRTtvQkFDekIsSUFBQSxnQ0FBVSxFQUFDLFdBQVcsRUFBRSxnQ0FBZ0MsUUFBUSxPQUFPLFlBQVksRUFBRSxDQUFDLENBQUM7aUJBQ3hGO2dCQUVELHlEQUF5RDtnQkFDekQsTUFBTSxVQUFVLEdBQUcsTUFBTSxDQUFDLFVBQXVELENBQUM7Z0JBQ2xGLFVBQVUsQ0FBQyxRQUFRLEdBQUcsWUFBWSxDQUFDO2dCQUNuQyxVQUFVLENBQUMsV0FBVyxHQUFHLFdBQVcsQ0FBQztZQUN2QyxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FDRixDQUFDO0lBQ0osQ0FBQztDQUNGO0FBckRELDhEQXFEQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBDb21waWxlciB9IGZyb20gJ3dlYnBhY2snO1xuaW1wb3J0IHsgYWRkV2FybmluZyB9IGZyb20gJy4uLy4uL3V0aWxzL3dlYnBhY2stZGlhZ25vc3RpY3MnO1xuXG5pbnRlcmZhY2UgUmVzb3VyY2VEYXRhIHtcbiAgcmVsYXRpdmVQYXRoOiBzdHJpbmc7XG4gIHJlc291cmNlOiBzdHJpbmc7XG4gIHBhY2thZ2VOYW1lPzogc3RyaW5nO1xuICBwYWNrYWdlVmVyc2lvbj86IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBEZWR1cGVNb2R1bGVSZXNvbHZlUGx1Z2luT3B0aW9ucyB7XG4gIHZlcmJvc2U/OiBib29sZWFuO1xufVxuXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuZnVuY3Rpb24gZ2V0UmVzb3VyY2VEYXRhKHJlc29sdmVEYXRhOiBhbnkpOiBSZXNvdXJjZURhdGEge1xuICBjb25zdCB7IGRlc2NyaXB0aW9uRmlsZURhdGEsIHJlbGF0aXZlUGF0aCB9ID0gcmVzb2x2ZURhdGEuY3JlYXRlRGF0YS5yZXNvdXJjZVJlc29sdmVEYXRhO1xuXG4gIHJldHVybiB7XG4gICAgcGFja2FnZU5hbWU6IGRlc2NyaXB0aW9uRmlsZURhdGE/Lm5hbWUsXG4gICAgcGFja2FnZVZlcnNpb246IGRlc2NyaXB0aW9uRmlsZURhdGE/LnZlcnNpb24sXG4gICAgcmVsYXRpdmVQYXRoLFxuICAgIHJlc291cmNlOiByZXNvbHZlRGF0YS5jcmVhdGVEYXRhLnJlc291cmNlLFxuICB9O1xufVxuXG4vKipcbiAqIERlZHVwZU1vZHVsZVJlc29sdmVQbHVnaW4gaXMgYSB3ZWJwYWNrIHBsdWdpbiB3aGljaCBkZWR1cGVzIG1vZHVsZXMgd2l0aCB0aGUgc2FtZSBuYW1lIGFuZCB2ZXJzaW9uc1xuICogdGhhdCBhcmUgbGFpZCBvdXQgaW4gZGlmZmVyZW50IHBhcnRzIG9mIHRoZSBub2RlX21vZHVsZXMgdHJlZS5cbiAqXG4gKiBUaGlzIGlzIG5lZWRlZCBiZWNhdXNlIFdlYnBhY2sgcmVsaWVzIG9uIHBhY2thZ2UgbWFuYWdlcnMgdG8gaG9pc3QgbW9kdWxlcyBhbmQgZG9lc24ndCBoYXZlIGFueSBkZWR1cGluZyBsb2dpYy5cbiAqXG4gKiBUaGlzIGlzIHNpbWlsYXIgdG8gaG93IFdlYnBhY2sncyAnTm9ybWFsTW9kdWxlUmVwbGFjZW1lbnRQbHVnaW4nIHdvcmtzXG4gKiBAc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS93ZWJwYWNrL3dlYnBhY2svYmxvYi80YTFmMDY4ODI4YzJhYjQ3NTM3ZDhiZTMwZDU0MmNkM2ExMDc2ZGI0L2xpYi9Ob3JtYWxNb2R1bGVSZXBsYWNlbWVudFBsdWdpbi5qcyNMOVxuICovXG5leHBvcnQgY2xhc3MgRGVkdXBlTW9kdWxlUmVzb2x2ZVBsdWdpbiB7XG4gIG1vZHVsZXMgPSBuZXcgTWFwPHN0cmluZywgeyByZXF1ZXN0OiBzdHJpbmc7IHJlc291cmNlOiBzdHJpbmcgfT4oKTtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIG9wdGlvbnM/OiBEZWR1cGVNb2R1bGVSZXNvbHZlUGx1Z2luT3B0aW9ucykge31cblxuICBhcHBseShjb21waWxlcjogQ29tcGlsZXIpIHtcbiAgICBjb21waWxlci5ob29rcy5jb21waWxhdGlvbi50YXAoXG4gICAgICAnRGVkdXBlTW9kdWxlUmVzb2x2ZVBsdWdpbicsXG4gICAgICAoY29tcGlsYXRpb24sIHsgbm9ybWFsTW9kdWxlRmFjdG9yeSB9KSA9PiB7XG4gICAgICAgIG5vcm1hbE1vZHVsZUZhY3RvcnkuaG9va3MuYWZ0ZXJSZXNvbHZlLnRhcCgnRGVkdXBlTW9kdWxlUmVzb2x2ZVBsdWdpbicsIChyZXN1bHQpID0+IHtcbiAgICAgICAgICBpZiAoIXJlc3VsdCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IHsgcGFja2FnZU5hbWUsIHBhY2thZ2VWZXJzaW9uLCByZWxhdGl2ZVBhdGgsIHJlc291cmNlIH0gPSBnZXRSZXNvdXJjZURhdGEocmVzdWx0KTtcblxuICAgICAgICAgIC8vIEVtcHR5IG5hbWUgb3IgdmVyc2lvbnMgYXJlIG5vIHZhbGlkIHByaW1hcnkgIGVudHJ5cG9pbnRzIG9mIGEgbGlicmFyeVxuICAgICAgICAgIGlmICghcGFja2FnZU5hbWUgfHwgIXBhY2thZ2VWZXJzaW9uKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3QgbW9kdWxlSWQgPSBwYWNrYWdlTmFtZSArICdAJyArIHBhY2thZ2VWZXJzaW9uICsgJzonICsgcmVsYXRpdmVQYXRoO1xuICAgICAgICAgIGNvbnN0IHByZXZSZXNvbHZlZE1vZHVsZSA9IHRoaXMubW9kdWxlcy5nZXQobW9kdWxlSWQpO1xuXG4gICAgICAgICAgaWYgKCFwcmV2UmVzb2x2ZWRNb2R1bGUpIHtcbiAgICAgICAgICAgIC8vIFRoaXMgaXMgdGhlIGZpcnN0IHRpbWUgd2UgdmlzaXQgdGhpcyBtb2R1bGUuXG4gICAgICAgICAgICB0aGlzLm1vZHVsZXMuc2V0KG1vZHVsZUlkLCB7XG4gICAgICAgICAgICAgIHJlc291cmNlLFxuICAgICAgICAgICAgICByZXF1ZXN0OiByZXN1bHQucmVxdWVzdCxcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3QgeyByZXNvdXJjZTogcHJldlJlc291cmNlLCByZXF1ZXN0OiBwcmV2UmVxdWVzdCB9ID0gcHJldlJlc29sdmVkTW9kdWxlO1xuICAgICAgICAgIGlmIChyZXNvdXJjZSA9PT0gcHJldlJlc291cmNlKSB7XG4gICAgICAgICAgICAvLyBObyBkZWR1cGluZyBuZWVkZWQuXG4gICAgICAgICAgICAvLyBDdXJyZW50IHBhdGggYW5kIHByZXZpb3VzbHkgcmVzb2x2ZWQgcGF0aCBhcmUgdGhlIHNhbWUuXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHRoaXMub3B0aW9ucz8udmVyYm9zZSkge1xuICAgICAgICAgICAgYWRkV2FybmluZyhjb21waWxhdGlvbiwgYFtEZWR1cGVNb2R1bGVSZXNvbHZlUGx1Z2luXTogJHtyZXNvdXJjZX0gLT4gJHtwcmV2UmVzb3VyY2V9YCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gQWx0ZXIgY3VycmVudCByZXF1ZXN0IHdpdGggcHJldmlvdXNseSByZXNvbHZlZCBtb2R1bGUuXG4gICAgICAgICAgY29uc3QgY3JlYXRlRGF0YSA9IHJlc3VsdC5jcmVhdGVEYXRhIGFzIHsgcmVzb3VyY2U6IHN0cmluZzsgdXNlclJlcXVlc3Q6IHN0cmluZyB9O1xuICAgICAgICAgIGNyZWF0ZURhdGEucmVzb3VyY2UgPSBwcmV2UmVzb3VyY2U7XG4gICAgICAgICAgY3JlYXRlRGF0YS51c2VyUmVxdWVzdCA9IHByZXZSZXF1ZXN0O1xuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgKTtcbiAgfVxufVxuIl19