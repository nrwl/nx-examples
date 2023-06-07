"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoveHashPlugin = void 0;
class RemoveHashPlugin {
    constructor(options) {
        this.options = options;
    }
    apply(compiler) {
        compiler.hooks.compilation.tap('remove-hash-plugin', (compilation) => {
            const assetPath = (path, data) => {
                const chunkName = data.chunk?.name;
                const { chunkNames, hashFormat } = this.options;
                if (chunkName && chunkNames?.includes(chunkName)) {
                    // Replace hash formats with empty strings.
                    return path.replace(hashFormat.chunk, '').replace(hashFormat.extract, '');
                }
                return path;
            };
            compilation.hooks.assetPath.tap('remove-hash-plugin', assetPath);
        });
    }
}
exports.RemoveHashPlugin = RemoveHashPlugin;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3ZlLWhhc2gtcGx1Z2luLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvYnVpbGRfYW5ndWxhci9zcmMvd2VicGFjay9wbHVnaW5zL3JlbW92ZS1oYXNoLXBsdWdpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7QUFVSCxNQUFhLGdCQUFnQjtJQUMzQixZQUFvQixPQUFnQztRQUFoQyxZQUFPLEdBQVAsT0FBTyxDQUF5QjtJQUFHLENBQUM7SUFFeEQsS0FBSyxDQUFDLFFBQWtCO1FBQ3RCLFFBQVEsQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDLFdBQVcsRUFBRSxFQUFFO1lBQ25FLE1BQU0sU0FBUyxHQUFHLENBQUMsSUFBWSxFQUFFLElBQWtDLEVBQUUsRUFBRTtnQkFDckUsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUM7Z0JBQ25DLE1BQU0sRUFBRSxVQUFVLEVBQUUsVUFBVSxFQUFFLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQztnQkFFaEQsSUFBSSxTQUFTLElBQUksVUFBVSxFQUFFLFFBQVEsQ0FBQyxTQUFTLENBQUMsRUFBRTtvQkFDaEQsMkNBQTJDO29CQUMzQyxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsQ0FBQztpQkFDM0U7Z0JBRUQsT0FBTyxJQUFJLENBQUM7WUFDZCxDQUFDLENBQUM7WUFFRixXQUFXLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsb0JBQW9CLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDbkUsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUFwQkQsNENBb0JDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7IENvbXBpbGVyIH0gZnJvbSAnd2VicGFjayc7XG5pbXBvcnQgeyBIYXNoRm9ybWF0IH0gZnJvbSAnLi4vdXRpbHMvaGVscGVycyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUmVtb3ZlSGFzaFBsdWdpbk9wdGlvbnMge1xuICBjaHVua05hbWVzOiBzdHJpbmdbXTtcbiAgaGFzaEZvcm1hdDogSGFzaEZvcm1hdDtcbn1cblxuZXhwb3J0IGNsYXNzIFJlbW92ZUhhc2hQbHVnaW4ge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIG9wdGlvbnM6IFJlbW92ZUhhc2hQbHVnaW5PcHRpb25zKSB7fVxuXG4gIGFwcGx5KGNvbXBpbGVyOiBDb21waWxlcik6IHZvaWQge1xuICAgIGNvbXBpbGVyLmhvb2tzLmNvbXBpbGF0aW9uLnRhcCgncmVtb3ZlLWhhc2gtcGx1Z2luJywgKGNvbXBpbGF0aW9uKSA9PiB7XG4gICAgICBjb25zdCBhc3NldFBhdGggPSAocGF0aDogc3RyaW5nLCBkYXRhOiB7IGNodW5rPzogeyBuYW1lOiBzdHJpbmcgfSB9KSA9PiB7XG4gICAgICAgIGNvbnN0IGNodW5rTmFtZSA9IGRhdGEuY2h1bms/Lm5hbWU7XG4gICAgICAgIGNvbnN0IHsgY2h1bmtOYW1lcywgaGFzaEZvcm1hdCB9ID0gdGhpcy5vcHRpb25zO1xuXG4gICAgICAgIGlmIChjaHVua05hbWUgJiYgY2h1bmtOYW1lcz8uaW5jbHVkZXMoY2h1bmtOYW1lKSkge1xuICAgICAgICAgIC8vIFJlcGxhY2UgaGFzaCBmb3JtYXRzIHdpdGggZW1wdHkgc3RyaW5ncy5cbiAgICAgICAgICByZXR1cm4gcGF0aC5yZXBsYWNlKGhhc2hGb3JtYXQuY2h1bmssICcnKS5yZXBsYWNlKGhhc2hGb3JtYXQuZXh0cmFjdCwgJycpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHBhdGg7XG4gICAgICB9O1xuXG4gICAgICBjb21waWxhdGlvbi5ob29rcy5hc3NldFBhdGgudGFwKCdyZW1vdmUtaGFzaC1wbHVnaW4nLCBhc3NldFBhdGgpO1xuICAgIH0pO1xuICB9XG59XG4iXX0=