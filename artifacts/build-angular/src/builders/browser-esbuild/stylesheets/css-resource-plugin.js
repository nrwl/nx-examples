"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCssResourcePlugin = void 0;
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
/**
 * Symbol marker used to indicate CSS resource resolution is being attempted.
 * This is used to prevent an infinite loop within the plugin's resolve hook.
 */
const CSS_RESOURCE_RESOLUTION = Symbol('CSS_RESOURCE_RESOLUTION');
/**
 * Creates an esbuild {@link Plugin} that loads all CSS url token references using the
 * built-in esbuild `file` loader. A plugin is used to allow for all file extensions
 * and types to be supported without needing to manually specify all extensions
 * within the build configuration.
 *
 * @returns An esbuild {@link Plugin} instance.
 */
function createCssResourcePlugin() {
    return {
        name: 'angular-css-resource',
        setup(build) {
            build.onResolve({ filter: /.*/ }, async (args) => {
                // Only attempt to resolve url tokens which only exist inside CSS.
                // Also, skip this plugin if already attempting to resolve the url-token.
                if (args.kind !== 'url-token' || args.pluginData?.[CSS_RESOURCE_RESOLUTION]) {
                    return null;
                }
                // If root-relative, absolute or protocol relative url, mark as external to leave the
                // path/URL in place.
                if (/^((?:\w+:)?\/\/|data:|chrome:|#|\/)/.test(args.path)) {
                    return {
                        path: args.path,
                        external: true,
                    };
                }
                const { importer, kind, resolveDir, namespace, pluginData = {} } = args;
                pluginData[CSS_RESOURCE_RESOLUTION] = true;
                const result = await build.resolve(args.path, {
                    importer,
                    kind,
                    namespace,
                    pluginData,
                    resolveDir,
                });
                // Return results that are not files since these are most likely specific to another plugin
                // and cannot be loaded by this plugin.
                if (result.namespace !== 'file' || !result.path) {
                    return result;
                }
                // All file results are considered CSS resources and will be loaded via the file loader
                return {
                    ...result,
                    // Use a relative path to prevent fully resolved paths in the metafile (JSON stats file).
                    // This is only necessary for custom namespaces. esbuild will handle the file namespace.
                    path: (0, node_path_1.relative)(build.initialOptions.absWorkingDir ?? '', result.path),
                    namespace: 'css-resource',
                };
            });
            build.onLoad({ filter: /.*/, namespace: 'css-resource' }, async (args) => {
                return {
                    contents: await (0, promises_1.readFile)((0, node_path_1.join)(build.initialOptions.absWorkingDir ?? '', args.path)),
                    loader: 'file',
                };
            });
        },
    };
}
exports.createCssResourcePlugin = createCssResourcePlugin;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3NzLXJlc291cmNlLXBsdWdpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2J1aWxkX2FuZ3VsYXIvc3JjL2J1aWxkZXJzL2Jyb3dzZXItZXNidWlsZC9zdHlsZXNoZWV0cy9jc3MtcmVzb3VyY2UtcGx1Z2luLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7OztBQUdILCtDQUE0QztBQUM1Qyx5Q0FBMkM7QUFFM0M7OztHQUdHO0FBQ0gsTUFBTSx1QkFBdUIsR0FBRyxNQUFNLENBQUMseUJBQXlCLENBQUMsQ0FBQztBQUVsRTs7Ozs7OztHQU9HO0FBQ0gsU0FBZ0IsdUJBQXVCO0lBQ3JDLE9BQU87UUFDTCxJQUFJLEVBQUUsc0JBQXNCO1FBQzVCLEtBQUssQ0FBQyxLQUFrQjtZQUN0QixLQUFLLENBQUMsU0FBUyxDQUFDLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsRUFBRTtnQkFDL0Msa0VBQWtFO2dCQUNsRSx5RUFBeUU7Z0JBQ3pFLElBQUksSUFBSSxDQUFDLElBQUksS0FBSyxXQUFXLElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDLHVCQUF1QixDQUFDLEVBQUU7b0JBQzNFLE9BQU8sSUFBSSxDQUFDO2lCQUNiO2dCQUVELHFGQUFxRjtnQkFDckYscUJBQXFCO2dCQUNyQixJQUFJLHFDQUFxQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUU7b0JBQ3pELE9BQU87d0JBQ0wsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO3dCQUNmLFFBQVEsRUFBRSxJQUFJO3FCQUNmLENBQUM7aUJBQ0g7Z0JBRUQsTUFBTSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLFNBQVMsRUFBRSxVQUFVLEdBQUcsRUFBRSxFQUFFLEdBQUcsSUFBSSxDQUFDO2dCQUN4RSxVQUFVLENBQUMsdUJBQXVCLENBQUMsR0FBRyxJQUFJLENBQUM7Z0JBRTNDLE1BQU0sTUFBTSxHQUFHLE1BQU0sS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFO29CQUM1QyxRQUFRO29CQUNSLElBQUk7b0JBQ0osU0FBUztvQkFDVCxVQUFVO29CQUNWLFVBQVU7aUJBQ1gsQ0FBQyxDQUFDO2dCQUVILDJGQUEyRjtnQkFDM0YsdUNBQXVDO2dCQUN2QyxJQUFJLE1BQU0sQ0FBQyxTQUFTLEtBQUssTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRTtvQkFDL0MsT0FBTyxNQUFNLENBQUM7aUJBQ2Y7Z0JBRUQsdUZBQXVGO2dCQUN2RixPQUFPO29CQUNMLEdBQUcsTUFBTTtvQkFDVCx5RkFBeUY7b0JBQ3pGLHdGQUF3RjtvQkFDeEYsSUFBSSxFQUFFLElBQUEsb0JBQVEsRUFBQyxLQUFLLENBQUMsY0FBYyxDQUFDLGFBQWEsSUFBSSxFQUFFLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQztvQkFDckUsU0FBUyxFQUFFLGNBQWM7aUJBQzFCLENBQUM7WUFDSixDQUFDLENBQUMsQ0FBQztZQUVILEtBQUssQ0FBQyxNQUFNLENBQUMsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxjQUFjLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLEVBQUU7Z0JBQ3ZFLE9BQU87b0JBQ0wsUUFBUSxFQUFFLE1BQU0sSUFBQSxtQkFBUSxFQUFDLElBQUEsZ0JBQUksRUFBQyxLQUFLLENBQUMsY0FBYyxDQUFDLGFBQWEsSUFBSSxFQUFFLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO29CQUNuRixNQUFNLEVBQUUsTUFBTTtpQkFDZixDQUFDO1lBQ0osQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO0tBQ0YsQ0FBQztBQUNKLENBQUM7QUF2REQsMERBdURDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB0eXBlIHsgUGx1Z2luLCBQbHVnaW5CdWlsZCB9IGZyb20gJ2VzYnVpbGQnO1xuaW1wb3J0IHsgcmVhZEZpbGUgfSBmcm9tICdub2RlOmZzL3Byb21pc2VzJztcbmltcG9ydCB7IGpvaW4sIHJlbGF0aXZlIH0gZnJvbSAnbm9kZTpwYXRoJztcblxuLyoqXG4gKiBTeW1ib2wgbWFya2VyIHVzZWQgdG8gaW5kaWNhdGUgQ1NTIHJlc291cmNlIHJlc29sdXRpb24gaXMgYmVpbmcgYXR0ZW1wdGVkLlxuICogVGhpcyBpcyB1c2VkIHRvIHByZXZlbnQgYW4gaW5maW5pdGUgbG9vcCB3aXRoaW4gdGhlIHBsdWdpbidzIHJlc29sdmUgaG9vay5cbiAqL1xuY29uc3QgQ1NTX1JFU09VUkNFX1JFU09MVVRJT04gPSBTeW1ib2woJ0NTU19SRVNPVVJDRV9SRVNPTFVUSU9OJyk7XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBlc2J1aWxkIHtAbGluayBQbHVnaW59IHRoYXQgbG9hZHMgYWxsIENTUyB1cmwgdG9rZW4gcmVmZXJlbmNlcyB1c2luZyB0aGVcbiAqIGJ1aWx0LWluIGVzYnVpbGQgYGZpbGVgIGxvYWRlci4gQSBwbHVnaW4gaXMgdXNlZCB0byBhbGxvdyBmb3IgYWxsIGZpbGUgZXh0ZW5zaW9uc1xuICogYW5kIHR5cGVzIHRvIGJlIHN1cHBvcnRlZCB3aXRob3V0IG5lZWRpbmcgdG8gbWFudWFsbHkgc3BlY2lmeSBhbGwgZXh0ZW5zaW9uc1xuICogd2l0aGluIHRoZSBidWlsZCBjb25maWd1cmF0aW9uLlxuICpcbiAqIEByZXR1cm5zIEFuIGVzYnVpbGQge0BsaW5rIFBsdWdpbn0gaW5zdGFuY2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVDc3NSZXNvdXJjZVBsdWdpbigpOiBQbHVnaW4ge1xuICByZXR1cm4ge1xuICAgIG5hbWU6ICdhbmd1bGFyLWNzcy1yZXNvdXJjZScsXG4gICAgc2V0dXAoYnVpbGQ6IFBsdWdpbkJ1aWxkKTogdm9pZCB7XG4gICAgICBidWlsZC5vblJlc29sdmUoeyBmaWx0ZXI6IC8uKi8gfSwgYXN5bmMgKGFyZ3MpID0+IHtcbiAgICAgICAgLy8gT25seSBhdHRlbXB0IHRvIHJlc29sdmUgdXJsIHRva2VucyB3aGljaCBvbmx5IGV4aXN0IGluc2lkZSBDU1MuXG4gICAgICAgIC8vIEFsc28sIHNraXAgdGhpcyBwbHVnaW4gaWYgYWxyZWFkeSBhdHRlbXB0aW5nIHRvIHJlc29sdmUgdGhlIHVybC10b2tlbi5cbiAgICAgICAgaWYgKGFyZ3Mua2luZCAhPT0gJ3VybC10b2tlbicgfHwgYXJncy5wbHVnaW5EYXRhPy5bQ1NTX1JFU09VUkNFX1JFU09MVVRJT05dKSB7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiByb290LXJlbGF0aXZlLCBhYnNvbHV0ZSBvciBwcm90b2NvbCByZWxhdGl2ZSB1cmwsIG1hcmsgYXMgZXh0ZXJuYWwgdG8gbGVhdmUgdGhlXG4gICAgICAgIC8vIHBhdGgvVVJMIGluIHBsYWNlLlxuICAgICAgICBpZiAoL14oKD86XFx3KzopP1xcL1xcL3xkYXRhOnxjaHJvbWU6fCN8XFwvKS8udGVzdChhcmdzLnBhdGgpKSB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHBhdGg6IGFyZ3MucGF0aCxcbiAgICAgICAgICAgIGV4dGVybmFsOiB0cnVlLFxuICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB7IGltcG9ydGVyLCBraW5kLCByZXNvbHZlRGlyLCBuYW1lc3BhY2UsIHBsdWdpbkRhdGEgPSB7fSB9ID0gYXJncztcbiAgICAgICAgcGx1Z2luRGF0YVtDU1NfUkVTT1VSQ0VfUkVTT0xVVElPTl0gPSB0cnVlO1xuXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGJ1aWxkLnJlc29sdmUoYXJncy5wYXRoLCB7XG4gICAgICAgICAgaW1wb3J0ZXIsXG4gICAgICAgICAga2luZCxcbiAgICAgICAgICBuYW1lc3BhY2UsXG4gICAgICAgICAgcGx1Z2luRGF0YSxcbiAgICAgICAgICByZXNvbHZlRGlyLFxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBSZXR1cm4gcmVzdWx0cyB0aGF0IGFyZSBub3QgZmlsZXMgc2luY2UgdGhlc2UgYXJlIG1vc3QgbGlrZWx5IHNwZWNpZmljIHRvIGFub3RoZXIgcGx1Z2luXG4gICAgICAgIC8vIGFuZCBjYW5ub3QgYmUgbG9hZGVkIGJ5IHRoaXMgcGx1Z2luLlxuICAgICAgICBpZiAocmVzdWx0Lm5hbWVzcGFjZSAhPT0gJ2ZpbGUnIHx8ICFyZXN1bHQucGF0aCkge1xuICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBbGwgZmlsZSByZXN1bHRzIGFyZSBjb25zaWRlcmVkIENTUyByZXNvdXJjZXMgYW5kIHdpbGwgYmUgbG9hZGVkIHZpYSB0aGUgZmlsZSBsb2FkZXJcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAuLi5yZXN1bHQsXG4gICAgICAgICAgLy8gVXNlIGEgcmVsYXRpdmUgcGF0aCB0byBwcmV2ZW50IGZ1bGx5IHJlc29sdmVkIHBhdGhzIGluIHRoZSBtZXRhZmlsZSAoSlNPTiBzdGF0cyBmaWxlKS5cbiAgICAgICAgICAvLyBUaGlzIGlzIG9ubHkgbmVjZXNzYXJ5IGZvciBjdXN0b20gbmFtZXNwYWNlcy4gZXNidWlsZCB3aWxsIGhhbmRsZSB0aGUgZmlsZSBuYW1lc3BhY2UuXG4gICAgICAgICAgcGF0aDogcmVsYXRpdmUoYnVpbGQuaW5pdGlhbE9wdGlvbnMuYWJzV29ya2luZ0RpciA/PyAnJywgcmVzdWx0LnBhdGgpLFxuICAgICAgICAgIG5hbWVzcGFjZTogJ2Nzcy1yZXNvdXJjZScsXG4gICAgICAgIH07XG4gICAgICB9KTtcblxuICAgICAgYnVpbGQub25Mb2FkKHsgZmlsdGVyOiAvLiovLCBuYW1lc3BhY2U6ICdjc3MtcmVzb3VyY2UnIH0sIGFzeW5jIChhcmdzKSA9PiB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgY29udGVudHM6IGF3YWl0IHJlYWRGaWxlKGpvaW4oYnVpbGQuaW5pdGlhbE9wdGlvbnMuYWJzV29ya2luZ0RpciA/PyAnJywgYXJncy5wYXRoKSksXG4gICAgICAgICAgbG9hZGVyOiAnZmlsZScsXG4gICAgICAgIH07XG4gICAgICB9KTtcbiAgICB9LFxuICB9O1xufVxuIl19