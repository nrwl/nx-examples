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
Object.defineProperty(exports, "__esModule", { value: true });
exports.execute = void 0;
const rxjs_1 = require("rxjs");
const check_port_1 = require("../../utils/check-port");
const purge_cache_1 = require("../../utils/purge-cache");
const options_1 = require("./options");
/**
 * A Builder that executes a development server based on the provided browser target option.
 * @param options Dev Server options.
 * @param context The build context.
 * @param transforms A map of transforms that can be used to hook into some logic (such as
 * transforming webpack configuration before passing it to webpack).
 *
 * @experimental Direct usage of this function is considered experimental.
 */
function execute(options, context, transforms = {}) {
    // Determine project name from builder context target
    const projectName = context.target?.project;
    if (!projectName) {
        context.logger.error(`The 'dev-server' builder requires a target to be specified.`);
        return rxjs_1.EMPTY;
    }
    return (0, rxjs_1.defer)(() => initialize(options, projectName, context)).pipe((0, rxjs_1.switchMap)(({ builderName, normalizedOptions }) => {
        // Use vite-based development server for esbuild-based builds
        if (builderName === '@angular-devkit/build-angular:browser-esbuild') {
            return (0, rxjs_1.defer)(() => Promise.resolve().then(() => __importStar(require('./vite-server')))).pipe((0, rxjs_1.switchMap)(({ serveWithVite }) => serveWithVite(normalizedOptions, builderName, context)));
        }
        // Use Webpack for all other browser targets
        return (0, rxjs_1.defer)(() => Promise.resolve().then(() => __importStar(require('./webpack-server')))).pipe((0, rxjs_1.switchMap)(({ serveWebpackBrowser }) => serveWebpackBrowser(normalizedOptions, builderName, context, transforms)));
    }));
}
exports.execute = execute;
async function initialize(initialOptions, projectName, context) {
    // Purge old build disk cache.
    await (0, purge_cache_1.purgeStaleBuildCache)(context);
    const normalizedOptions = await (0, options_1.normalizeOptions)(context, projectName, initialOptions);
    const builderName = await context.getBuilderNameForTarget(normalizedOptions.browserTarget);
    if (!normalizedOptions.disableHostCheck &&
        !/^127\.\d+\.\d+\.\d+/g.test(normalizedOptions.host) &&
        normalizedOptions.host !== 'localhost') {
        context.logger.warn(`
Warning: This is a simple server for use in testing or debugging Angular applications
locally. It hasn't been reviewed for security issues.

Binding this server to an open connection can result in compromising your application or
computer. Using a different host than the one passed to the "--host" flag might result in
websocket connection issues. You might need to use "--disable-host-check" if that's the
case.
    `);
    }
    if (normalizedOptions.disableHostCheck) {
        context.logger.warn('Warning: Running a server with --disable-host-check is a security risk. ' +
            'See https://medium.com/webpack/webpack-dev-server-middleware-security-issues-1489d950874a for more information.');
    }
    normalizedOptions.port = await (0, check_port_1.checkPort)(normalizedOptions.port, normalizedOptions.host);
    return { builderName, normalizedOptions };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVpbGRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2J1aWxkX2FuZ3VsYXIvc3JjL2J1aWxkZXJzL2Rldi1zZXJ2ZXIvYnVpbGRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUdILCtCQUEyRDtBQUUzRCx1REFBbUQ7QUFFbkQseURBQStEO0FBQy9ELHVDQUE2QztBQUk3Qzs7Ozs7Ozs7R0FRRztBQUNILFNBQWdCLE9BQU8sQ0FDckIsT0FBZ0MsRUFDaEMsT0FBdUIsRUFDdkIsYUFJSSxFQUFFO0lBRU4scURBQXFEO0lBQ3JELE1BQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDO0lBQzVDLElBQUksQ0FBQyxXQUFXLEVBQUU7UUFDaEIsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsNkRBQTZELENBQUMsQ0FBQztRQUVwRixPQUFPLFlBQUssQ0FBQztLQUNkO0lBRUQsT0FBTyxJQUFBLFlBQUssRUFBQyxHQUFHLEVBQUUsQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFLFdBQVcsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FDaEUsSUFBQSxnQkFBUyxFQUFDLENBQUMsRUFBRSxXQUFXLEVBQUUsaUJBQWlCLEVBQUUsRUFBRSxFQUFFO1FBQy9DLDZEQUE2RDtRQUM3RCxJQUFJLFdBQVcsS0FBSywrQ0FBK0MsRUFBRTtZQUNuRSxPQUFPLElBQUEsWUFBSyxFQUFDLEdBQUcsRUFBRSxtREFBUSxlQUFlLEdBQUMsQ0FBQyxDQUFDLElBQUksQ0FDOUMsSUFBQSxnQkFBUyxFQUFDLENBQUMsRUFBRSxhQUFhLEVBQUUsRUFBRSxFQUFFLENBQUMsYUFBYSxDQUFDLGlCQUFpQixFQUFFLFdBQVcsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUN6RixDQUFDO1NBQ0g7UUFFRCw0Q0FBNEM7UUFDNUMsT0FBTyxJQUFBLFlBQUssRUFBQyxHQUFHLEVBQUUsbURBQVEsa0JBQWtCLEdBQUMsQ0FBQyxDQUFDLElBQUksQ0FDakQsSUFBQSxnQkFBUyxFQUFDLENBQUMsRUFBRSxtQkFBbUIsRUFBRSxFQUFFLEVBQUUsQ0FDcEMsbUJBQW1CLENBQUMsaUJBQWlCLEVBQUUsV0FBVyxFQUFFLE9BQU8sRUFBRSxVQUFVLENBQUMsQ0FDekUsQ0FDRixDQUFDO0lBQ0osQ0FBQyxDQUFDLENBQ0gsQ0FBQztBQUNKLENBQUM7QUFsQ0QsMEJBa0NDO0FBRUQsS0FBSyxVQUFVLFVBQVUsQ0FDdkIsY0FBdUMsRUFDdkMsV0FBbUIsRUFDbkIsT0FBdUI7SUFFdkIsOEJBQThCO0lBQzlCLE1BQU0sSUFBQSxrQ0FBb0IsRUFBQyxPQUFPLENBQUMsQ0FBQztJQUVwQyxNQUFNLGlCQUFpQixHQUFHLE1BQU0sSUFBQSwwQkFBZ0IsRUFBQyxPQUFPLEVBQUUsV0FBVyxFQUFFLGNBQWMsQ0FBQyxDQUFDO0lBQ3ZGLE1BQU0sV0FBVyxHQUFHLE1BQU0sT0FBTyxDQUFDLHVCQUF1QixDQUFDLGlCQUFpQixDQUFDLGFBQWEsQ0FBQyxDQUFDO0lBRTNGLElBQ0UsQ0FBQyxpQkFBaUIsQ0FBQyxnQkFBZ0I7UUFDbkMsQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDO1FBQ3BELGlCQUFpQixDQUFDLElBQUksS0FBSyxXQUFXLEVBQ3RDO1FBQ0EsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUM7Ozs7Ozs7O0tBUW5CLENBQUMsQ0FBQztLQUNKO0lBRUQsSUFBSSxpQkFBaUIsQ0FBQyxnQkFBZ0IsRUFBRTtRQUN0QyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksQ0FDakIsMEVBQTBFO1lBQ3hFLGlIQUFpSCxDQUNwSCxDQUFDO0tBQ0g7SUFFRCxpQkFBaUIsQ0FBQyxJQUFJLEdBQUcsTUFBTSxJQUFBLHNCQUFTLEVBQUMsaUJBQWlCLENBQUMsSUFBSSxFQUFFLGlCQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDO0lBRXpGLE9BQU8sRUFBRSxXQUFXLEVBQUUsaUJBQWlCLEVBQUUsQ0FBQztBQUM1QyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB0eXBlIHsgQnVpbGRlckNvbnRleHQgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvYXJjaGl0ZWN0JztcbmltcG9ydCB7IEVNUFRZLCBPYnNlcnZhYmxlLCBkZWZlciwgc3dpdGNoTWFwIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgdHlwZSB7IEV4ZWN1dGlvblRyYW5zZm9ybWVyIH0gZnJvbSAnLi4vLi4vdHJhbnNmb3Jtcyc7XG5pbXBvcnQgeyBjaGVja1BvcnQgfSBmcm9tICcuLi8uLi91dGlscy9jaGVjay1wb3J0JztcbmltcG9ydCB0eXBlIHsgSW5kZXhIdG1sVHJhbnNmb3JtIH0gZnJvbSAnLi4vLi4vdXRpbHMvaW5kZXgtZmlsZS9pbmRleC1odG1sLWdlbmVyYXRvcic7XG5pbXBvcnQgeyBwdXJnZVN0YWxlQnVpbGRDYWNoZSB9IGZyb20gJy4uLy4uL3V0aWxzL3B1cmdlLWNhY2hlJztcbmltcG9ydCB7IG5vcm1hbGl6ZU9wdGlvbnMgfSBmcm9tICcuL29wdGlvbnMnO1xuaW1wb3J0IHR5cGUgeyBTY2hlbWEgYXMgRGV2U2VydmVyQnVpbGRlck9wdGlvbnMgfSBmcm9tICcuL3NjaGVtYSc7XG5pbXBvcnQgdHlwZSB7IERldlNlcnZlckJ1aWxkZXJPdXRwdXQgfSBmcm9tICcuL3dlYnBhY2stc2VydmVyJztcblxuLyoqXG4gKiBBIEJ1aWxkZXIgdGhhdCBleGVjdXRlcyBhIGRldmVsb3BtZW50IHNlcnZlciBiYXNlZCBvbiB0aGUgcHJvdmlkZWQgYnJvd3NlciB0YXJnZXQgb3B0aW9uLlxuICogQHBhcmFtIG9wdGlvbnMgRGV2IFNlcnZlciBvcHRpb25zLlxuICogQHBhcmFtIGNvbnRleHQgVGhlIGJ1aWxkIGNvbnRleHQuXG4gKiBAcGFyYW0gdHJhbnNmb3JtcyBBIG1hcCBvZiB0cmFuc2Zvcm1zIHRoYXQgY2FuIGJlIHVzZWQgdG8gaG9vayBpbnRvIHNvbWUgbG9naWMgKHN1Y2ggYXNcbiAqIHRyYW5zZm9ybWluZyB3ZWJwYWNrIGNvbmZpZ3VyYXRpb24gYmVmb3JlIHBhc3NpbmcgaXQgdG8gd2VicGFjaykuXG4gKlxuICogQGV4cGVyaW1lbnRhbCBEaXJlY3QgdXNhZ2Ugb2YgdGhpcyBmdW5jdGlvbiBpcyBjb25zaWRlcmVkIGV4cGVyaW1lbnRhbC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4ZWN1dGUoXG4gIG9wdGlvbnM6IERldlNlcnZlckJ1aWxkZXJPcHRpb25zLFxuICBjb250ZXh0OiBCdWlsZGVyQ29udGV4dCxcbiAgdHJhbnNmb3Jtczoge1xuICAgIHdlYnBhY2tDb25maWd1cmF0aW9uPzogRXhlY3V0aW9uVHJhbnNmb3JtZXI8aW1wb3J0KCd3ZWJwYWNrJykuQ29uZmlndXJhdGlvbj47XG4gICAgbG9nZ2luZz86IGltcG9ydCgnQGFuZ3VsYXItZGV2a2l0L2J1aWxkLXdlYnBhY2snKS5XZWJwYWNrTG9nZ2luZ0NhbGxiYWNrO1xuICAgIGluZGV4SHRtbD86IEluZGV4SHRtbFRyYW5zZm9ybTtcbiAgfSA9IHt9LFxuKTogT2JzZXJ2YWJsZTxEZXZTZXJ2ZXJCdWlsZGVyT3V0cHV0PiB7XG4gIC8vIERldGVybWluZSBwcm9qZWN0IG5hbWUgZnJvbSBidWlsZGVyIGNvbnRleHQgdGFyZ2V0XG4gIGNvbnN0IHByb2plY3ROYW1lID0gY29udGV4dC50YXJnZXQ/LnByb2plY3Q7XG4gIGlmICghcHJvamVjdE5hbWUpIHtcbiAgICBjb250ZXh0LmxvZ2dlci5lcnJvcihgVGhlICdkZXYtc2VydmVyJyBidWlsZGVyIHJlcXVpcmVzIGEgdGFyZ2V0IHRvIGJlIHNwZWNpZmllZC5gKTtcblxuICAgIHJldHVybiBFTVBUWTtcbiAgfVxuXG4gIHJldHVybiBkZWZlcigoKSA9PiBpbml0aWFsaXplKG9wdGlvbnMsIHByb2plY3ROYW1lLCBjb250ZXh0KSkucGlwZShcbiAgICBzd2l0Y2hNYXAoKHsgYnVpbGRlck5hbWUsIG5vcm1hbGl6ZWRPcHRpb25zIH0pID0+IHtcbiAgICAgIC8vIFVzZSB2aXRlLWJhc2VkIGRldmVsb3BtZW50IHNlcnZlciBmb3IgZXNidWlsZC1iYXNlZCBidWlsZHNcbiAgICAgIGlmIChidWlsZGVyTmFtZSA9PT0gJ0Bhbmd1bGFyLWRldmtpdC9idWlsZC1hbmd1bGFyOmJyb3dzZXItZXNidWlsZCcpIHtcbiAgICAgICAgcmV0dXJuIGRlZmVyKCgpID0+IGltcG9ydCgnLi92aXRlLXNlcnZlcicpKS5waXBlKFxuICAgICAgICAgIHN3aXRjaE1hcCgoeyBzZXJ2ZVdpdGhWaXRlIH0pID0+IHNlcnZlV2l0aFZpdGUobm9ybWFsaXplZE9wdGlvbnMsIGJ1aWxkZXJOYW1lLCBjb250ZXh0KSksXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIC8vIFVzZSBXZWJwYWNrIGZvciBhbGwgb3RoZXIgYnJvd3NlciB0YXJnZXRzXG4gICAgICByZXR1cm4gZGVmZXIoKCkgPT4gaW1wb3J0KCcuL3dlYnBhY2stc2VydmVyJykpLnBpcGUoXG4gICAgICAgIHN3aXRjaE1hcCgoeyBzZXJ2ZVdlYnBhY2tCcm93c2VyIH0pID0+XG4gICAgICAgICAgc2VydmVXZWJwYWNrQnJvd3Nlcihub3JtYWxpemVkT3B0aW9ucywgYnVpbGRlck5hbWUsIGNvbnRleHQsIHRyYW5zZm9ybXMpLFxuICAgICAgICApLFxuICAgICAgKTtcbiAgICB9KSxcbiAgKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gaW5pdGlhbGl6ZShcbiAgaW5pdGlhbE9wdGlvbnM6IERldlNlcnZlckJ1aWxkZXJPcHRpb25zLFxuICBwcm9qZWN0TmFtZTogc3RyaW5nLFxuICBjb250ZXh0OiBCdWlsZGVyQ29udGV4dCxcbikge1xuICAvLyBQdXJnZSBvbGQgYnVpbGQgZGlzayBjYWNoZS5cbiAgYXdhaXQgcHVyZ2VTdGFsZUJ1aWxkQ2FjaGUoY29udGV4dCk7XG5cbiAgY29uc3Qgbm9ybWFsaXplZE9wdGlvbnMgPSBhd2FpdCBub3JtYWxpemVPcHRpb25zKGNvbnRleHQsIHByb2plY3ROYW1lLCBpbml0aWFsT3B0aW9ucyk7XG4gIGNvbnN0IGJ1aWxkZXJOYW1lID0gYXdhaXQgY29udGV4dC5nZXRCdWlsZGVyTmFtZUZvclRhcmdldChub3JtYWxpemVkT3B0aW9ucy5icm93c2VyVGFyZ2V0KTtcblxuICBpZiAoXG4gICAgIW5vcm1hbGl6ZWRPcHRpb25zLmRpc2FibGVIb3N0Q2hlY2sgJiZcbiAgICAhL14xMjdcXC5cXGQrXFwuXFxkK1xcLlxcZCsvZy50ZXN0KG5vcm1hbGl6ZWRPcHRpb25zLmhvc3QpICYmXG4gICAgbm9ybWFsaXplZE9wdGlvbnMuaG9zdCAhPT0gJ2xvY2FsaG9zdCdcbiAgKSB7XG4gICAgY29udGV4dC5sb2dnZXIud2FybihgXG5XYXJuaW5nOiBUaGlzIGlzIGEgc2ltcGxlIHNlcnZlciBmb3IgdXNlIGluIHRlc3Rpbmcgb3IgZGVidWdnaW5nIEFuZ3VsYXIgYXBwbGljYXRpb25zXG5sb2NhbGx5LiBJdCBoYXNuJ3QgYmVlbiByZXZpZXdlZCBmb3Igc2VjdXJpdHkgaXNzdWVzLlxuXG5CaW5kaW5nIHRoaXMgc2VydmVyIHRvIGFuIG9wZW4gY29ubmVjdGlvbiBjYW4gcmVzdWx0IGluIGNvbXByb21pc2luZyB5b3VyIGFwcGxpY2F0aW9uIG9yXG5jb21wdXRlci4gVXNpbmcgYSBkaWZmZXJlbnQgaG9zdCB0aGFuIHRoZSBvbmUgcGFzc2VkIHRvIHRoZSBcIi0taG9zdFwiIGZsYWcgbWlnaHQgcmVzdWx0IGluXG53ZWJzb2NrZXQgY29ubmVjdGlvbiBpc3N1ZXMuIFlvdSBtaWdodCBuZWVkIHRvIHVzZSBcIi0tZGlzYWJsZS1ob3N0LWNoZWNrXCIgaWYgdGhhdCdzIHRoZVxuY2FzZS5cbiAgICBgKTtcbiAgfVxuXG4gIGlmIChub3JtYWxpemVkT3B0aW9ucy5kaXNhYmxlSG9zdENoZWNrKSB7XG4gICAgY29udGV4dC5sb2dnZXIud2FybihcbiAgICAgICdXYXJuaW5nOiBSdW5uaW5nIGEgc2VydmVyIHdpdGggLS1kaXNhYmxlLWhvc3QtY2hlY2sgaXMgYSBzZWN1cml0eSByaXNrLiAnICtcbiAgICAgICAgJ1NlZSBodHRwczovL21lZGl1bS5jb20vd2VicGFjay93ZWJwYWNrLWRldi1zZXJ2ZXItbWlkZGxld2FyZS1zZWN1cml0eS1pc3N1ZXMtMTQ4OWQ5NTA4NzRhIGZvciBtb3JlIGluZm9ybWF0aW9uLicsXG4gICAgKTtcbiAgfVxuXG4gIG5vcm1hbGl6ZWRPcHRpb25zLnBvcnQgPSBhd2FpdCBjaGVja1BvcnQobm9ybWFsaXplZE9wdGlvbnMucG9ydCwgbm9ybWFsaXplZE9wdGlvbnMuaG9zdCk7XG5cbiAgcmV0dXJuIHsgYnVpbGRlck5hbWUsIG5vcm1hbGl6ZWRPcHRpb25zIH07XG59XG4iXX0=