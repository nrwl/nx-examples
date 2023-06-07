"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformSupportedBrowsersToTargets = void 0;
/**
 * Transform browserlists result to esbuild target.
 * @see https://esbuild.github.io/api/#target
 */
function transformSupportedBrowsersToTargets(supportedBrowsers) {
    const transformed = [];
    // https://esbuild.github.io/api/#target
    const esBuildSupportedBrowsers = new Set([
        'chrome',
        'edge',
        'firefox',
        'ie',
        'ios',
        'node',
        'opera',
        'safari',
    ]);
    for (const browser of supportedBrowsers) {
        let [browserName, version] = browser.toLowerCase().split(' ');
        // browserslist uses the name `ios_saf` for iOS Safari whereas esbuild uses `ios`
        if (browserName === 'ios_saf') {
            browserName = 'ios';
        }
        // browserslist uses ranges `15.2-15.3` versions but only the lowest is required
        // to perform minimum supported feature checks. esbuild also expects a single version.
        [version] = version.split('-');
        if (esBuildSupportedBrowsers.has(browserName)) {
            if (browserName === 'safari' && version === 'tp') {
                // esbuild only supports numeric versions so `TP` is converted to a high number (999) since
                // a Technology Preview (TP) of Safari is assumed to support all currently known features.
                version = '999';
            }
            else if (!version.includes('.')) {
                // A lone major version is considered by esbuild to include all minor versions. However,
                // browserslist does not and is also inconsistent in its `.0` version naming. For example,
                // Safari 15.0 is named `safari 15` but Safari 16.0 is named `safari 16.0`.
                version += '.0';
            }
            transformed.push(browserName + version);
        }
    }
    return transformed;
}
exports.transformSupportedBrowsersToTargets = transformSupportedBrowsersToTargets;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXNidWlsZC10YXJnZXRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvYnVpbGRfYW5ndWxhci9zcmMvdXRpbHMvZXNidWlsZC10YXJnZXRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7OztBQUVIOzs7R0FHRztBQUNILFNBQWdCLG1DQUFtQyxDQUFDLGlCQUEyQjtJQUM3RSxNQUFNLFdBQVcsR0FBYSxFQUFFLENBQUM7SUFFakMsd0NBQXdDO0lBQ3hDLE1BQU0sd0JBQXdCLEdBQUcsSUFBSSxHQUFHLENBQUM7UUFDdkMsUUFBUTtRQUNSLE1BQU07UUFDTixTQUFTO1FBQ1QsSUFBSTtRQUNKLEtBQUs7UUFDTCxNQUFNO1FBQ04sT0FBTztRQUNQLFFBQVE7S0FDVCxDQUFDLENBQUM7SUFFSCxLQUFLLE1BQU0sT0FBTyxJQUFJLGlCQUFpQixFQUFFO1FBQ3ZDLElBQUksQ0FBQyxXQUFXLEVBQUUsT0FBTyxDQUFDLEdBQUcsT0FBTyxDQUFDLFdBQVcsRUFBRSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUU5RCxpRkFBaUY7UUFDakYsSUFBSSxXQUFXLEtBQUssU0FBUyxFQUFFO1lBQzdCLFdBQVcsR0FBRyxLQUFLLENBQUM7U0FDckI7UUFFRCxnRkFBZ0Y7UUFDaEYsc0ZBQXNGO1FBQ3RGLENBQUMsT0FBTyxDQUFDLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUUvQixJQUFJLHdCQUF3QixDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsRUFBRTtZQUM3QyxJQUFJLFdBQVcsS0FBSyxRQUFRLElBQUksT0FBTyxLQUFLLElBQUksRUFBRTtnQkFDaEQsMkZBQTJGO2dCQUMzRiwwRkFBMEY7Z0JBQzFGLE9BQU8sR0FBRyxLQUFLLENBQUM7YUFDakI7aUJBQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEVBQUU7Z0JBQ2pDLHdGQUF3RjtnQkFDeEYsMEZBQTBGO2dCQUMxRiwyRUFBMkU7Z0JBQzNFLE9BQU8sSUFBSSxJQUFJLENBQUM7YUFDakI7WUFFRCxXQUFXLENBQUMsSUFBSSxDQUFDLFdBQVcsR0FBRyxPQUFPLENBQUMsQ0FBQztTQUN6QztLQUNGO0lBRUQsT0FBTyxXQUFXLENBQUM7QUFDckIsQ0FBQztBQTVDRCxrRkE0Q0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuLyoqXG4gKiBUcmFuc2Zvcm0gYnJvd3Nlcmxpc3RzIHJlc3VsdCB0byBlc2J1aWxkIHRhcmdldC5cbiAqIEBzZWUgaHR0cHM6Ly9lc2J1aWxkLmdpdGh1Yi5pby9hcGkvI3RhcmdldFxuICovXG5leHBvcnQgZnVuY3Rpb24gdHJhbnNmb3JtU3VwcG9ydGVkQnJvd3NlcnNUb1RhcmdldHMoc3VwcG9ydGVkQnJvd3NlcnM6IHN0cmluZ1tdKTogc3RyaW5nW10ge1xuICBjb25zdCB0cmFuc2Zvcm1lZDogc3RyaW5nW10gPSBbXTtcblxuICAvLyBodHRwczovL2VzYnVpbGQuZ2l0aHViLmlvL2FwaS8jdGFyZ2V0XG4gIGNvbnN0IGVzQnVpbGRTdXBwb3J0ZWRCcm93c2VycyA9IG5ldyBTZXQoW1xuICAgICdjaHJvbWUnLFxuICAgICdlZGdlJyxcbiAgICAnZmlyZWZveCcsXG4gICAgJ2llJyxcbiAgICAnaW9zJyxcbiAgICAnbm9kZScsXG4gICAgJ29wZXJhJyxcbiAgICAnc2FmYXJpJyxcbiAgXSk7XG5cbiAgZm9yIChjb25zdCBicm93c2VyIG9mIHN1cHBvcnRlZEJyb3dzZXJzKSB7XG4gICAgbGV0IFticm93c2VyTmFtZSwgdmVyc2lvbl0gPSBicm93c2VyLnRvTG93ZXJDYXNlKCkuc3BsaXQoJyAnKTtcblxuICAgIC8vIGJyb3dzZXJzbGlzdCB1c2VzIHRoZSBuYW1lIGBpb3Nfc2FmYCBmb3IgaU9TIFNhZmFyaSB3aGVyZWFzIGVzYnVpbGQgdXNlcyBgaW9zYFxuICAgIGlmIChicm93c2VyTmFtZSA9PT0gJ2lvc19zYWYnKSB7XG4gICAgICBicm93c2VyTmFtZSA9ICdpb3MnO1xuICAgIH1cblxuICAgIC8vIGJyb3dzZXJzbGlzdCB1c2VzIHJhbmdlcyBgMTUuMi0xNS4zYCB2ZXJzaW9ucyBidXQgb25seSB0aGUgbG93ZXN0IGlzIHJlcXVpcmVkXG4gICAgLy8gdG8gcGVyZm9ybSBtaW5pbXVtIHN1cHBvcnRlZCBmZWF0dXJlIGNoZWNrcy4gZXNidWlsZCBhbHNvIGV4cGVjdHMgYSBzaW5nbGUgdmVyc2lvbi5cbiAgICBbdmVyc2lvbl0gPSB2ZXJzaW9uLnNwbGl0KCctJyk7XG5cbiAgICBpZiAoZXNCdWlsZFN1cHBvcnRlZEJyb3dzZXJzLmhhcyhicm93c2VyTmFtZSkpIHtcbiAgICAgIGlmIChicm93c2VyTmFtZSA9PT0gJ3NhZmFyaScgJiYgdmVyc2lvbiA9PT0gJ3RwJykge1xuICAgICAgICAvLyBlc2J1aWxkIG9ubHkgc3VwcG9ydHMgbnVtZXJpYyB2ZXJzaW9ucyBzbyBgVFBgIGlzIGNvbnZlcnRlZCB0byBhIGhpZ2ggbnVtYmVyICg5OTkpIHNpbmNlXG4gICAgICAgIC8vIGEgVGVjaG5vbG9neSBQcmV2aWV3IChUUCkgb2YgU2FmYXJpIGlzIGFzc3VtZWQgdG8gc3VwcG9ydCBhbGwgY3VycmVudGx5IGtub3duIGZlYXR1cmVzLlxuICAgICAgICB2ZXJzaW9uID0gJzk5OSc7XG4gICAgICB9IGVsc2UgaWYgKCF2ZXJzaW9uLmluY2x1ZGVzKCcuJykpIHtcbiAgICAgICAgLy8gQSBsb25lIG1ham9yIHZlcnNpb24gaXMgY29uc2lkZXJlZCBieSBlc2J1aWxkIHRvIGluY2x1ZGUgYWxsIG1pbm9yIHZlcnNpb25zLiBIb3dldmVyLFxuICAgICAgICAvLyBicm93c2Vyc2xpc3QgZG9lcyBub3QgYW5kIGlzIGFsc28gaW5jb25zaXN0ZW50IGluIGl0cyBgLjBgIHZlcnNpb24gbmFtaW5nLiBGb3IgZXhhbXBsZSxcbiAgICAgICAgLy8gU2FmYXJpIDE1LjAgaXMgbmFtZWQgYHNhZmFyaSAxNWAgYnV0IFNhZmFyaSAxNi4wIGlzIG5hbWVkIGBzYWZhcmkgMTYuMGAuXG4gICAgICAgIHZlcnNpb24gKz0gJy4wJztcbiAgICAgIH1cblxuICAgICAgdHJhbnNmb3JtZWQucHVzaChicm93c2VyTmFtZSArIHZlcnNpb24pO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0cmFuc2Zvcm1lZDtcbn1cbiJdfQ==