"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndexHtmlWebpackPlugin = void 0;
const path_1 = require("path");
const webpack_1 = require("webpack");
const error_1 = require("../../utils/error");
const index_html_generator_1 = require("../../utils/index-file/index-html-generator");
const webpack_diagnostics_1 = require("../../utils/webpack-diagnostics");
const PLUGIN_NAME = 'index-html-webpack-plugin';
class IndexHtmlWebpackPlugin extends index_html_generator_1.IndexHtmlGenerator {
    get compilation() {
        if (this._compilation) {
            return this._compilation;
        }
        throw new Error('compilation is undefined.');
    }
    constructor(options) {
        super(options);
        this.options = options;
    }
    apply(compiler) {
        compiler.hooks.thisCompilation.tap(PLUGIN_NAME, (compilation) => {
            this._compilation = compilation;
            compilation.hooks.processAssets.tapPromise({
                name: PLUGIN_NAME,
                stage: webpack_1.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE + 1,
            }, callback);
        });
        const callback = async (assets) => {
            const files = [];
            try {
                for (const chunk of this.compilation.chunks) {
                    for (const file of chunk.files) {
                        if (file.endsWith('.hot-update.js')) {
                            continue;
                        }
                        files.push({
                            name: chunk.name,
                            file,
                            extension: (0, path_1.extname)(file),
                        });
                    }
                }
                const { content, warnings, errors } = await this.process({
                    files,
                    outputPath: (0, path_1.dirname)(this.options.outputPath),
                    baseHref: this.options.baseHref,
                    lang: this.options.lang,
                });
                assets[this.options.outputPath] = new webpack_1.sources.RawSource(content);
                warnings.forEach((msg) => (0, webpack_diagnostics_1.addWarning)(this.compilation, msg));
                errors.forEach((msg) => (0, webpack_diagnostics_1.addError)(this.compilation, msg));
            }
            catch (error) {
                (0, error_1.assertIsError)(error);
                (0, webpack_diagnostics_1.addError)(this.compilation, error.message);
            }
        };
    }
    async readAsset(path) {
        const data = this.compilation.assets[(0, path_1.basename)(path)].source();
        return typeof data === 'string' ? data : data.toString();
    }
    async readIndex(path) {
        return new Promise((resolve, reject) => {
            this.compilation.inputFileSystem.readFile(path, (err, data) => {
                if (err) {
                    reject(err);
                    return;
                }
                this.compilation.fileDependencies.add(path);
                resolve(data?.toString() ?? '');
            });
        });
    }
}
exports.IndexHtmlWebpackPlugin = IndexHtmlWebpackPlugin;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXgtaHRtbC13ZWJwYWNrLXBsdWdpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2J1aWxkX2FuZ3VsYXIvc3JjL3dlYnBhY2svcGx1Z2lucy9pbmRleC1odG1sLXdlYnBhY2stcGx1Z2luLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7OztBQUVILCtCQUFrRDtBQUNsRCxxQ0FBeUQ7QUFDekQsNkNBQWtEO0FBRWxELHNGQUlxRDtBQUNyRCx5RUFBdUU7QUFNdkUsTUFBTSxXQUFXLEdBQUcsMkJBQTJCLENBQUM7QUFDaEQsTUFBYSxzQkFBdUIsU0FBUSx5Q0FBa0I7SUFFNUQsSUFBSSxXQUFXO1FBQ2IsSUFBSSxJQUFJLENBQUMsWUFBWSxFQUFFO1lBQ3JCLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQztTQUMxQjtRQUVELE1BQU0sSUFBSSxLQUFLLENBQUMsMkJBQTJCLENBQUMsQ0FBQztJQUMvQyxDQUFDO0lBRUQsWUFBOEIsT0FBc0M7UUFDbEUsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBRGEsWUFBTyxHQUFQLE9BQU8sQ0FBK0I7SUFFcEUsQ0FBQztJQUVELEtBQUssQ0FBQyxRQUFrQjtRQUN0QixRQUFRLENBQUMsS0FBSyxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLENBQUMsV0FBVyxFQUFFLEVBQUU7WUFDOUQsSUFBSSxDQUFDLFlBQVksR0FBRyxXQUFXLENBQUM7WUFDaEMsV0FBVyxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUN4QztnQkFDRSxJQUFJLEVBQUUsV0FBVztnQkFDakIsS0FBSyxFQUFFLHFCQUFXLENBQUMsNkJBQTZCLEdBQUcsQ0FBQzthQUNyRCxFQUNELFFBQVEsQ0FDVCxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxNQUFNLFFBQVEsR0FBRyxLQUFL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KiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsgYmFzZW5hbWUsIGRpcm5hbWUsIGV4dG5hbWUgfSBmcm9tICdwYXRoJztcbmltcG9ydCB7IENvbXBpbGF0aW9uLCBDb21waWxlciwgc291cmNlcyB9IGZyb20gJ3dlYnBhY2snO1xuaW1wb3J0IHsgYXNzZXJ0SXNFcnJvciB9IGZyb20gJy4uLy4uL3V0aWxzL2Vycm9yJztcbmltcG9ydCB7IEZpbGVJbmZvIH0gZnJvbSAnLi4vLi4vdXRpbHMvaW5kZXgtZmlsZS9hdWdtZW50LWluZGV4LWh0bWwnO1xuaW1wb3J0IHtcbiAgSW5kZXhIdG1sR2VuZXJhdG9yLFxuICBJbmRleEh0bWxHZW5lcmF0b3JPcHRpb25zLFxuICBJbmRleEh0bWxHZW5lcmF0b3JQcm9jZXNzT3B0aW9ucyxcbn0gZnJvbSAnLi4vLi4vdXRpbHMvaW5kZXgtZmlsZS9pbmRleC1odG1sLWdlbmVyYXRvcic7XG5pbXBvcnQgeyBhZGRFcnJvciwgYWRkV2FybmluZyB9IGZyb20gJy4uLy4uL3V0aWxzL3dlYnBhY2stZGlhZ25vc3RpY3MnO1xuXG5leHBvcnQgaW50ZXJmYWNlIEluZGV4SHRtbFdlYnBhY2tQbHVnaW5PcHRpb25zXG4gIGV4dGVuZHMgSW5kZXhIdG1sR2VuZXJhdG9yT3B0aW9ucyxcbiAgICBPbWl0PEluZGV4SHRtbEdlbmVyYXRvclByb2Nlc3NPcHRpb25zLCAnZmlsZXMnPiB7fVxuXG5jb25zdCBQTFVHSU5fTkFNRSA9ICdpbmRleC1odG1sLXdlYnBhY2stcGx1Z2luJztcbmV4cG9ydCBjbGFzcyBJbmRleEh0bWxXZWJwYWNrUGx1Z2luIGV4dGVuZHMgSW5kZXhIdG1sR2VuZXJhdG9yIHtcbiAgcHJpdmF0ZSBfY29tcGlsYXRpb246IENvbXBpbGF0aW9uIHwgdW5kZWZpbmVkO1xuICBnZXQgY29tcGlsYXRpb24oKTogQ29tcGlsYXRpb24ge1xuICAgIGlmICh0aGlzLl9jb21waWxhdGlvbikge1xuICAgICAgcmV0dXJuIHRoaXMuX2NvbXBpbGF0aW9uO1xuICAgIH1cblxuICAgIHRocm93IG5ldyBFcnJvcignY29tcGlsYXRpb24gaXMgdW5kZWZpbmVkLicpO1xuICB9XG5cbiAgY29uc3RydWN0b3Iob3ZlcnJpZGUgcmVhZG9ubHkgb3B0aW9uczogSW5kZXhIdG1sV2VicGFja1BsdWdpbk9wdGlvbnMpIHtcbiAgICBzdXBlcihvcHRpb25zKTtcbiAgfVxuXG4gIGFwcGx5KGNvbXBpbGVyOiBDb21waWxlcikge1xuICAgIGNvbXBpbGVyLmhvb2tzLnRoaXNDb21waWxhdGlvbi50YXAoUExVR0lOX05BTUUsIChjb21waWxhdGlvbikgPT4ge1xuICAgICAgdGhpcy5fY29tcGlsYXRpb24gPSBjb21waWxhdGlvbjtcbiAgICAgIGNvbXBpbGF0aW9uLmhvb2tzLnByb2Nlc3NBc3NldHMudGFwUHJvbWlzZShcbiAgICAgICAge1xuICAgICAgICAgIG5hbWU6IFBMVUdJTl9OQU1FLFxuICAgICAgICAgIHN0YWdlOiBDb21waWxhdGlvbi5QUk9DRVNTX0FTU0VUU19TVEFHRV9PUFRJTUlaRSArIDEsXG4gICAgICAgIH0sXG4gICAgICAgIGNhbGxiYWNrLFxuICAgICAgKTtcbiAgICB9KTtcblxuICAgIGNvbnN0IGNhbGxiYWNrID0gYXN5bmMgKGFzc2V0czogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pID0+IHtcbiAgICAgIGNvbnN0IGZpbGVzOiBGaWxlSW5mb1tdID0gW107XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGZvciAoY29uc3QgY2h1bmsgb2YgdGhpcy5jb21waWxhdGlvbi5jaHVua3MpIHtcbiAgICAgICAgICBmb3IgKGNvbnN0IGZpbGUgb2YgY2h1bmsuZmlsZXMpIHtcbiAgICAgICAgICAgIGlmIChmaWxlLmVuZHNXaXRoKCcuaG90LXVwZGF0ZS5qcycpKSB7XG4gICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmaWxlcy5wdXNoKHtcbiAgICAgICAgICAgICAgbmFtZTogY2h1bmsubmFtZSxcbiAgICAgICAgICAgICAgZmlsZSxcbiAgICAgICAgICAgICAgZXh0ZW5zaW9uOiBleHRuYW1lKGZpbGUpLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgeyBjb250ZW50LCB3YXJuaW5ncywgZXJyb3JzIH0gPSBhd2FpdCB0aGlzLnByb2Nlc3Moe1xuICAgICAgICAgIGZpbGVzLFxuICAgICAgICAgIG91dHB1dFBhdGg6IGRpcm5hbWUodGhpcy5vcHRpb25zLm91dHB1dFBhdGgpLFxuICAgICAgICAgIGJhc2VIcmVmOiB0aGlzLm9wdGlvbnMuYmFzZUhyZWYsXG4gICAgICAgICAgbGFuZzogdGhpcy5vcHRpb25zLmxhbmcsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGFzc2V0c1t0aGlzLm9wdGlvbnMub3V0cHV0UGF0aF0gPSBuZXcgc291cmNlcy5SYXdTb3VyY2UoY29udGVudCk7XG5cbiAgICAgICAgd2FybmluZ3MuZm9yRWFjaCgobXNnKSA9PiBhZGRXYXJuaW5nKHRoaXMuY29tcGlsYXRpb24sIG1zZykpO1xuICAgICAgICBlcnJvcnMuZm9yRWFjaCgobXNnKSA9PiBhZGRFcnJvcih0aGlzLmNvbXBpbGF0aW9uLCBtc2cpKTtcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGFzc2VydElzRXJyb3IoZXJyb3IpO1xuICAgICAgICBhZGRFcnJvcih0aGlzLmNvbXBpbGF0aW9uLCBlcnJvci5tZXNzYWdlKTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgb3ZlcnJpZGUgYXN5bmMgcmVhZEFzc2V0KHBhdGg6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgZGF0YSA9IHRoaXMuY29tcGlsYXRpb24uYXNzZXRzW2Jhc2VuYW1lKHBhdGgpXS5zb3VyY2UoKTtcblxuICAgIHJldHVybiB0eXBlb2YgZGF0YSA9PT0gJ3N0cmluZycgPyBkYXRhIDogZGF0YS50b1N0cmluZygpO1xuICB9XG5cbiAgcHJvdGVjdGVkIG92ZXJyaWRlIGFzeW5jIHJlYWRJbmRleChwYXRoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZTxzdHJpbmc+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHRoaXMuY29tcGlsYXRpb24uaW5wdXRGaWxlU3lzdGVtLnJlYWRGaWxlKFxuICAgICAgICBwYXRoLFxuICAgICAgICAoZXJyPzogRXJyb3IgfCBudWxsLCBkYXRhPzogc3RyaW5nIHwgQnVmZmVyKSA9PiB7XG4gICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgcmVqZWN0KGVycik7XG5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0aGlzLmNvbXBpbGF0aW9uLmZpbGVEZXBlbmRlbmNpZXMuYWRkKHBhdGgpO1xuICAgICAgICAgIHJlc29sdmUoZGF0YT8udG9TdHJpbmcoKSA/PyAnJyk7XG4gICAgICAgIH0sXG4gICAgICApO1xuICAgIH0pO1xuICB9XG59XG4iXX0=