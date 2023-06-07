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
exports.normalizeOptions = void 0;
const architect_1 = require("@angular-devkit/architect");
const node_path_1 = __importDefault(require("node:path"));
const normalize_cache_1 = require("../../utils/normalize-cache");
/**
 * Normalize the user provided options by creating full paths for all path based options
 * and converting multi-form options into a single form that can be directly used
 * by the build process.
 *
 * @param context The context for current builder execution.
 * @param projectName The name of the project for the current execution.
 * @param options An object containing the options to use for the build.
 * @returns An object containing normalized options required to perform the build.
 */
async function normalizeOptions(context, projectName, options) {
    const workspaceRoot = context.workspaceRoot;
    const projectMetadata = await context.getProjectMetadata(projectName);
    const projectRoot = node_path_1.default.join(workspaceRoot, projectMetadata.root ?? '');
    const cacheOptions = (0, normalize_cache_1.normalizeCacheOptions)(projectMetadata, workspaceRoot);
    const browserTarget = (0, architect_1.targetFromTargetString)(options.browserTarget);
    // Initial options to keep
    const { host, port, poll, open, verbose, watch, allowedHosts, disableHostCheck, liveReload, hmr, headers, proxyConfig, servePath, publicHost, ssl, sslCert, sslKey, } = options;
    // Return all the normalized options
    return {
        browserTarget,
        host: host ?? 'localhost',
        port: port ?? 4200,
        poll,
        open,
        verbose,
        watch,
        liveReload,
        hmr,
        headers,
        workspaceRoot,
        projectRoot,
        cacheOptions,
        allowedHosts,
        disableHostCheck,
        proxyConfig,
        servePath,
        publicHost,
        ssl,
        sslCert,
        sslKey,
    };
}
exports.normalizeOptions = normalizeOptions;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3B0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2J1aWxkX2FuZ3VsYXIvc3JjL2J1aWxkZXJzL2Rldi1zZXJ2ZXIvb3B0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7Ozs7QUFFSCx5REFBbUY7QUFDbkYsMERBQTZCO0FBQzdCLGlFQUFvRTtBQUtwRTs7Ozs7Ozs7O0dBU0c7QUFDSSxLQUFLLFVBQVUsZ0JBQWdCLENBQ3BDLE9BQXVCLEVBQ3ZCLFdBQW1CLEVBQ25CLE9BQXlCO0lBRXpCLE1BQU0sYUFBYSxHQUFHLE9BQU8sQ0FBQyxhQUFhLENBQUM7SUFDNUMsTUFBTSxlQUFlLEdBQUcsTUFBTSxPQUFPLENBQUMsa0JBQWtCLENBQUMsV0FBVyxDQUFDLENBQUM7SUFDdEUsTUFBTSxXQUFXLEdBQUcsbUJBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFHLGVBQWUsQ0FBQyxJQUEyQixJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBRWpHLE1BQU0sWUFBWSxHQUFHLElBQUEsdUNBQXFCLEVBQUMsZUFBZSxFQUFFLGFBQWEsQ0FBQyxDQUFDO0lBRTNFLE1BQU0sYUFBYSxHQUFHLElBQUEsa0NBQXNCLEVBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxDQUFDO0lBRXBFLDBCQUEwQjtJQUMxQixNQUFNLEVBQ0osSUFBSSxFQUNKLElBQUksRUFDSixJQUFJLEVBQ0osSUFBSSxFQUNKLE9BQU8sRUFDUCxLQUFLLEVBQ0wsWUFBWSxFQUNaLGdCQUFnQixFQUNoQixVQUFVLEVBQ1YsR0FBRyxFQUNILE9BQU8sRUFDUCxXQUFXLEVBQ1gsU0FBUyxFQUNULFVBQVUsRUFDVixHQUFHLEVBQ0gsT0FBTyxFQUNQLE1BQU0sR0FDUCxHQUFHLE9BQU8sQ0FBQztJQUVaLG9DQUFvQztJQUNwQyxPQUFPO1FBQ0wsYUFBYTtRQUNiLElBQUksRUFBRSxJQUFJLElBQUksV0FBVztRQUN6QixJQUFJLEVBQUUsSUFBSSxJQUFJLElBQUk7UUFDbEIsSUFBSTtRQUNKLElBQUk7UUFDSixPQUFPO1FBQ1AsS0FBSztRQUNMLFVBQVU7UUFDVixHQUFHO1FBQ0gsT0FBTztRQUNQLGFBQWE7UUFDYixXQUFXO1FBQ1gsWUFBWTtRQUNaLFlBQVk7UUFDWixnQkFBZ0I7UUFDaEIsV0FBVztRQUNYLFNBQVM7UUFDVCxVQUFVO1FBQ1YsR0FBRztRQUNILE9BQU87UUFDUCxNQUFNO0tBQ1AsQ0FBQztBQUNKLENBQUM7QUExREQsNENBMERDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7IEJ1aWxkZXJDb250ZXh0LCB0YXJnZXRGcm9tVGFyZ2V0U3RyaW5nIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2FyY2hpdGVjdCc7XG5pbXBvcnQgcGF0aCBmcm9tICdub2RlOnBhdGgnO1xuaW1wb3J0IHsgbm9ybWFsaXplQ2FjaGVPcHRpb25zIH0gZnJvbSAnLi4vLi4vdXRpbHMvbm9ybWFsaXplLWNhY2hlJztcbmltcG9ydCB7IFNjaGVtYSBhcyBEZXZTZXJ2ZXJPcHRpb25zIH0gZnJvbSAnLi9zY2hlbWEnO1xuXG5leHBvcnQgdHlwZSBOb3JtYWxpemVkRGV2U2VydmVyT3B0aW9ucyA9IEF3YWl0ZWQ8UmV0dXJuVHlwZTx0eXBlb2Ygbm9ybWFsaXplT3B0aW9ucz4+O1xuXG4vKipcbiAqIE5vcm1hbGl6ZSB0aGUgdXNlciBwcm92aWRlZCBvcHRpb25zIGJ5IGNyZWF0aW5nIGZ1bGwgcGF0aHMgZm9yIGFsbCBwYXRoIGJhc2VkIG9wdGlvbnNcbiAqIGFuZCBjb252ZXJ0aW5nIG11bHRpLWZvcm0gb3B0aW9ucyBpbnRvIGEgc2luZ2xlIGZvcm0gdGhhdCBjYW4gYmUgZGlyZWN0bHkgdXNlZFxuICogYnkgdGhlIGJ1aWxkIHByb2Nlc3MuXG4gKlxuICogQHBhcmFtIGNvbnRleHQgVGhlIGNvbnRleHQgZm9yIGN1cnJlbnQgYnVpbGRlciBleGVjdXRpb24uXG4gKiBAcGFyYW0gcHJvamVjdE5hbWUgVGhlIG5hbWUgb2YgdGhlIHByb2plY3QgZm9yIHRoZSBjdXJyZW50IGV4ZWN1dGlvbi5cbiAqIEBwYXJhbSBvcHRpb25zIEFuIG9iamVjdCBjb250YWluaW5nIHRoZSBvcHRpb25zIHRvIHVzZSBmb3IgdGhlIGJ1aWxkLlxuICogQHJldHVybnMgQW4gb2JqZWN0IGNvbnRhaW5pbmcgbm9ybWFsaXplZCBvcHRpb25zIHJlcXVpcmVkIHRvIHBlcmZvcm0gdGhlIGJ1aWxkLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbm9ybWFsaXplT3B0aW9ucyhcbiAgY29udGV4dDogQnVpbGRlckNvbnRleHQsXG4gIHByb2plY3ROYW1lOiBzdHJpbmcsXG4gIG9wdGlvbnM6IERldlNlcnZlck9wdGlvbnMsXG4pIHtcbiAgY29uc3Qgd29ya3NwYWNlUm9vdCA9IGNvbnRleHQud29ya3NwYWNlUm9vdDtcbiAgY29uc3QgcHJvamVjdE1ldGFkYXRhID0gYXdhaXQgY29udGV4dC5nZXRQcm9qZWN0TWV0YWRhdGEocHJvamVjdE5hbWUpO1xuICBjb25zdCBwcm9qZWN0Um9vdCA9IHBhdGguam9pbih3b3Jrc3BhY2VSb290LCAocHJvamVjdE1ldGFkYXRhLnJvb3QgYXMgc3RyaW5nIHwgdW5kZWZpbmVkKSA/PyAnJyk7XG5cbiAgY29uc3QgY2FjaGVPcHRpb25zID0gbm9ybWFsaXplQ2FjaGVPcHRpb25zKHByb2plY3RNZXRhZGF0YSwgd29ya3NwYWNlUm9vdCk7XG5cbiAgY29uc3QgYnJvd3NlclRhcmdldCA9IHRhcmdldEZyb21UYXJnZXRTdHJpbmcob3B0aW9ucy5icm93c2VyVGFyZ2V0KTtcblxuICAvLyBJbml0aWFsIG9wdGlvbnMgdG8ga2VlcFxuICBjb25zdCB7XG4gICAgaG9zdCxcbiAgICBwb3J0LFxuICAgIHBvbGwsXG4gICAgb3BlbixcbiAgICB2ZXJib3NlLFxuICAgIHdhdGNoLFxuICAgIGFsbG93ZWRIb3N0cyxcbiAgICBkaXNhYmxlSG9zdENoZWNrLFxuICAgIGxpdmVSZWxvYWQsXG4gICAgaG1yLFxuICAgIGhlYWRlcnMsXG4gICAgcHJveHlDb25maWcsXG4gICAgc2VydmVQYXRoLFxuICAgIHB1YmxpY0hvc3QsXG4gICAgc3NsLFxuICAgIHNzbENlcnQsXG4gICAgc3NsS2V5LFxuICB9ID0gb3B0aW9ucztcblxuICAvLyBSZXR1cm4gYWxsIHRoZSBub3JtYWxpemVkIG9wdGlvbnNcbiAgcmV0dXJuIHtcbiAgICBicm93c2VyVGFyZ2V0LFxuICAgIGhvc3Q6IGhvc3QgPz8gJ2xvY2FsaG9zdCcsXG4gICAgcG9ydDogcG9ydCA/PyA0MjAwLFxuICAgIHBvbGwsXG4gICAgb3BlbixcbiAgICB2ZXJib3NlLFxuICAgIHdhdGNoLFxuICAgIGxpdmVSZWxvYWQsXG4gICAgaG1yLFxuICAgIGhlYWRlcnMsXG4gICAgd29ya3NwYWNlUm9vdCxcbiAgICBwcm9qZWN0Um9vdCxcbiAgICBjYWNoZU9wdGlvbnMsXG4gICAgYWxsb3dlZEhvc3RzLFxuICAgIGRpc2FibGVIb3N0Q2hlY2ssXG4gICAgcHJveHlDb25maWcsXG4gICAgc2VydmVQYXRoLFxuICAgIHB1YmxpY0hvc3QsXG4gICAgc3NsLFxuICAgIHNzbENlcnQsXG4gICAgc3NsS2V5LFxuICB9O1xufVxuIl19