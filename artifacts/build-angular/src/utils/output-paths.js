"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureOutputPaths = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
function ensureOutputPaths(baseOutputPath, i18n) {
    const outputPaths = i18n.shouldInline
        ? [...i18n.inlineLocales].map((l) => [
            l,
            i18n.flatOutput ? baseOutputPath : (0, path_1.join)(baseOutputPath, l),
        ])
        : [['', baseOutputPath]];
    for (const [, outputPath] of outputPaths) {
        if (!(0, fs_1.existsSync)(outputPath)) {
            (0, fs_1.mkdirSync)(outputPath, { recursive: true });
        }
    }
    return new Map(outputPaths);
}
exports.ensureOutputPaths = ensureOutputPaths;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3V0cHV0LXBhdGhzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvYnVpbGRfYW5ndWxhci9zcmMvdXRpbHMvb3V0cHV0LXBhdGhzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7OztBQUVILDJCQUEyQztBQUMzQywrQkFBNEI7QUFHNUIsU0FBZ0IsaUJBQWlCLENBQUMsY0FBc0IsRUFBRSxJQUFpQjtJQUN6RSxNQUFNLFdBQVcsR0FBdUIsSUFBSSxDQUFDLFlBQVk7UUFDdkQsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUNqQyxDQUFDO1lBQ0QsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxJQUFBLFdBQUksRUFBQyxjQUFjLEVBQUUsQ0FBQyxDQUFDO1NBQzNELENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxjQUFjLENBQUMsQ0FBQyxDQUFDO0lBRTNCLEtBQUssTUFBTSxDQUFDLEVBQUUsVUFBVSxDQUFDLElBQUksV0FBVyxFQUFFO1FBQ3hDLElBQUksQ0FBQyxJQUFBLGVBQVUsRUFBQyxVQUFVLENBQUMsRUFBRTtZQUMzQixJQUFBLGNBQVMsRUFBQyxVQUFVLEVBQUUsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztTQUM1QztLQUNGO0lBRUQsT0FBTyxJQUFJLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQztBQUM5QixDQUFDO0FBZkQsOENBZUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsgZXhpc3RzU3luYywgbWtkaXJTeW5jIH0gZnJvbSAnZnMnO1xuaW1wb3J0IHsgam9pbiB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgSTE4bk9wdGlvbnMgfSBmcm9tICcuL2kxOG4tb3B0aW9ucyc7XG5cbmV4cG9ydCBmdW5jdGlvbiBlbnN1cmVPdXRwdXRQYXRocyhiYXNlT3V0cHV0UGF0aDogc3RyaW5nLCBpMThuOiBJMThuT3B0aW9ucyk6IE1hcDxzdHJpbmcsIHN0cmluZz4ge1xuICBjb25zdCBvdXRwdXRQYXRoczogW3N0cmluZywgc3RyaW5nXVtdID0gaTE4bi5zaG91bGRJbmxpbmVcbiAgICA/IFsuLi5pMThuLmlubGluZUxvY2FsZXNdLm1hcCgobCkgPT4gW1xuICAgICAgICBsLFxuICAgICAgICBpMThuLmZsYXRPdXRwdXQgPyBiYXNlT3V0cHV0UGF0aCA6IGpvaW4oYmFzZU91dHB1dFBhdGgsIGwpLFxuICAgICAgXSlcbiAgICA6IFtbJycsIGJhc2VPdXRwdXRQYXRoXV07XG5cbiAgZm9yIChjb25zdCBbLCBvdXRwdXRQYXRoXSBvZiBvdXRwdXRQYXRocykge1xuICAgIGlmICghZXhpc3RzU3luYyhvdXRwdXRQYXRoKSkge1xuICAgICAgbWtkaXJTeW5jKG91dHB1dFBhdGgsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBuZXcgTWFwKG91dHB1dFBhdGhzKTtcbn1cbiJdfQ==