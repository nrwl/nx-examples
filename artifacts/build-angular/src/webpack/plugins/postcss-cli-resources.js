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
exports.postcss = void 0;
const loader_utils_1 = require("loader-utils");
const path = __importStar(require("path"));
const url = __importStar(require("url"));
const error_1 = require("../../utils/error");
function wrapUrl(url) {
    let wrappedUrl;
    const hasSingleQuotes = url.indexOf("'") >= 0;
    if (hasSingleQuotes) {
        wrappedUrl = `"${url}"`;
    }
    else {
        wrappedUrl = `'${url}'`;
    }
    return `url(${wrappedUrl})`;
}
async function resolve(file, base, resolver) {
    try {
        return await resolver('./' + file, base);
    }
    catch {
        return resolver(file, base);
    }
}
exports.postcss = true;
function default_1(options) {
    if (!options) {
        throw new Error('No options were specified to "postcss-cli-resources".');
    }
    const { deployUrl = '', resourcesOutputPath = '', filename, loader, emitFile, extracted, } = options;
    const process = async (inputUrl, context, resourceCache) => {
        // If root-relative, absolute or protocol relative url, leave as is
        if (/^((?:\w+:)?\/\/|data:|chrome:|#)/.test(inputUrl)) {
            return inputUrl;
        }
        if (/^\//.test(inputUrl)) {
            return inputUrl;
        }
        // If starts with a caret, remove and return remainder
        // this supports bypassing asset processing
        if (inputUrl.startsWith('^')) {
            return inputUrl.slice(1);
        }
        const cacheKey = path.resolve(context, inputUrl);
        const cachedUrl = resourceCache.get(cacheKey);
        if (cachedUrl) {
            return cachedUrl;
        }
        if (inputUrl.startsWith('~')) {
            inputUrl = inputUrl.slice(1);
        }
        const { pathname, hash, search } = url.parse(inputUrl.replace(/\\/g, '/'));
        const resolver = (file, base) => new Promise((resolve, reject) => {
            loader.resolve(base, decodeURI(file), (err, result) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(result);
            });
        });
        const result = await resolve(pathname, context, resolver);
        return new Promise((resolve, reject) => {
            loader.fs.readFile(result, (err, content) => {
                if (err) {
                    reject(err);
                    return;
                }
                let outputPath = (0, loader_utils_1.interpolateName)({ resourcePath: result }, filename(result), {
                    content,
                    context: loader.context || loader.rootContext,
                }).replace(/\\|\//g, '-');
                if (resourcesOutputPath) {
                    outputPath = path.posix.join(resourcesOutputPath, outputPath);
                }
                loader.addDependency(result);
                if (emitFile) {
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    loader.emitFile(outputPath, content, undefined, { sourceFilename: result });
                }
                let outputUrl = outputPath.replace(/\\/g, '/');
                if (hash || search) {
                    outputUrl = url.format({ pathname: outputUrl, hash, search });
                }
                if (deployUrl && !extracted) {
                    outputUrl = url.resolve(deployUrl, outputUrl);
                }
                resourceCache.set(cacheKey, outputUrl);
                resolve(outputUrl);
            });
        });
    };
    const resourceCache = new Map();
    const processed = Symbol('postcss-cli-resources');
    return {
        postcssPlugin: 'postcss-cli-resources',
        async Declaration(decl) {
            if (!decl.value.includes('url') || processed in decl) {
                return;
            }
            const value = decl.value;
            const urlRegex = /url(?:\(\s*(['"]?))(.*?)(?:\1\s*\))/g;
            const segments = [];
            let match;
            let lastIndex = 0;
            let modified = false;
            // We want to load it relative to the file that imports
            const inputFile = decl.source && decl.source.input.file;
            const context = (inputFile && path.dirname(inputFile)) || loader.context;
            while ((match = urlRegex.exec(value))) {
                const originalUrl = match[2];
                let processedUrl;
                try {
                    processedUrl = await process(originalUrl, context, resourceCache);
                }
                catch (err) {
                    (0, error_1.assertIsError)(err);
                    loader.emitError(decl.error(err.message, { word: originalUrl }));
                    continue;
                }
                if (lastIndex < match.index) {
                    segments.push(value.slice(lastIndex, match.index));
                }
                if (!processedUrl || originalUrl === processedUrl) {
                    segments.push(match[0]);
                }
                else {
                    segments.push(wrapUrl(processedUrl));
                    modified = true;
                }
                lastIndex = match.index + match[0].length;
            }
            if (lastIndex < value.length) {
                segments.push(value.slice(lastIndex));
            }
            if (modified) {
                decl.value = segments.join('');
            }
            decl[processed] = true;
        },
    };
}
exports.default = default_1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9zdGNzcy1jbGktcmVzb3VyY2VzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvYnVpbGRfYW5ndWxhci9zcmMvd2VicGFjay9wbHVnaW5zL3Bvc3Rjc3MtY2xpLXJlc291cmNlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVILCtDQUErQztBQUMvQywyQ0FBNkI7QUFFN0IseUNBQTJCO0FBQzNCLDZDQUFrRDtBQUVsRCxTQUFTLE9BQU8sQ0FBQyxHQUFXO0lBQzFCLElBQUksVUFBVSxDQUFDO0lBQ2YsTUFBTSxlQUFlLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7SUFFOUMsSUFBSSxlQUFlLEVBQUU7UUFDbkIsVUFBVSxHQUFHLElBQUksR0FBRyxHQUFHLENBQUM7S0FDekI7U0FBTTtRQUNMLFVBQVUsR0FBRyxJQUFJLEdBQUcsR0FBRyxDQUFDO0tBQ3pCO0lBRUQsT0FBTyxPQUFPLFVBQVUsR0FBRyxDQUFDO0FBQzlCLENBQUM7QUFjRCxLQUFLLFVBQVUsT0FBTyxDQUNwQixJQUFZLEVBQ1osSUFBWSxFQUNaLFFBQXlEO0lBRXpELElBQUk7UUFDRixPQUFPLE1BQU0sUUFBUSxDQUFDLElBQUksR0FBRyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7S0FDMUM7SUFBQyxNQUFNO1FBQ04sT0FBTyxRQUFRLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0tBQzdCO0FBQ0gsQ0FBQztBQUVZLFFBQUEsT0FBTyxHQUFHLElBQUksQ0FBQztBQUU1QixtQkFBeUIsT0FBb0M7SUFDM0QsSUFBSSxDQUFDLE9BQU8sRUFBRTtRQUNaLE1BQU0sSUFBSSxLQUFLLENBQUMsdURBQXVELENBQUMsQ0FBQztLQUMxRTtJQUVELE1BQU0sRUFD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Q0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7aUJBQ3pCO3FCQUFNO29CQUNMLFFBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7b0JBQ3JDLFFBQVEsR0FBRyxJQUFJLENBQUM7aUJBQ2pCO2dCQUVELFNBQVMsR0FBRyxLQUFLLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUM7YUFDM0M7WUFFRCxJQUFJLFNBQVMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFO2dCQUM1QixRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQzthQUN2QztZQUVELElBQUksUUFBUSxFQUFFO2dCQUNaLElBQUksQ0FBQyxLQUFLLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQzthQUNoQztZQUVBLElBQStDLENBQUMsU0FBUyxDQUFDLEdBQUcsSUFBSSxDQUFDO1FBQ3JFLENBQUM7S0FDRixDQUFDO0FBQ0osQ0FBQztBQXZKRCw0QkF1SkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsgaW50ZXJwb2xhdGVOYW1lIH0gZnJvbSAnbG9hZGVyLXV0aWxzJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBEZWNsYXJhdGlvbiwgUGx1Z2luIH0gZnJvbSAncG9zdGNzcyc7XG5pbXBvcnQgKiBhcyB1cmwgZnJvbSAndXJsJztcbmltcG9ydCB7IGFzc2VydElzRXJyb3IgfSBmcm9tICcuLi8uLi91dGlscy9lcnJvcic7XG5cbmZ1bmN0aW9uIHdyYXBVcmwodXJsOiBzdHJpbmcpOiBzdHJpbmcge1xuICBsZXQgd3JhcHBlZFVybDtcbiAgY29uc3QgaGFzU2luZ2xlUXVvdGVzID0gdXJsLmluZGV4T2YoXCInXCIpID49IDA7XG5cbiAgaWYgKGhhc1NpbmdsZVF1b3Rlcykge1xuICAgIHdyYXBwZWRVcmwgPSBgXCIke3VybH1cImA7XG4gIH0gZWxzZSB7XG4gICAgd3JhcHBlZFVybCA9IGAnJHt1cmx9J2A7XG4gIH1cblxuICByZXR1cm4gYHVybCgke3dyYXBwZWRVcmx9KWA7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUG9zdGNzc0NsaVJlc291cmNlc09wdGlvbnMge1xuICBiYXNlSHJlZj86IHN0cmluZztcbiAgZGVwbG95VXJsPzogc3RyaW5nO1xuICByZXNvdXJjZXNPdXRwdXRQYXRoPzogc3RyaW5nO1xuICByZWJhc2VSb290UmVsYXRpdmU/OiBib29sZWFuO1xuICAvKiogQ1NTIGlzIGV4dHJhY3RlZCB0byBhIGAuY3NzYCBvciBpcyBlbWJlZGRlZCBpbiBhIGAuanNgIGZpbGUuICovXG4gIGV4dHJhY3RlZD86IGJvb2xlYW47XG4gIGZpbGVuYW1lOiAocmVzb3VyY2VQYXRoOiBzdHJpbmcpID0+IHN0cmluZztcbiAgbG9hZGVyOiBpbXBvcnQoJ3dlYnBhY2snKS5Mb2FkZXJDb250ZXh0PHVua25vd24+O1xuICBlbWl0RmlsZTogYm9vbGVhbjtcbn1cblxuYXN5bmMgZnVuY3Rpb24gcmVzb2x2ZShcbiAgZmlsZTogc3RyaW5nLFxuICBiYXNlOiBzdHJpbmcsXG4gIHJlc29sdmVyOiAoZmlsZTogc3RyaW5nLCBiYXNlOiBzdHJpbmcpID0+IFByb21pc2U8c3RyaW5nPixcbik6IFByb21pc2U8c3RyaW5nPiB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIGF3YWl0IHJlc29sdmVyKCcuLycgKyBmaWxlLCBiYXNlKTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIHJlc29sdmVyKGZpbGUsIGJhc2UpO1xuICB9XG59XG5cbmV4cG9ydCBjb25zdCBwb3N0Y3NzID0gdHJ1ZTtcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gKG9wdGlvbnM/OiBQb3N0Y3NzQ2xpUmVzb3VyY2VzT3B0aW9ucyk6IFBsdWdpbiB7XG4gIGlmICghb3B0aW9ucykge1xuICAgIHRocm93IG5ldyBFcnJvcignTm8gb3B0aW9ucyB3ZXJlIHNwZWNpZmllZCB0byBcInBvc3Rjc3MtY2xpLXJlc291cmNlc1wiLicpO1xuICB9XG5cbiAgY29uc3Qge1xuICAgIGRlcGxveVVybCA9ICcnLFxuICAgIHJlc291cmNlc091dHB1dFBhdGggPSAnJyxcbiAgICBmaWxlbmFtZSxcbiAgICBsb2FkZXIsXG4gICAgZW1pdEZpbGUsXG4gICAgZXh0cmFjdGVkLFxuICB9ID0gb3B0aW9ucztcblxuICBjb25zdCBwcm9jZXNzID0gYXN5bmMgKGlucHV0VXJsOiBzdHJpbmcsIGNvbnRleHQ6IHN0cmluZywgcmVzb3VyY2VDYWNoZTogTWFwPHN0cmluZywgc3RyaW5nPikgPT4ge1xuICAgIC8vIElmIHJvb3QtcmVsYXRpdmUsIGFic29sdXRlIG9yIHByb3RvY29sIHJlbGF0aXZlIHVybCwgbGVhdmUgYXMgaXNcbiAgICBpZiAoL14oKD86XFx3KzopP1xcL1xcL3xkYXRhOnxjaHJvbWU6fCMpLy50ZXN0KGlucHV0VXJsKSkge1xuICAgICAgcmV0dXJuIGlucHV0VXJsO1xuICAgIH1cblxuICAgIGlmICgvXlxcLy8udGVzdChpbnB1dFVybCkpIHtcbiAgICAgIHJldHVybiBpbnB1dFVybDtcbiAgICB9XG5cbiAgICAvLyBJZiBzdGFydHMgd2l0aCBhIGNhcmV0LCByZW1vdmUgYW5kIHJldHVybiByZW1haW5kZXJcbiAgICAvLyB0aGlzIHN1cHBvcnRzIGJ5cGFzc2luZyBhc3NldCBwcm9jZXNzaW5nXG4gICAgaWYgKGlucHV0VXJsLnN0YXJ0c1dpdGgoJ14nKSkge1xuICAgICAgcmV0dXJuIGlucHV0VXJsLnNsaWNlKDEpO1xuICAgIH1cblxuICAgIGNvbnN0IGNhY2hlS2V5ID0gcGF0aC5yZXNvbHZlKGNvbnRleHQsIGlucHV0VXJsKTtcbiAgICBjb25zdCBjYWNoZWRVcmwgPSByZXNvdXJjZUNhY2hlLmdldChjYWNoZUtleSk7XG4gICAgaWYgKGNhY2hlZFVybCkge1xuICAgICAgcmV0dXJuIGNhY2hlZFVybDtcbiAgICB9XG5cbiAgICBpZiAoaW5wdXRVcmwuc3RhcnRzV2l0aCgnficpKSB7XG4gICAgICBpbnB1dFVybCA9IGlucHV0VXJsLnNsaWNlKDEpO1xuICAgIH1cblxuICAgIGNvbnN0IHsgcGF0aG5hbWUsIGhhc2gsIHNlYXJjaCB9ID0gdXJsLnBhcnNlKGlucHV0VXJsLnJlcGxhY2UoL1xcXFwvZywgJy8nKSk7XG4gICAgY29uc3QgcmVzb2x2ZXIgPSAoZmlsZTogc3RyaW5nLCBiYXNlOiBzdHJpbmcpID0+XG4gICAgICBuZXcgUHJvbWlzZTxzdHJpbmc+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgbG9hZGVyLnJlc29sdmUoYmFzZSwgZGVjb2RlVVJJKGZpbGUpLCAoZXJyLCByZXN1bHQpID0+IHtcbiAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICByZWplY3QoZXJyKTtcblxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXNvbHZlKHJlc3VsdCBhcyBzdHJpbmcpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVzb2x2ZShwYXRobmFtZSBhcyBzdHJpbmcsIGNvbnRleHQsIHJlc29sdmVyKTtcblxuICAgIHJldHVybiBuZXcgUHJvbWlzZTxzdHJpbmc+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGxvYWRlci5mcy5yZWFkRmlsZShyZXN1bHQsIChlcnIsIGNvbnRlbnQpID0+IHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIHJlamVjdChlcnIpO1xuXG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IG91dHB1dFBhdGggPSBpbnRlcnBvbGF0ZU5hbWUoeyByZXNvdXJjZVBhdGg6IHJlc3VsdCB9LCBmaWxlbmFtZShyZXN1bHQpLCB7XG4gICAgICAgICAgY29udGVudCxcbiAgICAgICAgICBjb250ZXh0OiBsb2FkZXIuY29udGV4dCB8fCBsb2FkZXIucm9vdENvbnRleHQsXG4gICAgICAgIH0pLnJlcGxhY2UoL1xcXFx8XFwvL2csICctJyk7XG5cbiAgICAgICAgaWYgKHJlc291cmNlc091dHB1dFBhdGgpIHtcbiAgICAgICAgICBvdXRwdXRQYXRoID0gcGF0aC5wb3NpeC5qb2luKHJlc291cmNlc091dHB1dFBhdGgsIG91dHB1dFBhdGgpO1xuICAgICAgICB9XG5cbiAgICAgICAgbG9hZGVyLmFkZERlcGVuZGVuY3kocmVzdWx0KTtcbiAgICAgICAgaWYgKGVtaXRGaWxlKSB7XG4gICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1ub24tbnVsbC1hc3NlcnRpb25cbiAgICAgICAgICBsb2FkZXIuZW1pdEZpbGUob3V0cHV0UGF0aCwgY29udGVudCEsIHVuZGVmaW5lZCwgeyBzb3VyY2VGaWxlbmFtZTogcmVzdWx0IH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IG91dHB1dFVybCA9IG91dHB1dFBhdGgucmVwbGFjZSgvXFxcXC9nLCAnLycpO1xuICAgICAgICBpZiAoaGFzaCB8fCBzZWFyY2gpIHtcbiAgICAgICAgICBvdXRwdXRVcmwgPSB1cmwuZm9ybWF0KHsgcGF0aG5hbWU6IG91dHB1dFVybCwgaGFzaCwgc2VhcmNoIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRlcGxveVVybCAmJiAhZXh0cmFjdGVkKSB7XG4gICAgICAgICAgb3V0cHV0VXJsID0gdXJsLnJlc29sdmUoZGVwbG95VXJsLCBvdXRwdXRVcmwpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVzb3VyY2VDYWNoZS5zZXQoY2FjaGVLZXksIG91dHB1dFVybCk7XG4gICAgICAgIHJlc29sdmUob3V0cHV0VXJsKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9O1xuXG4gIGNvbnN0IHJlc291cmNlQ2FjaGUgPSBuZXcgTWFwPHN0cmluZywgc3RyaW5nPigpO1xuICBjb25zdCBwcm9jZXNzZWQgPSBTeW1ib2woJ3Bvc3Rjc3MtY2xpLXJlc291cmNlcycpO1xuXG4gIHJldHVybiB7XG4gICAgcG9zdGNzc1BsdWdpbjogJ3Bvc3Rjc3MtY2xpLXJlc291cmNlcycsXG4gICAgYXN5bmMgRGVjbGFyYXRpb24oZGVjbCkge1xuICAgICAgaWYgKCFkZWNsLnZhbHVlLmluY2x1ZGVzKCd1cmwnKSB8fCBwcm9jZXNzZWQgaW4gZGVjbCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHZhbHVlID0gZGVjbC52YWx1ZTtcbiAgICAgIGNvbnN0IHVybFJlZ2V4ID0gL3VybCg/OlxcKFxccyooWydcIl0/KSkoLio/KSg/OlxcMVxccypcXCkpL2c7XG4gICAgICBjb25zdCBzZWdtZW50czogc3RyaW5nW10gPSBbXTtcblxuICAgICAgbGV0IG1hdGNoO1xuICAgICAgbGV0IGxhc3RJbmRleCA9IDA7XG4gICAgICBsZXQgbW9kaWZpZWQgPSBmYWxzZTtcblxuICAgICAgLy8gV2Ugd2FudCB0byBsb2FkIGl0IHJlbGF0aXZlIHRvIHRoZSBmaWxlIHRoYXQgaW1wb3J0c1xuICAgICAgY29uc3QgaW5wdXRGaWxlID0gZGVjbC5zb3VyY2UgJiYgZGVjbC5zb3VyY2UuaW5wdXQuZmlsZTtcbiAgICAgIGNvbnN0IGNvbnRleHQgPSAoaW5wdXRGaWxlICYmIHBhdGguZGlybmFtZShpbnB1dEZpbGUpKSB8fCBsb2FkZXIuY29udGV4dDtcblxuICAgICAgd2hpbGUgKChtYXRjaCA9IHVybFJlZ2V4LmV4ZWModmFsdWUpKSkge1xuICAgICAgICBjb25zdCBvcmlnaW5hbFVybCA9IG1hdGNoWzJdO1xuICAgICAgICBsZXQgcHJvY2Vzc2VkVXJsO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIHByb2Nlc3NlZFVybCA9IGF3YWl0IHByb2Nlc3Mob3JpZ2luYWxVcmwsIGNvbnRleHQsIHJlc291cmNlQ2FjaGUpO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICBhc3NlcnRJc0Vycm9yKGVycik7XG4gICAgICAgICAgbG9hZGVyLmVtaXRFcnJvcihkZWNsLmVycm9yKGVyci5tZXNzYWdlLCB7IHdvcmQ6IG9yaWdpbmFsVXJsIH0pKTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChsYXN0SW5kZXggPCBtYXRjaC5pbmRleCkge1xuICAgICAgICAgIHNlZ21lbnRzLnB1c2godmFsdWUuc2xpY2UobGFzdEluZGV4LCBtYXRjaC5pbmRleCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFwcm9jZXNzZWRVcmwgfHwgb3JpZ2luYWxVcmwgPT09IHByb2Nlc3NlZFVybCkge1xuICAgICAgICAgIHNlZ21lbnRzLnB1c2gobWF0Y2hbMF0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNlZ21lbnRzLnB1c2god3JhcFVybChwcm9jZXNzZWRVcmwpKTtcbiAgICAgICAgICBtb2RpZmllZCA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBsYXN0SW5kZXggPSBtYXRjaC5pbmRleCArIG1hdGNoWzBdLmxlbmd0aDtcbiAgICAgIH1cblxuICAgICAgaWYgKGxhc3RJbmRleCA8IHZhbHVlLmxlbmd0aCkge1xuICAgICAgICBzZWdtZW50cy5wdXNoKHZhbHVlLnNsaWNlKGxhc3RJbmRleCkpO1xuICAgICAgfVxuXG4gICAgICBpZiAobW9kaWZpZWQpIHtcbiAgICAgICAgZGVjbC52YWx1ZSA9IHNlZ21lbnRzLmpvaW4oJycpO1xuICAgICAgfVxuXG4gICAgICAoZGVjbCBhcyBEZWNsYXJhdGlvbiAmIHsgW3Byb2Nlc3NlZF06IGJvb2xlYW4gfSlbcHJvY2Vzc2VkXSA9IHRydWU7XG4gICAgfSxcbiAgfTtcbn1cbiJdfQ==