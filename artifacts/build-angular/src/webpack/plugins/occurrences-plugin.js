"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OccurrencesPlugin = void 0;
const PLUGIN_NAME = 'angular-occurrences-plugin';
class OccurrencesPlugin {
    constructor(options) {
        this.options = options;
    }
    apply(compiler) {
        compiler.hooks.thisCompilation.tap(PLUGIN_NAME, (compilation) => {
            compilation.hooks.processAssets.tapPromise({
                name: PLUGIN_NAME,
                stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ANALYSE,
            }, async (compilationAssets) => {
                for (const assetName of Object.keys(compilationAssets)) {
                    if (!assetName.endsWith('.js')) {
                        continue;
                    }
                    const scriptAsset = compilation.getAsset(assetName);
                    if (!scriptAsset || scriptAsset.source.size() <= 0) {
                        continue;
                    }
                    const src = scriptAsset.source.source().toString('utf-8');
                    let ngComponentCount = 0;
                    if (!this.options.aot) {
                        // Count the number of `Component({` strings (case sensitive), which happens in __decorate().
                        ngComponentCount += this.countOccurrences(src, 'Component({');
                    }
                    if (this.options.scriptsOptimization) {
                        // for ascii_only true
                        ngComponentCount += this.countOccurrences(src, '.\\u0275cmp', false);
                    }
                    else {
                        // For Ivy we just count ɵcmp.src
                        ngComponentCount += this.countOccurrences(src, '.ɵcmp', true);
                    }
                    compilation.updateAsset(assetName, (s) => s, (assetInfo) => ({
                        ...assetInfo,
                        ngComponentCount,
                    }));
                }
            });
        });
    }
    countOccurrences(source, match, wordBreak = false) {
        let count = 0;
        // We condition here so branch prediction happens out of the loop, not in it.
        if (wordBreak) {
            const re = /\w/;
            for (let pos = source.lastIndexOf(match); pos >= 0; pos = source.lastIndexOf(match, pos)) {
                if (!(re.test(source[pos - 1] || '') || re.test(source[pos + match.length] || ''))) {
                    count++; // 1 match, AH! AH! AH! 2 matches, AH! AH! AH!
                }
                pos -= match.length;
                if (pos < 0) {
                    break;
                }
            }
        }
        else {
            for (let pos = source.lastIndexOf(match); pos >= 0; pos = source.lastIndexOf(match, pos)) {
                count++; // 1 match, AH! AH! AH! 2 matches, AH! AH! AH!
                pos -= match.length;
                if (pos < 0) {
                    break;
                }
            }
        }
        return count;
    }
}
exports.OccurrencesPlugin = OccurrencesPlugin;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib2NjdXJyZW5jZXMtcGx1Z2luLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvYnVpbGRfYW5ndWxhci9zcmMvd2VicGFjay9wbHVnaW5zL29jY3VycmVuY2VzLXBsdWdpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7QUFJSCxNQUFNLFdBQVcsR0FBRyw0QkFBNEIsQ0FBQztBQU9qRCxNQUFhLGlCQUFpQjtJQUM1QixZQUFvQixPQUFpQztRQUFqQyxZQUFPLEdBQVAsT0FBTyxDQUEwQjtJQUFHLENBQUM7SUFFekQsS0FBSyxDQUFDLFFBQWtCO1FBQ3RCLFFBQVEsQ0FBQyxLQUFLLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxXQUFXLEVBQUUsRUFBRTtZQUM5RCxXQUFXLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQ3hDO2dCQUNFLElBQUksRUFBRSxXQUFXO2dCQUNqQixLQUFLLEVBQUUsUUFBUSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsNEJBQTRCO2FBQ2pFLEVBQ0QsS0FBSyxFQUFFLGlCQUFpQixFQUFFLEVBQUU7Z0JBQzFCLEtBQUssTUFBTSxTQUFTLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFO29CQUN0RCxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsRUFBRTt3QkFDOUIsU0FBUztxQkFDVjtvQkFFRCxNQUFNLFdBQVcsR0FBRyxXQUFXLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDO29CQUNwRCxJQUFJLENBQUMsV0FBVyxJQUFJLFdBQVcsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxFQUFFO3dCQUNsRCxTQUFTO3FCQUNWO29CQUVELE1BQU0sR0FBRyxHQUFHLFdBQVcsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDO29CQUUxRCxJQUFJLGdCQUFnQixHQUFHLENBQUMsQ0FBQztvQkFFekIsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFO3dCQUNyQiw2RkFBNkY7d0JBQzdGLGdCQUFnQixJQUFJLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLEVBQUUsYUFBYSxDQUFDLENBQUM7cUJBQy9EO29CQUVELElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxtQkFBbUIsRUFBRTt3QkFDcEMsc0JBQXNCO3dCQUN0QixnQkFBZ0IsSUFBSSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxFQUFFLGFBQWEsRUFBRSxLQUFLLENBQUMsQ0FBQztxQkFDdEU7eUJBQU07d0JBQ0wsaUNBQWlDO3dCQUNqQyxnQkFBZ0IsSUFBSSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztxQkFDL0Q7b0JBRUQsV0FBVyxDQUFDLFdBQVcsQ0FDckIsU0FBUyxFQUNULENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQ1IsQ0FBQyxTQUFTLEVBQUUsRUFBRSxDQUFDLENBQUM7d0JBQ2QsR0FBRyxTQUFTO3dCQUNaLGdCQUFnQjtxQkFDakIsQ0FBQyxDQUNILENBQUM7aUJBQ0g7WUFDSCxDQUFDLENBQ0YsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVPLGdCQUFnQixDQUFDLE1BQWMsRUFBRSxLQUFhLEVBQUUsU0FBUyxHQUFHLEtBQUs7UUFDdkUsSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDO1FBRWQsNkVBQTZFO1FBQzdFLElBQUksU0FBUyxFQUFFO1lBQ2IsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDO1lBQ2hCLEtBQUssSUFBSSxHQUFHLEdBQUcsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxFQUFFLEdBQUcsR0FBRyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsRUFBRTtnQkFDeEYsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsRUFBRTtvQkFDbEYsS0FBSyxFQUFFLENBQUMsQ0FBQyw4Q0FBOEM7aUJBQ3hEO2dCQUVELEdBQUcsSUFBSSxLQUFLLENBQUMsTUFBTSxDQUFDO2dCQUNwQixJQUFJLEdBQUcsR0FBRyxDQUFDLEVBQUU7b0JBQ1gsTUFBTTtpQkFDUDthQUNGO1NBQ0Y7YUFBTTtZQUNMLEtBQUssSUFBSSxHQUFHLEdBQUcsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxFQUFFLEdBQUcsR0FBRyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsRUFBRTtnQkFDeEYsS0FBSyxFQUFFLENBQUMsQ0FBQyw4Q0FBOEM7Z0JBQ3ZELEdBQUcsSUFBSSxLQUFLLENBQUMsTUFBTSxDQUFDO2dCQUNwQixJQUFJLEdBQUcsR0FBRyxDQUFDLEVBQUU7b0JBQ1gsTUFBTTtpQkFDUDthQUNGO1NBQ0Y7UUFFRCxPQUFPLEtBQUssQ0FBQztJQUNmLENBQUM7Q0FDRjtBQWhGRCw4Q0FnRkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHsgQ29tcGlsZXIgfSBmcm9tICd3ZWJwYWNrJztcblxuY29uc3QgUExVR0lOX05BTUUgPSAnYW5ndWxhci1vY2N1cnJlbmNlcy1wbHVnaW4nO1xuXG5leHBvcnQgaW50ZXJmYWNlIE9jY3VycmVuY2VzUGx1Z2luT3B0aW9ucyB7XG4gIGFvdD86IGJvb2xlYW47XG4gIHNjcmlwdHNPcHRpbWl6YXRpb24/OiBib29sZWFuO1xufVxuXG5leHBvcnQgY2xhc3MgT2NjdXJyZW5jZXNQbHVnaW4ge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIG9wdGlvbnM6IE9jY3VycmVuY2VzUGx1Z2luT3B0aW9ucykge31cblxuICBhcHBseShjb21waWxlcjogQ29tcGlsZXIpIHtcbiAgICBjb21waWxlci5ob29rcy50aGlzQ29tcGlsYXRpb24udGFwKFBMVUdJTl9OQU1FLCAoY29tcGlsYXRpb24pID0+IHtcbiAgICAgIGNvbXBpbGF0aW9uLmhvb2tzLnByb2Nlc3NBc3NldHMudGFwUHJvbWlzZShcbiAgICAgICAge1xuICAgICAgICAgIG5hbWU6IFBMVUdJTl9OQU1FLFxuICAgICAgICAgIHN0YWdlOiBjb21waWxlci53ZWJwYWNrLkNvbXBpbGF0aW9uLlBST0NFU1NfQVNTRVRTX1NUQUdFX0FOQUxZU0UsXG4gICAgICAgIH0sXG4gICAgICAgIGFzeW5jIChjb21waWxhdGlvbkFzc2V0cykgPT4ge1xuICAgICAgICAgIGZvciAoY29uc3QgYXNzZXROYW1lIG9mIE9iamVjdC5rZXlzKGNvbXBpbGF0aW9uQXNzZXRzKSkge1xuICAgICAgICAgICAgaWYgKCFhc3NldE5hbWUuZW5kc1dpdGgoJy5qcycpKSB7XG4gICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBzY3JpcHRBc3NldCA9IGNvbXBpbGF0aW9uLmdldEFzc2V0KGFzc2V0TmFtZSk7XG4gICAgICAgICAgICBpZiAoIXNjcmlwdEFzc2V0IHx8IHNjcmlwdEFzc2V0LnNvdXJjZS5zaXplKCkgPD0gMCkge1xuICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3Qgc3JjID0gc2NyaXB0QXNzZXQuc291cmNlLnNvdXJjZSgpLnRvU3RyaW5nKCd1dGYtOCcpO1xuXG4gICAgICAgICAgICBsZXQgbmdDb21wb25lbnRDb3VudCA9IDA7XG5cbiAgICAgICAgICAgIGlmICghdGhpcy5vcHRpb25zLmFvdCkge1xuICAgICAgICAgICAgICAvLyBDb3VudCB0aGUgbnVtYmVyIG9mIGBDb21wb25lbnQoe2Agc3RyaW5ncyAoY2FzZSBzZW5zaXRpdmUpLCB3aGljaCBoYXBwZW5zIGluIF9fZGVjb3JhdGUoKS5cbiAgICAgICAgICAgICAgbmdDb21wb25lbnRDb3VudCArPSB0aGlzLmNvdW50T2NjdXJyZW5jZXMoc3JjLCAnQ29tcG9uZW50KHsnKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5zY3JpcHRzT3B0aW1pemF0aW9uKSB7XG4gICAgICAgICAgICAgIC8vIGZvciBhc2NpaV9vbmx5IHRydWVcbiAgICAgICAgICAgICAgbmdDb21wb25lbnRDb3VudCArPSB0aGlzLmNvdW50T2NjdXJyZW5jZXMoc3JjLCAnLlxcXFx1MDI3NWNtcCcsIGZhbHNlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIC8vIEZvciBJdnkgd2UganVzdCBjb3VudCDJtWNtcC5zcmNcbiAgICAgICAgICAgICAgbmdDb21wb25lbnRDb3VudCArPSB0aGlzLmNvdW50T2NjdXJyZW5jZXMoc3JjLCAnLsm1Y21wJywgdHJ1ZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbXBpbGF0aW9uLnVwZGF0ZUFzc2V0KFxuICAgICAgICAgICAgICBhc3NldE5hbWUsXG4gICAgICAgICAgICAgIChzKSA9PiBzLFxuICAgICAgICAgICAgICAoYXNzZXRJbmZvKSA9PiAoe1xuICAgICAgICAgICAgICAgIC4uLmFzc2V0SW5mbyxcbiAgICAgICAgICAgICAgICBuZ0NvbXBvbmVudENvdW50LFxuICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgKTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgY291bnRPY2N1cnJlbmNlcyhzb3VyY2U6IHN0cmluZywgbWF0Y2g6IHN0cmluZywgd29yZEJyZWFrID0gZmFsc2UpOiBudW1iZXIge1xuICAgIGxldCBjb3VudCA9IDA7XG5cbiAgICAvLyBXZSBjb25kaXRpb24gaGVyZSBzbyBicmFuY2ggcHJlZGljdGlvbiBoYXBwZW5zIG91dCBvZiB0aGUgbG9vcCwgbm90IGluIGl0LlxuICAgIGlmICh3b3JkQnJlYWspIHtcbiAgICAgIGNvbnN0IHJlID0gL1xcdy87XG4gICAgICBmb3IgKGxldCBwb3MgPSBzb3VyY2UubGFzdEluZGV4T2YobWF0Y2gpOyBwb3MgPj0gMDsgcG9zID0gc291cmNlLmxhc3RJbmRleE9mKG1hdGNoLCBwb3MpKSB7XG4gICAgICAgIGlmICghKHJlLnRlc3Qoc291cmNlW3BvcyAtIDFdIHx8ICcnKSB8fCByZS50ZXN0KHNvdXJjZVtwb3MgKyBtYXRjaC5sZW5ndGhdIHx8ICcnKSkpIHtcbiAgICAgICAgICBjb3VudCsrOyAvLyAxIG1hdGNoLCBBSCEgQUghIEFIISAyIG1hdGNoZXMsIEFIISBBSCEgQUghXG4gICAgICAgIH1cblxuICAgICAgICBwb3MgLT0gbWF0Y2gubGVuZ3RoO1xuICAgICAgICBpZiAocG9zIDwgMCkge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGZvciAobGV0IHBvcyA9IHNvdXJjZS5sYXN0SW5kZXhPZihtYXRjaCk7IHBvcyA+PSAwOyBwb3MgPSBzb3VyY2UubGFzdEluZGV4T2YobWF0Y2gsIHBvcykpIHtcbiAgICAgICAgY291bnQrKzsgLy8gMSBtYXRjaCwgQUghIEFIISBBSCEgMiBtYXRjaGVzLCBBSCEgQUghIEFIIVxuICAgICAgICBwb3MgLT0gbWF0Y2gubGVuZ3RoO1xuICAgICAgICBpZiAocG9zIDwgMCkge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGNvdW50O1xuICB9XG59XG4iXX0=