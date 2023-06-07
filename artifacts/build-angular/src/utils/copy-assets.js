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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.copyAssets = void 0;
const fs = __importStar(require("fs"));
const glob_1 = __importDefault(require("glob"));
const path = __importStar(require("path"));
const util_1 = require("util");
const globPromise = (0, util_1.promisify)(glob_1.default);
async function copyAssets(entries, basePaths, root, changed) {
    const defaultIgnore = ['.gitkeep', '**/.DS_Store', '**/Thumbs.db'];
    const outputFiles = [];
    for (const entry of entries) {
        const cwd = path.resolve(root, entry.input);
        const files = await globPromise(entry.glob, {
            cwd,
            dot: true,
            nodir: true,
            root: cwd,
            nomount: true,
            ignore: entry.ignore ? defaultIgnore.concat(entry.ignore) : defaultIgnore,
            follow: entry.followSymlinks,
        });
        const directoryExists = new Set();
        for (const file of files) {
            const src = path.join(cwd, file);
            if (changed && !changed.has(src)) {
                continue;
            }
            const filePath = entry.flatten ? path.basename(file) : file;
            outputFiles.push({ source: src, destination: path.join(entry.output, filePath) });
            for (const base of basePaths) {
                const dest = path.join(base, entry.output, filePath);
                const dir = path.dirname(dest);
                if (!directoryExists.has(dir)) {
                    if (!fs.existsSync(dir)) {
                        fs.mkdirSync(dir, { recursive: true });
                    }
                    directoryExists.add(dir);
                }
                fs.copyFileSync(src, dest, fs.constants.COPYFILE_FICLONE);
            }
        }
    }
    return outputFiles;
}
exports.copyAssets = copyAssets;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29weS1hc3NldHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy91dGlscy9jb3B5LWFzc2V0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVILHVDQUF5QjtBQUN6QixnREFBd0I7QUFDeEIsMkNBQTZCO0FBQzdCLCtCQUFpQztBQUVqQyxNQUFNLFdBQVcsR0FBRyxJQUFBLGdCQUFTLEVBQUMsY0FBSSxDQUFDLENBQUM7QUFFN0IsS0FBSyxVQUFVLFVBQVUsQ0FDOUIsT0FPRyxFQUNILFNBQTJCLEVBQzNCLElBQVksRUFDWixPQUFxQjtJQUVyQixNQUFNLGFBQWEsR0FBRyxDQUFDLFVBQVUsRUFBRSxjQUFjLEVBQUUsY0FBYyxDQUFDLENBQUM7SUFFbkUsTUFBTSxXQUFXLEdBQThDLEVBQUUsQ0FBQztJQUVsRSxLQUFLLE1BQU0sS0FBSyxJQUFJLE9BQU8sRUFBRTtRQUMzQixNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDNUMsTUFBTSxLQUFLLEdBQUcsTUFBTSxXQUFXLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRTtZQUMxQyxHQUFHO1lBQ0gsR0FBRyxFQUFFLElBQUk7WUFDVCxLQUFLLEVBQUUsSUFBSTtZQUNYLElBQUksRUFBRSxHQUFHO1lBQ1QsT0FBTyxFQUFFLElBQUk7WUFDYixNQUFNLEVBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLGFBQWE7WUFDekUsTUFBTSxFQUFFLEtBQUssQ0FBQyxjQUFjO1NBQzdCLENBQUMsQ0FBQztRQUVILE1BQU0sZUFBZSxHQUFHLElBQUksR0FBRyxFQUFVLENBQUM7UUFFMUMsS0FBSyxNQUFNLElBQUksSUFBSSxLQUFLLEVBQUU7WUFDeEIsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDakMsSUFBSSxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFO2dCQUNoQyxTQUFTO2FBQ1Y7WUFFRCxNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFFNUQsV0FBVyxDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsV0FBVyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUM7WUFFbEYsS0FBSyxNQUFNLElBQUksSUFBSSxTQUFTLEVBQUU7Z0JBQzVCLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUM7Z0JBQ3JELE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQy9CLElBQUksQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFO29CQUM3QixJQUFJLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsRUFBRTt3QkFDdkIsRUFBRSxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUUsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztxQkFDeEM7b0JBQ0QsZUFBZSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztpQkFDMUI7Z0JBQ0QsRUFBRSxDQUFDLFlBQVksQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQyxTQUFTLENBQUMsZ0JBQWdCLENBQUMsQ0FBQzthQUMzRDtTQUNGO0tBQ0Y7SUFFRCxPQUFPLFdBQVcsQ0FBQztBQUNyQixDQUFDO0FBeERELGdDQXdEQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcyc7XG5pbXBvcnQgZ2xvYiBmcm9tICdnbG9iJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBwcm9taXNpZnkgfSBmcm9tICd1dGlsJztcblxuY29uc3QgZ2xvYlByb21pc2UgPSBwcm9taXNpZnkoZ2xvYik7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjb3B5QXNzZXRzKFxuICBlbnRyaWVzOiB7XG4gICAgZ2xvYjogc3RyaW5nO1xuICAgIGlnbm9yZT86IHN0cmluZ1tdO1xuICAgIGlucHV0OiBzdHJpbmc7XG4gICAgb3V0cHV0OiBzdHJpbmc7XG4gICAgZmxhdHRlbj86IGJvb2xlYW47XG4gICAgZm9sbG93U3ltbGlua3M/OiBib29sZWFuO1xuICB9W10sXG4gIGJhc2VQYXRoczogSXRlcmFibGU8c3RyaW5nPixcbiAgcm9vdDogc3RyaW5nLFxuICBjaGFuZ2VkPzogU2V0PHN0cmluZz4sXG4pIHtcbiAgY29uc3QgZGVmYXVsdElnbm9yZSA9IFsnLmdpdGtlZXAnLCAnKiovLkRTX1N0b3JlJywgJyoqL1RodW1icy5kYiddO1xuXG4gIGNvbnN0IG91dHB1dEZpbGVzOiB7IHNvdXJjZTogc3RyaW5nOyBkZXN0aW5hdGlvbjogc3RyaW5nIH1bXSA9IFtdO1xuXG4gIGZvciAoY29uc3QgZW50cnkgb2YgZW50cmllcykge1xuICAgIGNvbnN0IGN3ZCA9IHBhdGgucmVzb2x2ZShyb290LCBlbnRyeS5pbnB1dCk7XG4gICAgY29uc3QgZmlsZXMgPSBhd2FpdCBnbG9iUHJvbWlzZShlbnRyeS5nbG9iLCB7XG4gICAgICBjd2QsXG4gICAgICBkb3Q6IHRydWUsXG4gICAgICBub2RpcjogdHJ1ZSxcbiAgICAgIHJvb3Q6IGN3ZCxcbiAgICAgIG5vbW91bnQ6IHRydWUsXG4gICAgICBpZ25vcmU6IGVudHJ5Lmlnbm9yZSA/IGRlZmF1bHRJZ25vcmUuY29uY2F0KGVudHJ5Lmlnbm9yZSkgOiBkZWZhdWx0SWdub3JlLFxuICAgICAgZm9sbG93OiBlbnRyeS5mb2xsb3dTeW1saW5rcyxcbiAgICB9KTtcblxuICAgIGNvbnN0IGRpcmVjdG9yeUV4aXN0cyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuXG4gICAgZm9yIChjb25zdCBmaWxlIG9mIGZpbGVzKSB7XG4gICAgICBjb25zdCBzcmMgPSBwYXRoLmpvaW4oY3dkLCBmaWxlKTtcbiAgICAgIGlmIChjaGFuZ2VkICYmICFjaGFuZ2VkLmhhcyhzcmMpKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBmaWxlUGF0aCA9IGVudHJ5LmZsYXR0ZW4gPyBwYXRoLmJhc2VuYW1lKGZpbGUpIDogZmlsZTtcblxuICAgICAgb3V0cHV0RmlsZXMucHVzaCh7IHNvdXJjZTogc3JjLCBkZXN0aW5hdGlvbjogcGF0aC5qb2luKGVudHJ5Lm91dHB1dCwgZmlsZVBhdGgpIH0pO1xuXG4gICAgICBmb3IgKGNvbnN0IGJhc2Ugb2YgYmFzZVBhdGhzKSB7XG4gICAgICAgIGNvbnN0IGRlc3QgPSBwYXRoLmpvaW4oYmFzZSwgZW50cnkub3V0cHV0LCBmaWxlUGF0aCk7XG4gICAgICAgIGNvbnN0IGRpciA9IHBhdGguZGlybmFtZShkZXN0KTtcbiAgICAgICAgaWYgKCFkaXJlY3RvcnlFeGlzdHMuaGFzKGRpcikpIHtcbiAgICAgICAgICBpZiAoIWZzLmV4aXN0c1N5bmMoZGlyKSkge1xuICAgICAgICAgICAgZnMubWtkaXJTeW5jKGRpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGRpcmVjdG9yeUV4aXN0cy5hZGQoZGlyKTtcbiAgICAgICAgfVxuICAgICAgICBmcy5jb3B5RmlsZVN5bmMoc3JjLCBkZXN0LCBmcy5jb25zdGFudHMuQ09QWUZJTEVfRklDTE9ORSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG91dHB1dEZpbGVzO1xufVxuIl19