"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkCommonJSModules = void 0;
/**
 * Checks the input files of a build to determine if any of the files included
 * in the build are not ESM. ESM files can be tree-shaken and otherwise optimized
 * in ways that CommonJS and other module formats cannot. The esbuild metafile
 * information is used as the basis for the analysis as it contains information
 * for each input file including its respective format.
 *
 * If any allowed dependencies are provided via the `allowedCommonJsDependencies`
 * parameter, both the direct import and any deep imports will be ignored and no
 * diagnostic will be generated.
 *
 * If a module has been issued a diagnostic message, then all descendant modules
 * will not be checked. This prevents a potential massive amount of inactionable
 * messages since the initial module import is the cause of the problem.
 *
 * @param metafile An esbuild metafile object to check.
 * @param allowedCommonJsDependencies An optional list of allowed dependencies.
 * @returns Zero or more diagnostic messages for any non-ESM modules.
 */
function checkCommonJSModules(metafile, allowedCommonJsDependencies) {
    const messages = [];
    const allowedRequests = new Set(allowedCommonJsDependencies);
    // Ignore Angular locale definitions which are currently UMD
    allowedRequests.add('@angular/common/locales');
    // Ignore zone.js due to it currently being built with a UMD like structure.
    // Once the build output is updated to be fully ESM, this can be removed.
    allowedRequests.add('zone.js');
    // Find all entry points that contain code (JS/TS)
    const files = [];
    for (const { entryPoint } of Object.values(metafile.outputs)) {
        if (!entryPoint) {
            continue;
        }
        if (!isPathCode(entryPoint)) {
            continue;
        }
        files.push(entryPoint);
    }
    // Track seen files so they are only analyzed once.
    // Bundler runtime code is also ignored since it cannot be actionable.
    const seenFiles = new Set(['<runtime>']);
    // Analyze the files present by walking the import graph
    let currentFile;
    while ((currentFile = files.shift())) {
        const input = metafile.inputs[currentFile];
        for (const imported of input.imports) {
            // Ignore imports that were already seen or not originally in the code (bundler injected)
            if (!imported.original || seenFiles.has(imported.path)) {
                continue;
            }
            seenFiles.add(imported.path);
            // Only check actual code files
            if (!isPathCode(imported.path)) {
                continue;
            }
            // Check if the import is ESM format and issue a diagnostic if the file is not allowed
            if (metafile.inputs[imported.path].format !== 'esm') {
                const request = imported.original;
                let notAllowed = true;
                if (allowedRequests.has(request)) {
                    notAllowed = false;
                }
                else {
                    // Check for deep imports of allowed requests
                    for (const allowed of allowedRequests) {
                        if (request.startsWith(allowed + '/')) {
                            notAllowed = false;
                            break;
                        }
                    }
                }
                if (notAllowed) {
                    // Issue a diagnostic message and skip all descendants since they are also most
                    // likely not ESM but solved by addressing this import.
                    messages.push(createCommonJSModuleError(request, currentFile));
                    continue;
                }
            }
            // Add the path so that its imports can be checked
            files.push(imported.path);
        }
    }
    return messages;
}
exports.checkCommonJSModules = checkCommonJSModules;
/**
 * Determines if a file path has an extension that is a JavaScript or TypeScript
 * code file.
 *
 * @param name A path to check for code file extensions.
 * @returns True, if a code file path; false, otherwise.
 */
function isPathCode(name) {
    return /\.[cm]?[jt]sx?$/.test(name);
}
/**
 * Creates an esbuild diagnostic message for a given non-ESM module request.
 *
 * @param request The requested non-ESM module name.
 * @param importer The path of the file containing the import.
 * @returns A message representing the diagnostic.
 */
