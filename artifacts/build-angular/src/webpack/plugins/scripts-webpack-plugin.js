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
exports.ScriptsWebpackPlugin = void 0;
const loader_utils_1 = require("loader-utils");
const path = __importStar(require("path"));
const webpack_1 = require("webpack");
const error_1 = require("../../utils/error");
const webpack_diagnostics_1 = require("../../utils/webpack-diagnostics");
const Entrypoint = require('webpack/lib/Entrypoint');
/**
 * The name of the plugin provided to Webpack when tapping Webpack compiler hooks.
 */
const PLUGIN_NAME = 'scripts-webpack-plugin';
function addDependencies(compilation, scripts) {
    for (const script of scripts) {
        compilation.fileDependencies.add(script);
    }
}
class ScriptsWebpackPlugin {
    constructor(options) {
        this.options = options;
    }
    async shouldSkip(compilation, scripts) {
        if (this._lastBuildTime == undefined) {
            this._lastBuildTime = Date.now();
            return false;
        }
        for (const script of scripts) {
            const scriptTime = await new Promise((resolve, reject) => {
                compilation.fileSystemInfo.getFileTimestamp(script, (error, entry) => {
                    if (error) {
                        reject(error);
                        return;
                    }
                    resolve(entry && typeof entry !== 'string' ? entry.safeTime : undefined);
                });
            });
            if (!scriptTime || scriptTime > this._lastBuildTime) {
                this._lastBuildTime = Date.now();
                return false;
            }
        }
        return true;
    }
    _insertOutput(compilation, { filename, source }, cached = false) {
        const chunk = new webpack_1.Chunk(this.options.name);
        chunk.rendered = !cached;
        chunk.id = this.options.name;
        chunk.ids = [chunk.id];
        chunk.files.add(filename);
        const entrypoint = new Entrypoint(this.options.name);
        entrypoint.pushChunk(chunk);
        chunk.addGroup(entrypoint);
        compilation.entrypoints.set(this.options.name, entrypoint);
        compilation.chunks.add(chunk);
        compilation.assets[filename] = source;
        compilation.hooks.chunkAsset.call(chunk, filename);
    }
    apply(compiler) {
        if (this.options.scripts.length === 0) {
            return;
        }
        compiler.hooks.thisCompilation.tap(PLUGIN_NAME, (compilation) => {
            // Use the resolver from the compilation instead of compiler.
            // Using the latter will causes a lot of `DescriptionFileUtils.loadDescriptionFile` calls.
            // See: https://github.com/angular/angular-cli/issues/24634#issuecomment-1425782668
            const resolver = compilation.resolverFactory.get('normal', {
                preferRelative: true,
                useSyncFileSystemCalls: true,
                // Caching must be disabled because it causes the resolver to become async after a rebuild.
                cache: false,
            });
            const scripts = [];
            for (const script of this.options.scripts) {
                try {
                    const resolvedPath = resolver.resolveSync({}, this.options.basePath, script);
                    if (resolvedPath) {
                        scripts.push(resolvedPath);
                    }
                    else {
                        (0, webpack_diagnostics_1.addError)(compilation, `Cannot resolve '${script}'.`);
                    }
                }
                catch (error) {
                    (0, error_1.assertIsError)(error);
                    (0, webpack_diagnostics_1.addError)(compilation, error.message);
                }
            }
            compilation.hooks.additionalAssets.tapPromise(PLUGIN_NAME, async () => {
                if (await this.shouldSkip(compilation, scripts)) {
                    if (this._cachedOutput) {
                        this._insertOutput(compilation, this._cachedOutput, true);
                    }
                    addDependencies(compilation, scripts);
                    return;
                }
                const sourceGetters = scripts.map((fullPath) => {
                    return new Promise((resolve, reject) => {
                        compilation.inputFileSystem.readFile(fullPath, (err, data) => {
                            if (err) {
                                reject(err);
                                return;
                            }
                            const content = data?.toString() ?? '';
                            let source;
                            if (this.options.sourceMap) {
                                // TODO: Look for source map file (for '.min' scripts, etc.)
                                let adjustedPath = fullPath;
                                if (this.options.basePath) {
                                    adjustedPath = path.relative(this.options.basePath, fullPath);
                                }
                                source = new webpack_1.sources.OriginalSource(content, adjustedPath);
                            }
                            else {
                                source = new webpack_1.sources.RawSource(content);
                            }
                            resolve(source);
                        });
                    });
                });
                const sources = await Promise.all(sourceGetters);
                const concatSource = new webpack_1.sources.ConcatSource();
                sources.forEach((source) => {
                    concatSource.add(source);
                    concatSource.add('\n;');
                });
                const combinedSource = new webpack_1.sources.CachedSource(concatSource);
                const output = { filename: this.options.filename, source: combinedSource };
                this._insertOutput(compilation, output);
                this._cachedOutput = output;
                addDependencies(compilation, scripts);
            });
            compilation.hooks.processAssets.tapPromise({
                name: PLUGIN_NAME,
                stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_DEV_TOOLING,
            }, async () => {
                const assetName = this.options.filename;
                const asset = compilation.getAsset(assetName);
                if (asset) {
                    const interpolatedFilename = (0, loader_utils_1.interpolateName)({ resourcePath: 'scripts.js' }, assetName, { content: asset.source.source() });
                    if (assetName !== interpolatedFilename) {
                        compilation.renameAsset(assetName, interpolatedFilename);
                    }
                }
            });
        });
    }
}
exports.ScriptsWebpackPlugin = ScriptsWebpackPlugin;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NyaXB0cy13ZWJwYWNrLXBsdWdpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2J1aWxkX2FuZ3VsYXIvc3JjL3dlYnBhY2svcGx1Z2lucy9zY3JpcHRzLXdlYnBhY2stcGx1Z2luLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUgsK0NBQStDO0FBQy9DLDJDQUE2QjtBQUM3QixxQ0FBa0Y7QUFDbEYsNkNBQWtEO0FBQ2xELHlFQUEyRDtBQUUzRCxNQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsd0JBQXdCLENBQUMsQ0FBQztBQUVyRDs7R0FFRztBQUNILE1BQU0sV0FBVyxHQUFHLHdCQUF3QixDQUFDO0FBZTdDLFNBQVMsZUFBZSxDQUFDLFdBQXdCLEVBQUUsT0FBaUI7SUFDbEUsS0FBSyxNQUFNLE1BQU0sSUFBSSxPQUFPLEVBQUU7UUFDNUIsV0FBVyxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztLQUMxQztBQUNILENBQUM7QUFFRCxNQUFhLG9CQUFvQjtJQUkvQixZQUFvQixPQUFvQztRQUFwQyxZQUFPLEdBQVAsT0FBTyxDQUE2QjtJQUFHLENBQUM7SUFFNUQsS0FBSyxDQUFDLFVBQVUsQ0FBQyxXQUF3QixFQUFFLE9BQWlCO1FBQzFELElBQUksSUFBSSxDQUFDLGNBQWMsSUFBSSxTQUFTLEVBQUU7WUFDcEMsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7WUFFakMsT0FBTyxLQUFLLENBQUM7U0FDZDtRQUVELEtBQUssTUFBTSxNQUFNLElBQUksT0FBTyxFQUFFO1lBQzVCLE1BQU0sVUFBVSxHQUFHLE1BQU0sSUFBSSxPQUFPLENBQXFCLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO2dCQUMzRSxX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RSxJQUFJLENBQUMsYUFBYSxDQUFDLFdBQVcsRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFDeEMsSUFBSSxDQUFDLGFBQWEsR0FBRyxNQUFNLENBQUM7Z0JBQzVCLGVBQWUsQ0FBQyxXQUFXLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDeEMsQ0FBQyxDQUFDLENBQUM7WUFDSCxXQUFXLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQ3hDO2dCQUNFLElBQUksRUFBRSxXQUFXO2dCQUNqQixLQUFLLEVBQUUsUUFBUSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsZ0NBQWdDO2FBQ3JFLEVBQ0QsS0FBSyxJQUFJLEVBQUU7Z0JBQ1QsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUM7Z0JBQ3hDLE1BQU0sS0FBSyxHQUFHLFdBQVcsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQzlDLElBQUksS0FBSyxFQUFFO29CQUNULE1BQU0sb0JBQW9CLEdBQUcsSUFBQSw4QkFBZSxFQUMxQyxFQUFFLFlBQVksRUFBRSxZQUFZLEVBQUUsRUFDOUIsU0FBUyxFQUNULEVBQUUsT0FBTyxFQUFFLEtBQUssQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FDbkMsQ0FBQztvQkFDRixJQUFJLFNBQVMsS0FBSyxvQkFBb0IsRUFBRTt3QkFDdEMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxTQUFTLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztxQkFDMUQ7aUJBQ0Y7WUFDSCxDQUFDLENBQ0YsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBeEtELG9EQXdLQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBpbnRlcnBvbGF0ZU5hbWUgfSBmcm9tICdsb2FkZXItdXRpbHMnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IENodW5rLCBDb21waWxhdGlvbiwgQ29tcGlsZXIsIHNvdXJjZXMgYXMgd2VicGFja1NvdXJjZXMgfSBmcm9tICd3ZWJwYWNrJztcbmltcG9ydCB7IGFzc2VydElzRXJyb3IgfSBmcm9tICcuLi8uLi91dGlscy9lcnJvcic7XG5pbXBvcnQgeyBhZGRFcnJvciB9IGZyb20gJy4uLy4uL3V0aWxzL3dlYnBhY2stZGlhZ25vc3RpY3MnO1xuXG5jb25zdCBFbnRyeXBvaW50ID0gcmVxdWlyZSgnd2VicGFjay9saWIvRW50cnlwb2ludCcpO1xuXG4vKipcbiAqIFRoZSBuYW1lIG9mIHRoZSBwbHVnaW4gcHJvdmlkZWQgdG8gV2VicGFjayB3aGVuIHRhcHBpbmcgV2VicGFjayBjb21waWxlciBob29rcy5cbiAqL1xuY29uc3QgUExVR0lOX05BTUUgPSAnc2NyaXB0cy13ZWJwYWNrLXBsdWdpbic7XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2NyaXB0c1dlYnBhY2tQbHVnaW5PcHRpb25zIHtcbiAgbmFtZTogc3RyaW5nO1xuICBzb3VyY2VNYXA/OiBib29sZWFuO1xuICBzY3JpcHRzOiBzdHJpbmdbXTtcbiAgZmlsZW5hbWU6IHN0cmluZztcbiAgYmFzZVBhdGg6IHN0cmluZztcbn1cblxuaW50ZXJmYWNlIFNjcmlwdE91dHB1dCB7XG4gIGZpbGVuYW1lOiBzdHJpbmc7XG4gIHNvdXJjZTogd2VicGFja1NvdXJjZXMuQ2FjaGVkU291cmNlO1xufVxuXG5mdW5jdGlvbiBhZGREZXBlbmRlbmNpZXMoY29tcGlsYXRpb246IENvbXBpbGF0aW9uLCBzY3JpcHRzOiBzdHJpbmdbXSk6IHZvaWQge1xuICBmb3IgKGNvbnN0IHNjcmlwdCBvZiBzY3JpcHRzKSB7XG4gICAgY29tcGlsYXRpb24uZmlsZURlcGVuZGVuY2llcy5hZGQoc2NyaXB0KTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgU2NyaXB0c1dlYnBhY2tQbHVnaW4ge1xuICBwcml2YXRlIF9sYXN0QnVpbGRUaW1lPzogbnVtYmVyO1xuICBwcml2YXRlIF9jYWNoZWRPdXRwdXQ/OiBTY3JpcHRPdXRwdXQ7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBvcHRpb25zOiBTY3JpcHRzV2VicGFja1BsdWdpbk9wdGlvbnMpIHt9XG5cbiAgYXN5bmMgc2hvdWxkU2tpcChjb21waWxhdGlvbjogQ29tcGlsYXRpb24sIHNjcmlwdHM6IHN0cmluZ1tdKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgaWYgKHRoaXMuX2xhc3RCdWlsZFRpbWUgPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLl9sYXN0QnVpbGRUaW1lID0gRGF0ZS5ub3coKTtcblxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGZvciAoY29uc3Qgc2NyaXB0IG9mIHNjcmlwdHMpIHtcbiAgICAgIGNvbnN0IHNjcmlwdFRpbWUgPSBhd2FpdCBuZXcgUHJvbWlzZTxudW1iZXIgfCB1bmRlZmluZWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgY29tcGlsYXRpb24uZmlsZVN5c3RlbUluZm8uZ2V0RmlsZVRpbWVzdGFtcChzY3JpcHQsIChlcnJvciwgZW50cnkpID0+IHtcbiAgICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICAgIHJlamVjdChlcnJvcik7XG5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXNvbHZlKGVudHJ5ICYmIHR5cGVvZiBlbnRyeSAhPT0gJ3N0cmluZycgPyBlbnRyeS5zYWZlVGltZSA6IHVuZGVmaW5lZCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAgIGlmICghc2NyaXB0VGltZSB8fCBzY3JpcHRUaW1lID4gdGhpcy5fbGFzdEJ1aWxkVGltZSkge1xuICAgICAgICB0aGlzLl9sYXN0QnVpbGRUaW1lID0gRGF0ZS5ub3coKTtcblxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBwcml2YXRlIF9pbnNlcnRPdXRwdXQoXG4gICAgY29tcGlsYXRpb246IENvbXBpbGF0aW9uLFxuICAgIHsgZmlsZW5hbWUsIHNvdXJjZSB9OiBTY3JpcHRPdXRwdXQsXG4gICAgY2FjaGVkID0gZmFsc2UsXG4gICkge1xuICAgIGNvbnN0IGNodW5rID0gbmV3IENodW5rKHRoaXMub3B0aW9ucy5uYW1lKTtcbiAgICBjaHVuay5yZW5kZXJlZCA9ICFjYWNoZWQ7XG4gICAgY2h1bmsuaWQgPSB0aGlzLm9wdGlvbnMubmFtZTtcbiAgICBjaHVuay5pZHMgPSBbY2h1bmsuaWRdO1xuICAgIGNodW5rLmZpbGVzLmFkZChmaWxlbmFtZSk7XG5cbiAgICBjb25zdCBlbnRyeXBvaW50ID0gbmV3IEVudHJ5cG9pbnQodGhpcy5vcHRpb25zLm5hbWUpO1xuICAgIGVudHJ5cG9pbnQucHVzaENodW5rKGNodW5rKTtcbiAgICBjaHVuay5hZGRHcm91cChlbnRyeXBvaW50KTtcbiAgICBjb21waWxhdGlvbi5lbnRyeXBvaW50cy5zZXQodGhpcy5vcHRpb25zLm5hbWUsIGVudHJ5cG9pbnQpO1xuICAgIGNvbXBpbGF0aW9uLmNodW5rcy5hZGQoY2h1bmspO1xuXG4gICAgY29tcGlsYXRpb24uYXNzZXRzW2ZpbGVuYW1lXSA9IHNvdXJjZTtcbiAgICBjb21waWxhdGlvbi5ob29rcy5jaHVua0Fzc2V0LmNhbGwoY2h1bmssIGZpbGVuYW1lKTtcbiAgfVxuXG4gIGFwcGx5KGNvbXBpbGVyOiBDb21waWxlcik6IHZvaWQge1xuICAgIGlmICh0aGlzLm9wdGlvbnMuc2NyaXB0cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb21waWxlci5ob29rcy50aGlzQ29tcGlsYXRpb24udGFwKFBMVUdJTl9OQU1FLCAoY29tcGlsYXRpb24pID0+IHtcbiAgICAgIC8vIFVzZSB0aGUgcmVzb2x2ZXIgZnJvbSB0aGUgY29tcGlsYXRpb24gaW5zdGVhZCBvZiBjb21waWxlci5cbiAgICAgIC8vIFVzaW5nIHRoZSBsYXR0ZXIgd2lsbCBjYXVzZXMgYSBsb3Qgb2YgYERlc2NyaXB0aW9uRmlsZVV0aWxzLmxvYWREZXNjcmlwdGlvbkZpbGVgIGNhbGxzLlxuICAgICAgLy8gU2VlOiBodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci9hbmd1bGFyLWNsaS9pc3N1ZXMvMjQ2MzQjaXNzdWVjb21tZW50LTE0MjU3ODI2NjhcbiAgICAgIGNvbnN0IHJlc29sdmVyID0gY29tcGlsYXRpb24ucmVzb2x2ZXJGYWN0b3J5LmdldCgnbm9ybWFsJywge1xuICAgICAgICBwcmVmZXJSZWxhdGl2ZTogdHJ1ZSxcbiAgICAgICAgdXNlU3luY0ZpbGVTeXN0ZW1DYWxsczogdHJ1ZSxcbiAgICAgICAgLy8gQ2FjaGluZyBtdXN0IGJlIGRpc2FibGVkIGJlY2F1c2UgaXQgY2F1c2VzIHRoZSByZXNvbHZlciB0byBiZWNvbWUgYXN5bmMgYWZ0ZXIgYSByZWJ1aWxkLlxuICAgICAgICBjYWNoZTogZmFsc2UsXG4gICAgICB9KTtcblxuICAgICAgY29uc3Qgc2NyaXB0czogc3RyaW5nW10gPSBbXTtcblxuICAgICAgZm9yIChjb25zdCBzY3JpcHQgb2YgdGhpcy5vcHRpb25zLnNjcmlwdHMpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zdCByZXNvbHZlZFBhdGggPSByZXNvbHZlci5yZXNvbHZlU3luYyh7fSwgdGhpcy5vcHRpb25zLmJhc2VQYXRoLCBzY3JpcHQpO1xuICAgICAgICAgIGlmIChyZXNvbHZlZFBhdGgpIHtcbiAgICAgICAgICAgIHNjcmlwdHMucHVzaChyZXNvbHZlZFBhdGgpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhZGRFcnJvcihjb21waWxhdGlvbiwgYENhbm5vdCByZXNvbHZlICcke3NjcmlwdH0nLmApO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICBhc3NlcnRJc0Vycm9yKGVycm9yKTtcbiAgICAgICAgICBhZGRFcnJvcihjb21waWxhdGlvbiwgZXJyb3IubWVzc2FnZSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY29tcGlsYXRpb24uaG9va3MuYWRkaXRpb25hbEFzc2V0cy50YXBQcm9taXNlKFBMVUdJTl9OQU1FLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGlmIChhd2FpdCB0aGlzLnNob3VsZFNraXAoY29tcGlsYXRpb24sIHNjcmlwdHMpKSB7XG4gICAgICAgICAgaWYgKHRoaXMuX2NhY2hlZE91dHB1dCkge1xuICAgICAgICAgICAgdGhpcy5faW5zZXJ0T3V0cHV0KGNvbXBpbGF0aW9uLCB0aGlzLl9jYWNoZWRPdXRwdXQsIHRydWUpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGFkZERlcGVuZGVuY2llcyhjb21waWxhdGlvbiwgc2NyaXB0cyk7XG5cbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBzb3VyY2VHZXR0ZXJzID0gc2NyaXB0cy5tYXAoKGZ1bGxQYXRoKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPHdlYnBhY2tTb3VyY2VzLlNvdXJjZT4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29tcGlsYXRpb24uaW5wdXRGaWxlU3lzdGVtLnJlYWRGaWxlKFxuICAgICAgICAgICAgICBmdWxsUGF0aCxcbiAgICAgICAgICAgICAgKGVycj86IEVycm9yIHwgbnVsbCwgZGF0YT86IHN0cmluZyB8IEJ1ZmZlcikgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpO1xuXG4gICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY29uc3QgY29udGVudCA9IGRhdGE/LnRvU3RyaW5nKCkgPz8gJyc7XG5cbiAgICAgICAgICAgICAgICBsZXQgc291cmNlO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuc291cmNlTWFwKSB7XG4gICAgICAgICAgICAgICAgICAvLyBUT0RPOiBMb29rIGZvciBzb3VyY2UgbWFwIGZpbGUgKGZvciAnLm1pbicgc2NyaXB0cywgZXRjLilcblxuICAgICAgICAgICAgICAgICAgbGV0IGFkanVzdGVkUGF0aCA9IGZ1bGxQYXRoO1xuICAgICAgICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5iYXNlUGF0aCkge1xuICAgICAgICAgICAgICAgICAgICBhZGp1c3RlZFBhdGggPSBwYXRoLnJlbGF0aXZlKHRoaXMub3B0aW9ucy5iYXNlUGF0aCwgZnVsbFBhdGgpO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgc291cmNlID0gbmV3IHdlYnBhY2tTb3VyY2VzLk9yaWdpbmFsU291cmNlKGNvbnRlbnQsIGFkanVzdGVkUGF0aCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIHNvdXJjZSA9IG5ldyB3ZWJwYWNrU291cmNlcy5SYXdTb3VyY2UoY29udGVudCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShzb3VyY2UpO1xuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3Qgc291cmNlcyA9IGF3YWl0IFByb21pc2UuYWxsKHNvdXJjZUdldHRlcnMpO1xuICAgICAgICBjb25zdCBjb25jYXRTb3VyY2UgPSBuZXcgd2VicGFja1NvdXJjZXMuQ29uY2F0U291cmNlKCk7XG4gICAgICAgIHNvdXJjZXMuZm9yRWFjaCgoc291cmNlKSA9PiB7XG4gICAgICAgICAgY29uY2F0U291cmNlLmFkZChzb3VyY2UpO1xuICAgICAgICAgIGNvbmNhdFNvdXJjZS5hZGQoJ1xcbjsnKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgY29tYmluZWRTb3VyY2UgPSBuZXcgd2VicGFja1NvdXJjZXMuQ2FjaGVkU291cmNlKGNvbmNhdFNvdXJjZSk7XG5cbiAgICAgICAgY29uc3Qgb3V0cHV0ID0geyBmaWxlbmFtZTogdGhpcy5vcHRpb25zLmZpbGVuYW1lLCBzb3VyY2U6IGNvbWJpbmVkU291cmNlIH07XG4gICAgICAgIHRoaXMuX2luc2VydE91dHB1dChjb21waWxhdGlvbiwgb3V0cHV0KTtcbiAgICAgICAgdGhpcy5fY2FjaGVkT3V0cHV0ID0gb3V0cHV0O1xuICAgICAgICBhZGREZXBlbmRlbmNpZXMoY29tcGlsYXRpb24sIHNjcmlwdHMpO1xuICAgICAgfSk7XG4gICAgICBjb21waWxhdGlvbi5ob29rcy5wcm9jZXNzQXNzZXRzLnRhcFByb21pc2UoXG4gICAgICAgIHtcbiAgICAgICAgICBuYW1lOiBQTFVHSU5fTkFNRSxcbiAgICAgICAgICBzdGFnZTogY29tcGlsZXIud2VicGFjay5Db21waWxhdGlvbi5QUk9DRVNTX0FTU0VUU19TVEFHRV9ERVZfVE9PTElORyxcbiAgICAgICAgfSxcbiAgICAgICAgYXN5bmMgKCkgPT4ge1xuICAgICAgICAgIGNvbnN0IGFzc2V0TmFtZSA9IHRoaXMub3B0aW9ucy5maWxlbmFtZTtcbiAgICAgICAgICBjb25zdCBhc3NldCA9IGNvbXBpbGF0aW9uLmdldEFzc2V0KGFzc2V0TmFtZSk7XG4gICAgICAgICAgaWYgKGFzc2V0KSB7XG4gICAgICAgICAgICBjb25zdCBpbnRlcnBvbGF0ZWRGaWxlbmFtZSA9IGludGVycG9sYXRlTmFtZShcbiAgICAgICAgICAgICAgeyByZXNvdXJjZVBhdGg6ICdzY3JpcHRzLmpzJyB9LFxuICAgICAgICAgICAgICBhc3NldE5hbWUsXG4gICAgICAgICAgICAgIHsgY29udGVudDogYXNzZXQuc291cmNlLnNvdXJjZSgpIH0sXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgaWYgKGFzc2V0TmFtZSAhPT0gaW50ZXJwb2xhdGVkRmlsZW5hbWUpIHtcbiAgICAgICAgICAgICAgY29tcGlsYXRpb24ucmVuYW1lQXNzZXQoYXNzZXROYW1lLCBpbnRlcnBvbGF0ZWRGaWxlbmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgKTtcbiAgICB9KTtcbiAgfVxufVxuIl19