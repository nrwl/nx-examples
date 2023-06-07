"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuppressExtractedTextChunksWebpackPlugin = void 0;
/**
 * Remove .js files from entry points consisting entirely of stylesheets.
 * To be used together with mini-css-extract-plugin.
 */
class SuppressExtractedTextChunksWebpackPlugin {
    apply(compiler) {
        compiler.hooks.compilation.tap('SuppressExtractedTextChunks', (compilation) => {
            compilation.hooks.chunkAsset.tap('SuppressExtractedTextChunks', (chunk, filename) => {
                // Remove only JavaScript assets
                if (!filename.endsWith('.js')) {
                    return;
                }
                // Only chunks with a css asset should have JavaScript assets removed
                let hasCssFile = false;
                for (const file of chunk.files) {
                    if (file.endsWith('.css')) {
                        hasCssFile = true;
                        break;
                    }
                }
                if (!hasCssFile) {
                    return;
                }
                // Only chunks with all CSS entry dependencies should have JavaScript assets removed
                let cssOnly = false;
                const entryModules = compilation.chunkGraph.getChunkEntryModulesIterable(chunk);
                for (const module of entryModules) {
                    cssOnly = module.dependencies.every((dependency) => dependency.constructor.name === 'CssDependency');
                    if (!cssOnly) {
                        break;
                    }
                }
                if (cssOnly) {
                    chunk.files.delete(filename);
                    compilation.deleteAsset(filename);
                }
            });
        });
    }
}
exports.SuppressExtractedTextChunksWebpackPlugin = SuppressExtractedTextChunksWebpackPlugin;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3VwcHJlc3MtZW50cnktY2h1bmtzLXdlYnBhY2stcGx1Z2luLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvYnVpbGRfYW5ndWxhci9zcmMvd2VicGFjay9wbHVnaW5zL3N1cHByZXNzLWVudHJ5LWNodW5rcy13ZWJwYWNrLXBsdWdpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7QUFFSDs7O0dBR0c7QUFDSCxNQUFhLHdDQUF3QztJQUNuRCxLQUFLLENBQUMsUUFBb0M7UUFDeEMsUUFBUSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLDZCQUE2QixFQUFFLENBQUMsV0FBVyxFQUFFLEVBQUU7WUFDNUUsV0FBVyxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLDZCQUE2QixFQUFFLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRSxFQUFFO2dCQUNsRixnQ0FBZ0M7Z0JBQ2hDLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxFQUFFO29CQUM3QixPQUFPO2lCQUNSO2dCQUVELHFFQUFxRTtnQkFDckUsSUFBSSxVQUFVLEdBQUcsS0FBSyxDQUFDO2dCQUN2QixLQUFLLE1BQU0sSUFBSSxJQUFJLEtBQUssQ0FBQyxLQUFLLEVBQUU7b0JBQzlCLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsRUFBRTt3QkFDekIsVUFBVSxHQUFHLElBQUksQ0FBQzt3QkFDbEIsTUFBTTtxQkFDUDtpQkFDRjtnQkFFRCxJQUFJLENBQUMsVUFBVSxFQUFFO29CQUNmLE9BQU87aUJBQ1I7Z0JBRUQsb0ZBQW9GO2dCQUNwRixJQUFJLE9BQU8sR0FBRyxLQUFLLENBQUM7Z0JBQ3BCLE1BQU0sWUFBWSxHQUFHLFdBQVcsQ0FBQyxVQUFVLENBQUMsNEJBQTRCLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ2hGLEtBQUssTUFBTSxNQUFNLElBQUksWUFBWSxFQUFFO29CQUNqQyxPQUFPLEdBQUcsTUFBTSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQ2pDLENBQUMsVUFBYyxFQUFFLEVBQUUsQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLElBQUksS0FBSyxlQUFlLENBQ3BFLENBQUM7b0JBRUYsSUFBSSxDQUFDLE9BQU8sRUFBRTt3QkFDWixNQUFNO3FCQUNQO2lCQUNGO2dCQUVELElBQUksT0FBTyxFQUFFO29CQUNYLEtBQUssQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO29CQUM3QixXQUFXLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO2lCQUNuQztZQUNILENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUExQ0QsNEZBMENDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbi8qKlxuICogUmVtb3ZlIC5qcyBmaWxlcyBmcm9tIGVudHJ5IHBvaW50cyBjb25zaXN0aW5nIGVudGlyZWx5IG9mIHN0eWxlc2hlZXRzLlxuICogVG8gYmUgdXNlZCB0b2dldGhlciB3aXRoIG1pbmktY3NzLWV4dHJhY3QtcGx1Z2luLlxuICovXG5leHBvcnQgY2xhc3MgU3VwcHJlc3NFeHRyYWN0ZWRUZXh0Q2h1bmtzV2VicGFja1BsdWdpbiB7XG4gIGFwcGx5KGNvbXBpbGVyOiBpbXBvcnQoJ3dlYnBhY2snKS5Db21waWxlcik6IHZvaWQge1xuICAgIGNvbXBpbGVyLmhvb2tzLmNvbXBpbGF0aW9uLnRhcCgnU3VwcHJlc3NFeHRyYWN0ZWRUZXh0Q2h1bmtzJywgKGNvbXBpbGF0aW9uKSA9PiB7XG4gICAgICBjb21waWxhdGlvbi5ob29rcy5jaHVua0Fzc2V0LnRhcCgnU3VwcHJlc3NFeHRyYWN0ZWRUZXh0Q2h1bmtzJywgKGNodW5rLCBmaWxlbmFtZSkgPT4ge1xuICAgICAgICAvLyBSZW1vdmUgb25seSBKYXZhU2NyaXB0IGFzc2V0c1xuICAgICAgICBpZiAoIWZpbGVuYW1lLmVuZHNXaXRoKCcuanMnKSkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIE9ubHkgY2h1bmtzIHdpdGggYSBjc3MgYXNzZXQgc2hvdWxkIGhhdmUgSmF2YVNjcmlwdCBhc3NldHMgcmVtb3ZlZFxuICAgICAgICBsZXQgaGFzQ3NzRmlsZSA9IGZhbHNlO1xuICAgICAgICBmb3IgKGNvbnN0IGZpbGUgb2YgY2h1bmsuZmlsZXMpIHtcbiAgICAgICAgICBpZiAoZmlsZS5lbmRzV2l0aCgnLmNzcycpKSB7XG4gICAgICAgICAgICBoYXNDc3NGaWxlID0gdHJ1ZTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghaGFzQ3NzRmlsZSkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIE9ubHkgY2h1bmtzIHdpdGggYWxsIENTUyBlbnRyeSBkZXBlbmRlbmNpZXMgc2hvdWxkIGhhdmUgSmF2YVNjcmlwdCBhc3NldHMgcmVtb3ZlZFxuICAgICAgICBsZXQgY3NzT25seSA9IGZhbHNlO1xuICAgICAgICBjb25zdCBlbnRyeU1vZHVsZXMgPSBjb21waWxhdGlvbi5jaHVua0dyYXBoLmdldENodW5rRW50cnlNb2R1bGVzSXRlcmFibGUoY2h1bmspO1xuICAgICAgICBmb3IgKGNvbnN0IG1vZHVsZSBvZiBlbnRyeU1vZHVsZXMpIHtcbiAgICAgICAgICBjc3NPbmx5ID0gbW9kdWxlLmRlcGVuZGVuY2llcy5ldmVyeShcbiAgICAgICAgICAgIChkZXBlbmRlbmN5OiB7fSkgPT4gZGVwZW5kZW5jeS5jb25zdHJ1Y3Rvci5uYW1lID09PSAnQ3NzRGVwZW5kZW5jeScsXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIGlmICghY3NzT25seSkge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNzc09ubHkpIHtcbiAgICAgICAgICBjaHVuay5maWxlcy5kZWxldGUoZmlsZW5hbWUpO1xuICAgICAgICAgIGNvbXBpbGF0aW9uLmRlbGV0ZUFzc2V0KGZpbGVuYW1lKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==