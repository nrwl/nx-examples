"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.urlJoin = void 0;
function urlJoin(...parts) {
    const [p, ...rest] = parts;
    // Remove trailing slash from first part
    // Join all parts with `/`
    // Dedupe double slashes from path names
    return p.replace(/\/$/, '') + ('/' + rest.join('/')).replace(/\/\/+/g, '/');
}
exports.urlJoin = urlJoin;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXJsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvYnVpbGRfYW5ndWxhci9zcmMvdXRpbHMvdXJsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7OztBQUVILFNBQWdCLE9BQU8sQ0FBQyxHQUFHLEtBQWU7SUFDeEMsTUFBTSxDQUFDLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxHQUFHLEtBQUssQ0FBQztJQUUzQix3Q0FBd0M7SUFDeEMsMEJBQTBCO0lBQzFCLHdDQUF3QztJQUN4QyxPQUFPLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0FBQzlFLENBQUM7QUFQRCwwQkFPQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5leHBvcnQgZnVuY3Rpb24gdXJsSm9pbiguLi5wYXJ0czogc3RyaW5nW10pOiBzdHJpbmcge1xuICBjb25zdCBbcCwgLi4ucmVzdF0gPSBwYXJ0cztcblxuICAvLyBSZW1vdmUgdHJhaWxpbmcgc2xhc2ggZnJvbSBmaXJzdCBwYXJ0XG4gIC8vIEpvaW4gYWxsIHBhcnRzIHdpdGggYC9gXG4gIC8vIERlZHVwZSBkb3VibGUgc2xhc2hlcyBmcm9tIHBhdGggbmFtZXNcbiAgcmV0dXJuIHAucmVwbGFjZSgvXFwvJC8sICcnKSArICgnLycgKyByZXN0LmpvaW4oJy8nKSkucmVwbGFjZSgvXFwvXFwvKy9nLCAnLycpO1xufVxuIl19