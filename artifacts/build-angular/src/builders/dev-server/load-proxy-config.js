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
exports.loadProxyConfiguration = void 0;
const node_fs_1 = require("node:fs");
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
const node_url_1 = require("node:url");
const error_1 = require("../../utils/error");
const load_esm_1 = require("../../utils/load-esm");
async function loadProxyConfiguration(root, proxyConfig) {
    if (!proxyConfig) {
        return undefined;
    }
    const proxyPath = (0, node_path_1.resolve)(root, proxyConfig);
    if (!(0, node_fs_1.existsSync)(proxyPath)) {
        throw new Error(`Proxy configuration file ${proxyPath} does not exist.`);
    }
    switch ((0, node_path_1.extname)(proxyPath)) {
        case '.json': {
            const content = await (0, promises_1.readFile)(proxyPath, 'utf-8');
            const { parse, printParseErrorCode } = await Promise.resolve().then(() => __importStar(require('jsonc-parser')));
            const parseErrors = [];
            const proxyConfiguration = parse(content, parseErrors, { allowTrailingComma: true });
            if (parseErrors.length > 0) {
                let errorMessage = `Proxy configuration file ${proxyPath} contains parse errors:`;
                for (const parseError of parseErrors) {
                    const { line, column } = getJsonErrorLineColumn(parseError.offset, content);
                    errorMessage += `\n[${line}, ${column}] ${printParseErrorCode(parseError.error)}`;
                }
                throw new Error(errorMessage);
            }
            return proxyConfiguration;
        }
        case '.mjs':
            // Load the ESM configuration file using the TypeScript dynamic import workaround.
            // Once TypeScript provides support for keeping the dynamic import this workaround can be
            // changed to a direct dynamic import.
            return (await (0, load_esm_1.loadEsmModule)((0, node_url_1.pathToFileURL)(proxyPath))).default;
        case '.cjs':
            return require(proxyPath);
        default:
            // The file could be either CommonJS or ESM.
            // CommonJS is tried first then ESM if loading fails.
            try {
                return require(proxyPath);
            }
            catch (e) {
                (0, error_1.assertIsError)(e);
                if (e.code === 'ERR_REQUIRE_ESM') {
                    // Load the ESM configuration file using the TypeScript dynamic import workaround.
                    // Once TypeScript provides support for keeping the dynamic import this workaround can be
                    // changed to a direct dynamic import.
                    return (await (0, load_esm_1.loadEsmModule)((0, node_url_1.pathToFileURL)(proxyPath))).default;
                }
                throw e;
            }
    }
}
exports.loadProxyConfiguration = loadProxyConfiguration;
/**
 * Calculates the line and column for an error offset in the content of a JSON file.
 * @param location The offset error location from the beginning of the content.
 * @param content The full content of the file containing the error.
 * @returns An object containing the line and column
 */
