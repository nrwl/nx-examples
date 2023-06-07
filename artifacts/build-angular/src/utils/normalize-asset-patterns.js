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
exports.normalizeAssetPatterns = exports.MissingAssetSourceRootException = void 0;
const core_1 = require("@angular-devkit/core");
const fs_1 = require("fs");
const path = __importStar(require("path"));
class MissingAssetSourceRootException extends core_1.BaseException {
    constructor(path) {
        super(`The ${path} asset path must start with the project source root.`);
    }
}
exports.MissingAssetSourceRootException = MissingAssetSourceRootException;
function normalizeAssetPatterns(assetPatterns, workspaceRoot, projectRoot, projectSourceRoot) {
    if (assetPatterns.length === 0) {
        return [];
    }
    // When sourceRoot is not available, we default to ${projectRoot}/src.
    const sourceRoot = projectSourceRoot || path.join(projectRoot, 'src');
    const resolvedSourceRoot = path.resolve(workspaceRoot, sourceRoot);
    return assetPatterns.map((assetPattern) => {
        // Normalize string asset patterns to objects.
        if (typeof assetPattern === 'string') {
            const assetPath = path.normalize(assetPattern);
            const resolvedAssetPath = path.resolve(workspaceRoot, assetPath);
            // Check if the string asset is within sourceRoot.
            if (!resolvedAssetPath.startsWith(resolvedSourceRoot)) {
                throw new MissingAssetSourceRootException(assetPattern);
            }
            let glob, input;
            let isDirectory = false;
            try {
                isDirectory = (0, fs_1.statSync)(resolvedAssetPath).isDirectory();
            }
            catch {
                isDirectory = true;
            }
            if (isDirectory) {
                // Folders get a recursive star glob.
                glob = '**/*';
                // Input directory is their original path.
                input = assetPath;
            }
            else {
                // Files are their own glob.
                glob = path.basename(assetPath);
                // Input directory is their original dirname.
                input = path.dirname(assetPath);
            }
            // Output directory for both is the relative path from source root to input.
            const output = path.relative(resolvedSourceRoot, path.resolve(workspaceRoot, input));
            assetPattern = { glob, input, output };
        }
        else {
            assetPattern.output = path.join('.', assetPattern.output);
        }
        if (assetPattern.output.startsWith('..')) {
            throw new Error('An asset cannot be written to a location outside of the output path.');
        }
        return assetPattern;
    });
}
exports.normalizeAssetPatterns = normalizeAssetPatterns;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9ybWFsaXplLWFzc2V0LXBhdHRlcm5zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvYnVpbGRfYW5ndWxhci9zcmMvdXRpbHMvbm9ybWFsaXplLWFzc2V0LXBhdHRlcm5zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUgsK0NBQXFEO0FBQ3JELDJCQUE4QjtBQUM5QiwyQ0FBNkI7QUFHN0IsTUFBYSwrQkFBZ0MsU0FBUSxvQkFBYTtJQUNoRSxZQUFZLElBQVk7UUFDdEIsS0FBSyxDQUFDLE9BQU8sSUFBSSxzREFBc0QsQ0FBQyxDQUFDO0lBQzNFLENBQUM7Q0FDRjtBQUpELDBFQUlDO0FBRUQsU0FBZ0Isc0JBQXNCLENBQ3BDLGFBQTZCLEVBQzdCLGFBQXFCLEVBQ3JCLFdBQW1CLEVBQ25CLGlCQUFxQztJQUVyQyxJQUFJLGFBQWEsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO1FBQzlCLE9BQU8sRUFBRSxDQUFDO0tBQ1g7SUFFRCxzRUFBc0U7SUFDdEUsTUFBTSxVQUFVLEdBQUcsaUJBQWlCLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDdEUsTUFBTSxrQkFBa0IsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRSxVQUFVLENBQUMsQ0FBQztJQUVuRSxPQUFPLGFBQWEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxZQUFZLEVBQUUsRUFBRTtRQUN4Qyw4Q0FBOEM7UUFDOUMsSUFBSSxPQUFPLFlBQVksS0FBSyxRQUFRLEVBQUU7WUFDcEMsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUMvQyxNQUFNLGlCQUFpQixHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBRWpFLGtEQUFrRDtZQUNsRCxJQUFJLENBQUMsaUJBQWlCLENBQUMsVUFBVSxDQUFDLGtCQUFrQixDQUFDLEVBQUU7Z0JBQ3JELE1BQU0sSUFBSSwrQkFBK0IsQ0FBQyxZQUFZLENBQUMsQ0FBQzthQUN6RDtZQUVELElBQUksSUFBWSxFQUFFLEtBQWEsQ0FBQztZQUNoQyxJQUFJLFdBQVcsR0FBRyxLQUFLLENBQUM7WUFFeEIsSUFBSTtnQkFDRixXQUFXLEdBQUcsSUFBQSxhQUFRLEVBQUMsaUJBQWlCLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQzthQUN6RDtZQUFDLE1BQU07Z0JBQ04sV0FBVyxHQUFHLElBQUksQ0FBQzthQUNwQjtZQUVELElBQUksV0FBVyxFQUFFO2dCQUNmLHFDQUFxQztnQkFDckMsSUFBSSxHQUFHLE1BQU0sQ0FBQztnQkFDZCwwQ0FBMEM7Z0JBQzFDLEtBQUssR0FBRyxTQUFTLENBQUM7YUFDbkI7aUJBQU07Z0JBQ0wsNEJBQTRCO2dCQUM1QixJQUFJLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDaEMsNkNBQTZDO2dCQUM3QyxLQUFLLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQzthQUNqQztZQUVELDRFQUE0RTtZQUM1RSxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLGtCQUFrQixFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFFckYsWUFBWSxHQUFHLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsQ0FBQztTQUN4QzthQUFNO1lBQ0wsWUFBWSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUM7U0FDM0Q7UUFFRCxJQUFJLFlBQVksQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ3hDLE1BQU0sSUFBSSxLQUFLLENBQUMsc0VBQXNFLENBQUMsQ0FBQztTQUN6RjtRQUVELE9BQU8sWUFBWSxDQUFDO0lBQ3RCLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQTVERCx3REE0REMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsgQmFzZUV4Y2VwdGlvbiB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7IHN0YXRTeW5jIH0gZnJvbSAnZnMnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IEFzc2V0UGF0dGVybiwgQXNzZXRQYXR0ZXJuQ2xhc3MgfSBmcm9tICcuLi9idWlsZGVycy9icm93c2VyL3NjaGVtYSc7XG5cbmV4cG9ydCBjbGFzcyBNaXNzaW5nQXNzZXRTb3VyY2VSb290RXhjZXB0aW9uIGV4dGVuZHMgQmFzZUV4Y2VwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKHBhdGg6IFN0cmluZykge1xuICAgIHN1cGVyKGBUaGUgJHtwYXRofSBhc3NldCBwYXRoIG11c3Qgc3RhcnQgd2l0aCB0aGUgcHJvamVjdCBzb3VyY2Ugcm9vdC5gKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplQXNzZXRQYXR0ZXJucyhcbiAgYXNzZXRQYXR0ZXJuczogQXNzZXRQYXR0ZXJuW10sXG4gIHdvcmtzcGFjZVJvb3Q6IHN0cmluZyxcbiAgcHJvamVjdFJvb3Q6IHN0cmluZyxcbiAgcHJvamVjdFNvdXJjZVJvb3Q6IHN0cmluZyB8IHVuZGVmaW5lZCxcbik6IEFzc2V0UGF0dGVybkNsYXNzW10ge1xuICBpZiAoYXNzZXRQYXR0ZXJucy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gW107XG4gIH1cblxuICAvLyBXaGVuIHNvdXJjZVJvb3QgaXMgbm90IGF2YWlsYWJsZSwgd2UgZGVmYXVsdCB0byAke3Byb2plY3RSb290fS9zcmMuXG4gIGNvbnN0IHNvdXJjZVJvb3QgPSBwcm9qZWN0U291cmNlUm9vdCB8fCBwYXRoLmpvaW4ocHJvamVjdFJvb3QsICdzcmMnKTtcbiAgY29uc3QgcmVzb2x2ZWRTb3VyY2VSb290ID0gcGF0aC5yZXNvbHZlKHdvcmtzcGFjZVJvb3QsIHNvdXJjZVJvb3QpO1xuXG4gIHJldHVybiBhc3NldFBhdHRlcm5zLm1hcCgoYXNzZXRQYXR0ZXJuKSA9PiB7XG4gICAgLy8gTm9ybWFsaXplIHN0cmluZyBhc3NldCBwYXR0ZXJucyB0byBvYmplY3RzLlxuICAgIGlmICh0eXBlb2YgYXNzZXRQYXR0ZXJuID09PSAnc3RyaW5nJykge1xuICAgICAgY29uc3QgYXNzZXRQYXRoID0gcGF0aC5ub3JtYWxpemUoYXNzZXRQYXR0ZXJuKTtcbiAgICAgIGNvbnN0IHJlc29sdmVkQXNzZXRQYXRoID0gcGF0aC5yZXNvbHZlKHdvcmtzcGFjZVJvb3QsIGFzc2V0UGF0aCk7XG5cbiAgICAgIC8vIENoZWNrIGlmIHRoZSBzdHJpbmcgYXNzZXQgaXMgd2l0aGluIHNvdXJjZVJvb3QuXG4gICAgICBpZiAoIXJlc29sdmVkQXNzZXRQYXRoLnN0YXJ0c1dpdGgocmVzb2x2ZWRTb3VyY2VSb290KSkge1xuICAgICAgICB0aHJvdyBuZXcgTWlzc2luZ0Fzc2V0U291cmNlUm9vdEV4Y2VwdGlvbihhc3NldFBhdHRlcm4pO1xuICAgICAgfVxuXG4gICAgICBsZXQgZ2xvYjogc3RyaW5nLCBpbnB1dDogc3RyaW5nO1xuICAgICAgbGV0IGlzRGlyZWN0b3J5ID0gZmFsc2U7XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGlzRGlyZWN0b3J5ID0gc3RhdFN5bmMocmVzb2x2ZWRBc3NldFBhdGgpLmlzRGlyZWN0b3J5KCk7XG4gICAgICB9IGNhdGNoIHtcbiAgICAgICAgaXNEaXJlY3RvcnkgPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAoaXNEaXJlY3RvcnkpIHtcbiAgICAgICAgLy8gRm9sZGVycyBnZXQgYSByZWN1cnNpdmUgc3RhciBnbG9iLlxuICAgICAgICBnbG9iID0gJyoqLyonO1xuICAgICAgICAvLyBJbnB1dCBkaXJlY3RvcnkgaXMgdGhlaXIgb3JpZ2luYWwgcGF0aC5cbiAgICAgICAgaW5wdXQgPSBhc3NldFBhdGg7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBGaWxlcyBhcmUgdGhlaXIgb3duIGdsb2IuXG4gICAgICAgIGdsb2IgPSBwYXRoLmJhc2VuYW1lKGFzc2V0UGF0aCk7XG4gICAgICAgIC8vIElucHV0IGRpcmVjdG9yeSBpcyB0aGVpciBvcmlnaW5hbCBkaXJuYW1lLlxuICAgICAgICBpbnB1dCA9IHBhdGguZGlybmFtZShhc3NldFBhdGgpO1xuICAgICAgfVxuXG4gICAgICAvLyBPdXRwdXQgZGlyZWN0b3J5IGZvciBib3RoIGlzIHRoZSByZWxhdGl2ZSBwYXRoIGZyb20gc291cmNlIHJvb3QgdG8gaW5wdXQuXG4gICAgICBjb25zdCBvdXRwdXQgPSBwYXRoLnJlbGF0aXZlKHJlc29sdmVkU291cmNlUm9vdCwgcGF0aC5yZXNvbHZlKHdvcmtzcGFjZVJvb3QsIGlucHV0KSk7XG5cbiAgICAgIGFzc2V0UGF0dGVybiA9IHsgZ2xvYiwgaW5wdXQsIG91dHB1dCB9O1xuICAgIH0gZWxzZSB7XG4gICAgICBhc3NldFBhdHRlcm4ub3V0cHV0ID0gcGF0aC5qb2luKCcuJywgYXNzZXRQYXR0ZXJuLm91dHB1dCk7XG4gICAgfVxuXG4gICAgaWYgKGFzc2V0UGF0dGVybi5vdXRwdXQuc3RhcnRzV2l0aCgnLi4nKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdBbiBhc3NldCBjYW5ub3QgYmUgd3JpdHRlbiB0byBhIGxvY2F0aW9uIG91dHNpZGUgb2YgdGhlIG91dHB1dCBwYXRoLicpO1xuICAgIH1cblxuICAgIHJldHVybiBhc3NldFBhdHRlcm47XG4gIH0pO1xufVxuIl19