"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getKeywords = void 0;
const core_1 = require("@babel/core");
/**
 * The name of the Angular class metadata function created by the Angular compiler.
 */
const SET_CLASS_METADATA_NAME = 'ɵsetClassMetadata';
/**
 * Provides one or more keywords that if found within the content of a source file indicate
 * that this plugin should be used with a source file.
 *
 * @returns An a string iterable containing one or more keywords.
 */
function getKeywords() {
    return [SET_CLASS_METADATA_NAME];
}
exports.getKeywords = getKeywords;
/**
 * A babel plugin factory function for eliding the Angular class metadata function (`ɵsetClassMetadata`).
 *
 * @returns A babel plugin object instance.
 */
function default_1() {
    return {
        visitor: {
            CallExpression(path) {
                const callee = path.node.callee;
                // The function being called must be the metadata function name
                let calleeName;
                if (core_1.types.isMemberExpression(callee) && core_1.types.isIdentifier(callee.property)) {
                    calleeName = callee.property.name;
                }
                else if (core_1.types.isIdentifier(callee)) {
                    calleeName = callee.name;
                }
                if (calleeName !== SET_CLASS_METADATA_NAME) {
                    return;
                }
                // There must be four arguments that meet the following criteria:
                // * First must be an identifier
                // * Second must be an array literal
                const callArguments = path.node.arguments;
                if (callArguments.length !== 4 ||
                    !core_1.types.isIdentifier(callArguments[0]) ||
                    !core_1.types.isArrayExpression(callArguments[1])) {
                    return;
                }
                // The metadata function is always emitted inside a function expression
                if (!path.getFunctionParent()?.isFunctionExpression()) {
                    return;
                }
                // Replace the metadata function with `void 0` which is the equivalent return value
                // of the metadata function.
                path.replaceWith(path.scope.buildUndefinedNode());
            },
        },
    };
}
exports.default = default_1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWxpZGUtYW5ndWxhci1tZXRhZGF0YS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2J1aWxkX2FuZ3VsYXIvc3JjL2JhYmVsL3BsdWdpbnMvZWxpZGUtYW5ndWxhci1tZXRhZGF0YS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HOzs7QUFFSCxzQ0FBeUQ7QUFFekQ7O0dBRUc7QUFDSCxNQUFNLHVCQUF1QixHQUFHLG1CQUFtQixDQUFDO0FBRXBEOzs7OztHQUtHO0FBQ0gsU0FBZ0IsV0FBVztJQUN6QixPQUFPLENBQUMsdUJBQXVCLENBQUMsQ0FBQztBQUNuQyxDQUFDO0FBRkQsa0NBRUM7QUFFRDs7OztHQUlHO0FBQ0g7SUFDRSxPQUFPO1FBQ0wsT0FBTyxFQUFFO1lBQ1AsY0FBYyxDQUFDLElBQW9DO2dCQUNqRCxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQztnQkFFaEMsK0RBQStEO2dCQUMvRCxJQUFJLFVBQVUsQ0FBQztnQkFDZixJQUFJLFlBQUssQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsSUFBSSxZQUFLLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsRUFBRTtvQkFDM0UsVUFBVSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDO2lCQUNuQztxQkFBTSxJQUFJLFlBQUssQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLEVBQUU7b0JBQ3JDLFVBQVUsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDO2lCQUMxQjtnQkFDRCxJQUFJLFVBQVUsS0FBSyx1QkFBdUIsRUFBRTtvQkFDMUMsT0FBTztpQkFDUjtnQkFFRCxpRUFBaUU7Z0JBQ2pFLGdDQUFnQztnQkFDaEMsb0NBQW9DO2dCQUNwQyxNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQztnQkFDMUMsSUFDRSxhQUFhLENBQUMsTUFBTSxLQUFLLENBQUM7b0JBQzFCLENBQUMsWUFBSyxDQUFDLFlBQVksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ3JDLENBQUMsWUFBSyxDQUFDLGlCQUFpQixDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUMxQztvQkFDQSxPQUFPO2lCQUNSO2dCQUVELHVFQUF1RTtnQkFDdkUsSUFBSSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxFQUFFLG9CQUFvQixFQUFFLEVBQUU7b0JBQ3JELE9BQU87aUJBQ1I7Z0JBRUQsbUZBQW1GO2dCQUNuRiw0QkFBNEI7Z0JBQzVCLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsRUFBRSxDQUFDLENBQUM7WUFDcEQsQ0FBQztTQUNGO0tBQ0YsQ0FBQztBQUNKLENBQUM7QUF4Q0QsNEJBd0NDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7IE5vZGVQYXRoLCBQbHVnaW5PYmosIHR5cGVzIH0gZnJvbSAnQGJhYmVsL2NvcmUnO1xuXG4vKipcbiAqIFRoZSBuYW1lIG9mIHRoZSBBbmd1bGFyIGNsYXNzIG1ldGFkYXRhIGZ1bmN0aW9uIGNyZWF0ZWQgYnkgdGhlIEFuZ3VsYXIgY29tcGlsZXIuXG4gKi9cbmNvbnN0IFNFVF9DTEFTU19NRVRBREFUQV9OQU1FID0gJ8m1c2V0Q2xhc3NNZXRhZGF0YSc7XG5cbi8qKlxuICogUHJvdmlkZXMgb25lIG9yIG1vcmUga2V5d29yZHMgdGhhdCBpZiBmb3VuZCB3aXRoaW4gdGhlIGNvbnRlbnQgb2YgYSBzb3VyY2UgZmlsZSBpbmRpY2F0ZVxuICogdGhhdCB0aGlzIHBsdWdpbiBzaG91bGQgYmUgdXNlZCB3aXRoIGEgc291cmNlIGZpbGUuXG4gKlxuICogQHJldHVybnMgQW4gYSBzdHJpbmcgaXRlcmFibGUgY29udGFpbmluZyBvbmUgb3IgbW9yZSBrZXl3b3Jkcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEtleXdvcmRzKCk6IEl0ZXJhYmxlPHN0cmluZz4ge1xuICByZXR1cm4gW1NFVF9DTEFTU19NRVRBREFUQV9OQU1FXTtcbn1cblxuLyoqXG4gKiBBIGJhYmVsIHBsdWdpbiBmYWN0b3J5IGZ1bmN0aW9uIGZvciBlbGlkaW5nIHRoZSBBbmd1bGFyIGNsYXNzIG1ldGFkYXRhIGZ1bmN0aW9uIChgybVzZXRDbGFzc01ldGFkYXRhYCkuXG4gKlxuICogQHJldHVybnMgQSBiYWJlbCBwbHVnaW4gb2JqZWN0IGluc3RhbmNlLlxuICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiAoKTogUGx1Z2luT2JqIHtcbiAgcmV0dXJuIHtcbiAgICB2aXNpdG9yOiB7XG4gICAgICBDYWxsRXhwcmVzc2lvbihwYXRoOiBOb2RlUGF0aDx0eXBlcy5DYWxsRXhwcmVzc2lvbj4pIHtcbiAgICAgICAgY29uc3QgY2FsbGVlID0gcGF0aC5ub2RlLmNhbGxlZTtcblxuICAgICAgICAvLyBUaGUgZnVuY3Rpb24gYmVpbmcgY2FsbGVkIG11c3QgYmUgdGhlIG1ldGFkYXRhIGZ1bmN0aW9uIG5hbWVcbiAgICAgICAgbGV0IGNhbGxlZU5hbWU7XG4gICAgICAgIGlmICh0eXBlcy5pc01lbWJlckV4cHJlc3Npb24oY2FsbGVlKSAmJiB0eXBlcy5pc0lkZW50aWZpZXIoY2FsbGVlLnByb3BlcnR5KSkge1xuICAgICAgICAgIGNhbGxlZU5hbWUgPSBjYWxsZWUucHJvcGVydHkubmFtZTtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlcy5pc0lkZW50aWZpZXIoY2FsbGVlKSkge1xuICAgICAgICAgIGNhbGxlZU5hbWUgPSBjYWxsZWUubmFtZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY2FsbGVlTmFtZSAhPT0gU0VUX0NMQVNTX01FVEFEQVRBX05BTUUpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUaGVyZSBtdXN0IGJlIGZvdXIgYXJndW1lbnRzIHRoYXQgbWVldCB0aGUgZm9sbG93aW5nIGNyaXRlcmlhOlxuICAgICAgICAvLyAqIEZpcnN0IG11c3QgYmUgYW4gaWRlbnRpZmllclxuICAgICAgICAvLyAqIFNlY29uZCBtdXN0IGJlIGFuIGFycmF5IGxpdGVyYWxcbiAgICAgICAgY29uc3QgY2FsbEFyZ3VtZW50cyA9IHBhdGgubm9kZS5hcmd1bWVudHM7XG4gICAgICAgIGlmIChcbiAgICAgICAgICBjYWxsQXJndW1lbnRzLmxlbmd0aCAhPT0gNCB8fFxuICAgICAgICAgICF0eXBlcy5pc0lkZW50aWZpZXIoY2FsbEFyZ3VtZW50c1swXSkgfHxcbiAgICAgICAgICAhdHlwZXMuaXNBcnJheUV4cHJlc3Npb24oY2FsbEFyZ3VtZW50c1sxXSlcbiAgICAgICAgKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVGhlIG1ldGFkYXRhIGZ1bmN0aW9uIGlzIGFsd2F5cyBlbWl0dGVkIGluc2lkZSBhIGZ1bmN0aW9uIGV4cHJlc3Npb25cbiAgICAgICAgaWYgKCFwYXRoLmdldEZ1bmN0aW9uUGFyZW50KCk/LmlzRnVuY3Rpb25FeHByZXNzaW9uKCkpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBSZXBsYWNlIHRoZSBtZXRhZGF0YSBmdW5jdGlvbiB3aXRoIGB2b2lkIDBgIHdoaWNoIGlzIHRoZSBlcXVpdmFsZW50IHJldHVybiB2YWx1ZVxuICAgICAgICAvLyBvZiB0aGUgbWV0YWRhdGEgZnVuY3Rpb24uXG4gICAgICAgIHBhdGgucmVwbGFjZVdpdGgocGF0aC5zY29wZS5idWlsZFVuZGVmaW5lZE5vZGUoKSk7XG4gICAgICB9LFxuICAgIH0sXG4gIH07XG59XG4iXX0=