function getJsonErrorLineColumn(offset, content) {
    if (offset === 0) {
        return { line: 1, column: 1 };
    }
    let line = 0;
    let position = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
        ++line;
        const nextNewline = content.indexOf('\n', position);
        if (nextNewline === -1 || nextNewline > offset) {
            break;
        }
        position = nextNewline + 1;
    }
    return { line, column: offset - position + 1 };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9hZC1wcm94eS1jb25maWcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy9idWlsZGVycy9kZXYtc2VydmVyL2xvYWQtcHJveHktY29uZmlnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUgscUNBQXFDO0FBQ3JDLCtDQUE0QztBQUM1Qyx5Q0FBNkM7QUFDN0MsdUNBQXlDO0FBQ3pDLDZDQUFrRDtBQUNsRCxtREFBcUQ7QUFFOUMsS0FBSyxVQUFVLHNCQUFzQixDQUFDLElBQVksRUFBRSxXQUErQjtJQUN4RixJQUFJLENBQUMsV0FBVyxFQUFFO1FBQ2hCLE9BQU8sU0FBUyxDQUFDO0tBQ2xCO0lBRUQsTUFBTSxTQUFTLEdBQUcsSUFBQSxtQkFBTyxFQUFDLElBQUksRUFBRSxXQUFXLENBQUMsQ0FBQztJQUU3QyxJQUFJLENBQUMsSUFBQSxvQkFBVSxFQUFDLFNBQVMsQ0FBQyxFQUFFO1FBQzFCLE1BQU0sSUFBSSxLQUFLLENBQUMsNEJBQTRCLFNBQVMsa0JBQWtCLENBQUMsQ0FBQztLQUMxRTtJQUVELFFBQVEsSUFBQSxtQkFBTyxFQUFDLFNBQVMsQ0FBQyxFQUFFO1FBQzFCLEtBQUssT0FBTyxDQUFDLENBQUM7WUFDWixNQUFNLE9BQU8sR0FBRyxNQUFNLElBQUEsbUJBQVEsRUFBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFFbkQsTUFBTSxFQUFFLEtBQUssRUFBRSxtQkFBbUIsRUFBRSxHQUFHLHdEQUFhLGNBQWMsR0FBQyxDQUFDO1lBQ3BFLE1BQU0sV0FBVyxHQUF3QyxFQUFFLENBQUM7WUFDNUQsTUFBTSxrQkFBa0IsR0FBRyxLQUFLLENBQUMsT0FBTyxFQUFFLFdBQVcsRUFBRSxFQUFFLGtCQUFrQixFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7WUFFckYsSUFBSSxXQUFXLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtnQkFDMUIsSUFBSSxZQUFZLEdBQUcsNEJBQTRCLFNBQVMseUJBQXlCLENBQUM7Z0JBQ2xGLEtBQUssTUFBTSxVQUFVLElBQUksV0FBVyxFQUFFO29CQUNwQyxNQUFNLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxHQUFHLHNCQUFzQixDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7b0JBQzVFLFlBQVksSUFBSSxNQUFNLElBQUksS0FBSyxNQUFNLEtBQUssbUJBQW1CLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7aUJBQ25GO2dCQUNELE1BQU0sSUFBSSxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUM7YUFDL0I7WUFFRCxPQUFPLGtCQUFrQixDQUFDO1NBQzNCO1FBQ0QsS0FBSyxNQUFNO1lBQ1Qsa0ZBQWtGO1lBQ2xGLHlGQUF5RjtZQUN6RixzQ0FBc0M7WUFDdEMsT0FBTyxDQUFDLE1BQU0sSUFBQSx3QkFBYSxFQUF1QixJQUFBLHdCQUFhLEVBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQztRQUN2RixLQUFLLE1BQU07WUFDVCxPQUFPLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUM1QjtZQUNFLDRDQUE0QztZQUM1QyxxREFBcUQ7WUFDckQsSUFBSTtnQkFDRixPQUFPLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQzthQUMzQjtZQUFDLE9BQU8sQ0FBQyxFQUFFO2dCQUNWLElBQUEscUJBQWEsRUFBQyxDQUFDLENBQUMsQ0FBQztnQkFDakIsSUFBSSxDQUFDLENBQUMsSUFBSSxLQUFLLGlCQUFpQixFQUFFO29CQUNoQyxrRkFBa0Y7b0JBQ2xGLHlGQUF5RjtvQkFDekYsc0NBQXNDO29CQUN0QyxPQUFPLENBQUMsTUFBTSxJQUFBLHdCQUFhLEVBQXVCLElBQUEsd0JBQWEsRUFBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDO2lCQUN0RjtnQkFFRCxNQUFNLENBQUMsQ0FBQzthQUNUO0tBQ0o7QUFDSCxDQUFDO0FBdERELHdEQXNEQztBQUVEOzs7OztHQUtHO0FBQ0gsU0FBUyxzQkFBc0IsQ0FBQyxNQUFjLEVBQUUsT0FBZTtJQUM3RCxJQUFJLE1BQU0sS0FBSyxDQUFDLEVBQUU7UUFDaEIsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDO0tBQy9CO0lBRUQsSUFBSSxJQUFJLEdBQUcsQ0FBQyxDQUFDO0lBQ2IsSUFBSSxRQUFRLEdBQUcsQ0FBQyxDQUFDO0lBQ2pCLGlEQUFpRDtJQUNqRCxPQUFPLElBQUksRUFBRTtRQUNYLEVBQUUsSUFBSSxDQUFDO1FBRVAsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDcEQsSUFBSSxXQUFXLEtBQUssQ0FBQyxDQUFDLElBQUksV0FBVyxHQUFHLE1BQU0sRUFBRTtZQUM5QyxNQUFNO1NBQ1A7UUFFRCxRQUFRLEdBQUcsV0FBVyxHQUFHLENBQUMsQ0FBQztLQUM1QjtJQUVELE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLE1BQU0sR0FBRyxRQUFRLEdBQUcsQ0FBQyxFQUFFLENBQUM7QUFDakQsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBleGlzdHNTeW5jIH0gZnJvbSAnbm9kZTpmcyc7XG5pbXBvcnQgeyByZWFkRmlsZSB9IGZyb20gJ25vZGU6ZnMvcHJvbWlzZXMnO1xuaW1wb3J0IHsgZXh0bmFtZSwgcmVzb2x2ZSB9IGZyb20gJ25vZGU6cGF0aCc7XG5pbXBvcnQgeyBwYXRoVG9GaWxlVVJMIH0gZnJvbSAnbm9kZTp1cmwnO1xuaW1wb3J0IHsgYXNzZXJ0SXNFcnJvciB9IGZyb20gJy4uLy4uL3V0aWxzL2Vycm9yJztcbmltcG9ydCB7IGxvYWRFc21Nb2R1bGUgfSBmcm9tICcuLi8uLi91dGlscy9sb2FkLWVzbSc7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBsb2FkUHJveHlDb25maWd1cmF0aW9uKHJvb3Q6IHN0cmluZywgcHJveHlDb25maWc6IHN0cmluZyB8IHVuZGVmaW5lZCkge1xuICBpZiAoIXByb3h5Q29uZmlnKSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIGNvbnN0IHByb3h5UGF0aCA9IHJlc29sdmUocm9vdCwgcHJveHlDb25maWcpO1xuXG4gIGlmICghZXhpc3RzU3luYyhwcm94eVBhdGgpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBQcm94eSBjb25maWd1cmF0aW9uIGZpbGUgJHtwcm94eVBhdGh9IGRvZXMgbm90IGV4aXN0LmApO1xuICB9XG5cbiAgc3dpdGNoIChleHRuYW1lKHByb3h5UGF0aCkpIHtcbiAgICBjYXNlICcuanNvbic6IHtcbiAgICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCByZWFkRmlsZShwcm94eVBhdGgsICd1dGYtOCcpO1xuXG4gICAgICBjb25zdCB7IHBhcnNlLCBwcmludFBhcnNlRXJyb3JDb2RlIH0gPSBhd2FpdCBpbXBvcnQoJ2pzb25jLXBhcnNlcicpO1xuICAgICAgY29uc3QgcGFyc2VFcnJvcnM6IGltcG9ydCgnanNvbmMtcGFyc2VyJykuUGFyc2VFcnJvcltdID0gW107XG4gICAgICBjb25zdCBwcm94eUNvbmZpZ3VyYXRpb24gPSBwYXJzZShjb250ZW50LCBwYXJzZUVycm9ycywgeyBhbGxvd1RyYWlsaW5nQ29tbWE6IHRydWUgfSk7XG5cbiAgICAgIGlmIChwYXJzZUVycm9ycy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGxldCBlcnJvck1lc3NhZ2UgPSBgUHJveHkgY29uZmlndXJhdGlvbiBmaWxlICR7cHJveHlQYXRofSBjb250YWlucyBwYXJzZSBlcnJvcnM6YDtcbiAgICAgICAgZm9yIChjb25zdCBwYXJzZUVycm9yIG9mIHBhcnNlRXJyb3JzKSB7XG4gICAgICAgICAgY29uc3QgeyBsaW5lLCBjb2x1bW4gfSA9IGdldEpzb25FcnJvckxpbmVDb2x1bW4ocGFyc2VFcnJvci5vZmZzZXQsIGNvbnRlbnQpO1xuICAgICAgICAgIGVycm9yTWVzc2FnZSArPSBgXFxuWyR7bGluZX0sICR7Y29sdW1ufV0gJHtwcmludFBhcnNlRXJyb3JDb2RlKHBhcnNlRXJyb3IuZXJyb3IpfWA7XG4gICAgICAgIH1cbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGVycm9yTWVzc2FnZSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBwcm94eUNvbmZpZ3VyYXRpb247XG4gICAgfVxuICAgIGNhc2UgJy5tanMnOlxuICAgICAgLy8gTG9hZCB0aGUgRVNNIGNvbmZpZ3VyYXRpb24gZmlsZSB1c2luZyB0aGUgVHlwZVNjcmlwdCBkeW5hbWljIGltcG9ydCB3b3JrYXJvdW5kLlxuICAgICAgLy8gT25jZSBUeXBlU2NyaXB0IHByb3ZpZGVzIHN1cHBvcnQgZm9yIGtlZXBpbmcgdGhlIGR5bmFtaWMgaW1wb3J0IHRoaXMgd29ya2Fyb3VuZCBjYW4gYmVcbiAgICAgIC8vIGNoYW5nZWQgdG8gYSBkaXJlY3QgZHluYW1pYyBpbXBvcnQuXG4gICAgICByZXR1cm4gKGF3YWl0IGxvYWRFc21Nb2R1bGU8eyBkZWZhdWx0OiB1bmtub3duIH0+KHBhdGhUb0ZpbGVVUkwocHJveHlQYXRoKSkpLmRlZmF1bHQ7XG4gICAgY2FzZSAnLmNqcyc6XG4gICAgICByZXR1cm4gcmVxdWlyZShwcm94eVBhdGgpO1xuICAgIGRlZmF1bHQ6XG4gICAgICAvLyBUaGUgZmlsZSBjb3VsZCBiZSBlaXRoZXIgQ29tbW9uSlMgb3IgRVNNLlxuICAgICAgLy8gQ29tbW9uSlMgaXMgdHJpZWQgZmlyc3QgdGhlbiBFU00gaWYgbG9hZGluZyBmYWlscy5cbiAgICAgIHRyeSB7XG4gICAgICAgIHJldHVybiByZXF1aXJlKHByb3h5UGF0aCk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGFzc2VydElzRXJyb3IoZSk7XG4gICAgICAgIGlmIChlLmNvZGUgPT09ICdFUlJfUkVRVUlSRV9FU00nKSB7XG4gICAgICAgICAgLy8gTG9hZCB0aGUgRVNNIGNvbmZpZ3VyYXRpb24gZmlsZSB1c2luZyB0aGUgVHlwZVNjcmlwdCBkeW5hbWljIGltcG9ydCB3b3JrYXJvdW5kLlxuICAgICAgICAgIC8vIE9uY2UgVHlwZVNjcmlwdCBwcm92aWRlcyBzdXBwb3J0IGZvciBrZWVwaW5nIHRoZSBkeW5hbWljIGltcG9ydCB0aGlzIHdvcmthcm91bmQgY2FuIGJlXG4gICAgICAgICAgLy8gY2hhbmdlZCB0byBhIGRpcmVjdCBkeW5hbWljIGltcG9ydC5cbiAgICAgICAgICByZXR1cm4gKGF3YWl0IGxvYWRFc21Nb2R1bGU8eyBkZWZhdWx0OiB1bmtub3duIH0+KHBhdGhUb0ZpbGVVUkwocHJveHlQYXRoKSkpLmRlZmF1bHQ7XG4gICAgICAgIH1cblxuICAgICAgICB0aHJvdyBlO1xuICAgICAgfVxuICB9XG59XG5cbi8qKlxuICogQ2FsY3VsYXRlcyB0aGUgbGluZSBhbmQgY29sdW1uIGZvciBhbiBlcnJvciBvZmZzZXQgaW4gdGhlIGNvbnRlbnQgb2YgYSBKU09OIGZpbGUuXG4gKiBAcGFyYW0gbG9jYXRpb24gVGhlIG9mZnNldCBlcnJvciBsb2NhdGlvbiBmcm9tIHRoZSBiZWdpbm5pbmcgb2YgdGhlIGNvbnRlbnQuXG4gKiBAcGFyYW0gY29udGVudCBUaGUgZnVsbCBjb250ZW50IG9mIHRoZSBmaWxlIGNvbnRhaW5pbmcgdGhlIGVycm9yLlxuICogQHJldHVybnMgQW4gb2JqZWN0IGNvbnRhaW5pbmcgdGhlIGxpbmUgYW5kIGNvbHVtblxuICovXG5mdW5jdGlvbiBnZXRKc29uRXJyb3JMaW5lQ29sdW1uKG9mZnNldDogbnVtYmVyLCBjb250ZW50OiBzdHJpbmcpIHtcbiAgaWYgKG9mZnNldCA9PT0gMCkge1xuICAgIHJldHVybiB7IGxpbmU6IDEsIGNvbHVtbjogMSB9O1xuICB9XG5cbiAgbGV0IGxpbmUgPSAwO1xuICBsZXQgcG9zaXRpb24gPSAwO1xuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc3RhbnQtY29uZGl0aW9uXG4gIHdoaWxlICh0cnVlKSB7XG4gICAgKytsaW5lO1xuXG4gICAgY29uc3QgbmV4dE5ld2xpbmUgPSBjb250ZW50LmluZGV4T2YoJ1xcbicsIHBvc2l0aW9uKTtcbiAgICBpZiAobmV4dE5ld2xpbmUgPT09IC0xIHx8IG5leHROZXdsaW5lID4gb2Zmc2V0KSB7XG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICBwb3NpdGlvbiA9IG5leHROZXdsaW5lICsgMTtcbiAgfVxuXG4gIHJldHVybiB7IGxpbmUsIGNvbHVtbjogb2Zmc2V0IC0gcG9zaXRpb24gKyAxIH07XG59XG4iXX0=