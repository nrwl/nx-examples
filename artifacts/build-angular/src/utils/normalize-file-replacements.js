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
exports.normalizeFileReplacements = exports.MissingFileReplacementException = void 0;
const core_1 = require("@angular-devkit/core");
const fs_1 = require("fs");
const path = __importStar(require("path"));
class MissingFileReplacementException extends core_1.BaseException {
    constructor(path) {
        super(`The ${path} path in file replacements does not exist.`);
    }
}
exports.MissingFileReplacementException = MissingFileReplacementException;
function normalizeFileReplacements(fileReplacements, workspaceRoot) {
    if (fileReplacements.length === 0) {
        return [];
    }
    const normalizedReplacement = fileReplacements.map((replacement) => normalizeFileReplacement(replacement, workspaceRoot));
    for (const { replace, with: replacementWith } of normalizedReplacement) {
        if (!(0, fs_1.existsSync)(replacementWith)) {
            throw new MissingFileReplacementException(replacementWith);
        }
        if (!(0, fs_1.existsSync)(replace)) {
            throw new MissingFileReplacementException(replace);
        }
    }
    return normalizedReplacement;
}
exports.normalizeFileReplacements = normalizeFileReplacements;
function normalizeFileReplacement(fileReplacement, root) {
    let replacePath;
    let withPath;
    if (fileReplacement.src && fileReplacement.replaceWith) {
        replacePath = fileReplacement.src;
        withPath = fileReplacement.replaceWith;
    }
    else if (fileReplacement.replace && fileReplacement.with) {
        replacePath = fileReplacement.replace;
        withPath = fileReplacement.with;
    }
    else {
        throw new Error(`Invalid file replacement: ${JSON.stringify(fileReplacement)}`);
    }
    return {
        replace: path.join(root, replacePath),
        with: path.join(root, withPath),
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9ybWFsaXplLWZpbGUtcmVwbGFjZW1lbnRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvYnVpbGRfYW5ndWxhci9zcmMvdXRpbHMvbm9ybWFsaXplLWZpbGUtcmVwbGFjZW1lbnRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUgsK0NBQXFEO0FBQ3JELDJCQUFnQztBQUNoQywyQ0FBNkI7QUFHN0IsTUFBYSwrQkFBZ0MsU0FBUSxvQkFBYTtJQUNoRSxZQUFZLElBQVk7UUFDdEIsS0FBSyxDQUFDLE9BQU8sSUFBSSw0Q0FBNEMsQ0FBQyxDQUFDO0lBQ2pFLENBQUM7Q0FDRjtBQUpELDBFQUlDO0FBT0QsU0FBZ0IseUJBQXlCLENBQ3ZDLGdCQUFtQyxFQUNuQyxhQUFxQjtJQUVyQixJQUFJLGdCQUFnQixDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7UUFDakMsT0FBTyxFQUFFLENBQUM7S0FDWDtJQUVELE1BQU0scUJBQXFCLEdBQUcsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FDakUsd0JBQXdCLENBQUMsV0FBVyxFQUFFLGFBQWEsQ0FBQyxDQUNyRCxDQUFDO0lBRUYsS0FBSyxNQUFNLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxlQUFlLEVBQUUsSUFBSSxxQkFBcUIsRUFBRTtRQUN0RSxJQUFJLENBQUMsSUFBQSxlQUFVLEVBQUMsZUFBZSxDQUFDLEVBQUU7WUFDaEMsTUFBTSxJQUFJLCtCQUErQixDQUFDLGVBQWUsQ0FBQyxDQUFDO1NBQzVEO1FBRUQsSUFBSSxDQUFDLElBQUEsZUFBVSxFQUFDLE9BQU8sQ0FBQyxFQUFFO1lBQ3hCLE1BQU0sSUFBSSwrQkFBK0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztTQUNwRDtLQUNGO0lBRUQsT0FBTyxxQkFBcUIsQ0FBQztBQUMvQixDQUFDO0FBdkJELDhEQXVCQztBQUVELFNBQVMsd0JBQXdCLENBQy9CLGVBQWdDLEVBQ2hDLElBQVk7SUFFWixJQUFJLFdBQW1CLENBQUM7SUFDeEIsSUFBSSxRQUFnQixDQUFDO0lBQ3JCLElBQUksZUFBZSxDQUFDLEdBQUcsSUFBSSxlQUFlLENBQUMsV0FBVyxFQUFFO1FBQ3RELFdBQVcsR0FBRyxlQUFlLENBQUMsR0FBRyxDQUFDO1FBQ2xDLFFBQVEsR0FBRyxlQUFlLENBQUMsV0FBVyxDQUFDO0tBQ3hDO1NBQU0sSUFBSSxlQUFlLENBQUMsT0FBTyxJQUFJLGVBQWUsQ0FBQyxJQUFJLEVBQUU7UUFDMUQsV0FBVyxHQUFHLGVBQWUsQ0FBQyxPQUFPLENBQUM7UUFDdEMsUUFBUSxHQUFHLGVBQWUsQ0FBQyxJQUFJLENBQUM7S0FDakM7U0FBTTtRQUNMLE1BQU0sSUFBSSxLQUFLLENBQUMsNkJBQTZCLElBQUksQ0FBQyxTQUFTLENBQUMsZUFBZSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0tBQ2pGO0lBRUQsT0FBTztRQUNMLE9BQU8sRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxXQUFXLENBQUM7UUFDckMsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQztLQUNoQyxDQUFDO0FBQ0osQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBCYXNlRXhjZXB0aW9uIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IHsgZXhpc3RzU3luYyB9IGZyb20gJ2ZzJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBGaWxlUmVwbGFjZW1lbnQgfSBmcm9tICcuLi9idWlsZGVycy9icm93c2VyL3NjaGVtYSc7XG5cbmV4cG9ydCBjbGFzcyBNaXNzaW5nRmlsZVJlcGxhY2VtZW50RXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKHBhdGg6IFN0cmluZykge1xuICAgIHN1cGVyKGBUaGUgJHtwYXRofSBwYXRoIGluIGZpbGUgcmVwbGFjZW1lbnRzIGRvZXMgbm90IGV4aXN0LmApO1xuICB9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTm9ybWFsaXplZEZpbGVSZXBsYWNlbWVudCB7XG4gIHJlcGxhY2U6IHN0cmluZztcbiAgd2l0aDogc3RyaW5nO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplRmlsZVJlcGxhY2VtZW50cyhcbiAgZmlsZVJlcGxhY2VtZW50czogRmlsZVJlcGxhY2VtZW50W10sXG4gIHdvcmtzcGFjZVJvb3Q6IHN0cmluZyxcbik6IE5vcm1hbGl6ZWRGaWxlUmVwbGFjZW1lbnRbXSB7XG4gIGlmIChmaWxlUmVwbGFjZW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBbXTtcbiAgfVxuXG4gIGNvbnN0IG5vcm1hbGl6ZWRSZXBsYWNlbWVudCA9IGZpbGVSZXBsYWNlbWVudHMubWFwKChyZXBsYWNlbWVudCkgPT5cbiAgICBub3JtYWxpemVGaWxlUmVwbGFjZW1lbnQocmVwbGFjZW1lbnQsIHdvcmtzcGFjZVJvb3QpLFxuICApO1xuXG4gIGZvciAoY29uc3QgeyByZXBsYWNlLCB3aXRoOiByZXBsYWNlbWVudFdpdGggfSBvZiBub3JtYWxpemVkUmVwbGFjZW1lbnQpIHtcbiAgICBpZiAoIWV4aXN0c1N5bmMocmVwbGFjZW1lbnRXaXRoKSkge1xuICAgICAgdGhyb3cgbmV3IE1pc3NpbmdGaWxlUmVwbGFjZW1lbnRFeGNlcHRpb24ocmVwbGFjZW1lbnRXaXRoKTtcbiAgICB9XG5cbiAgICBpZiAoIWV4aXN0c1N5bmMocmVwbGFjZSkpIHtcbiAgICAgIHRocm93IG5ldyBNaXNzaW5nRmlsZVJlcGxhY2VtZW50RXhjZXB0aW9uKHJlcGxhY2UpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBub3JtYWxpemVkUmVwbGFjZW1lbnQ7XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZUZpbGVSZXBsYWNlbWVudChcbiAgZmlsZVJlcGxhY2VtZW50OiBGaWxlUmVwbGFjZW1lbnQsXG4gIHJvb3Q6IHN0cmluZyxcbik6IE5vcm1hbGl6ZWRGaWxlUmVwbGFjZW1lbnQge1xuICBsZXQgcmVwbGFjZVBhdGg6IHN0cmluZztcbiAgbGV0IHdpdGhQYXRoOiBzdHJpbmc7XG4gIGlmIChmaWxlUmVwbGFjZW1lbnQuc3JjICYmIGZpbGVSZXBsYWNlbWVudC5yZXBsYWNlV2l0aCkge1xuICAgIHJlcGxhY2VQYXRoID0gZmlsZVJlcGxhY2VtZW50LnNyYztcbiAgICB3aXRoUGF0aCA9IGZpbGVSZXBsYWNlbWVudC5yZXBsYWNlV2l0aDtcbiAgfSBlbHNlIGlmIChmaWxlUmVwbGFjZW1lbnQucmVwbGFjZSAmJiBmaWxlUmVwbGFjZW1lbnQud2l0aCkge1xuICAgIHJlcGxhY2VQYXRoID0gZmlsZVJlcGxhY2VtZW50LnJlcGxhY2U7XG4gICAgd2l0aFBhdGggPSBmaWxlUmVwbGFjZW1lbnQud2l0aDtcbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgZmlsZSByZXBsYWNlbWVudDogJHtKU09OLnN0cmluZ2lmeShmaWxlUmVwbGFjZW1lbnQpfWApO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICByZXBsYWNlOiBwYXRoLmpvaW4ocm9vdCwgcmVwbGFjZVBhdGgpLFxuICAgIHdpdGg6IHBhdGguam9pbihyb290LCB3aXRoUGF0aCksXG4gIH07XG59XG4iXX0=