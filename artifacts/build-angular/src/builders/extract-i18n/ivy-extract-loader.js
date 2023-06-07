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
const nodePath = __importStar(require("path"));
const load_esm_1 = require("../../utils/load-esm");
function localizeExtractLoader(content, map) {
    // This loader is not cacheable due to how message extraction works.
    // Extracted messages are not part of webpack pipeline and hence they cannot be retrieved from cache.
    // TODO: We should investigate in the future on making this deterministic and more cacheable.
    this.cacheable(false);
    const options = this.getOptions();
    const callback = this.async();
    extract(this, content, map, options).then(() => {
        // Pass through the original content now that messages have been extracted
        callback(undefined, content, map);
    }, (error) => {
        callback(error);
    });
}
exports.default = localizeExtractLoader;
async function extract(loaderContext, content, map, options) {
    // Try to load the `@angular/localize` message extractor.
    // All the localize usages are setup to first try the ESM entry point then fallback to the deep imports.
    // This provides interim compatibility while the framework is transitioned to bundled ESM packages.
    let MessageExtractor;
    try {
        // Load ESM `@angular/localize/tools` using the TypeScript dynamic import workaround.
        // Once TypeScript provides support for keeping the dynamic import this workaround can be
        // changed to a direct dynamic import.
        const localizeToolsModule = await (0, load_esm_1.loadEsmModule)('@angular/localize/tools');
        MessageExtractor = localizeToolsModule.MessageExtractor;
    }
    catch {
        throw new Error(`Unable to load message extractor. Please ensure '@angular/localize' is installed.`);
    }
    // Setup a Webpack-based logger instance
    const logger = {
        // level 2 is warnings
        level: 2,
        debug(...args) {
            // eslint-disable-next-line no-console
            console.debug(...args);
        },
        info(...args) {
            loaderContext.emitWarning(new Error(args.join('')));
        },
        warn(...args) {
            loaderContext.emitWarning(new Error(args.join('')));
        },
        error(...args) {
            loaderContext.emitError(new Error(args.join('')));
        },
    };
    let filename = loaderContext.resourcePath;
    const mapObject = typeof map === 'string' ? JSON.parse(map) : map;
    if (mapObject?.file) {
        // The extractor's internal sourcemap handling expects the filenames to match
        filename = nodePath.join(loaderContext.context, mapObject.file);
    }
    // Setup a virtual file system instance for the extractor
    // * MessageExtractor itself uses readFile, relative and resolve
    // * Internal SourceFileLoader (sourcemap support) uses dirname, exists, readFile, and resolve
    const filesystem = {
        readFile(path) {
            if (path === filename) {
                return content;
            }
            else if (path === filename + '.map') {
                return typeof map === 'string' ? map : JSON.stringify(map);
            }
            else {
                throw new Error('Unknown file requested: ' + path);
            }
        },
        relative(from, to) {
            return nodePath.relative(from, to);
        },
        resolve(...paths) {
            return nodePath.resolve(...paths);
        },
        exists(path) {
            return path === filename || path === filename + '.map';
        },
        dirname(path) {
            return nodePath.dirname(path);
        },
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const extractor = new MessageExtractor(filesystem, logger, {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        basePath: loaderContext.rootContext,
        useSourceMaps: !!map,
    });
    const messages = extractor.extractMessages(filename);
    if (messages.length > 0) {
        options?.messageHandler(messages);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXZ5LWV4dHJhY3QtbG9hZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvYnVpbGRfYW5ndWxhci9zcmMvYnVpbGRlcnMvZXh0cmFjdC1pMThuL2l2eS1leHRyYWN0LWxvYWRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUgsK0NBQWlDO0FBQ2pDLG1EQUFxRDtBQVNyRCxTQUF3QixxQkFBcUIsQ0FFM0MsT0FBZSxFQUNmLEdBQW9CO0lBRXBCLG9FQUFvRTtJQUNwRSxxR0FBcUc7SUFDckcsNkZBQTZGO0lBQzdGLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7SUFFdEIsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO0lBQ2xDLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUU5QixPQUFPLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUN2QyxHQUFHLEVBQUU7UUFDSCwwRUFBMEU7UUFDMUUsUUFBUSxDQUFDLFNBQVMsRUFBRSxPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDcEMsQ0FBQyxFQUNELENBQUMsS0FBSyxFQUFFLEVBQUU7UUFDUixRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDbEIsQ0FBQyxDQUNGLENBQUM7QUFDSixDQUFDO0FBdEJELHdDQXNCQztBQUVELEtBQUssVUFBVSxPQUFPLENBQ3BCLGFBQTRFLEVBQzVFLE9BQWUsRUFDZixHQUF5QyxFQUN6QyxPQUFxQztJQUVyQyx5REFBeUQ7SUFDekQsd0dBQXdHO0lBQ3hHLG1HQUFtRztJQUNuRyxJQUFJLGdCQUFnQixDQUFDO0lBQ3JCLElBQUk7UUFDRixxRkFBcUY7UUFDckYs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RUFBRTtRQUNoRSw4REFBOEQ7UUFDOUQsUUFBUSxFQUFFLGFBQWEsQ0FBQyxXQUFrQjtRQUMxQyxhQUFhLEVBQUUsQ0FBQyxDQUFDLEdBQUc7S0FDckIsQ0FBQyxDQUFDO0lBRUgsTUFBTSxRQUFRLEdBQUcsU0FBUyxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUNyRCxJQUFJLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO1FBQ3ZCLE9BQU8sRUFBRSxjQUFjLENBQUMsUUFBUSxDQUFDLENBQUM7S0FDbkM7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAqIGFzIG5vZGVQYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgbG9hZEVzbU1vZHVsZSB9IGZyb20gJy4uLy4uL3V0aWxzL2xvYWQtZXNtJztcblxuLy8gRXh0cmFjdCBsb2FkZXIgc291cmNlIG1hcCBwYXJhbWV0ZXIgdHlwZSBzaW5jZSBpdCBpcyBub3QgZXhwb3J0ZWQgZGlyZWN0bHlcbnR5cGUgTG9hZGVyU291cmNlTWFwID0gUGFyYW1ldGVyczxpbXBvcnQoJ3dlYnBhY2snKS5Mb2FkZXJEZWZpbml0aW9uRnVuY3Rpb24+WzFdO1xuXG5pbnRlcmZhY2UgTG9jYWxpemVFeHRyYWN0TG9hZGVyT3B0aW9ucyB7XG4gIG1lc3NhZ2VIYW5kbGVyOiAobWVzc2FnZXM6IGltcG9ydCgnQGFuZ3VsYXIvbG9jYWxpemUnKS7JtVBhcnNlZE1lc3NhZ2VbXSkgPT4gdm9pZDtcbn1cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gbG9jYWxpemVFeHRyYWN0TG9hZGVyKFxuICB0aGlzOiBpbXBvcnQoJ3dlYnBhY2snKS5Mb2FkZXJDb250ZXh0PExvY2FsaXplRXh0cmFjdExvYWRlck9wdGlvbnM+LFxuICBjb250ZW50OiBzdHJpbmcsXG4gIG1hcDogTG9hZGVyU291cmNlTWFwLFxuKSB7XG4gIC8vIFRoaXMgbG9hZGVyIGlzIG5vdCBjYWNoZWFibGUgZHVlIHRvIGhvdyBtZXNzYWdlIGV4dHJhY3Rpb24gd29ya3MuXG4gIC8vIEV4dHJhY3RlZCBtZXNzYWdlcyBhcmUgbm90IHBhcnQgb2Ygd2VicGFjayBwaXBlbGluZSBhbmQgaGVuY2UgdGhleSBjYW5ub3QgYmUgcmV0cmlldmVkIGZyb20gY2FjaGUuXG4gIC8vIFRPRE86IFdlIHNob3VsZCBpbnZlc3RpZ2F0ZSBpbiB0aGUgZnV0dXJlIG9uIG1ha2luZyB0aGlzIGRldGVybWluaXN0aWMgYW5kIG1vcmUgY2FjaGVhYmxlLlxuICB0aGlzLmNhY2hlYWJsZShmYWxzZSk7XG5cbiAgY29uc3Qgb3B0aW9ucyA9IHRoaXMuZ2V0T3B0aW9ucygpO1xuICBjb25zdCBjYWxsYmFjayA9IHRoaXMuYXN5bmMoKTtcblxuICBleHRyYWN0KHRoaXMsIGNvbnRlbnQsIG1hcCwgb3B0aW9ucykudGhlbihcbiAgICAoKSA9PiB7XG4gICAgICAvLyBQYXNzIHRocm91Z2ggdGhlIG9yaWdpbmFsIGNvbnRlbnQgbm93IHRoYXQgbWVzc2FnZXMgaGF2ZSBiZWVuIGV4dHJhY3RlZFxuICAgICAgY2FsbGJhY2sodW5kZWZpbmVkLCBjb250ZW50LCBtYXApO1xuICAgIH0sXG4gICAgKGVycm9yKSA9PiB7XG4gICAgICBjYWxsYmFjayhlcnJvcik7XG4gICAgfSxcbiAgKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZXh0cmFjdChcbiAgbG9hZGVyQ29udGV4dDogaW1wb3J0KCd3ZWJwYWNrJykuTG9hZGVyQ29udGV4dDxMb2NhbGl6ZUV4dHJhY3RMb2FkZXJPcHRpb25zPixcbiAgY29udGVudDogc3RyaW5nLFxuICBtYXA6IHN0cmluZyB8IExvYWRlclNvdXJjZU1hcCB8IHVuZGVmaW5lZCxcbiAgb3B0aW9uczogTG9jYWxpemVFeHRyYWN0TG9hZGVyT3B0aW9ucyxcbikge1xuICAvLyBUcnkgdG8gbG9hZCB0aGUgYEBhbmd1bGFyL2xvY2FsaXplYCBtZXNzYWdlIGV4dHJhY3Rvci5cbiAgLy8gQWxsIHRoZSBsb2NhbGl6ZSB1c2FnZXMgYXJlIHNldHVwIHRvIGZpcnN0IHRyeSB0aGUgRVNNIGVudHJ5IHBvaW50IHRoZW4gZmFsbGJhY2sgdG8gdGhlIGRlZXAgaW1wb3J0cy5cbiAgLy8gVGhpcyBwcm92aWRlcyBpbnRlcmltIGNvbXBhdGliaWxpdHkgd2hpbGUgdGhlIGZyYW1ld29yayBpcyB0cmFuc2l0aW9uZWQgdG8gYnVuZGxlZCBFU00gcGFja2FnZXMuXG4gIGxldCBNZXNzYWdlRXh0cmFjdG9yO1xuICB0cnkge1xuICAgIC8vIExvYWQgRVNNIGBAYW5ndWxhci9sb2NhbGl6ZS90b29sc2AgdXNpbmcgdGhlIFR5cGVTY3JpcHQgZHluYW1pYyBpbXBvcnQgd29ya2Fyb3VuZC5cbiAgICAvLyBPbmNlIFR5cGVTY3JpcHQgcHJvdmlkZXMgc3VwcG9ydCBmb3Iga2VlcGluZyB0aGUgZHluYW1pYyBpbXBvcnQgdGhpcyB3b3JrYXJvdW5kIGNhbiBiZVxuICAgIC8vIGNoYW5nZWQgdG8gYSBkaXJlY3QgZHluYW1pYyBpbXBvcnQuXG4gICAgY29uc3QgbG9jYWxpemVUb29sc01vZHVsZSA9IGF3YWl0IGxvYWRFc21Nb2R1bGU8dHlwZW9mIGltcG9ydCgnQGFuZ3VsYXIvbG9jYWxpemUvdG9vbHMnKT4oXG4gICAgICAnQGFuZ3VsYXIvbG9jYWxpemUvdG9vbHMnLFxuICAgICk7XG4gICAgTWVzc2FnZUV4dHJhY3RvciA9IGxvY2FsaXplVG9vbHNNb2R1bGUuTWVzc2FnZUV4dHJhY3RvcjtcbiAgfSBjYXRjaCB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgYFVuYWJsZSB0byBsb2FkIG1lc3NhZ2UgZXh0cmFjdG9yLiBQbGVhc2UgZW5zdXJlICdAYW5ndWxhci9sb2NhbGl6ZScgaXMgaW5zdGFsbGVkLmAsXG4gICAgKTtcbiAgfVxuXG4gIC8vIFNldHVwIGEgV2VicGFjay1iYXNlZCBsb2dnZXIgaW5zdGFuY2VcbiAgY29uc3QgbG9nZ2VyID0ge1xuICAgIC8vIGxldmVsIDIgaXMgd2FybmluZ3NcbiAgICBsZXZlbDogMixcbiAgICBkZWJ1ZyguLi5hcmdzOiBzdHJpbmdbXSk6IHZvaWQge1xuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcbiAgICAgIGNvbnNvbGUuZGVidWcoLi4uYXJncyk7XG4gICAgfSxcbiAgICBpbmZvKC4uLmFyZ3M6IHN0cmluZ1tdKTogdm9pZCB7XG4gICAgICBsb2FkZXJDb250ZXh0LmVtaXRXYXJuaW5nKG5ldyBFcnJvcihhcmdzLmpvaW4oJycpKSk7XG4gICAgfSxcbiAgICB3YXJuKC4uLmFyZ3M6IHN0cmluZ1tdKTogdm9pZCB7XG4gICAgICBsb2FkZXJDb250ZXh0LmVtaXRXYXJuaW5nKG5ldyBFcnJvcihhcmdzLmpvaW4oJycpKSk7XG4gICAgfSxcbiAgICBlcnJvciguLi5hcmdzOiBzdHJpbmdbXSk6IHZvaWQge1xuICAgICAgbG9hZGVyQ29udGV4dC5lbWl0RXJyb3IobmV3IEVycm9yKGFyZ3Muam9pbignJykpKTtcbiAgICB9LFxuICB9O1xuXG4gIGxldCBmaWxlbmFtZSA9IGxvYWRlckNvbnRleHQucmVzb3VyY2VQYXRoO1xuICBjb25zdCBtYXBPYmplY3QgPVxuICAgIHR5cGVvZiBtYXAgPT09ICdzdHJpbmcnID8gKEpTT04ucGFyc2UobWFwKSBhcyBFeGNsdWRlPExvYWRlclNvdXJjZU1hcCwgc3RyaW5nPikgOiBtYXA7XG4gIGlmIChtYXBPYmplY3Q/LmZpbGUpIHtcbiAgICAvLyBUaGUgZXh0cmFjdG9yJ3MgaW50ZXJuYWwgc291cmNlbWFwIGhhbmRsaW5nIGV4cGVjdHMgdGhlIGZpbGVuYW1lcyB0byBtYXRjaFxuICAgIGZpbGVuYW1lID0gbm9kZVBhdGguam9pbihsb2FkZXJDb250ZXh0LmNvbnRleHQsIG1hcE9iamVjdC5maWxlKTtcbiAgfVxuXG4gIC8vIFNldHVwIGEgdmlydHVhbCBmaWxlIHN5c3RlbSBpbnN0YW5jZSBmb3IgdGhlIGV4dHJhY3RvclxuICAvLyAqIE1lc3NhZ2VFeHRyYWN0b3IgaXRzZWxmIHVzZXMgcmVhZEZpbGUsIHJlbGF0aXZlIGFuZCByZXNvbHZlXG4gIC8vICogSW50ZXJuYWwgU291cmNlRmlsZUxvYWRlciAoc291cmNlbWFwIHN1cHBvcnQpIHVzZXMgZGlybmFtZSwgZXhpc3RzLCByZWFkRmlsZSwgYW5kIHJlc29sdmVcbiAgY29uc3QgZmlsZXN5c3RlbSA9IHtcbiAgICByZWFkRmlsZShwYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgICAgaWYgKHBhdGggPT09IGZpbGVuYW1lKSB7XG4gICAgICAgIHJldHVybiBjb250ZW50O1xuICAgICAgfSBlbHNlIGlmIChwYXRoID09PSBmaWxlbmFtZSArICcubWFwJykge1xuICAgICAgICByZXR1cm4gdHlwZW9mIG1hcCA9PT0gJ3N0cmluZycgPyBtYXAgOiBKU09OLnN0cmluZ2lmeShtYXApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmtub3duIGZpbGUgcmVxdWVzdGVkOiAnICsgcGF0aCk7XG4gICAgICB9XG4gICAgfSxcbiAgICByZWxhdGl2ZShmcm9tOiBzdHJpbmcsIHRvOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgICAgcmV0dXJuIG5vZGVQYXRoLnJlbGF0aXZlKGZyb20sIHRvKTtcbiAgICB9LFxuICAgIHJlc29sdmUoLi4ucGF0aHM6IHN0cmluZ1tdKTogc3RyaW5nIHtcbiAgICAgIHJldHVybiBub2RlUGF0aC5yZXNvbHZlKC4uLnBhdGhzKTtcbiAgICB9LFxuICAgIGV4aXN0cyhwYXRoOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICAgIHJldHVybiBwYXRoID09PSBmaWxlbmFtZSB8fCBwYXRoID09PSBmaWxlbmFtZSArICcubWFwJztcbiAgICB9LFxuICAgIGRpcm5hbWUocGF0aDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICAgIHJldHVybiBub2RlUGF0aC5kaXJuYW1lKHBhdGgpO1xuICAgIH0sXG4gIH07XG5cbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbiAgY29uc3QgZXh0cmFjdG9yID0gbmV3IE1lc3NhZ2VFeHRyYWN0b3IoZmlsZXN5c3RlbSBhcyBhbnksIGxvZ2dlciwge1xuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gICAgYmFzZVBhdGg6IGxvYWRlckNvbnRleHQucm9vdENvbnRleHQgYXMgYW55LFxuICAgIHVzZVNvdXJjZU1hcHM6ICEhbWFwLFxuICB9KTtcblxuICBjb25zdCBtZXNzYWdlcyA9IGV4dHJhY3Rvci5leHRyYWN0TWVzc2FnZXMoZmlsZW5hbWUpO1xuICBpZiAobWVzc2FnZXMubGVuZ3RoID4gMCkge1xuICAgIG9wdGlvbnM/Lm1lc3NhZ2VIYW5kbGVyKG1lc3NhZ2VzKTtcbiAgfVxufVxuIl19