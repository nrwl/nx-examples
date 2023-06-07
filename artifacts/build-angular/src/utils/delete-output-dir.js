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
exports.deleteOutputDir = void 0;
const fs = __importStar(require("fs"));
const path_1 = require("path");
/**
 * Delete an output directory, but error out if it's the root of the project.
 */
function deleteOutputDir(root, outputPath) {
    const resolvedOutputPath = (0, path_1.resolve)(root, outputPath);
    if (resolvedOutputPath === root) {
        throw new Error('Output path MUST not be project root directory!');
    }
    fs.rmSync(resolvedOutputPath, { force: true, recursive: true, maxRetries: 3 });
}
exports.deleteOutputDir = deleteOutputDir;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVsZXRlLW91dHB1dC1kaXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy91dGlscy9kZWxldGUtb3V0cHV0LWRpci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVILHVDQUF5QjtBQUN6QiwrQkFBK0I7QUFFL0I7O0dBRUc7QUFDSCxTQUFnQixlQUFlLENBQUMsSUFBWSxFQUFFLFVBQWtCO0lBQzlELE1BQU0sa0JBQWtCLEdBQUcsSUFBQSxjQUFPLEVBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxDQUFDO0lBQ3JELElBQUksa0JBQWtCLEtBQUssSUFBSSxFQUFFO1FBQy9CLE1BQU0sSUFBSSxLQUFLLENBQUMsaURBQWlELENBQUMsQ0FBQztLQUNwRTtJQUVELEVBQUUsQ0FBQyxNQUFNLENBQUMsa0JBQWtCLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDakYsQ0FBQztBQVBELDBDQU9DIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJztcbmltcG9ydCB7IHJlc29sdmUgfSBmcm9tICdwYXRoJztcblxuLyoqXG4gKiBEZWxldGUgYW4gb3V0cHV0IGRpcmVjdG9yeSwgYnV0IGVycm9yIG91dCBpZiBpdCdzIHRoZSByb290IG9mIHRoZSBwcm9qZWN0LlxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVsZXRlT3V0cHV0RGlyKHJvb3Q6IHN0cmluZywgb3V0cHV0UGF0aDogc3RyaW5nKTogdm9pZCB7XG4gIGNvbnN0IHJlc29sdmVkT3V0cHV0UGF0aCA9IHJlc29sdmUocm9vdCwgb3V0cHV0UGF0aCk7XG4gIGlmIChyZXNvbHZlZE91dHB1dFBhdGggPT09IHJvb3QpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ091dHB1dCBwYXRoIE1VU1Qgbm90IGJlIHByb2plY3Qgcm9vdCBkaXJlY3RvcnkhJyk7XG4gIH1cblxuICBmcy5ybVN5bmMocmVzb2x2ZWRPdXRwdXRQYXRoLCB7IGZvcmNlOiB0cnVlLCByZWN1cnNpdmU6IHRydWUsIG1heFJldHJpZXM6IDMgfSk7XG59XG4iXX0=