function createCommonJSModuleError(request, importer) {
    const error = {
        text: `Module '${request}' used by '${importer}' is not ESM`,
        notes: [
            {
                text: 'CommonJS or AMD dependencies can cause optimization bailouts.\n' +
                    'For more information see: https://angular.io/guide/build#configuring-commonjs-dependencies',
            },
        ],
    };
    return error;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbW9uanMtY2hlY2tlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2J1aWxkX2FuZ3VsYXIvc3JjL2J1aWxkZXJzL2Jyb3dzZXItZXNidWlsZC9jb21tb25qcy1jaGVja2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7OztBQUlIOzs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FrQkc7QUFDSCxTQUFnQixvQkFBb0IsQ0FDbEMsUUFBa0IsRUFDbEIsMkJBQXNDO0lBRXRDLE1BQU0sUUFBUSxHQUFxQixFQUFFLENBQUM7SUFDdEMsTUFBTSxlQUFlLEdBQUcsSUFBSSxHQUFHLENBQUMsMkJBQTJCLENBQUMsQ0FBQztJQUU3RCw0REFBNEQ7SUFDNUQsZUFBZSxDQUFDLEdBQUcsQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO0lBRS9DLDRFQUE0RTtJQUM1RSx5RUFBeUU7SUFDekUsZUFBZSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUUvQixrREFBa0Q7SUFDbEQsTUFBTSxLQUFLLEdBQWEsRUFBRSxDQUFDO0lBQzNCLEtBQUssTUFBTSxFQUFFLFVBQVUsRUFBRSxJQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFO1FBQzVELElBQUksQ0FBQyxVQUFVLEVBQUU7WUFDZixTQUFTO1NBQ1Y7UUFDRCxJQUFJLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxFQUFFO1lBQzNCLFNBQVM7U0FDVjtRQUVELEtBQUssQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7S0FDeEI7SUFFRCxtREFBbUQ7SUFDbkQsc0VBQXNFO0lBQ3RFLE1BQU0sU0FBUyxHQUFHLElBQUksR0FBRyxDQUFTLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztJQUVqRCx3REFBd0Q7SUFDeEQsSUFBSSxXQUErQixDQUFDO0lBQ3BDLE9BQU8sQ0FBQyxXQUFXLEdBQUcsS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDLEVBQUU7UUFDcEMsTUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUUzQyxLQUFLLE1BQU0sUUFBUSxJQUFJLEtBQUssQ0FBQyxPQUFPLEVBQUU7WUFDcEMseUZBQXlGO1lBQ3pGLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxJQUFJLFNBQVMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUN0RCxTQUFTO2FBQ1Y7WUFDRCxTQUFTLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUU3QiwrQkFBK0I7WUFDL0IsSUFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUU7Z0JBQzlCLFNBQVM7YUFDVjtZQUVELHNGQUFzRjtZQUN0RixJQUFJLFFBQVEsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sS0FBSyxLQUFLLEVBQUU7Z0JBQ25ELE1BQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUM7Z0JBRWxDLElBQUksVUFBVSxHQUFHLElBQUksQ0FBQztnQkFDdEIsSUFBSSxlQUFlLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxFQUFFO29CQUNoQyxVQUFVLEdBQUcsS0FBSyxDQUFDO2lCQUNwQjtxQkFBTTtvQkFDTCw2Q0FBNkM7b0JBQzdDLEtBQUssTUFBTSxPQUFPLElBQUksZUFBZSxFQUFFO3dCQUNyQyxJQUFJLE9BQU8sQ0FBQyxVQUFVLENBQUMsT0FBTyxHQUFHLEdBQUcsQ0FBQyxFQUFFOzRCQUNyQyxVQUFVLEdBQUcsS0FBSyxDQUFDOzRCQUNuQixNQUFNO3lCQUNQO3FCQUNGO2lCQUNGO2dCQUVELElBQUksVUFBVSxFQUFFO29CQUNkLCtFQUErRTtvQkFDL0UsdURBQXVEO29CQUN2RCxRQUFRLENBQUMsSUFBSSxDQUFDLHlCQUF5QixDQUFDLE9BQU8sRUFBRSxXQUFXLENBQUMsQ0FBQyxDQUFDO29CQUMvRCxTQUFTO2lCQUNWO2FBQ0Y7WUFFRCxrREFBa0Q7WUFDbEQsS0FBSyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDM0I7S0FDRjtJQUVELE9BQU8sUUFBUSxDQUFDO0FBQ2xCLENBQUM7QUEvRUQsb0RBK0VDO0FBRUQ7Ozs7OztHQU1HO0FBQ0gsU0FBUyxVQUFVLENBQUMsSUFBWTtJQUM5QixPQUFPLGlCQUFpQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUN0QyxDQUFDO0FBRUQ7Ozs7OztHQU1HO0FBQ0gsU0FBUyx5QkFBeUIsQ0FBQyxPQUFlLEVBQUUsUUFBZ0I7SUFDbEUsTUFBTSxLQUFLLEdBQUc7UUFDWixJQUFJLEVBQUUsV0FBVyxPQUFPLGNBQWMsUUFBUSxjQUFjO1FBQzVELEtBQUssRUFBRTtZQUNMO2dCQUNFLElBQUksRUFDRixpRUFBaUU7b0JBQ2pFLDRGQUE0RjthQUMvRjtTQUNGO0tBQ0YsQ0FBQztJQUVGLE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgdHlwZSB7IE1ldGFmaWxlLCBQYXJ0aWFsTWVzc2FnZSB9IGZyb20gJ2VzYnVpbGQnO1xuXG4vKipcbiAqIENoZWNrcyB0aGUgaW5wdXQgZmlsZXMgb2YgYSBidWlsZCB0byBkZXRlcm1pbmUgaWYgYW55IG9mIHRoZSBmaWxlcyBpbmNsdWRlZFxuICogaW4gdGhlIGJ1aWxkIGFyZSBub3QgRVNNLiBFU00gZmlsZXMgY2FuIGJlIHRyZWUtc2hha2VuIGFuZCBvdGhlcndpc2Ugb3B0aW1pemVkXG4gKiBpbiB3YXlzIHRoYXQgQ29tbW9uSlMgYW5kIG90aGVyIG1vZHVsZSBmb3JtYXRzIGNhbm5vdC4gVGhlIGVzYnVpbGQgbWV0YWZpbGVcbiAqIGluZm9ybWF0aW9uIGlzIHVzZWQgYXMgdGhlIGJhc2lzIGZvciB0aGUgYW5hbHlzaXMgYXMgaXQgY29udGFpbnMgaW5mb3JtYXRpb25cbiAqIGZvciBlYWNoIGlucHV0IGZpbGUgaW5jbHVkaW5nIGl0cyByZXNwZWN0aXZlIGZvcm1hdC5cbiAqXG4gKiBJZiBhbnkgYWxsb3dlZCBkZXBlbmRlbmNpZXMgYXJlIHByb3ZpZGVkIHZpYSB0aGUgYGFsbG93ZWRDb21tb25Kc0RlcGVuZGVuY2llc2BcbiAqIHBhcmFtZXRlciwgYm90aCB0aGUgZGlyZWN0IGltcG9ydCBhbmQgYW55IGRlZXAgaW1wb3J0cyB3aWxsIGJlIGlnbm9yZWQgYW5kIG5vXG4gKiBkaWFnbm9zdGljIHdpbGwgYmUgZ2VuZXJhdGVkLlxuICpcbiAqIElmIGEgbW9kdWxlIGhhcyBiZWVuIGlzc3VlZCBhIGRpYWdub3N0aWMgbWVzc2FnZSwgdGhlbiBhbGwgZGVzY2VuZGFudCBtb2R1bGVzXG4gKiB3aWxsIG5vdCBiZSBjaGVja2VkLiBUaGlzIHByZXZlbnRzIGEgcG90ZW50aWFsIG1hc3NpdmUgYW1vdW50IG9mIGluYWN0aW9uYWJsZVxuICogbWVzc2FnZXMgc2luY2UgdGhlIGluaXRpYWwgbW9kdWxlIGltcG9ydCBpcyB0aGUgY2F1c2Ugb2YgdGhlIHByb2JsZW0uXG4gKlxuICogQHBhcmFtIG1ldGFmaWxlIEFuIGVzYnVpbGQgbWV0YWZpbGUgb2JqZWN0IHRvIGNoZWNrLlxuICogQHBhcmFtIGFsbG93ZWRDb21tb25Kc0RlcGVuZGVuY2llcyBBbiBvcHRpb25hbCBsaXN0IG9mIGFsbG93ZWQgZGVwZW5kZW5jaWVzLlxuICogQHJldHVybnMgWmVybyBvciBtb3JlIGRpYWdub3N0aWMgbWVzc2FnZXMgZm9yIGFueSBub24tRVNNIG1vZHVsZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjaGVja0NvbW1vbkpTTW9kdWxlcyhcbiAgbWV0YWZpbGU6IE1ldGFmaWxlLFxuICBhbGxvd2VkQ29tbW9uSnNEZXBlbmRlbmNpZXM/OiBzdHJpbmdbXSxcbik6IFBhcnRpYWxNZXNzYWdlW10ge1xuICBjb25zdCBtZXNzYWdlczogUGFydGlhbE1lc3NhZ2VbXSA9IFtdO1xuICBjb25zdCBhbGxvd2VkUmVxdWVzdHMgPSBuZXcgU2V0KGFsbG93ZWRDb21tb25Kc0RlcGVuZGVuY2llcyk7XG5cbiAgLy8gSWdub3JlIEFuZ3VsYXIgbG9jYWxlIGRlZmluaXRpb25zIHdoaWNoIGFyZSBjdXJyZW50bHkgVU1EXG4gIGFsbG93ZWRSZXF1ZXN0cy5hZGQoJ0Bhbmd1bGFyL2NvbW1vbi9sb2NhbGVzJyk7XG5cbiAgLy8gSWdub3JlIHpvbmUuanMgZHVlIHRvIGl0IGN1cnJlbnRseSBiZWluZyBidWlsdCB3aXRoIGEgVU1EIGxpa2Ugc3RydWN0dXJlLlxuICAvLyBPbmNlIHRoZSBidWlsZCBvdXRwdXQgaXMgdXBkYXRlZCB0byBiZSBmdWxseSBFU00sIHRoaXMgY2FuIGJlIHJlbW92ZWQuXG4gIGFsbG93ZWRSZXF1ZXN0cy5hZGQoJ3pvbmUuanMnKTtcblxuICAvLyBGaW5kIGFsbCBlbnRyeSBwb2ludHMgdGhhdCBjb250YWluIGNvZGUgKEpTL1RTKVxuICBjb25zdCBmaWxlczogc3RyaW5nW10gPSBbXTtcbiAgZm9yIChjb25zdCB7IGVudHJ5UG9pbnQgfSBvZiBPYmplY3QudmFsdWVzKG1ldGFmaWxlLm91dHB1dHMpKSB7XG4gICAgaWYgKCFlbnRyeVBvaW50KSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgaWYgKCFpc1BhdGhDb2RlKGVudHJ5UG9pbnQpKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBmaWxlcy5wdXNoKGVudHJ5UG9pbnQpO1xuICB9XG5cbiAgLy8gVHJhY2sgc2VlbiBmaWxlcyBzbyB0aGV5IGFyZSBvbmx5IGFuYWx5emVkIG9uY2UuXG4gIC8vIEJ1bmRsZXIgcnVudGltZSBjb2RlIGlzIGFsc28gaWdub3JlZCBzaW5jZSBpdCBjYW5ub3QgYmUgYWN0aW9uYWJsZS5cbiAgY29uc3Qgc2VlbkZpbGVzID0gbmV3IFNldDxzdHJpbmc+KFsnPHJ1bnRpbWU+J10pO1xuXG4gIC8vIEFuYWx5emUgdGhlIGZpbGVzIHByZXNlbnQgYnkgd2Fsa2luZyB0aGUgaW1wb3J0IGdyYXBoXG4gIGxldCBjdXJyZW50RmlsZTogc3RyaW5nIHwgdW5kZWZpbmVkO1xuICB3aGlsZSAoKGN1cnJlbnRGaWxlID0gZmlsZXMuc2hpZnQoKSkpIHtcbiAgICBjb25zdCBpbnB1dCA9IG1ldGFmaWxlLmlucHV0c1tjdXJyZW50RmlsZV07XG5cbiAgICBmb3IgKGNvbnN0IGltcG9ydGVkIG9mIGlucHV0LmltcG9ydHMpIHtcbiAgICAgIC8vIElnbm9yZSBpbXBvcnRzIHRoYXQgd2VyZSBhbHJlYWR5IHNlZW4gb3Igbm90IG9yaWdpbmFsbHkgaW4gdGhlIGNvZGUgKGJ1bmRsZXIgaW5qZWN0ZWQpXG4gICAgICBpZiAoIWltcG9ydGVkLm9yaWdpbmFsIHx8IHNlZW5GaWxlcy5oYXMoaW1wb3J0ZWQucGF0aCkpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBzZWVuRmlsZXMuYWRkKGltcG9ydGVkLnBhdGgpO1xuXG4gICAgICAvLyBPbmx5IGNoZWNrIGFjdHVhbCBjb2RlIGZpbGVzXG4gICAgICBpZiAoIWlzUGF0aENvZGUoaW1wb3J0ZWQucGF0aCkpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIC8vIENoZWNrIGlmIHRoZSBpbXBvcnQgaXMgRVNNIGZvcm1hdCBhbmQgaXNzdWUgYSBkaWFnbm9zdGljIGlmIHRoZSBmaWxlIGlzIG5vdCBhbGxvd2VkXG4gICAgICBpZiAobWV0YWZpbGUuaW5wdXRzW2ltcG9ydGVkLnBhdGhdLmZvcm1hdCAhPT0gJ2VzbScpIHtcbiAgICAgICAgY29uc3QgcmVxdWVzdCA9IGltcG9ydGVkLm9yaWdpbmFsO1xuXG4gICAgICAgIGxldCBub3RBbGxvd2VkID0gdHJ1ZTtcbiAgICAgICAgaWYgKGFsbG93ZWRSZXF1ZXN0cy5oYXMocmVxdWVzdCkpIHtcbiAgICAgICAgICBub3RBbGxvd2VkID0gZmFsc2U7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gQ2hlY2sgZm9yIGRlZXAgaW1wb3J0cyBvZiBhbGxvd2VkIHJlcXVlc3RzXG4gICAgICAgICAgZm9yIChjb25zdCBhbGxvd2VkIG9mIGFsbG93ZWRSZXF1ZXN0cykge1xuICAgICAgICAgICAgaWYgKHJlcXVlc3Quc3RhcnRzV2l0aChhbGxvd2VkICsgJy8nKSkge1xuICAgICAgICAgICAgICBub3RBbGxvd2VkID0gZmFsc2U7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChub3RBbGxvd2VkKSB7XG4gICAgICAgICAgLy8gSXNzdWUgYSBkaWFnbm9zdGljIG1lc3NhZ2UgYW5kIHNraXAgYWxsIGRlc2NlbmRhbnRzIHNpbmNlIHRoZXkgYXJlIGFsc28gbW9zdFxuICAgICAgICAgIC8vIGxpa2VseSBub3QgRVNNIGJ1dCBzb2x2ZWQgYnkgYWRkcmVzc2luZyB0aGlzIGltcG9ydC5cbiAgICAgICAgICBtZXNzYWdlcy5wdXNoKGNyZWF0ZUNvbW1vbkpTTW9kdWxlRXJyb3IocmVxdWVzdCwgY3VycmVudEZpbGUpKTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBBZGQgdGhlIHBhdGggc28gdGhhdCBpdHMgaW1wb3J0cyBjYW4gYmUgY2hlY2tlZFxuICAgICAgZmlsZXMucHVzaChpbXBvcnRlZC5wYXRoKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbWVzc2FnZXM7XG59XG5cbi8qKlxuICogRGV0ZXJtaW5lcyBpZiBhIGZpbGUgcGF0aCBoYXMgYW4gZXh0ZW5zaW9uIHRoYXQgaXMgYSBKYXZhU2NyaXB0IG9yIFR5cGVTY3JpcHRcbiAqIGNvZGUgZmlsZS5cbiAqXG4gKiBAcGFyYW0gbmFtZSBBIHBhdGggdG8gY2hlY2sgZm9yIGNvZGUgZmlsZSBleHRlbnNpb25zLlxuICogQHJldHVybnMgVHJ1ZSwgaWYgYSBjb2RlIGZpbGUgcGF0aDsgZmFsc2UsIG90aGVyd2lzZS5cbiAqL1xuZnVuY3Rpb24gaXNQYXRoQ29kZShuYW1lOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgcmV0dXJuIC9cXC5bY21dP1tqdF1zeD8kLy50ZXN0KG5hbWUpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYW4gZXNidWlsZCBkaWFnbm9zdGljIG1lc3NhZ2UgZm9yIGEgZ2l2ZW4gbm9uLUVTTSBtb2R1bGUgcmVxdWVzdC5cbiAqXG4gKiBAcGFyYW0gcmVxdWVzdCBUaGUgcmVxdWVzdGVkIG5vbi1FU00gbW9kdWxlIG5hbWUuXG4gKiBAcGFyYW0gaW1wb3J0ZXIgVGhlIHBhdGggb2YgdGhlIGZpbGUgY29udGFpbmluZyB0aGUgaW1wb3J0LlxuICogQHJldHVybnMgQSBtZXNzYWdlIHJlcHJlc2VudGluZyB0aGUgZGlhZ25vc3RpYy5cbiAqL1xuZnVuY3Rpb24gY3JlYXRlQ29tbW9uSlNNb2R1bGVFcnJvcihyZXF1ZXN0OiBzdHJpbmcsIGltcG9ydGVyOiBzdHJpbmcpOiBQYXJ0aWFsTWVzc2FnZSB7XG4gIGNvbnN0IGVycm9yID0ge1xuICAgIHRleHQ6IGBNb2R1bGUgJyR7cmVxdWVzdH0nIHVzZWQgYnkgJyR7aW1wb3J0ZXJ9JyBpcyBub3QgRVNNYCxcbiAgICBub3RlczogW1xuICAgICAge1xuICAgICAgICB0ZXh0OlxuICAgICAgICAgICdDb21tb25KUyBvciBBTUQgZGVwZW5kZW5jaWVzIGNhbiBjYXVzZSBvcHRpbWl6YXRpb24gYmFpbG91dHMuXFxuJyArXG4gICAgICAgICAgJ0ZvciBtb3JlIGluZm9ybWF0aW9uIHNlZTogaHR0cHM6Ly9hbmd1bGFyLmlvL2d1aWRlL2J1aWxkI2NvbmZpZ3VyaW5nLWNvbW1vbmpzLWRlcGVuZGVuY2llcycsXG4gICAgICB9LFxuICAgIF0sXG4gIH07XG5cbiAgcmV0dXJuIGVycm9yO1xufVxuIl19