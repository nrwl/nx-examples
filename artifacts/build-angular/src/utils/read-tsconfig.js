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
exports.readTsconfig = void 0;
const path = __importStar(require("path"));
const load_esm_1 = require("./load-esm");
/**
 * Reads and parses a given TsConfig file.
 *
 * @param tsconfigPath - An absolute or relative path from 'workspaceRoot' of the tsconfig file.
 * @param workspaceRoot - workspaceRoot root location when provided
 * it will resolve 'tsconfigPath' from this path.
 */
async function readTsconfig(tsconfigPath, workspaceRoot) {
    const tsConfigFullPath = workspaceRoot ? path.resolve(workspaceRoot, tsconfigPath) : tsconfigPath;
    // Load ESM `@angular/compiler-cli` using the TypeScript dynamic import workaround.
    // Once TypeScript provides support for keeping the dynamic import this workaround can be
    // changed to a direct dynamic import.
    const { formatDiagnostics, readConfiguration } = await (0, load_esm_1.loadEsmModule)('@angular/compiler-cli');
    const configResult = readConfiguration(tsConfigFullPath);
    if (configResult.errors && configResult.errors.length) {
        throw new Error(formatDiagnostics(configResult.errors));
    }
    return configResult;
}
exports.readTsconfig = readTsconfig;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVhZC10c2NvbmZpZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2J1aWxkX2FuZ3VsYXIvc3JjL3V0aWxzL3JlYWQtdHNjb25maWcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFHSCwyQ0FBNkI7QUFDN0IseUNBQTJDO0FBRTNDOzs7Ozs7R0FNRztBQUNJLEtBQUssVUFBVSxZQUFZLENBQ2hDLFlBQW9CLEVBQ3BCLGFBQXNCO0lBRXRCLE1BQU0sZ0JBQWdCLEdBQUcsYUFBYSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRSxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDO0lBRWxHLG1GQUFtRjtJQUNuRix5RkFBeUY7SUFDekYsc0NBQXNDO0lBQ3RDLE1BQU0sRUFBRSxpQkFBaUIsRUFBRSxpQkFBaUIsRUFBRSxHQUFHLE1BQU0sSUFBQSx3QkFBYSxFQUVsRSx1QkFBdUIsQ0FBQyxDQUFDO0lBRTNCLE1BQU0sWUFBWSxHQUFHLGlCQUFpQixDQUFDLGdCQUFnQixDQUFDLENBQUM7SUFDekQsSUFBSSxZQUFZLENBQUMsTUFBTSxJQUFJLFlBQVksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFO1FBQ3JELE1BQU0sSUFBSSxLQUFLLENBQUMsaUJBQWlCLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7S0FDekQ7SUFFRCxPQUFPLFlBQVksQ0FBQztBQUN0QixDQUFDO0FBbkJELG9DQW1CQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgdHlwZSB7IFBhcnNlZENvbmZpZ3VyYXRpb24gfSBmcm9tICdAYW5ndWxhci9jb21waWxlci1jbGknO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IGxvYWRFc21Nb2R1bGUgfSBmcm9tICcuL2xvYWQtZXNtJztcblxuLyoqXG4gKiBSZWFkcyBhbmQgcGFyc2VzIGEgZ2l2ZW4gVHNDb25maWcgZmlsZS5cbiAqXG4gKiBAcGFyYW0gdHNjb25maWdQYXRoIC0gQW4gYWJzb2x1dGUgb3IgcmVsYXRpdmUgcGF0aCBmcm9tICd3b3Jrc3BhY2VSb290JyBvZiB0aGUgdHNjb25maWcgZmlsZS5cbiAqIEBwYXJhbSB3b3Jrc3BhY2VSb290IC0gd29ya3NwYWNlUm9vdCByb290IGxvY2F0aW9uIHdoZW4gcHJvdmlkZWRcbiAqIGl0IHdpbGwgcmVzb2x2ZSAndHNjb25maWdQYXRoJyBmcm9tIHRoaXMgcGF0aC5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlYWRUc2NvbmZpZyhcbiAgdHNjb25maWdQYXRoOiBzdHJpbmcsXG4gIHdvcmtzcGFjZVJvb3Q/OiBzdHJpbmcsXG4pOiBQcm9taXNlPFBhcnNlZENvbmZpZ3VyYXRpb24+IHtcbiAgY29uc3QgdHNDb25maWdGdWxsUGF0aCA9IHdvcmtzcGFjZVJvb3QgPyBwYXRoLnJlc29sdmUod29ya3NwYWNlUm9vdCwgdHNjb25maWdQYXRoKSA6IHRzY29uZmlnUGF0aDtcblxuICAvLyBMb2FkIEVTTSBgQGFuZ3VsYXIvY29tcGlsZXItY2xpYCB1c2luZyB0aGUgVHlwZVNjcmlwdCBkeW5hbWljIGltcG9ydCB3b3JrYXJvdW5kLlxuICAvLyBPbmNlIFR5cGVTY3JpcHQgcHJvdmlkZXMgc3VwcG9ydCBmb3Iga2VlcGluZyB0aGUgZHluYW1pYyBpbXBvcnQgdGhpcyB3b3JrYXJvdW5kIGNhbiBiZVxuICAvLyBjaGFuZ2VkIHRvIGEgZGlyZWN0IGR5bmFtaWMgaW1wb3J0LlxuICBjb25zdCB7IGZvcm1hdERpYWdub3N0aWNzLCByZWFkQ29uZmlndXJhdGlvbiB9ID0gYXdhaXQgbG9hZEVzbU1vZHVsZTxcbiAgICB0eXBlb2YgaW1wb3J0KCdAYW5ndWxhci9jb21waWxlci1jbGknKVxuICA+KCdAYW5ndWxhci9jb21waWxlci1jbGknKTtcblxuICBjb25zdCBjb25maWdSZXN1bHQgPSByZWFkQ29uZmlndXJhdGlvbih0c0NvbmZpZ0Z1bGxQYXRoKTtcbiAgaWYgKGNvbmZpZ1Jlc3VsdC5lcnJvcnMgJiYgY29uZmlnUmVzdWx0LmVycm9ycy5sZW5ndGgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoZm9ybWF0RGlhZ25vc3RpY3MoY29uZmlnUmVzdWx0LmVycm9ycykpO1xuICB9XG5cbiAgcmV0dXJuIGNvbmZpZ1Jlc3VsdDtcbn1cbiJdfQ==