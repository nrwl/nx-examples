"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSupportedBrowsers = void 0;
const browserslist_1 = __importDefault(require("browserslist"));
function getSupportedBrowsers(projectRoot, logger) {
    browserslist_1.default.defaults = [
        'last 2 Chrome versions',
        'last 1 Firefox version',
        'last 2 Edge major versions',
        'last 2 Safari major versions',
        'last 2 iOS major versions',
        'Firefox ESR',
    ];
    // Get browsers from config or default.
    const browsersFromConfigOrDefault = new Set((0, browserslist_1.default)(undefined, { path: projectRoot }));
    // Get browsers that support ES6 modules.
    const browsersThatSupportEs6 = new Set((0, browserslist_1.default)('supports es6-module'));
    const unsupportedBrowsers = [];
    for (const browser of browsersFromConfigOrDefault) {
        if (!browsersThatSupportEs6.has(browser)) {
            browsersFromConfigOrDefault.delete(browser);
            unsupportedBrowsers.push(browser);
        }
    }
    if (unsupportedBrowsers.length) {
        logger.warn(`One or more browsers which are configured in the project's Browserslist configuration ` +
            'will be ignored as ES5 output is not supported by the Angular CLI.\n' +
            `Ignored browsers: ${unsupportedBrowsers.join(', ')}`);
    }
    return Array.from(browsersFromConfigOrDefault);
}
exports.getSupportedBrowsers = getSupportedBrowsers;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3VwcG9ydGVkLWJyb3dzZXJzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvYnVpbGRfYW5ndWxhci9zcmMvdXRpbHMvc3VwcG9ydGVkLWJyb3dzZXJzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7Ozs7OztBQUdILGdFQUF3QztBQUV4QyxTQUFnQixvQkFBb0IsQ0FBQyxXQUFtQixFQUFFLE1BQXlCO0lBQ2pGLHNCQUFZLENBQUMsUUFBUSxHQUFHO1FBQ3RCLHdCQUF3QjtRQUN4Qix3QkFBd0I7UUFDeEIsNEJBQTRCO1FBQzVCLDhCQUE4QjtRQUM5QiwyQkFBMkI7UUFDM0IsYUFBYTtLQUNkLENBQUM7SUFFRix1Q0FBdUM7SUFDdkMsTUFBTSwyQkFBMkIsR0FBRyxJQUFJLEdBQUcsQ0FBQyxJQUFBLHNCQUFZLEVBQUMsU0FBUyxFQUFFLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUU1Rix5Q0FBeUM7SUFDekMsTUFBTSxzQkFBc0IsR0FBRyxJQUFJLEdBQUcsQ0FBQyxJQUFBLHNCQUFZLEVBQUMscUJBQXFCLENBQUMsQ0FBQyxDQUFDO0lBRTVFLE1BQU0sbUJBQW1CLEdBQWEsRUFBRSxDQUFDO0lBQ3pDLEtBQUssTUFBTSxPQUFPLElBQUksMkJBQTJCLEVBQUU7UUFDakQsSUFBSSxDQUFDLHNCQUFzQixDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsRUFBRTtZQUN4QywyQkFBMkIsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDNUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1NBQ25DO0tBQ0Y7SUFFRCxJQUFJLG1CQUFtQixDQUFDLE1BQU0sRUFBRTtRQUM5QixNQUFNLENBQUMsSUFBSSxDQUNULHdGQUF3RjtZQUN0RixzRUFBc0U7WUFDdEUscUJBQXFCLG1CQUFtQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUN4RCxDQUFDO0tBQ0g7SUFFRCxPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsMkJBQTJCLENBQUMsQ0FBQztBQUNqRCxDQUFDO0FBakNELG9EQWlDQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBsb2dnaW5nIH0gZnJvbSAnQGFuZ3VsYXItZGV2a2l0L2NvcmUnO1xuaW1wb3J0IGJyb3dzZXJzbGlzdCBmcm9tICdicm93c2Vyc2xpc3QnO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0U3VwcG9ydGVkQnJvd3NlcnMocHJvamVjdFJvb3Q6IHN0cmluZywgbG9nZ2VyOiBsb2dnaW5nLkxvZ2dlckFwaSk6IHN0cmluZ1tdIHtcbiAgYnJvd3NlcnNsaXN0LmRlZmF1bHRzID0gW1xuICAgICdsYXN0IDIgQ2hyb21lIHZlcnNpb25zJyxcbiAgICAnbGFzdCAxIEZpcmVmb3ggdmVyc2lvbicsXG4gICAgJ2xhc3QgMiBFZGdlIG1ham9yIHZlcnNpb25zJyxcbiAgICAnbGFzdCAyIFNhZmFyaSBtYWpvciB2ZXJzaW9ucycsXG4gICAgJ2xhc3QgMiBpT1MgbWFqb3IgdmVyc2lvbnMnLFxuICAgICdGaXJlZm94IEVTUicsXG4gIF07XG5cbiAgLy8gR2V0IGJyb3dzZXJzIGZyb20gY29uZmlnIG9yIGRlZmF1bHQuXG4gIGNvbnN0IGJyb3dzZXJzRnJvbUNvbmZpZ09yRGVmYXVsdCA9IG5ldyBTZXQoYnJvd3NlcnNsaXN0KHVuZGVmaW5lZCwgeyBwYXRoOiBwcm9qZWN0Um9vdCB9KSk7XG5cbiAgLy8gR2V0IGJyb3dzZXJzIHRoYXQgc3VwcG9ydCBFUzYgbW9kdWxlcy5cbiAgY29uc3QgYnJvd3NlcnNUaGF0U3VwcG9ydEVzNiA9IG5ldyBTZXQoYnJvd3NlcnNsaXN0KCdzdXBwb3J0cyBlczYtbW9kdWxlJykpO1xuXG4gIGNvbnN0IHVuc3VwcG9ydGVkQnJvd3NlcnM6IHN0cmluZ1tdID0gW107XG4gIGZvciAoY29uc3QgYnJvd3NlciBvZiBicm93c2Vyc0Zyb21Db25maWdPckRlZmF1bHQpIHtcbiAgICBpZiAoIWJyb3dzZXJzVGhhdFN1cHBvcnRFczYuaGFzKGJyb3dzZXIpKSB7XG4gICAgICBicm93c2Vyc0Zyb21Db25maWdPckRlZmF1bHQuZGVsZXRlKGJyb3dzZXIpO1xuICAgICAgdW5zdXBwb3J0ZWRCcm93c2Vycy5wdXNoKGJyb3dzZXIpO1xuICAgIH1cbiAgfVxuXG4gIGlmICh1bnN1cHBvcnRlZEJyb3dzZXJzLmxlbmd0aCkge1xuICAgIGxvZ2dlci53YXJuKFxuICAgICAgYE9uZSBvciBtb3JlIGJyb3dzZXJzIHdoaWNoIGFyZSBjb25maWd1cmVkIGluIHRoZSBwcm9qZWN0J3MgQnJvd3NlcnNsaXN0IGNvbmZpZ3VyYXRpb24gYCArXG4gICAgICAgICd3aWxsIGJlIGlnbm9yZWQgYXMgRVM1IG91dHB1dCBpcyBub3Qgc3VwcG9ydGVkIGJ5IHRoZSBBbmd1bGFyIENMSS5cXG4nICtcbiAgICAgICAgYElnbm9yZWQgYnJvd3NlcnM6ICR7dW5zdXBwb3J0ZWRCcm93c2Vycy5qb2luKCcsICcpfWAsXG4gICAgKTtcbiAgfVxuXG4gIHJldHVybiBBcnJheS5mcm9tKGJyb3dzZXJzRnJvbUNvbmZpZ09yRGVmYXVsdCk7XG59XG4iXX0=