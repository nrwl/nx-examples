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
const architect_1 = require("@angular-devkit/architect");
const path_1 = require("path");
const rxjs_1 = require("rxjs");
const normalize_cache_1 = require("../../utils/normalize-cache");
const purge_cache_1 = require("../../utils/purge-cache");
/**
 * @experimental Direct usage of this function is considered experimental.
 */
function execute(options, context) {
    return (0, rxjs_1.from)((async () => {
        // Purge old build disk cache.
        await (0, purge_cache_1.purgeStaleBuildCache)(context);
        const root = context.workspaceRoot;
        const packager = (await Promise.resolve().then(() => __importStar(require('ng-packagr')))).ngPackagr();
        packager.forProject((0, path_1.resolve)(root, options.project));
        if (options.tsConfig) {
            packager.withTsConfig((0, path_1.resolve)(root, options.tsConfig));
        }
        const projectName = context.target?.project;
        if (!projectName) {
            throw new Error('The builder requires a target.');
        }
        const metadata = await context.getProjectMetadata(projectName);
        const { enabled: cacheEnabled, path: cacheDirectory } = (0, normalize_cache_1.normalizeCacheOptions)(metadata, context.workspaceRoot);
        const ngPackagrOptions = {
            cacheEnabled,
            cacheDirectory: (0, path_1.join)(cacheDirectory, 'ng-packagr'),
        };
        return { packager, ngPackagrOptions };
    })()).pipe((0, rxjs_1.switchMap)(({ packager, ngPackagrOptions }) => options.watch ? packager.watch(ngPackagrOptions) : packager.build(ngPackagrOptions)), (0, rxjs_1.mapTo)({ success: true }), (0, rxjs_1.catchError)((err) => (0, rxjs_1.of)({ success: false, error: err.message })));
}
exports.execute = execute;
exports.default = (0, architect_1.createBuilder)(execute);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy9idWlsZGVycy9uZy1wYWNrYWdyL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUgseURBQXlGO0FBQ3pGLCtCQUFxQztBQUNyQywrQkFBMEU7QUFDMUUsaUVBQW9FO0FBQ3BFLHlEQUErRDtBQUcvRDs7R0FFRztBQUNILFNBQWdCLE9BQU8sQ0FDckIsT0FBZ0MsRUFDaEMsT0FBdUI7SUFFdkIsT0FBTyxJQUFBLFdBQUksRUFDVCxDQUFDLEtBQUssSUFBSSxFQUFFO1FBQ1YsOEJBQThCO1FBQzlCLE1BQU0sSUFBQSxrQ0FBb0IsRUFBQyxPQUFPLENBQUMsQ0FBQztRQUVwQyxNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsYUFBYSxDQUFDO1FBQ25DLE1BQU0sUUFBUSxHQUFHLENBQUMsd0RBQWEsWUFBWSxHQUFDLENBQUMsQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUUxRCxRQUFRLENBQUMsVUFBVSxDQUFDLElBQUEsY0FBTyxFQUFDLElBQUksRUFBRSxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUVwRCxJQUFJLE9BQU8sQ0FBQyxRQUFRLEVBQUU7WUFDcEIsUUFBUSxDQUFDLFlBQVksQ0FBQyxJQUFBLGNBQU8sRUFBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7U0FDeEQ7UUFFRCxNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQztRQUM1QyxJQUFJLENBQUMsV0FBVyxFQUFFO1lBQ2hCLE1BQU0sSUFBSSxLQUFLLENBQUMsZ0NBQWdDLENBQUMsQ0FBQztTQUNuRDtRQUVELE1BQU0sUUFBUSxHQUFHLE1BQU0sT0FBTyxDQUFDLGtCQUFrQixDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQy9ELE1BQU0sRUFBRSxPQUFPLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSxjQUFjLEVBQUUsR0FBRyxJQUFBLHVDQUFxQixFQUMzRSxRQUFRLEVBQ1IsT0FBTyxDQUFDLGFBQWEsQ0FDdEIsQ0FBQztRQUVGLE1BQU0sZ0JBQWdCLEdBQUc7WUFDdkIsWUFBWTtZQUNaLGNBQWMsRUFBRSxJQUFBLFdBQUksRUFBQyxjQUFjLEVBQUUsWUFBWSxDQUFDO1NBQ25ELENBQUM7UUFFRixPQUFPLEVBQUUsUUFBUSxFQUFFLGdCQUFnQixFQUFFLENBQUM7SUFDeEMsQ0FBQyxDQUFDLEVBQUUsQ0FDTCxDQUFDLElBQUksQ0FDSixJQUFBLGdCQUFTLEVBQUMsQ0FBQyxFQUFFLFFBQVEsRUFBRSxnQkFBZ0IsRUFBRSxFQUFFLEVBQUUsQ0FDM0MsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLGdCQUFnQixDQUFDLENBQ3BGLEVBQ0QsSUFBQSxZQUFLLEVBQUMsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFDeEIsSUFBQSxpQkFBVSxFQUFDLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxJQUFBLFNBQUUsRUFBQyxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQ2hFLENBQUM7QUFDSixDQUFDO0FBM0NELDBCQTJDQztBQUdELGtCQUFlLElBQUEseUJBQWEsRUFBbUQsT0FBTyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsgQnVpbGRlckNvbnRleHQsIEJ1aWxkZXJPdXRwdXQsIGNyZWF0ZUJ1aWxkZXIgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvYXJjaGl0ZWN0JztcbmltcG9ydCB7IGpvaW4sIHJlc29sdmUgfSBmcm9tICdwYXRoJztcbmltcG9ydCB7IE9ic2VydmFibGUsIGNhdGNoRXJyb3IsIGZyb20sIG1hcFRvLCBvZiwgc3dpdGNoTWFwIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBub3JtYWxpemVDYWNoZU9wdGlvbnMgfSBmcm9tICcuLi8uLi91dGlscy9ub3JtYWxpemUtY2FjaGUnO1xuaW1wb3J0IHsgcHVyZ2VTdGFsZUJ1aWxkQ2FjaGUgfSBmcm9tICcuLi8uLi91dGlscy9wdXJnZS1jYWNoZSc7XG5pbXBvcnQgeyBTY2hlbWEgYXMgTmdQYWNrYWdyQnVpbGRlck9wdGlvbnMgfSBmcm9tICcuL3NjaGVtYSc7XG5cbi8qKlxuICogQGV4cGVyaW1lbnRhbCBEaXJlY3QgdXNhZ2Ugb2YgdGhpcyBmdW5jdGlvbiBpcyBjb25zaWRlcmVkIGV4cGVyaW1lbnRhbC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4ZWN1dGUoXG4gIG9wdGlvbnM6IE5nUGFja2FnckJ1aWxkZXJPcHRpb25zLFxuICBjb250ZXh0OiBCdWlsZGVyQ29udGV4dCxcbik6IE9ic2VydmFibGU8QnVpbGRlck91dHB1dD4ge1xuICByZXR1cm4gZnJvbShcbiAgICAoYXN5bmMgKCkgPT4ge1xuICAgICAgLy8gUHVyZ2Ugb2xkIGJ1aWxkIGRpc2sgY2FjaGUuXG4gICAgICBhd2FpdCBwdXJnZVN0YWxlQnVpbGRDYWNoZShjb250ZXh0KTtcblxuICAgICAgY29uc3Qgcm9vdCA9IGNvbnRleHQud29ya3NwYWNlUm9vdDtcbiAgICAgIGNvbnN0IHBhY2thZ2VyID0gKGF3YWl0IGltcG9ydCgnbmctcGFja2FncicpKS5uZ1BhY2thZ3IoKTtcblxuICAgICAgcGFja2FnZXIuZm9yUHJvamVjdChyZXNvbHZlKHJvb3QsIG9wdGlvbnMucHJvamVjdCkpO1xuXG4gICAgICBpZiAob3B0aW9ucy50c0NvbmZpZykge1xuICAgICAgICBwYWNrYWdlci53aXRoVHNDb25maWcocmVzb2x2ZShyb290LCBvcHRpb25zLnRzQ29uZmlnKSk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHByb2plY3ROYW1lID0gY29udGV4dC50YXJnZXQ/LnByb2plY3Q7XG4gICAgICBpZiAoIXByb2plY3ROYW1lKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIGJ1aWxkZXIgcmVxdWlyZXMgYSB0YXJnZXQuJyk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IG1ldGFkYXRhID0gYXdhaXQgY29udGV4dC5nZXRQcm9qZWN0TWV0YWRhdGEocHJvamVjdE5hbWUpO1xuICAgICAgY29uc3QgeyBlbmFibGVkOiBjYWNoZUVuYWJsZWQsIHBhdGg6IGNhY2hlRGlyZWN0b3J5IH0gPSBub3JtYWxpemVDYWNoZU9wdGlvbnMoXG4gICAgICAgIG1ldGFkYXRhLFxuICAgICAgICBjb250ZXh0LndvcmtzcGFjZVJvb3QsXG4gICAgICApO1xuXG4gICAgICBjb25zdCBuZ1BhY2thZ3JPcHRpb25zID0ge1xuICAgICAgICBjYWNoZUVuYWJsZWQsXG4gICAgICAgIGNhY2hlRGlyZWN0b3J5OiBqb2luKGNhY2hlRGlyZWN0b3J5LCAnbmctcGFja2FncicpLFxuICAgICAgfTtcblxuICAgICAgcmV0dXJuIHsgcGFja2FnZXIsIG5nUGFja2Fnck9wdGlvbnMgfTtcbiAgICB9KSgpLFxuICApLnBpcGUoXG4gICAgc3dpdGNoTWFwKCh7IHBhY2thZ2VyLCBuZ1BhY2thZ3JPcHRpb25zIH0pID0+XG4gICAgICBvcHRpb25zLndhdGNoID8gcGFja2FnZXIud2F0Y2gobmdQYWNrYWdyT3B0aW9ucykgOiBwYWNrYWdlci5idWlsZChuZ1BhY2thZ3JPcHRpb25zKSxcbiAgICApLFxuICAgIG1hcFRvKHsgc3VjY2VzczogdHJ1ZSB9KSxcbiAgICBjYXRjaEVycm9yKChlcnIpID0+IG9mKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnIubWVzc2FnZSB9KSksXG4gICk7XG59XG5cbmV4cG9ydCB7IE5nUGFja2FnckJ1aWxkZXJPcHRpb25zIH07XG5leHBvcnQgZGVmYXVsdCBjcmVhdGVCdWlsZGVyPFJlY29yZDxzdHJpbmcsIHN0cmluZz4gJiBOZ1BhY2thZ3JCdWlsZGVyT3B0aW9ucz4oZXhlY3V0ZSk7XG4iXX0=