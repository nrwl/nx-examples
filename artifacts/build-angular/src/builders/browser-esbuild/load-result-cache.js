"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _MemoryLoadResultCache_loadResults, _MemoryLoadResultCache_fileDependencies;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryLoadResultCache = void 0;
class MemoryLoadResultCache {
    constructor() {
        _MemoryLoadResultCache_loadResults.set(this, new Map());
        _MemoryLoadResultCache_fileDependencies.set(this, new Map());
    }
    get(path) {
        return __classPrivateFieldGet(this, _MemoryLoadResultCache_loadResults, "f").get(path);
    }
    async put(path, result) {
        __classPrivateFieldGet(this, _MemoryLoadResultCache_loadResults, "f").set(path, result);
        if (result.watchFiles) {
            for (const watchFile of result.watchFiles) {
                let affected = __classPrivateFieldGet(this, _MemoryLoadResultCache_fileDependencies, "f").get(watchFile);
                if (affected === undefined) {
                    affected = new Set();
                    __classPrivateFieldGet(this, _MemoryLoadResultCache_fileDependencies, "f").set(watchFile, affected);
                }
                affected.add(path);
            }
        }
    }
    invalidate(path) {
        const affected = __classPrivateFieldGet(this, _MemoryLoadResultCache_fileDependencies, "f").get(path);
        let found = false;
        if (affected) {
            affected.forEach((a) => (found || (found = __classPrivateFieldGet(this, _MemoryLoadResultCache_loadResults, "f").delete(a))));
            __classPrivateFieldGet(this, _MemoryLoadResultCache_fileDependencies, "f").delete(path);
        }
        found || (found = __classPrivateFieldGet(this, _MemoryLoadResultCache_loadResults, "f").delete(path));
        return found;
    }
}
exports.MemoryLoadResultCache = MemoryLoadResultCache;
_MemoryLoadResultCache_loadResults = new WeakMap(), _MemoryLoadResultCache_fileDependencies = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9hZC1yZXN1bHQtY2FjaGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy9idWlsZGVycy9icm93c2VyLWVzYnVpbGQvbG9hZC1yZXN1bHQtY2FjaGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7O0FBU0gsTUFBYSxxQkFBcUI7SUFBbEM7UUFDRSw2Q0FBZSxJQUFJLEdBQUcsRUFBd0IsRUFBQztRQUMvQyxrREFBb0IsSUFBSSxHQUFHLEVBQXVCLEVBQUM7SUFpQ3JELENBQUM7SUEvQkMsR0FBRyxDQUFDLElBQVk7UUFDZCxPQUFPLHVCQUFBLElBQUksMENBQWEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDckMsQ0FBQztJQUVELEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBWSxFQUFFLE1BQW9CO1FBQzFDLHVCQUFBLElBQUksMENBQWEsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ3BDLElBQUksTUFBTSxDQUFDLFVBQVUsRUFBRTtZQUNyQixLQUFLLE1BQU0sU0FBUyxJQUFJLE1BQU0sQ0FBQyxVQUFVLEVBQUU7Z0JBQ3pDLElBQUksUUFBUSxHQUFHLHVCQUFBLElBQUksK0NBQWtCLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUNyRCxJQUFJLFFBQVEsS0FBSyxTQUFTLEVBQUU7b0JBQzFCLFFBQVEsR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFDO29CQUNyQix1QkFBQSxJQUFJLCtDQUFrQixDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsUUFBUSxDQUFDLENBQUM7aUJBQ2pEO2dCQUNELFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDcEI7U0FDRjtJQUNILENBQUM7SUFFRCxVQUFVLENBQUMsSUFBWTtRQUNyQixNQUFNLFFBQVEsR0FBRyx1QkFBQSxJQUFJLCtDQUFrQixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNsRCxJQUFJLEtBQUssR0FBRyxLQUFLLENBQUM7UUFFbEIsSUFBSSxRQUFRLEVBQUU7WUFDWixRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEtBQUssS0FBTCxLQUFLLEdBQUssdUJBQUEsSUFBSSwwQ0FBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7WUFDakUsdUJBQUEsSUFBSSwrQ0FBa0IsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDckM7UUFFRCxLQUFLLEtBQUwsS0FBSyxHQUFLLHVCQUFBLElBQUksMENBQWEsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUM7UUFFekMsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDO0NBQ0Y7QUFuQ0Qsc0RBbUNDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB0eXBlIHsgT25Mb2FkUmVzdWx0IH0gZnJvbSAnZXNidWlsZCc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgTG9hZFJlc3VsdENhY2hlIHtcbiAgZ2V0KHBhdGg6IHN0cmluZyk6IE9uTG9hZFJlc3VsdCB8IHVuZGVmaW5lZDtcbiAgcHV0KHBhdGg6IHN0cmluZywgcmVzdWx0OiBPbkxvYWRSZXN1bHQpOiBQcm9taXNlPHZvaWQ+O1xufVxuXG5leHBvcnQgY2xhc3MgTWVtb3J5TG9hZFJlc3VsdENhY2hlIGltcGxlbWVudHMgTG9hZFJlc3VsdENhY2hlIHtcbiAgI2xvYWRSZXN1bHRzID0gbmV3IE1hcDxzdHJpbmcsIE9uTG9hZFJlc3VsdD4oKTtcbiAgI2ZpbGVEZXBlbmRlbmNpZXMgPSBuZXcgTWFwPHN0cmluZywgU2V0PHN0cmluZz4+KCk7XG5cbiAgZ2V0KHBhdGg6IHN0cmluZyk6IE9uTG9hZFJlc3VsdCB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuI2xvYWRSZXN1bHRzLmdldChwYXRoKTtcbiAgfVxuXG4gIGFzeW5jIHB1dChwYXRoOiBzdHJpbmcsIHJlc3VsdDogT25Mb2FkUmVzdWx0KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhpcy4jbG9hZFJlc3VsdHMuc2V0KHBhdGgsIHJlc3VsdCk7XG4gICAgaWYgKHJlc3VsdC53YXRjaEZpbGVzKSB7XG4gICAgICBmb3IgKGNvbnN0IHdhdGNoRmlsZSBvZiByZXN1bHQud2F0Y2hGaWxlcykge1xuICAgICAgICBsZXQgYWZmZWN0ZWQgPSB0aGlzLiNmaWxlRGVwZW5kZW5jaWVzLmdldCh3YXRjaEZpbGUpO1xuICAgICAgICBpZiAoYWZmZWN0ZWQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIGFmZmVjdGVkID0gbmV3IFNldCgpO1xuICAgICAgICAgIHRoaXMuI2ZpbGVEZXBlbmRlbmNpZXMuc2V0KHdhdGNoRmlsZSwgYWZmZWN0ZWQpO1xuICAgICAgICB9XG4gICAgICAgIGFmZmVjdGVkLmFkZChwYXRoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBpbnZhbGlkYXRlKHBhdGg6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IGFmZmVjdGVkID0gdGhpcy4jZmlsZURlcGVuZGVuY2llcy5nZXQocGF0aCk7XG4gICAgbGV0IGZvdW5kID0gZmFsc2U7XG5cbiAgICBpZiAoYWZmZWN0ZWQpIHtcbiAgICAgIGFmZmVjdGVkLmZvckVhY2goKGEpID0+IChmb3VuZCB8fD0gdGhpcy4jbG9hZFJlc3VsdHMuZGVsZXRlKGEpKSk7XG4gICAgICB0aGlzLiNmaWxlRGVwZW5kZW5jaWVzLmRlbGV0ZShwYXRoKTtcbiAgICB9XG5cbiAgICBmb3VuZCB8fD0gdGhpcy4jbG9hZFJlc3VsdHMuZGVsZXRlKHBhdGgpO1xuXG4gICAgcmV0dXJuIGZvdW5kO1xuICB9XG59XG4iXX0=