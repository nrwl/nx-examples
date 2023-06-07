"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@babel/core");
const helper_annotate_as_pure_1 = __importDefault(require("@babel/helper-annotate-as-pure"));
const tslib = __importStar(require("tslib"));
/**
 * A cached set of TypeScript helper function names used by the helper name matcher utility function.
 */
const tslibHelpers = new Set(Object.keys(tslib).filter((h) => h.startsWith('__')));
/**
 * Determinates whether an identifier name matches one of the TypeScript helper function names.
 *
 * @param name The identifier name to check.
 * @returns True, if the name matches a TypeScript helper name; otherwise, false.
 */
function isTslibHelperName(name) {
    const nameParts = name.split('$');
    const originalName = nameParts[0];
    if (nameParts.length > 2 || (nameParts.length === 2 && isNaN(+nameParts[1]))) {
        return false;
    }
    return tslibHelpers.has(originalName);
}
/**
 * A babel plugin factory function for adding the PURE annotation to top-level new and call expressions.
 *
 * @returns A babel plugin object instance.
 */
function default_1() {
    return {
        visitor: {
            CallExpression(path) {
                // If the expression has a function parent, it is not top-level
                if (path.getFunctionParent()) {
                    return;
                }
                const callee = path.node.callee;
                if (core_1.types.isFunctionExpression(callee) && path.node.arguments.length !== 0) {
                    return;
                }
                // Do not annotate TypeScript helpers emitted by the TypeScript compiler.
                // TypeScript helpers are intended to cause side effects.
                if (core_1.types.isIdentifier(callee) && isTslibHelperName(callee.name)) {
                    return;
                }
                (0, helper_annotate_as_pure_1.default)(path);
            },
            NewExpression(path) {
                // If the expression has a function parent, it is not top-level
                if (!path.getFunctionParent()) {
                    (0, helper_annotate_as_pure_1.default)(path);
                }
            },
        },
    };
}
exports.default = default_1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHVyZS10b3BsZXZlbC1mdW5jdGlvbnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy9iYWJlbC9wbHVnaW5zL3B1cmUtdG9wbGV2ZWwtZnVuY3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFSCxzQ0FBeUQ7QUFDekQsNkZBQTREO0FBQzVELDZDQUErQjtBQUUvQjs7R0FFRztBQUNILE1BQU0sWUFBWSxHQUFHLElBQUksR0FBRyxDQUFTLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUUzRjs7Ozs7R0FLRztBQUNILFNBQVMsaUJBQWlCLENBQUMsSUFBWTtJQUNyQyxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ2xDLE1BQU0sWUFBWSxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUVsQyxJQUFJLFNBQVMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sS0FBSyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRTtRQUM1RSxPQUFPLEtBQUssQ0FBQztLQUNkO0lBRUQsT0FBTyxZQUFZLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBQ3hDLENBQUM7QUFFRDs7OztHQUlHO0FBQ0g7SUFDRSxPQUFPO1FBQ0wsT0FBTyxFQUFFO1lBQ1AsY0FBYyxDQUFDLElBQW9DO2dCQUNqRCwrREFBK0Q7Z0JBQy9ELElBQUksSUFBSSxDQUFDLGlCQUFpQixFQUFFLEVBQUU7b0JBQzVCLE9BQU87aUJBQ1I7Z0JBRUQsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7Z0JBQ2hDLElBQUksWUFBSyxDQUFDLG9CQUFvQixDQUFDLE1BQU0sQ0FBQyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7b0JBQzFFLE9BQU87aUJBQ1I7Z0JBQ0QseUVBQXlFO2dCQUN6RSx5REFBeUQ7Z0JBQ3pELElBQUksWUFBSyxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsSUFBSSxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUU7b0JBQ2hFLE9BQU87aUJBQ1I7Z0JBRUQsSUFBQSxpQ0FBYyxFQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3ZCLENBQUM7WUFDRCxhQUFhLENBQUMsSUFBbUM7Z0JBQy9DLCtEQUErRDtnQkFDL0QsSUFBSSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxFQUFFO29CQUM3QixJQUFBLGlDQUFjLEVBQUMsSUFBSSxDQUFDLENBQUM7aUJBQ3RCO1lBQ0gsQ0FBQztTQUNGO0tBQ0YsQ0FBQztBQUNKLENBQUM7QUE3QkQsNEJBNkJDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7IE5vZGVQYXRoLCBQbHVnaW5PYmosIHR5cGVzIH0gZnJvbSAnQGJhYmVsL2NvcmUnO1xuaW1wb3J0IGFubm90YXRlQXNQdXJlIGZyb20gJ0BiYWJlbC9oZWxwZXItYW5ub3RhdGUtYXMtcHVyZSc7XG5pbXBvcnQgKiBhcyB0c2xpYiBmcm9tICd0c2xpYic7XG5cbi8qKlxuICogQSBjYWNoZWQgc2V0IG9mIFR5cGVTY3JpcHQgaGVscGVyIGZ1bmN0aW9uIG5hbWVzIHVzZWQgYnkgdGhlIGhlbHBlciBuYW1lIG1hdGNoZXIgdXRpbGl0eSBmdW5jdGlvbi5cbiAqL1xuY29uc3QgdHNsaWJIZWxwZXJzID0gbmV3IFNldDxzdHJpbmc+KE9iamVjdC5rZXlzKHRzbGliKS5maWx0ZXIoKGgpID0+IGguc3RhcnRzV2l0aCgnX18nKSkpO1xuXG4vKipcbiAqIERldGVybWluYXRlcyB3aGV0aGVyIGFuIGlkZW50aWZpZXIgbmFtZSBtYXRjaGVzIG9uZSBvZiB0aGUgVHlwZVNjcmlwdCBoZWxwZXIgZnVuY3Rpb24gbmFtZXMuXG4gKlxuICogQHBhcmFtIG5hbWUgVGhlIGlkZW50aWZpZXIgbmFtZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIFRydWUsIGlmIHRoZSBuYW1lIG1hdGNoZXMgYSBUeXBlU2NyaXB0IGhlbHBlciBuYW1lOyBvdGhlcndpc2UsIGZhbHNlLlxuICovXG5mdW5jdGlvbiBpc1RzbGliSGVscGVyTmFtZShuYW1lOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgY29uc3QgbmFtZVBhcnRzID0gbmFtZS5zcGxpdCgnJCcpO1xuICBjb25zdCBvcmlnaW5hbE5hbWUgPSBuYW1lUGFydHNbMF07XG5cbiAgaWYgKG5hbWVQYXJ0cy5sZW5ndGggPiAyIHx8IChuYW1lUGFydHMubGVuZ3RoID09PSAyICYmIGlzTmFOKCtuYW1lUGFydHNbMV0pKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHJldHVybiB0c2xpYkhlbHBlcnMuaGFzKG9yaWdpbmFsTmFtZSk7XG59XG5cbi8qKlxuICogQSBiYWJlbCBwbHVnaW4gZmFjdG9yeSBmdW5jdGlvbiBmb3IgYWRkaW5nIHRoZSBQVVJFIGFubm90YXRpb24gdG8gdG9wLWxldmVsIG5ldyBhbmQgY2FsbCBleHByZXNzaW9ucy5cbiAqXG4gKiBAcmV0dXJucyBBIGJhYmVsIHBsdWdpbiBvYmplY3QgaW5zdGFuY2UuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uICgpOiBQbHVnaW5PYmoge1xuICByZXR1cm4ge1xuICAgIHZpc2l0b3I6IHtcbiAgICAgIENhbGxFeHByZXNzaW9uKHBhdGg6IE5vZGVQYXRoPHR5cGVzLkNhbGxFeHByZXNzaW9uPikge1xuICAgICAgICAvLyBJZiB0aGUgZXhwcmVzc2lvbiBoYXMgYSBmdW5jdGlvbiBwYXJlbnQsIGl0IGlzIG5vdCB0b3AtbGV2ZWxcbiAgICAgICAgaWYgKHBhdGguZ2V0RnVuY3Rpb25QYXJlbnQoKSkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGNhbGxlZSA9IHBhdGgubm9kZS5jYWxsZWU7XG4gICAgICAgIGlmICh0eXBlcy5pc0Z1bmN0aW9uRXhwcmVzc2lvbihjYWxsZWUpICYmIHBhdGgubm9kZS5hcmd1bWVudHMubGVuZ3RoICE9PSAwKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIC8vIERvIG5vdCBhbm5vdGF0ZSBUeXBlU2NyaXB0IGhlbHBlcnMgZW1pdHRlZCBieSB0aGUgVHlwZVNjcmlwdCBjb21waWxlci5cbiAgICAgICAgLy8gVHlwZVNjcmlwdCBoZWxwZXJzIGFyZSBpbnRlbmRlZCB0byBjYXVzZSBzaWRlIGVmZmVjdHMuXG4gICAgICAgIGlmICh0eXBlcy5pc0lkZW50aWZpZXIoY2FsbGVlKSAmJiBpc1RzbGliSGVscGVyTmFtZShjYWxsZWUubmFtZSkpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBhbm5vdGF0ZUFzUHVyZShwYXRoKTtcbiAgICAgIH0sXG4gICAgICBOZXdFeHByZXNzaW9uKHBhdGg6IE5vZGVQYXRoPHR5cGVzLk5ld0V4cHJlc3Npb24+KSB7XG4gICAgICAgIC8vIElmIHRoZSBleHByZXNzaW9uIGhhcyBhIGZ1bmN0aW9uIHBhcmVudCwgaXQgaXMgbm90IHRvcC1sZXZlbFxuICAgICAgICBpZiAoIXBhdGguZ2V0RnVuY3Rpb25QYXJlbnQoKSkge1xuICAgICAgICAgIGFubm90YXRlQXNQdXJlKHBhdGgpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgIH0sXG4gIH07XG59XG4iXX0=