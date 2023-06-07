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
exports.getKeywords = void 0;
const core_1 = require("@babel/core");
const helper_annotate_as_pure_1 = __importDefault(require("@babel/helper-annotate-as-pure"));
/**
 * Provides one or more keywords that if found within the content of a source file indicate
 * that this plugin should be used with a source file.
 *
 * @returns An a string iterable containing one or more keywords.
 */
function getKeywords() {
    return ['var'];
}
exports.getKeywords = getKeywords;
/**
 * A babel plugin factory function for adjusting TypeScript emitted enums.
 *
 * @returns A babel plugin object instance.
 */
function default_1() {
    return {
        visitor: {
            VariableDeclaration(path) {
                const { parentPath, node } = path;
                if (node.kind !== 'var' || node.declarations.length !== 1) {
                    return;
                }
                const declaration = path.get('declarations')[0];
                if (declaration.node.init) {
                    return;
                }
                const declarationId = declaration.node.id;
                if (!core_1.types.isIdentifier(declarationId)) {
                    return;
                }
                const hasExport = parentPath.isExportNamedDeclaration() || parentPath.isExportDefaultDeclaration();
                const origin = hasExport ? parentPath : path;
                const nextStatement = origin.getSibling(+origin.key + 1);
                if (!nextStatement.isExpressionStatement()) {
                    return;
                }
                const nextExpression = nextStatement.get('expression');
                if (!nextExpression.isCallExpression() || nextExpression.node.arguments.length !== 1) {
                    return;
                }
                const enumCallArgument = nextExpression.node.arguments[0];
                if (!core_1.types.isLogicalExpression(enumCallArgument, { operator: '||' })) {
                    return;
                }
                // Check if identifiers match var declaration
                if (!core_1.types.isIdentifier(enumCallArgument.left) ||
                    !nextExpression.scope.bindingIdentifierEquals(enumCallArgument.left.name, declarationId)) {
                    return;
                }
                const enumCallee = nextExpression.get('callee');
                if (!enumCallee.isFunctionExpression() || enumCallee.node.params.length !== 1) {
                    return;
                }
                const enumCalleeParam = enumCallee.node.params[0];
                const isEnumCalleeMatching = core_1.types.isIdentifier(enumCalleeParam) && enumCalleeParam.name === declarationId.name;
                let enumAssignments;
                if (isEnumCalleeMatching) {
                    enumAssignments = [];
                }
                // Check if all enum member values are pure.
                // If not, leave as-is due to potential side efects
                let hasElements = false;
                for (const enumStatement of enumCallee.get('body').get('body')) {
                    if (!enumStatement.isExpressionStatement()) {
                        return;
                    }
                    const enumValueAssignment = enumStatement.get('expression');
                    if (!enumValueAssignment.isAssignmentExpression() ||
                        !enumValueAssignment.get('right').isPure()) {
                        return;
                    }
                    hasElements = true;
                    enumAssignments?.push(enumStatement.node);
                }
                // If there are no enum elements then there is nothing to wrap
                if (!hasElements) {
                    return;
                }
                // Remove existing enum initializer
                const enumInitializer = nextExpression.node;
                nextExpression.remove();
                // Create IIFE block contents
                let blockContents;
                if (enumAssignments) {
                    // Loose mode
                    blockContents = [
                        core_1.types.expressionStatement(core_1.types.assignmentExpression('=', core_1.types.cloneNode(declarationId), core_1.types.logicalExpression('||', core_1.types.cloneNode(declarationId), core_1.types.objectExpression([])))),
                        ...enumAssignments,
                    ];
                }
                else {
                    blockContents = [core_1.types.expressionStatement(enumInitializer)];
                }
                // Wrap existing enum initializer in a pure annotated IIFE
                const container = core_1.types.arrowFunctionExpression([], core_1.types.blockStatement([
                    ...blockContents,
                    core_1.types.returnStatement(core_1.types.cloneNode(declarationId)),
                ]));
                const replacementInitializer = core_1.types.callExpression(core_1.types.parenthesizedExpression(container), []);
                (0, helper_annotate_as_pure_1.default)(replacementInitializer);
                // Add the wrapped enum initializer directly to the variable declaration
                declaration.get('init').replaceWith(replacementInitializer);
            },
        },
    };
}
exports.default = default_1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWRqdXN0LXR5cGVzY3JpcHQtZW51bXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy9iYWJlbC9wbHVnaW5zL2FkanVzdC10eXBlc2NyaXB0LWVudW1zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7Ozs7OztBQUVILHNDQUF5RDtBQUN6RCw2RkFBNEQ7QUFFNUQ7Ozs7O0dBS0c7QUFDSCxTQUFnQixXQUFXO0lBQ3pCLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNqQixDQUFDO0FBRkQsa0NBRUM7QUFFRDs7OztHQUlHO0FBQ0g7SUFDRSxPQUFPO1FBQ0wsT0FBTyxFQUFFO1lBQ1AsbUJBQW1CLENBQUMsSUFBeUM7Z0JBQzNELE1BQU0sRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDO2dCQUNsQyxJQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssS0FBSyxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtvQkFDekQsT0FBTztpQkFDUjtnQkFFRCxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNoRCxJQUFJLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFO29CQUN6QixPQUFPO2lCQUNSO2dCQUVELE1BQU0sYUFBYSxHQUFHLFdBQVcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO2dCQUMxQyxJQUFJLENBQUMsWUFBSyxDQUFDLFlBQVksQ0FBQyxhQUFhLENBQUMsRUFBRTtvQkFDdEMsT0FBTztpQkFDUjtnQkFFRCxNQUFNLFNBQVMsR0FDYixVQUFVLENBQUMsd0JBQXdCLEVBQUUsSUFBSSxVQUFVLENBQUMsMEJBQTBCLEVBQUUsQ0FBQztnQkFDbkYsTUFBTSxN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LElBQUksZUFBZSxFQUFFO29CQUNuQixhQUFhO29CQUNiLGFBQWEsR0FBRzt3QkFDZCxZQUFLLENBQUMsbUJBQW1CLENBQ3ZCLFlBQUssQ0FBQyxvQkFBb0IsQ0FDeEIsR0FBRyxFQUNILFlBQUssQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLEVBQzlCLFlBQUssQ0FBQyxpQkFBaUIsQ0FDckIsSUFBSSxFQUNKLFlBQUssQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLEVBQzlCLFlBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLENBQUMsQ0FDM0IsQ0FDRixDQUNGO3dCQUNELEdBQUcsZUFBZTtxQkFDbkIsQ0FBQztpQkFDSDtxQkFBTTtvQkFDTCxhQUFhLEdBQUcsQ0FBQyxZQUFLLENBQUMsbUJBQW1CLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQztpQkFDOUQ7Z0JBRUQsMERBQTBEO2dCQUMxRCxNQUFNLFNBQVMsR0FBRyxZQUFLLENBQUMsdUJBQXVCLENBQzdDLEVBQUUsRUFDRixZQUFLLENBQUMsY0FBYyxDQUFDO29CQUNuQixHQUFHLGFBQWE7b0JBQ2hCLFlBQUssQ0FBQyxlQUFlLENBQUMsWUFBSyxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsQ0FBQztpQkFDdEQsQ0FBQyxDQUNILENBQUM7Z0JBQ0YsTUFBTSxzQkFBc0IsR0FBRyxZQUFLLENBQUMsY0FBYyxDQUNqRCxZQUFLLENBQUMsdUJBQXVCLENBQUMsU0FBUyxDQUFDLEVBQ3hDLEVBQUUsQ0FDSCxDQUFDO2dCQUNGLElBQUEsaUNBQWMsRUFBQyxzQkFBc0IsQ0FBQyxDQUFDO2dCQUV2Qyx3RUFBd0U7Z0JBQ3hFLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsV0FBVyxDQUFDLHNCQUFzQixDQUFDLENBQUM7WUFDOUQsQ0FBQztTQUNGO0tBQ0YsQ0FBQztBQUNKLENBQUM7QUFqSUQsNEJBaUlDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7IE5vZGVQYXRoLCBQbHVnaW5PYmosIHR5cGVzIH0gZnJvbSAnQGJhYmVsL2NvcmUnO1xuaW1wb3J0IGFubm90YXRlQXNQdXJlIGZyb20gJ0BiYWJlbC9oZWxwZXItYW5ub3RhdGUtYXMtcHVyZSc7XG5cbi8qKlxuICogUHJvdmlkZXMgb25lIG9yIG1vcmUga2V5d29yZHMgdGhhdCBpZiBmb3VuZCB3aXRoaW4gdGhlIGNvbnRlbnQgb2YgYSBzb3VyY2UgZmlsZSBpbmRpY2F0ZVxuICogdGhhdCB0aGlzIHBsdWdpbiBzaG91bGQgYmUgdXNlZCB3aXRoIGEgc291cmNlIGZpbGUuXG4gKlxuICogQHJldHVybnMgQW4gYSBzdHJpbmcgaXRlcmFibGUgY29udGFpbmluZyBvbmUgb3IgbW9yZSBrZXl3b3Jkcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEtleXdvcmRzKCk6IEl0ZXJhYmxlPHN0cmluZz4ge1xuICByZXR1cm4gWyd2YXInXTtcbn1cblxuLyoqXG4gKiBBIGJhYmVsIHBsdWdpbiBmYWN0b3J5IGZ1bmN0aW9uIGZvciBhZGp1c3RpbmcgVHlwZVNjcmlwdCBlbWl0dGVkIGVudW1zLlxuICpcbiAqIEByZXR1cm5zIEEgYmFiZWwgcGx1Z2luIG9iamVjdCBpbnN0YW5jZS5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gKCk6IFBsdWdpbk9iaiB7XG4gIHJldHVybiB7XG4gICAgdmlzaXRvcjoge1xuICAgICAgVmFyaWFibGVEZWNsYXJhdGlvbihwYXRoOiBOb2RlUGF0aDx0eXBlcy5WYXJpYWJsZURlY2xhcmF0aW9uPikge1xuICAgICAgICBjb25zdCB7IHBhcmVudFBhdGgsIG5vZGUgfSA9IHBhdGg7XG4gICAgICAgIGlmIChub2RlLmtpbmQgIT09ICd2YXInIHx8IG5vZGUuZGVjbGFyYXRpb25zLmxlbmd0aCAhPT0gMSkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGRlY2xhcmF0aW9uID0gcGF0aC5nZXQoJ2RlY2xhcmF0aW9ucycpWzBdO1xuICAgICAgICBpZiAoZGVjbGFyYXRpb24ubm9kZS5pbml0KSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZGVjbGFyYXRpb25JZCA9IGRlY2xhcmF0aW9uLm5vZGUuaWQ7XG4gICAgICAgIGlmICghdHlwZXMuaXNJZGVudGlmaWVyKGRlY2xhcmF0aW9uSWQpKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgaGFzRXhwb3J0ID1cbiAgICAgICAgICBwYXJlbnRQYXRoLmlzRXhwb3J0TmFtZWREZWNsYXJhdGlvbigpIHx8IHBhcmVudFBhdGguaXNFeHBvcnREZWZhdWx0RGVjbGFyYXRpb24oKTtcbiAgICAgICAgY29uc3Qgb3JpZ2luID0gaGFzRXhwb3J0ID8gcGFyZW50UGF0aCA6IHBhdGg7XG4gICAgICAgIGNvbnN0IG5leHRTdGF0ZW1lbnQgPSBvcmlnaW4uZ2V0U2libGluZygrb3JpZ2luLmtleSArIDEpO1xuICAgICAgICBpZiAoIW5leHRTdGF0ZW1lbnQuaXNFeHByZXNzaW9uU3RhdGVtZW50KCkpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBuZXh0RXhwcmVzc2lvbiA9IG5leHRTdGF0ZW1lbnQuZ2V0KCdleHByZXNzaW9uJyk7XG4gICAgICAgIGlmICghbmV4dEV4cHJlc3Npb24uaXNDYWxsRXhwcmVzc2lvbigpIHx8IG5leHRFeHByZXNzaW9uLm5vZGUuYXJndW1lbnRzLmxlbmd0aCAhPT0gMSkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGVudW1DYWxsQXJndW1lbnQgPSBuZXh0RXhwcmVzc2lvbi5ub2RlLmFyZ3VtZW50c1swXTtcbiAgICAgICAgaWYgKCF0eXBlcy5pc0xvZ2ljYWxFeHByZXNzaW9uKGVudW1DYWxsQXJndW1lbnQsIHsgb3BlcmF0b3I6ICd8fCcgfSkpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDaGVjayBpZiBpZGVudGlmaWVycyBtYXRjaCB2YXIgZGVjbGFyYXRpb25cbiAgICAgICAgaWYgKFxuICAgICAgICAgICF0eXBlcy5pc0lkZW50aWZpZXIoZW51bUNhbGxBcmd1bWVudC5sZWZ0KSB8fFxuICAgICAgICAgICFuZXh0RXhwcmVzc2lvbi5zY29wZS5iaW5kaW5nSWRlbnRpZmllckVxdWFscyhlbnVtQ2FsbEFyZ3VtZW50LmxlZnQubmFtZSwgZGVjbGFyYXRpb25JZClcbiAgICAgICAgKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZW51bUNhbGxlZSA9IG5leHRFeHByZXNzaW9uLmdldCgnY2FsbGVlJyk7XG4gICAgICAgIGlmICghZW51bUNhbGxlZS5pc0Z1bmN0aW9uRXhwcmVzc2lvbigpIHx8IGVudW1DYWxsZWUubm9kZS5wYXJhbXMubGVuZ3RoICE9PSAxKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZW51bUNhbGxlZVBhcmFtID0gZW51bUNhbGxlZS5ub2RlLnBhcmFtc1swXTtcbiAgICAgICAgY29uc3QgaXNFbnVtQ2FsbGVlTWF0Y2hpbmcgPVxuICAgICAgICAgIHR5cGVzLmlzSWRlbnRpZmllcihlbnVtQ2FsbGVlUGFyYW0pICYmIGVudW1DYWxsZWVQYXJhbS5uYW1lID09PSBkZWNsYXJhdGlvbklkLm5hbWU7XG5cbiAgICAgICAgbGV0IGVudW1Bc3NpZ25tZW50czogdHlwZXMuRXhwcmVzc2lvblN0YXRlbWVudFtdIHwgdW5kZWZpbmVkO1xuICAgICAgICBpZiAoaXNFbnVtQ2FsbGVlTWF0Y2hpbmcpIHtcbiAgICAgICAgICBlbnVtQXNzaWdubWVudHMgPSBbXTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENoZWNrIGlmIGFsbCBlbnVtIG1lbWJlciB2YWx1ZXMgYXJlIHB1cmUuXG4gICAgICAgIC8vIElmIG5vdCwgbGVhdmUgYXMtaXMgZHVlIHRvIHBvdGVudGlhbCBzaWRlIGVmZWN0c1xuICAgICAgICBsZXQgaGFzRWxlbWVudHMgPSBmYWxzZTtcbiAgICAgICAgZm9yIChjb25zdCBlbnVtU3RhdGVtZW50IG9mIGVudW1DYWxsZWUuZ2V0KCdib2R5JykuZ2V0KCdib2R5JykpIHtcbiAgICAgICAgICBpZiAoIWVudW1TdGF0ZW1lbnQuaXNFeHByZXNzaW9uU3RhdGVtZW50KCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCBlbnVtVmFsdWVBc3NpZ25tZW50ID0gZW51bVN0YXRlbWVudC5nZXQoJ2V4cHJlc3Npb24nKTtcbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAhZW51bVZhbHVlQXNzaWdubWVudC5pc0Fzc2lnbm1lbnRFeHByZXNzaW9uKCkgfHxcbiAgICAgICAgICAgICFlbnVtVmFsdWVBc3NpZ25tZW50LmdldCgncmlnaHQnKS5pc1B1cmUoKVxuICAgICAgICAgICkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGhhc0VsZW1lbnRzID0gdHJ1ZTtcbiAgICAgICAgICBlbnVtQXNzaWdubWVudHM/LnB1c2goZW51bVN0YXRlbWVudC5ub2RlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIHRoZXJlIGFyZSBubyBlbnVtIGVsZW1lbnRzIHRoZW4gdGhlcmUgaXMgbm90aGluZyB0byB3cmFwXG4gICAgICAgIGlmICghaGFzRWxlbWVudHMpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBSZW1vdmUgZXhpc3RpbmcgZW51bSBpbml0aWFsaXplclxuICAgICAgICBjb25zdCBlbnVtSW5pdGlhbGl6ZXIgPSBuZXh0RXhwcmVzc2lvbi5ub2RlO1xuICAgICAgICBuZXh0RXhwcmVzc2lvbi5yZW1vdmUoKTtcblxuICAgICAgICAvLyBDcmVhdGUgSUlGRSBibG9jayBjb250ZW50c1xuICAgICAgICBsZXQgYmxvY2tDb250ZW50cztcbiAgICAgICAgaWYgKGVudW1Bc3NpZ25tZW50cykge1xuICAgICAgICAgIC8vIExvb3NlIG1vZGVcbiAgICAgICAgICBibG9ja0NvbnRlbnRzID0gW1xuICAgICAgICAgICAgdHlwZXMuZXhwcmVzc2lvblN0YXRlbWVudChcbiAgICAgICAgICAgICAgdHlwZXMuYXNzaWdubWVudEV4cHJlc3Npb24oXG4gICAgICAgICAgICAgICAgJz0nLFxuICAgICAgICAgICAgICAgIHR5cGVzLmNsb25lTm9kZShkZWNsYXJhdGlvbklkKSxcbiAgICAgICAgICAgICAgICB0eXBlcy5sb2dpY2FsRXhwcmVzc2lvbihcbiAgICAgICAgICAgICAgICAgICd8fCcsXG4gICAgICAgICAgICAgICAgICB0eXBlcy5jbG9uZU5vZGUoZGVjbGFyYXRpb25JZCksXG4gICAgICAgICAgICAgICAgICB0eXBlcy5vYmplY3RFeHByZXNzaW9uKFtdKSxcbiAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgKSxcbiAgICAgICAgICAgIC4uLmVudW1Bc3NpZ25tZW50cyxcbiAgICAgICAgICBdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGJsb2NrQ29udGVudHMgPSBbdHlwZXMuZXhwcmVzc2lvblN0YXRlbWVudChlbnVtSW5pdGlhbGl6ZXIpXTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFdyYXAgZXhpc3RpbmcgZW51bSBpbml0aWFsaXplciBpbiBhIHB1cmUgYW5ub3RhdGVkIElJRkVcbiAgICAgICAgY29uc3QgY29udGFpbmVyID0gdHlwZXMuYXJyb3dGdW5jdGlvbkV4cHJlc3Npb24oXG4gICAgICAgICAgW10sXG4gICAgICAgICAgdHlwZXMuYmxvY2tTdGF0ZW1lbnQoW1xuICAgICAgICAgICAgLi4uYmxvY2tDb250ZW50cyxcbiAgICAgICAgICAgIHR5cGVzLnJldHVyblN0YXRlbWVudCh0eXBlcy5jbG9uZU5vZGUoZGVjbGFyYXRpb25JZCkpLFxuICAgICAgICAgIF0pLFxuICAgICAgICApO1xuICAgICAgICBjb25zdCByZXBsYWNlbWVudEluaXRpYWxpemVyID0gdHlwZXMuY2FsbEV4cHJlc3Npb24oXG4gICAgICAgICAgdHlwZXMucGFyZW50aGVzaXplZEV4cHJlc3Npb24oY29udGFpbmVyKSxcbiAgICAgICAgICBbXSxcbiAgICAgICAgKTtcbiAgICAgICAgYW5ub3RhdGVBc1B1cmUocmVwbGFjZW1lbnRJbml0aWFsaXplcik7XG5cbiAgICAgICAgLy8gQWRkIHRoZSB3cmFwcGVkIGVudW0gaW5pdGlhbGl6ZXIgZGlyZWN0bHkgdG8gdGhlIHZhcmlhYmxlIGRlY2xhcmF0aW9uXG4gICAgICAgIGRlY2xhcmF0aW9uLmdldCgnaW5pdCcpLnJlcGxhY2VXaXRoKHJlcGxhY2VtZW50SW5pdGlhbGl6ZXIpO1xuICAgICAgfSxcbiAgICB9LFxuICB9O1xufVxuIl19