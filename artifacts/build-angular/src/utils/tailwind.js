"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.findTailwindConfigurationFile = void 0;
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
const tailwindConfigFiles = [
    'tailwind.config.js',
    'tailwind.config.cjs',
    'tailwind.config.mjs',
    'tailwind.config.ts',
];
async function findTailwindConfigurationFile(workspaceRoot, projectRoot) {
    const dirEntries = [projectRoot, workspaceRoot].map((root) => (0, promises_1.readdir)(root, { withFileTypes: false }).then((entries) => ({
        root,
        files: new Set(entries),
    })));
    // A configuration file can exist in the project or workspace root
    for await (const { root, files } of dirEntries) {
        for (const potentialConfig of tailwindConfigFiles) {
            if (files.has(potentialConfig)) {
                return (0, node_path_1.join)(root, potentialConfig);
            }
        }
    }
    return undefined;
}
exports.findTailwindConfigurationFile = findTailwindConfigurationFile;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFpbHdpbmQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy91dGlscy90YWlsd2luZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7QUFFSCwrQ0FBMkM7QUFDM0MseUNBQWlDO0FBRWpDLE1BQU0sbUJBQW1CLEdBQWE7SUFDcEMsb0JBQW9CO0lBQ3BCLHFCQUFxQjtJQUNyQixxQkFBcUI7SUFDckIsb0JBQW9CO0NBQ3JCLENBQUM7QUFFSyxLQUFLLFVBQVUsNkJBQTZCLENBQ2pELGFBQXFCLEVBQ3JCLFdBQW1CO0lBRW5CLE1BQU0sVUFBVSxHQUFHLENBQUMsV0FBVyxFQUFFLGFBQWEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFLENBQzNELElBQUEsa0JBQU8sRUFBQyxJQUFJLEVBQUUsRUFBRSxhQUFhLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDekQsSUFBSTtRQUNKLEtBQUssRUFBRSxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUM7S0FDeEIsQ0FBQyxDQUFDLENBQ0osQ0FBQztJQUVGLGtFQUFrRTtJQUNsRSxJQUFJLEtBQUssRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLFVBQVUsRUFBRTtRQUM5QyxLQUFLLE1BQU0sZUFBZSxJQUFJLG1CQUFtQixFQUFFO1lBQ2pELElBQUksS0FBSyxDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQUMsRUFBRTtnQkFDOUIsT0FBTyxJQUFBLGdCQUFJLEVBQUMsSUFBSSxFQUFFLGVBQWUsQ0FBQyxDQUFDO2FBQ3BDO1NBQ0Y7S0FDRjtJQUVELE9BQU8sU0FBUyxDQUFDO0FBQ25CLENBQUM7QUFyQkQsc0VBcUJDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7IHJlYWRkaXIgfSBmcm9tICdub2RlOmZzL3Byb21pc2VzJztcbmltcG9ydCB7IGpvaW4gfSBmcm9tICdub2RlOnBhdGgnO1xuXG5jb25zdCB0YWlsd2luZENvbmZpZ0ZpbGVzOiBzdHJpbmdbXSA9IFtcbiAgJ3RhaWx3aW5kLmNvbmZpZy5qcycsXG4gICd0YWlsd2luZC5jb25maWcuY2pzJyxcbiAgJ3RhaWx3aW5kLmNvbmZpZy5tanMnLFxuICAndGFpbHdpbmQuY29uZmlnLnRzJyxcbl07XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBmaW5kVGFpbHdpbmRDb25maWd1cmF0aW9uRmlsZShcbiAgd29ya3NwYWNlUm9vdDogc3RyaW5nLFxuICBwcm9qZWN0Um9vdDogc3RyaW5nLFxuKTogUHJvbWlzZTxzdHJpbmcgfCB1bmRlZmluZWQ+IHtcbiAgY29uc3QgZGlyRW50cmllcyA9IFtwcm9qZWN0Um9vdCwgd29ya3NwYWNlUm9vdF0ubWFwKChyb290KSA9PlxuICAgIHJlYWRkaXIocm9vdCwgeyB3aXRoRmlsZVR5cGVzOiBmYWxzZSB9KS50aGVuKChlbnRyaWVzKSA9PiAoe1xuICAgICAgcm9vdCxcbiAgICAgIGZpbGVzOiBuZXcgU2V0KGVudHJpZXMpLFxuICAgIH0pKSxcbiAgKTtcblxuICAvLyBBIGNvbmZpZ3VyYXRpb24gZmlsZSBjYW4gZXhpc3QgaW4gdGhlIHByb2plY3Qgb3Igd29ya3NwYWNlIHJvb3RcbiAgZm9yIGF3YWl0IChjb25zdCB7IHJvb3QsIGZpbGVzIH0gb2YgZGlyRW50cmllcykge1xuICAgIGZvciAoY29uc3QgcG90ZW50aWFsQ29uZmlnIG9mIHRhaWx3aW5kQ29uZmlnRmlsZXMpIHtcbiAgICAgIGlmIChmaWxlcy5oYXMocG90ZW50aWFsQ29uZmlnKSkge1xuICAgICAgICByZXR1cm4gam9pbihyb290LCBwb3RlbnRpYWxDb25maWcpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB1bmRlZmluZWQ7XG59XG4iXX0=