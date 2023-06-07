"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeCacheOptions = void 0;
const core_1 = require("@angular-devkit/core");
const path_1 = require("path");
const package_version_1 = require("./package-version");
function normalizeCacheOptions(metadata, worspaceRoot) {
    const cacheMetadata = core_1.json.isJsonObject(metadata.cli) && core_1.json.isJsonObject(metadata.cli.cache)
        ? metadata.cli.cache
        : {};
    const { enabled = true, environment = 'local', path = '.angular/cache' } = cacheMetadata;
    const isCI = process.env['CI'] === '1' || process.env['CI']?.toLowerCase() === 'true';
    let cacheEnabled = enabled;
    if (cacheEnabled) {
        switch (environment) {
            case 'ci':
                cacheEnabled = isCI;
                break;
            case 'local':
                cacheEnabled = !isCI;
                break;
        }
    }
    const cacheBasePath = (0, path_1.resolve)(worspaceRoot, path);
    return {
        enabled: cacheEnabled,
        basePath: cacheBasePath,
        path: (0, path_1.join)(cacheBasePath, package_version_1.VERSION),
    };
}
exports.normalizeCacheOptions = normalizeCacheOptions;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9ybWFsaXplLWNhY2hlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvYnVpbGRfYW5ndWxhci9zcmMvdXRpbHMvbm9ybWFsaXplLWNhY2hlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7OztBQUVILCtDQUE0QztBQUM1QywrQkFBcUM7QUFDckMsdURBQTRDO0FBaUI1QyxTQUFnQixxQkFBcUIsQ0FDbkMsUUFBeUIsRUFDekIsWUFBb0I7SUFFcEIsTUFBTSxhQUFhLEdBQ2pCLFdBQUksQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLFdBQUksQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUM7UUFDdEUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsS0FBSztRQUNwQixDQUFDLENBQUMsRUFBRSxDQUFDO0lBRVQsTUFBTSxFQUFFLE9BQU8sR0FBRyxJQUFJLEVBQUUsV0FBVyxHQUFHLE9BQU8sRUFBRSxJQUFJLEdBQUcsZ0JBQWdCLEVBQUUsR0FBRyxhQUFhLENBQUM7SUFDekYsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxXQUFXLEVBQUUsS0FBSyxNQUFNLENBQUM7SUFFdEYsSUFBSSxZQUFZLEdBQUcsT0FBTyxDQUFDO0lBQzNCLElBQUksWUFBWSxFQUFFO1FBQ2hCLFFBQVEsV0FBVyxFQUFFO1lBQ25CLEtBQUssSUFBSTtnQkFDUCxZQUFZLEdBQUcsSUFBSSxDQUFDO2dCQUNwQixNQUFNO1lBQ1IsS0FBSyxPQUFPO2dCQUNWLFlBQVksR0FBRyxDQUFDLElBQUksQ0FBQztnQkFDckIsTUFBTTtTQUNUO0tBQ0Y7SUFFRCxNQUFNLGFBQWEsR0FBRyxJQUFBLGNBQU8sRUFBQyxZQUFZLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFFbEQsT0FBTztRQUNMLE9BQU8sRUFBRSxZQUFZO1FBQ3JCLFFBQVEsRUFBRSxhQUFhO1FBQ3ZCLElBQUksRUFBRSxJQUFBLFdBQUksRUFBQyxhQUFhLEVBQUUseUJBQU8sQ0FBQztLQUNuQyxDQUFDO0FBQ0osQ0FBQztBQS9CRCxzREErQkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsganNvbiB9IGZyb20gJ0Bhbmd1bGFyLWRldmtpdC9jb3JlJztcbmltcG9ydCB7IGpvaW4sIHJlc29sdmUgfSBmcm9tICdwYXRoJztcbmltcG9ydCB7IFZFUlNJT04gfSBmcm9tICcuL3BhY2thZ2UtdmVyc2lvbic7XG5cbmV4cG9ydCBpbnRlcmZhY2UgTm9ybWFsaXplZENhY2hlZE9wdGlvbnMge1xuICAvKiogV2hldGhlciBkaXNrIGNhY2hlIGlzIGVuYWJsZWQuICovXG4gIGVuYWJsZWQ6IGJvb2xlYW47XG4gIC8qKiBEaXNrIGNhY2hlIHBhdGguIEV4YW1wbGU6IGAvLmFuZ3VsYXIvY2FjaGUvdjEyLjAuMGAuICovXG4gIHBhdGg6IHN0cmluZztcbiAgLyoqIERpc2sgY2FjaGUgYmFzZSBwYXRoLiBFeGFtcGxlOiBgLy5hbmd1bGFyL2NhY2hlYC4gKi9cbiAgYmFzZVBhdGg6IHN0cmluZztcbn1cblxuaW50ZXJmYWNlIENhY2hlTWV0YWRhdGEge1xuICBlbmFibGVkPzogYm9vbGVhbjtcbiAgZW52aXJvbm1lbnQ/OiAnbG9jYWwnIHwgJ2NpJyB8ICdhbGwnO1xuICBwYXRoPzogc3RyaW5nO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplQ2FjaGVPcHRpb25zKFxuICBtZXRhZGF0YToganNvbi5Kc29uT2JqZWN0LFxuICB3b3JzcGFjZVJvb3Q6IHN0cmluZyxcbik6IE5vcm1hbGl6ZWRDYWNoZWRPcHRpb25zIHtcbiAgY29uc3QgY2FjaGVNZXRhZGF0YTogQ2FjaGVNZXRhZGF0YSA9XG4gICAganNvbi5pc0pzb25PYmplY3QobWV0YWRhdGEuY2xpKSAmJiBqc29uLmlzSnNvbk9iamVjdChtZXRhZGF0YS5jbGkuY2FjaGUpXG4gICAgICA/IG1ldGFkYXRhLmNsaS5jYWNoZVxuICAgICAgOiB7fTtcblxuICBjb25zdCB7IGVuYWJsZWQgPSB0cnVlLCBlbnZpcm9ubWVudCA9ICdsb2NhbCcsIHBhdGggPSAnLmFuZ3VsYXIvY2FjaGUnIH0gPSBjYWNoZU1ldGFkYXRhO1xuICBjb25zdCBpc0NJID0gcHJvY2Vzcy5lbnZbJ0NJJ10gPT09ICcxJyB8fCBwcm9jZXNzLmVudlsnQ0knXT8udG9Mb3dlckNhc2UoKSA9PT0gJ3RydWUnO1xuXG4gIGxldCBjYWNoZUVuYWJsZWQgPSBlbmFibGVkO1xuICBpZiAoY2FjaGVFbmFibGVkKSB7XG4gICAgc3dpdGNoIChlbnZpcm9ubWVudCkge1xuICAgICAgY2FzZSAnY2knOlxuICAgICAgICBjYWNoZUVuYWJsZWQgPSBpc0NJO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2xvY2FsJzpcbiAgICAgICAgY2FjaGVFbmFibGVkID0gIWlzQ0k7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IGNhY2hlQmFzZVBhdGggPSByZXNvbHZlKHdvcnNwYWNlUm9vdCwgcGF0aCk7XG5cbiAgcmV0dXJuIHtcbiAgICBlbmFibGVkOiBjYWNoZUVuYWJsZWQsXG4gICAgYmFzZVBhdGg6IGNhY2hlQmFzZVBhdGgsXG4gICAgcGF0aDogam9pbihjYWNoZUJhc2VQYXRoLCBWRVJTSU9OKSxcbiAgfTtcbn1cbiJdfQ==