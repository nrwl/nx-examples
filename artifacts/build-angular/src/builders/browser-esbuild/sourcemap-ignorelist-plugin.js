"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSourcemapIngorelistPlugin = void 0;
/**
 * The field identifier for the sourcemap Chrome Devtools ignore list extension.
 *
 * Following the naming conventions from https://sourcemaps.info/spec.html#h.ghqpj1ytqjbm
 */
const IGNORE_LIST_ID = 'x_google_ignoreList';
/**
 * Creates an esbuild plugin that updates generated sourcemaps to include the Chrome
 * DevTools ignore list extension. All source files that originate from a node modules
 * directory are added to the ignore list by this plugin.
 *
 * For more information, see https://developer.chrome.com/articles/x-google-ignore-list/
 * @returns An esbuild plugin.
 */
function createSourcemapIngorelistPlugin() {
    return {
        name: 'angular-sourcemap-ignorelist',
        setup(build) {
            if (!build.initialOptions.sourcemap) {
                return;
            }
            build.onEnd((result) => {
                if (!result.outputFiles) {
                    return;
                }
                for (const file of result.outputFiles) {
                    // Only process sourcemap files
                    if (!file.path.endsWith('.map')) {
                        continue;
                    }
                    const contents = Buffer.from(file.contents);
                    // Avoid parsing sourcemaps that have no node modules references
                    if (!contents.includes('node_modules/')) {
                        continue;
                    }
                    const map = JSON.parse(contents.toString('utf-8'));
                    const ignoreList = [];
                    // Check and store the index of each source originating from a node modules directory
                    for (let index = 0; index < map.sources.length; ++index) {
                        if (map.sources[index].startsWith('node_modules/') ||
                            map.sources[index].includes('/node_modules/')) {
                            ignoreList.push(index);
                        }
                    }
                    // Avoid regenerating the source map if nothing changed
                    if (ignoreList.length === 0) {
                        continue;
                    }
                    // Update the sourcemap in the output file
                    map[IGNORE_LIST_ID] = ignoreList;
                    file.contents = Buffer.from(JSON.stringify(map), 'utf-8');
                }
            });
        },
    };
}
exports.createSourcemapIngorelistPlugin = createSourcemapIngorelistPlugin;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic291cmNlbWFwLWlnbm9yZWxpc3QtcGx1Z2luLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvYnVpbGRfYW5ndWxhci9zcmMvYnVpbGRlcnMvYnJvd3Nlci1lc2J1aWxkL3NvdXJjZW1hcC1pZ25vcmVsaXN0LXBsdWdpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7QUFJSDs7OztHQUlHO0FBQ0gsTUFBTSxjQUFjLEdBQUcscUJBQXFCLENBQUM7QUFVN0M7Ozs7Ozs7R0FPRztBQUNILFNBQWdCLCtCQUErQjtJQUM3QyxPQUFPO1FBQ0wsSUFBSSxFQUFFLDhCQUE4QjtRQUNwQyxLQUFLLENBQUMsS0FBSztZQUNULElBQUksQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLFNBQVMsRUFBRTtnQkFDbkMsT0FBTzthQUNSO1lBRUQsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFO2dCQUNyQixJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsRUFBRTtvQkFDdkIsT0FBTztpQkFDUjtnQkFFRCxLQUFLLE1BQU0sSUFBSSxJQUFJLE1BQU0sQ0FBQyxXQUFXLEVBQUU7b0JBQ3JDLCtCQUErQjtvQkFDL0IsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFO3dCQUMvQixTQUFTO3FCQUNWO29CQUVELE1BQU0sUUFBUSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO29CQUU1QyxnRUFBZ0U7b0JBQ2hFLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxFQUFFO3dCQUN2QyxTQUFTO3FCQUNWO29CQUVELE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBYyxDQUFDO29CQUNoRSxNQUFNLFVBQVUsR0FBRyxFQUFFLENBQUM7b0JBRXRCLHFGQUFxRjtvQkFDckYsS0FBSyxJQUFJLEtBQUssR0FBRyxDQUFDLEVBQUUsS0FBSyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLEVBQUUsS0FBSyxFQUFFO3dCQUN2RCxJQUNFLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsVUFBVSxDQUFDLGVBQWUsQ0FBQzs0QkFDOUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsRUFDN0M7NEJBQ0EsVUFBVSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQzt5QkFDeEI7cUJBQ0Y7b0JBRUQsdURBQXVEO29CQUN2RCxJQUFJLFVBQVUsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO3dCQUMzQixTQUFTO3FCQUNWO29CQUVELDBDQUEwQztvQkFDMUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxHQUFHLFVBQVUsQ0FBQztvQkFDakMsSUFBSSxDQUFDLFFBQVEsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7aUJBQzNEO1lBQ0gsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO0tBQ0YsQ0FBQztBQUNKLENBQUM7QUFuREQsMEVBbURDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB0eXBlIHsgUGx1Z2luIH0gZnJvbSAnZXNidWlsZCc7XG5cbi8qKlxuICogVGhlIGZpZWxkIGlkZW50aWZpZXIgZm9yIHRoZSBzb3VyY2VtYXAgQ2hyb21lIERldnRvb2xzIGlnbm9yZSBsaXN0IGV4dGVuc2lvbi5cbiAqXG4gKiBGb2xsb3dpbmcgdGhlIG5hbWluZyBjb252ZW50aW9ucyBmcm9tIGh0dHBzOi8vc291cmNlbWFwcy5pbmZvL3NwZWMuaHRtbCNoLmdocXBqMXl0cWpibVxuICovXG5jb25zdCBJR05PUkVfTElTVF9JRCA9ICd4X2dvb2dsZV9pZ25vcmVMaXN0JztcblxuLyoqXG4gKiBNaW5pbWFsIHNvdXJjZW1hcCBvYmplY3QgcmVxdWlyZWQgdG8gY3JlYXRlIHRoZSBpZ25vcmUgbGlzdC5cbiAqL1xuaW50ZXJmYWNlIFNvdXJjZU1hcCB7XG4gIHNvdXJjZXM6IHN0cmluZ1tdO1xuICBbSUdOT1JFX0xJU1RfSURdPzogbnVtYmVyW107XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBlc2J1aWxkIHBsdWdpbiB0aGF0IHVwZGF0ZXMgZ2VuZXJhdGVkIHNvdXJjZW1hcHMgdG8gaW5jbHVkZSB0aGUgQ2hyb21lXG4gKiBEZXZUb29scyBpZ25vcmUgbGlzdCBleHRlbnNpb24uIEFsbCBzb3VyY2UgZmlsZXMgdGhhdCBvcmlnaW5hdGUgZnJvbSBhIG5vZGUgbW9kdWxlc1xuICogZGlyZWN0b3J5IGFyZSBhZGRlZCB0byB0aGUgaWdub3JlIGxpc3QgYnkgdGhpcyBwbHVnaW4uXG4gKlxuICogRm9yIG1vcmUgaW5mb3JtYXRpb24sIHNlZSBodHRwczovL2RldmVsb3Blci5jaHJvbWUuY29tL2FydGljbGVzL3gtZ29vZ2xlLWlnbm9yZS1saXN0L1xuICogQHJldHVybnMgQW4gZXNidWlsZCBwbHVnaW4uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVTb3VyY2VtYXBJbmdvcmVsaXN0UGx1Z2luKCk6IFBsdWdpbiB7XG4gIHJldHVybiB7XG4gICAgbmFtZTogJ2FuZ3VsYXItc291cmNlbWFwLWlnbm9yZWxpc3QnLFxuICAgIHNldHVwKGJ1aWxkKTogdm9pZCB7XG4gICAgICBpZiAoIWJ1aWxkLmluaXRpYWxPcHRpb25zLnNvdXJjZW1hcCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGJ1aWxkLm9uRW5kKChyZXN1bHQpID0+IHtcbiAgICAgICAgaWYgKCFyZXN1bHQub3V0cHV0RmlsZXMpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGNvbnN0IGZpbGUgb2YgcmVzdWx0Lm91dHB1dEZpbGVzKSB7XG4gICAgICAgICAgLy8gT25seSBwcm9jZXNzIHNvdXJjZW1hcCBmaWxlc1xuICAgICAgICAgIGlmICghZmlsZS5wYXRoLmVuZHNXaXRoKCcubWFwJykpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IGNvbnRlbnRzID0gQnVmZmVyLmZyb20oZmlsZS5jb250ZW50cyk7XG5cbiAgICAgICAgICAvLyBBdm9pZCBwYXJzaW5nIHNvdXJjZW1hcHMgdGhhdCBoYXZlIG5vIG5vZGUgbW9kdWxlcyByZWZlcmVuY2VzXG4gICAgICAgICAgaWYgKCFjb250ZW50cy5pbmNsdWRlcygnbm9kZV9tb2R1bGVzLycpKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCBtYXAgPSBKU09OLnBhcnNlKGNvbnRlbnRzLnRvU3RyaW5nKCd1dGYtOCcpKSBhcyBTb3VyY2VNYXA7XG4gICAgICAgICAgY29uc3QgaWdub3JlTGlzdCA9IFtdO1xuXG4gICAgICAgICAgLy8gQ2hlY2sgYW5kIHN0b3JlIHRoZSBpbmRleCBvZiBlYWNoIHNvdXJjZSBvcmlnaW5hdGluZyBmcm9tIGEgbm9kZSBtb2R1bGVzIGRpcmVjdG9yeVxuICAgICAgICAgIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCBtYXAuc291cmNlcy5sZW5ndGg7ICsraW5kZXgpIHtcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgbWFwLnNvdXJjZXNbaW5kZXhdLnN0YXJ0c1dpdGgoJ25vZGVfbW9kdWxlcy8nKSB8fFxuICAgICAgICAgICAgICBtYXAuc291cmNlc1tpbmRleF0uaW5jbHVkZXMoJy9ub2RlX21vZHVsZXMvJylcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICBpZ25vcmVMaXN0LnB1c2goaW5kZXgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIEF2b2lkIHJlZ2VuZXJhdGluZyB0aGUgc291cmNlIG1hcCBpZiBub3RoaW5nIGNoYW5nZWRcbiAgICAgICAgICBpZiAoaWdub3JlTGlzdC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIFVwZGF0ZSB0aGUgc291cmNlbWFwIGluIHRoZSBvdXRwdXQgZmlsZVxuICAgICAgICAgIG1hcFtJR05PUkVfTElTVF9JRF0gPSBpZ25vcmVMaXN0O1xuICAgICAgICAgIGZpbGUuY29udGVudHMgPSBCdWZmZXIuZnJvbShKU09OLnN0cmluZ2lmeShtYXApLCAndXRmLTgnKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSxcbiAgfTtcbn1cbiJdfQ==