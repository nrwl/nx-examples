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
const helper_split_export_declaration_1 = __importDefault(require("@babel/helper-split-export-declaration"));
/**
 * The name of the Typescript decorator helper function created by the TypeScript compiler.
 */
const TSLIB_DECORATE_HELPER_NAME = '__decorate';
/**
 * The set of Angular static fields that should always be wrapped.
 * These fields may appear to have side effects but are safe to remove if the associated class
 * is otherwise unused within the output.
 */
const angularStaticsToWrap = new Set([
    'ɵcmp',
    'ɵdir',
    'ɵfac',
    'ɵinj',
    'ɵmod',
    'ɵpipe',
    'ɵprov',
    'INJECTOR_KEY',
]);
/**
 * An object map of static fields and related value checks for discovery of Angular generated
 * JIT related static fields.
 */
const angularStaticsToElide = {
    'ctorParameters'(path) {
        return path.isFunctionExpression() || path.isArrowFunctionExpression();
    },
    'decorators'(path) {
        return path.isArrayExpression();
    },
    'propDecorators'(path) {
        return path.isObjectExpression();
    },
};
/**
 * Provides one or more keywords that if found within the content of a source file indicate
 * that this plugin should be used with a source file.
 *
 * @returns An a string iterable containing one or more keywords.
 */
function getKeywords() {
    return ['class'];
}
exports.getKeywords = getKeywords;
/**
 * Determines whether a property and its initializer value can be safely wrapped in a pure
 * annotated IIFE. Values that may cause side effects are not considered safe to wrap.
 * Wrapping such values may cause runtime errors and/or incorrect runtime behavior.
 *
 * @param propertyName The name of the property to analyze.
 * @param assignmentValue The initializer value that will be assigned to the property.
 * @returns If the property can be safely wrapped, then true; otherwise, false.
 */
function canWrapProperty(propertyName, assignmentValue) {
    if (angularStaticsToWrap.has(propertyName)) {
        return true;
    }
    const { leadingComments } = assignmentValue.node;
    if (leadingComments?.some(
    // `@pureOrBreakMyCode` is used by closure and is present in Angular code
    ({ value }) => value.includes('@__PURE__') ||
        value.includes('#__PURE__') ||
        value.includes('@pureOrBreakMyCode'))) {
        return true;
    }
    return assignmentValue.isPure();
}
/**
 * Analyze the sibling nodes of a class to determine if any downlevel elements should be
 * wrapped in a pure annotated IIFE. Also determines if any elements have potential side
 * effects.
 *
 * @param origin The starting NodePath location for analyzing siblings.
 * @param classIdentifier The identifier node that represents the name of the class.
 * @param allowWrappingDecorators Whether to allow decorators to be wrapped.
 * @returns An object containing the results of the analysis.
 */
function analyzeClassSiblings(origin, classIdentifier, allowWrappingDecorators) {
    const wrapStatementPaths = [];
    let hasPotentialSideEffects = false;
    for (let i = 1;; ++i) {
        const nextStatement = origin.getSibling(+origin.key + i);
        if (!nextStatement.isExpressionStatement()) {
            break;
        }
        // Valid sibling statements for class declarations are only assignment expressions
        // and TypeScript decorator helper call expressions
        const nextExpression = nextStatement.get('expression');
        if (nextExpression.isCallExpression()) {
            if (!core_1.types.isIdentifier(nextExpression.node.callee) ||
                nextExpression.node.callee.name !== TSLIB_DECORATE_HELPER_NAME) {
                break;
            }
            if (allowWrappingDecorators) {
                wrapStatementPaths.push(nextStatement);
            }
            else {
                // Statement cannot be safely wrapped which makes wrapping the class unneeded.
                // The statement will prevent even a wrapped class from being optimized away.
                hasPotentialSideEffects = true;
            }
            continue;
        }
        else if (!nextExpression.isAssignmentExpression()) {
            break;
        }
        // Valid assignment expressions should be member access expressions using the class
        // name as the object and an identifier as the property for static fields or only
        // the class name for decorators.
        const left = nextExpression.get('left');
        if (left.isIdentifier()) {
            if (!left.scope.bindingIdentifierEquals(left.node.name, classIdentifier) ||
                !core_1.types.isCallExpression(nextExpression.node.right) ||
                !core_1.types.isIdentifier(nextExpression.node.right.callee) ||
                nextExpression.node.right.callee.name !== TSLIB_DECORATE_HELPER_NAME) {
                break;
            }
            if (allowWrappingDecorators) {
                wrapStatementPaths.push(nextStatement);
            }
            else {
                // Statement cannot be safely wrapped which makes wrapping the class unneeded.
                // The statement will prevent even a wrapped class from being optimized away.
                hasPotentialSideEffects = true;
            }
            continue;
        }
        else if (!left.isMemberExpression() ||
            !core_1.types.isIdentifier(left.node.object) ||
            !left.scope.bindingIdentifierEquals(left.node.object.name, classIdentifier) ||
            !core_1.types.isIdentifier(left.node.property)) {
            break;
        }
        const propertyName = left.node.property.name;
        const assignmentValue = nextExpression.get('right');
        if (angularStaticsToElide[propertyName]?.(assignmentValue)) {
            nextStatement.remove();
            --i;
        }
        else if (canWrapProperty(propertyName, assignmentValue)) {
            wrapStatementPaths.push(nextStatement);
        }
        else {
            // Statement cannot be safely wrapped which makes wrapping the class unneeded.
            // The statement will prevent even a wrapped class from being optimized away.
            hasPotentialSideEffects = true;
        }
    }
    return { hasPotentialSideEffects, wrapStatementPaths };
}
/**
 * The set of classes already visited and analyzed during the plugin's execution.
 * This is used to prevent adjusted classes from being repeatedly analyzed which can lead
 * to an infinite loop.
 */
const visitedClasses = new WeakSet();
/**
 * A map of classes that have already been analyzed during the default export splitting step.
 * This is used to avoid analyzing a class declaration twice if it is a direct default export.
 */
const exportDefaultAnalysis = new WeakMap();
/**
 * A babel plugin factory function for adjusting classes; primarily with Angular metadata.
 * The adjustments include wrapping classes with known safe or no side effects with pure
 * annotations to support dead code removal of unused classes. Angular compiler generated
 * metadata static fields not required in AOT mode are also elided to better support bundler-
 * level treeshaking.
 *
 * @returns A babel plugin object instance.
 */
// eslint-disable-next-line max-lines-per-function
function default_1() {
    return {
        visitor: {
            // When a class is converted to a variable declaration, the default export must be moved
            // to a subsequent statement to prevent a JavaScript syntax error.
            ExportDefaultDeclaration(path, state) {
                const declaration = path.get('declaration');
                if (!declaration.isClassDeclaration()) {
                    return;
                }
                const { wrapDecorators } = state.opts;
                const analysis = analyzeClassSiblings(path, declaration.node.id, wrapDecorators);
                exportDefaultAnalysis.set(declaration.node, analysis);
                // Splitting the export declaration is not needed if the class will not be wrapped
                if (analysis.hasPotentialSideEffects) {
                    return;
                }
                (0, helper_split_export_declaration_1.default)(path);
            },
            ClassDeclaration(path, state) {
                const { node: classNode, parentPath } = path;
                const { wrapDecorators } = state.opts;
                if (visitedClasses.has(classNode)) {
                    return;
                }
                // Analyze sibling statements for elements of the class that were downleveled
                const origin = parentPath.isExportNamedDeclaration() ? parentPath : path;
                const { wrapStatementPaths, hasPotentialSideEffects } = exportDefaultAnalysis.get(classNode) ??
                    analyzeClassSiblings(origin, classNode.id, wrapDecorators);
                visitedClasses.add(classNode);
                if (hasPotentialSideEffects) {
                    return;
                }
                // If no statements to wrap, check for static class properties.
                // Static class properties may be downleveled at later stages in the build pipeline
                // which results in additional function calls outside the class body. These calls
                // then cause the class to be referenced and not eligible for removal. Since it is
                // not known at this stage whether the class needs to be downleveled, the transform
                // wraps classes preemptively to allow for potential removal within the optimization
                // stages.
                if (wrapStatementPaths.length === 0) {
                    let shouldWrap = false;
                    for (const element of path.get('body').get('body')) {
                        if (element.isClassProperty()) {
                            // Only need to analyze static properties
                            if (!element.node.static) {
                                continue;
                            }
                            // Check for potential side effects.
                            // These checks are conservative and could potentially be expanded in the future.
                            const elementKey = element.get('key');
                            const elementValue = element.get('value');
                            if (elementKey.isIdentifier() &&
                                (!elementValue.isExpression() ||
                                    canWrapProperty(elementKey.node.name, elementValue))) {
                                shouldWrap = true;
                            }
                            else {
                                // Not safe to wrap
                                shouldWrap = false;
                                break;
                            }
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        }
                        else if (element.isStaticBlock()) {
                            // Only need to analyze static blocks
                            const body = element.get('body');
                            if (Array.isArray(body) && body.length > 1) {
                                // Not safe to wrap
                                shouldWrap = false;
                                break;
                            }
                            const expression = body.find((n) => n.isExpressionStatement());
                            const assignmentExpression = expression?.get('expression');
                            if (assignmentExpression?.isAssignmentExpression()) {
                                const left = assignmentExpression.get('left');
                                if (!left.isMemberExpression()) {
                                    continue;
                                }
                                if (!left.get('object').isThisExpression()) {
                                    // Not safe to wrap
                                    shouldWrap = false;
                                    break;
                                }
                                const element = left.get('property');
                                const right = assignmentExpression.get('right');
                                if (element.isIdentifier() &&
                                    (!right.isExpression() || canWrapProperty(element.node.name, right))) {
                                    shouldWrap = true;
                                }
                                else {
                                    // Not safe to wrap
                                    shouldWrap = false;
                                    break;
                                }
                            }
                        }
                    }
                    if (!shouldWrap) {
                        return;
                    }
                }
                const wrapStatementNodes = [];
                for (const statementPath of wrapStatementPaths) {
                    wrapStatementNodes.push(statementPath.node);
                    statementPath.remove();
                }
                // Wrap class and safe static assignments in a pure annotated IIFE
                const container = core_1.types.arrowFunctionExpression([], core_1.types.blockStatement([
                    classNode,
                    ...wrapStatementNodes,
                    core_1.types.returnStatement(core_1.types.cloneNode(classNode.id)),
                ]));
                const replacementInitializer = core_1.types.callExpression(core_1.types.parenthesizedExpression(container), []);
                (0, helper_annotate_as_pure_1.default)(replacementInitializer);
                // Replace class with IIFE wrapped class
                const declaration = core_1.types.variableDeclaration('let', [
                    core_1.types.variableDeclarator(core_1.types.cloneNode(classNode.id), replacementInitializer),
                ]);
                path.replaceWith(declaration);
            },
            ClassExpression(path, state) {
                const { node: classNode, parentPath } = path;
                const { wrapDecorators } = state.opts;
                // Class expressions are used by TypeScript to represent downlevel class/constructor decorators.
                // If not wrapping decorators, they do not need to be processed.
                if (!wrapDecorators || visitedClasses.has(classNode)) {
                    return;
                }
                if (!classNode.id ||
                    !parentPath.isVariableDeclarator() ||
                    !core_1.types.isIdentifier(parentPath.node.id) ||
                    parentPath.node.id.name !== classNode.id.name) {
                    return;
                }
                const origin = parentPath.parentPath;
                if (!origin.isVariableDeclaration() || origin.node.declarations.length !== 1) {
                    return;
                }
                const { wrapStatementPaths, hasPotentialSideEffects } = analyzeClassSiblings(origin, parentPath.node.id, wrapDecorators);
                visitedClasses.add(classNode);
                if (hasPotentialSideEffects || wrapStatementPaths.length === 0) {
                    return;
                }
                const wrapStatementNodes = [];
                for (const statementPath of wrapStatementPaths) {
                    wrapStatementNodes.push(statementPath.node);
                    statementPath.remove();
                }
                // Wrap class and safe static assignments in a pure annotated IIFE
                const container = core_1.types.arrowFunctionExpression([], core_1.types.blockStatement([
                    core_1.types.variableDeclaration('let', [
                        core_1.types.variableDeclarator(core_1.types.cloneNode(classNode.id), classNode),
                    ]),
                    ...wrapStatementNodes,
                    core_1.types.returnStatement(core_1.types.cloneNode(classNode.id)),
                ]));
                const replacementInitializer = core_1.types.callExpression(core_1.types.parenthesizedExpression(container), []);
                (0, helper_annotate_as_pure_1.default)(replacementInitializer);
                // Add the wrapped class directly to the variable declaration
                parentPath.get('init').replaceWith(replacementInitializer);
            },
        },
    };
}
exports.default = default_1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWRqdXN0LXN0YXRpYy1jbGFzcy1tZW1iZXJzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5ndWxhcl9kZXZraXQvYnVpbGRfYW5ndWxhci9zcmMvYmFiZWwvcGx1Z2lucy9hZGp1c3Qtc3RhdGljLWNsYXNzLW1lbWJlcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7O0FBRUgsc0NBQXFFO0FBQ3JFLDZGQUE0RDtBQUM1RCw2R0FBNEU7QUFFNUU7O0dBRUc7QUFDSCxNQUFNLDBCQUEwQixHQUFHLFlBQVksQ0FBQztBQUVoRDs7OztHQUlHO0FBQ0gsTUFBTSxvQkFBb0IsR0FBRyxJQUFJLEdBQUcsQ0FBQztJQUNuQyxNQUFNO0lBQ04sTUFBTTtJQUNOLE1BQU07SUFDTixNQUFNO0lBQ04sTUFBTTtJQUNOLE9BQU87SUFDUCxPQUFPO0lBQ1AsY0FBYztDQUNmLENBQUMsQ0FBQztBQUVIOzs7R0FHRztBQUNILE1BQU0scUJBQXFCLEdBQWtFO0lBQzNGLGdCQUFnQixDQUFDLElBQUk7UUFDbkIsT0FBTyxJQUFJLENBQUMsb0JBQW9CLEVBQUUsSUFBSSxJQUFJLENBQUMseUJBQXlCLEVBQUUsQ0FBQztJQUN6RSxDQUFDO0lBQ0QsWUFBWSxDQUFDLElBQUk7UUFDZixPQUFPLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO0lBQ2xDLENBQUM7SUFDRCxnQkFBZ0IsQ0FBQyxJQUFJO1FBQ25CLE9BQU8sSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7SUFDbkMsQ0FBQztDQUNGLENBQUM7QUFFRjs7Ozs7R0FLRztBQUNILFNBQWdCLFdBQVc7SUFDekIsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ25CLENBQUM7QUFGRCxrQ0FFQztBQUVEOzs7Ozs7OztHQVFHO0FBQ0gsU0FBUyxlQUFlLENBQUMsWUFBb0IsRUFBRSxlQUF5QjtJQUN0RSxJQUFJ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LEdBQXNCLEVBQUUsQ0FBQztnQkFDakQsS0FBSyxNQUFNLGFBQWEsSUFBSSxrQkFBa0IsRUFBRTtvQkFDOUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDNUMsYUFBYSxDQUFDLE1BQU0sRUFBRSxDQUFDO2lCQUN4QjtnQkFFRCxrRUFBa0U7Z0JBQ2xFLE1BQU0sU0FBUyxHQUFHLFlBQUssQ0FBQyx1QkFBdUIsQ0FDN0MsRUFBRSxFQUNGLFlBQUssQ0FBQyxjQUFjLENBQUM7b0JBQ25CLFlBQUssQ0FBQyxtQkFBbUIsQ0FBQyxLQUFLLEVBQUU7d0JBQy9CLFlBQUssQ0FBQyxrQkFBa0IsQ0FBQyxZQUFLLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsRUFBRSxTQUFTLENBQUM7cUJBQ25FLENBQUM7b0JBQ0YsR0FBRyxrQkFBa0I7b0JBQ3JCLFlBQUssQ0FBQyxlQUFlLENBQUMsWUFBSyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUM7aUJBQ3JELENBQUMsQ0FDSCxDQUFDO2dCQUNGLE1BQU0sc0JBQXNCLEdBQUcsWUFBSyxDQUFDLGNBQWMsQ0FDakQsWUFBSyxDQUFDLHVCQUF1QixDQUFDLFNBQVMsQ0FBQyxFQUN4QyxFQUFFLENBQ0gsQ0FBQztnQkFDRixJQUFBLGlDQUFjLEVBQUMsc0JBQXNCLENBQUMsQ0FBQztnQkFFdkMsNkRBQTZEO2dCQUM3RCxVQUFVLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLFdBQVcsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO1lBQzdELENBQUM7U0FDRjtLQUNGLENBQUM7QUFDSixDQUFDO0FBcE5ELDRCQW9OQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgeyBOb2RlUGF0aCwgUGx1Z2luT2JqLCBQbHVnaW5QYXNzLCB0eXBlcyB9IGZyb20gJ0BiYWJlbC9jb3JlJztcbmltcG9ydCBhbm5vdGF0ZUFzUHVyZSBmcm9tICdAYmFiZWwvaGVscGVyLWFubm90YXRlLWFzLXB1cmUnO1xuaW1wb3J0IHNwbGl0RXhwb3J0RGVjbGFyYXRpb24gZnJvbSAnQGJhYmVsL2hlbHBlci1zcGxpdC1leHBvcnQtZGVjbGFyYXRpb24nO1xuXG4vKipcbiAqIFRoZSBuYW1lIG9mIHRoZSBUeXBlc2NyaXB0IGRlY29yYXRvciBoZWxwZXIgZnVuY3Rpb24gY3JlYXRlZCBieSB0aGUgVHlwZVNjcmlwdCBjb21waWxlci5cbiAqL1xuY29uc3QgVFNMSUJfREVDT1JBVEVfSEVMUEVSX05BTUUgPSAnX19kZWNvcmF0ZSc7XG5cbi8qKlxuICogVGhlIHNldCBvZiBBbmd1bGFyIHN0YXRpYyBmaWVsZHMgdGhhdCBzaG91bGQgYWx3YXlzIGJlIHdyYXBwZWQuXG4gKiBUaGVzZSBmaWVsZHMgbWF5IGFwcGVhciB0byBoYXZlIHNpZGUgZWZmZWN0cyBidXQgYXJlIHNhZmUgdG8gcmVtb3ZlIGlmIHRoZSBhc3NvY2lhdGVkIGNsYXNzXG4gKiBpcyBvdGhlcndpc2UgdW51c2VkIHdpdGhpbiB0aGUgb3V0cHV0LlxuICovXG5jb25zdCBhbmd1bGFyU3RhdGljc1RvV3JhcCA9IG5ldyBTZXQoW1xuICAnybVjbXAnLFxuICAnybVkaXInLFxuICAnybVmYWMnLFxuICAnybVpbmonLFxuICAnybVtb2QnLFxuICAnybVwaXBlJyxcbiAgJ8m1cHJvdicsXG4gICdJTkpFQ1RPUl9LRVknLFxuXSk7XG5cbi8qKlxuICogQW4gb2JqZWN0IG1hcCBvZiBzdGF0aWMgZmllbGRzIGFuZCByZWxhdGVkIHZhbHVlIGNoZWNrcyBmb3IgZGlzY292ZXJ5IG9mIEFuZ3VsYXIgZ2VuZXJhdGVkXG4gKiBKSVQgcmVsYXRlZCBzdGF0aWMgZmllbGRzLlxuICovXG5jb25zdCBhbmd1bGFyU3RhdGljc1RvRWxpZGU6IFJlY29yZDxzdHJpbmcsIChwYXRoOiBOb2RlUGF0aDx0eXBlcy5FeHByZXNzaW9uPikgPT4gYm9vbGVhbj4gPSB7XG4gICdjdG9yUGFyYW1ldGVycycocGF0aCkge1xuICAgIHJldHVybiBwYXRoLmlzRnVuY3Rpb25FeHByZXNzaW9uKCkgfHwgcGF0aC5pc0Fycm93RnVuY3Rpb25FeHByZXNzaW9uKCk7XG4gIH0sXG4gICdkZWNvcmF0b3JzJyhwYXRoKSB7XG4gICAgcmV0dXJuIHBhdGguaXNBcnJheUV4cHJlc3Npb24oKTtcbiAgfSxcbiAgJ3Byb3BEZWNvcmF0b3JzJyhwYXRoKSB7XG4gICAgcmV0dXJuIHBhdGguaXNPYmplY3RFeHByZXNzaW9uKCk7XG4gIH0sXG59O1xuXG4vKipcbiAqIFByb3ZpZGVzIG9uZSBvciBtb3JlIGtleXdvcmRzIHRoYXQgaWYgZm91bmQgd2l0aGluIHRoZSBjb250ZW50IG9mIGEgc291cmNlIGZpbGUgaW5kaWNhdGVcbiAqIHRoYXQgdGhpcyBwbHVnaW4gc2hvdWxkIGJlIHVzZWQgd2l0aCBhIHNvdXJjZSBmaWxlLlxuICpcbiAqIEByZXR1cm5zIEFuIGEgc3RyaW5nIGl0ZXJhYmxlIGNvbnRhaW5pbmcgb25lIG9yIG1vcmUga2V5d29yZHMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRLZXl3b3JkcygpOiBJdGVyYWJsZTxzdHJpbmc+IHtcbiAgcmV0dXJuIFsnY2xhc3MnXTtcbn1cblxuLyoqXG4gKiBEZXRlcm1pbmVzIHdoZXRoZXIgYSBwcm9wZXJ0eSBhbmQgaXRzIGluaXRpYWxpemVyIHZhbHVlIGNhbiBiZSBzYWZlbHkgd3JhcHBlZCBpbiBhIHB1cmVcbiAqIGFubm90YXRlZCBJSUZFLiBWYWx1ZXMgdGhhdCBtYXkgY2F1c2Ugc2lkZSBlZmZlY3RzIGFyZSBub3QgY29uc2lkZXJlZCBzYWZlIHRvIHdyYXAuXG4gKiBXcmFwcGluZyBzdWNoIHZhbHVlcyBtYXkgY2F1c2UgcnVudGltZSBlcnJvcnMgYW5kL29yIGluY29ycmVjdCBydW50aW1lIGJlaGF2aW9yLlxuICpcbiAqIEBwYXJhbSBwcm9wZXJ0eU5hbWUgVGhlIG5hbWUgb2YgdGhlIHByb3BlcnR5IHRvIGFuYWx5emUuXG4gKiBAcGFyYW0gYXNzaWdubWVudFZhbHVlIFRoZSBpbml0aWFsaXplciB2YWx1ZSB0aGF0IHdpbGwgYmUgYXNzaWduZWQgdG8gdGhlIHByb3BlcnR5LlxuICogQHJldHVybnMgSWYgdGhlIHByb3BlcnR5IGNhbiBiZSBzYWZlbHkgd3JhcHBlZCwgdGhlbiB0cnVlOyBvdGhlcndpc2UsIGZhbHNlLlxuICovXG5mdW5jdGlvbiBjYW5XcmFwUHJvcGVydHkocHJvcGVydHlOYW1lOiBzdHJpbmcsIGFzc2lnbm1lbnRWYWx1ZTogTm9kZVBhdGgpOiBib29sZWFuIHtcbiAgaWYgKGFuZ3VsYXJTdGF0aWNzVG9XcmFwLmhhcyhwcm9wZXJ0eU5hbWUpKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBjb25zdCB7IGxlYWRpbmdDb21tZW50cyB9ID0gYXNzaWdubWVudFZhbHVlLm5vZGUgYXMgeyBsZWFkaW5nQ29tbWVudHM/OiB7IHZhbHVlOiBzdHJpbmcgfVtdIH07XG4gIGlmIChcbiAgICBsZWFkaW5nQ29tbWVudHM/LnNvbWUoXG4gICAgICAvLyBgQHB1cmVPckJyZWFrTXlDb2RlYCBpcyB1c2VkIGJ5IGNsb3N1cmUgYW5kIGlzIHByZXNlbnQgaW4gQW5ndWxhciBjb2RlXG4gICAgICAoeyB2YWx1ZSB9KSA9PlxuICAgICAgICB2YWx1ZS5pbmNsdWRlcygnQF9fUFVSRV9fJykgfHxcbiAgICAgICAgdmFsdWUuaW5jbHVkZXMoJyNfX1BVUkVfXycpIHx8XG4gICAgICAgIHZhbHVlLmluY2x1ZGVzKCdAcHVyZU9yQnJlYWtNeUNvZGUnKSxcbiAgICApXG4gICkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgcmV0dXJuIGFzc2lnbm1lbnRWYWx1ZS5pc1B1cmUoKTtcbn1cblxuLyoqXG4gKiBBbmFseXplIHRoZSBzaWJsaW5nIG5vZGVzIG9mIGEgY2xhc3MgdG8gZGV0ZXJtaW5lIGlmIGFueSBkb3dubGV2ZWwgZWxlbWVudHMgc2hvdWxkIGJlXG4gKiB3cmFwcGVkIGluIGEgcHVyZSBhbm5vdGF0ZWQgSUlGRS4gQWxzbyBkZXRlcm1pbmVzIGlmIGFueSBlbGVtZW50cyBoYXZlIHBvdGVudGlhbCBzaWRlXG4gKiBlZmZlY3RzLlxuICpcbiAqIEBwYXJhbSBvcmlnaW4gVGhlIHN0YXJ0aW5nIE5vZGVQYXRoIGxvY2F0aW9uIGZvciBhbmFseXppbmcgc2libGluZ3MuXG4gKiBAcGFyYW0gY2xhc3NJZGVudGlmaWVyIFRoZSBpZGVudGlmaWVyIG5vZGUgdGhhdCByZXByZXNlbnRzIHRoZSBuYW1lIG9mIHRoZSBjbGFzcy5cbiAqIEBwYXJhbSBhbGxvd1dyYXBwaW5nRGVjb3JhdG9ycyBXaGV0aGVyIHRvIGFsbG93IGRlY29yYXRvcnMgdG8gYmUgd3JhcHBlZC5cbiAqIEByZXR1cm5zIEFuIG9iamVjdCBjb250YWluaW5nIHRoZSByZXN1bHRzIG9mIHRoZSBhbmFseXNpcy5cbiAqL1xuZnVuY3Rpb24gYW5hbHl6ZUNsYXNzU2libGluZ3MoXG4gIG9yaWdpbjogTm9kZVBhdGgsXG4gIGNsYXNzSWRlbnRpZmllcjogdHlwZXMuSWRlbnRpZmllcixcbiAgYWxsb3dXcmFwcGluZ0RlY29yYXRvcnM6IGJvb2xlYW4sXG4pOiB7IGhhc1BvdGVudGlhbFNpZGVFZmZlY3RzOiBib29sZWFuOyB3cmFwU3RhdGVtZW50UGF0aHM6IE5vZGVQYXRoPHR5cGVzLlN0YXRlbWVudD5bXSB9IHtcbiAgY29uc3Qgd3JhcFN0YXRlbWVudFBhdGhzOiBOb2RlUGF0aDx0eXBlcy5TdGF0ZW1lbnQ+W10gPSBbXTtcbiAgbGV0IGhhc1BvdGVudGlhbFNpZGVFZmZlY3RzID0gZmFsc2U7XG4gIGZvciAobGV0IGkgPSAxOyA7ICsraSkge1xuICAgIGNvbnN0IG5leHRTdGF0ZW1lbnQgPSBvcmlnaW4uZ2V0U2libGluZygrb3JpZ2luLmtleSArIGkpO1xuICAgIGlmICghbmV4dFN0YXRlbWVudC5pc0V4cHJlc3Npb25TdGF0ZW1lbnQoKSkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgLy8gVmFsaWQgc2libGluZyBzdGF0ZW1lbnRzIGZvciBjbGFzcyBkZWNsYXJhdGlvbnMgYXJlIG9ubHkgYXNzaWdubWVudCBleHByZXNzaW9uc1xuICAgIC8vIGFuZCBUeXBlU2NyaXB0IGRlY29yYXRvciBoZWxwZXIgY2FsbCBleHByZXNzaW9uc1xuICAgIGNvbnN0IG5leHRFeHByZXNzaW9uID0gbmV4dFN0YXRlbWVudC5nZXQoJ2V4cHJlc3Npb24nKTtcbiAgICBpZiAobmV4dEV4cHJlc3Npb24uaXNDYWxsRXhwcmVzc2lvbigpKSB7XG4gICAgICBpZiAoXG4gICAgICAgICF0eXBlcy5pc0lkZW50aWZpZXIobmV4dEV4cHJlc3Npb24ubm9kZS5jYWxsZWUpIHx8XG4gICAgICAgIG5leHRFeHByZXNzaW9uLm5vZGUuY2FsbGVlLm5hbWUgIT09IFRTTElCX0RFQ09SQVRFX0hFTFBFUl9OQU1FXG4gICAgICApIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIGlmIChhbGxvd1dyYXBwaW5nRGVjb3JhdG9ycykge1xuICAgICAgICB3cmFwU3RhdGVtZW50UGF0aHMucHVzaChuZXh0U3RhdGVtZW50KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFN0YXRlbWVudCBjYW5ub3QgYmUgc2FmZWx5IHdyYXBwZWQgd2hpY2ggbWFrZXMgd3JhcHBpbmcgdGhlIGNsYXNzIHVubmVlZGVkLlxuICAgICAgICAvLyBUaGUgc3RhdGVtZW50IHdpbGwgcHJldmVudCBldmVuIGEgd3JhcHBlZCBjbGFzcyBmcm9tIGJlaW5nIG9wdGltaXplZCBhd2F5LlxuICAgICAgICBoYXNQb3RlbnRpYWxTaWRlRWZmZWN0cyA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIGNvbnRpbnVlO1xuICAgIH0gZWxzZSBpZiAoIW5leHRFeHByZXNzaW9uLmlzQXNzaWdubWVudEV4cHJlc3Npb24oKSkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgLy8gVmFsaWQgYXNzaWdubWVudCBleHByZXNzaW9ucyBzaG91bGQgYmUgbWVtYmVyIGFjY2VzcyBleHByZXNzaW9ucyB1c2luZyB0aGUgY2xhc3NcbiAgICAvLyBuYW1lIGFzIHRoZSBvYmplY3QgYW5kIGFuIGlkZW50aWZpZXIgYXMgdGhlIHByb3BlcnR5IGZvciBzdGF0aWMgZmllbGRzIG9yIG9ubHlcbiAgICAvLyB0aGUgY2xhc3MgbmFtZSBmb3IgZGVjb3JhdG9ycy5cbiAgICBjb25zdCBsZWZ0ID0gbmV4dEV4cHJlc3Npb24uZ2V0KCdsZWZ0Jyk7XG4gICAgaWYgKGxlZnQuaXNJZGVudGlmaWVyKCkpIHtcbiAgICAgIGlmIChcbiAgICAgICAgIWxlZnQuc2NvcGUuYmluZGluZ0lkZW50aWZpZXJFcXVhbHMobGVmdC5ub2RlLm5hbWUsIGNsYXNzSWRlbnRpZmllcikgfHxcbiAgICAgICAgIXR5cGVzLmlzQ2FsbEV4cHJlc3Npb24obmV4dEV4cHJlc3Npb24ubm9kZS5yaWdodCkgfHxcbiAgICAgICAgIXR5cGVzLmlzSWRlbnRpZmllcihuZXh0RXhwcmVzc2lvbi5ub2RlLnJpZ2h0LmNhbGxlZSkgfHxcbiAgICAgICAgbmV4dEV4cHJlc3Npb24ubm9kZS5yaWdodC5jYWxsZWUubmFtZSAhPT0gVFNMSUJfREVDT1JBVEVfSEVMUEVSX05BTUVcbiAgICAgICkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgaWYgKGFsbG93V3JhcHBpbmdEZWNvcmF0b3JzKSB7XG4gICAgICAgIHdyYXBTdGF0ZW1lbnRQYXRocy5wdXNoKG5leHRTdGF0ZW1lbnQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gU3RhdGVtZW50IGNhbm5vdCBiZSBzYWZlbHkgd3JhcHBlZCB3aGljaCBtYWtlcyB3cmFwcGluZyB0aGUgY2xhc3MgdW5uZWVkZWQuXG4gICAgICAgIC8vIFRoZSBzdGF0ZW1lbnQgd2lsbCBwcmV2ZW50IGV2ZW4gYSB3cmFwcGVkIGNsYXNzIGZyb20gYmVpbmcgb3B0aW1pemVkIGF3YXkuXG4gICAgICAgIGhhc1BvdGVudGlhbFNpZGVFZmZlY3RzID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgY29udGludWU7XG4gICAgfSBlbHNlIGlmIChcbiAgICAgICFsZWZ0LmlzTWVtYmVyRXhwcmVzc2lvbigpIHx8XG4gICAgICAhdHlwZXMuaXNJZGVudGlmaWVyKGxlZnQubm9kZS5vYmplY3QpIHx8XG4gICAgICAhbGVmdC5zY29wZS5iaW5kaW5nSWRlbnRpZmllckVxdWFscyhsZWZ0Lm5vZGUub2JqZWN0Lm5hbWUsIGNsYXNzSWRlbnRpZmllcikgfHxcbiAgICAgICF0eXBlcy5pc0lkZW50aWZpZXIobGVmdC5ub2RlLnByb3BlcnR5KVxuICAgICkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgY29uc3QgcHJvcGVydHlOYW1lID0gbGVmdC5ub2RlLnByb3BlcnR5Lm5hbWU7XG4gICAgY29uc3QgYXNzaWdubWVudFZhbHVlID0gbmV4dEV4cHJlc3Npb24uZ2V0KCdyaWdodCcpO1xuICAgIGlmIChhbmd1bGFyU3RhdGljc1RvRWxpZGVbcHJvcGVydHlOYW1lXT8uKGFzc2lnbm1lbnRWYWx1ZSkpIHtcbiAgICAgIG5leHRTdGF0ZW1lbnQucmVtb3ZlKCk7XG4gICAgICAtLWk7XG4gICAgfSBlbHNlIGlmIChjYW5XcmFwUHJvcGVydHkocHJvcGVydHlOYW1lLCBhc3NpZ25tZW50VmFsdWUpKSB7XG4gICAgICB3cmFwU3RhdGVtZW50UGF0aHMucHVzaChuZXh0U3RhdGVtZW50KTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gU3RhdGVtZW50IGNhbm5vdCBiZSBzYWZlbHkgd3JhcHBlZCB3aGljaCBtYWtlcyB3cmFwcGluZyB0aGUgY2xhc3MgdW5uZWVkZWQuXG4gICAgICAvLyBUaGUgc3RhdGVtZW50IHdpbGwgcHJldmVudCBldmVuIGEgd3JhcHBlZCBjbGFzcyBmcm9tIGJlaW5nIG9wdGltaXplZCBhd2F5LlxuICAgICAgaGFzUG90ZW50aWFsU2lkZUVmZmVjdHMgPSB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB7IGhhc1BvdGVudGlhbFNpZGVFZmZlY3RzLCB3cmFwU3RhdGVtZW50UGF0aHMgfTtcbn1cblxuLyoqXG4gKiBUaGUgc2V0IG9mIGNsYXNzZXMgYWxyZWFkeSB2aXNpdGVkIGFuZCBhbmFseXplZCBkdXJpbmcgdGhlIHBsdWdpbidzIGV4ZWN1dGlvbi5cbiAqIFRoaXMgaXMgdXNlZCB0byBwcmV2ZW50IGFkanVzdGVkIGNsYXNzZXMgZnJvbSBiZWluZyByZXBlYXRlZGx5IGFuYWx5emVkIHdoaWNoIGNhbiBsZWFkXG4gKiB0byBhbiBpbmZpbml0ZSBsb29wLlxuICovXG5jb25zdCB2aXNpdGVkQ2xhc3NlcyA9IG5ldyBXZWFrU2V0PHR5cGVzLkNsYXNzPigpO1xuXG4vKipcbiAqIEEgbWFwIG9mIGNsYXNzZXMgdGhhdCBoYXZlIGFscmVhZHkgYmVlbiBhbmFseXplZCBkdXJpbmcgdGhlIGRlZmF1bHQgZXhwb3J0IHNwbGl0dGluZyBzdGVwLlxuICogVGhpcyBpcyB1c2VkIHRvIGF2b2lkIGFuYWx5emluZyBhIGNsYXNzIGRlY2xhcmF0aW9uIHR3aWNlIGlmIGl0IGlzIGEgZGlyZWN0IGRlZmF1bHQgZXhwb3J0LlxuICovXG5jb25zdCBleHBvcnREZWZhdWx0QW5hbHlzaXMgPSBuZXcgV2Vha01hcDx0eXBlcy5DbGFzcywgUmV0dXJuVHlwZTx0eXBlb2YgYW5hbHl6ZUNsYXNzU2libGluZ3M+PigpO1xuXG4vKipcbiAqIEEgYmFiZWwgcGx1Z2luIGZhY3RvcnkgZnVuY3Rpb24gZm9yIGFkanVzdGluZyBjbGFzc2VzOyBwcmltYXJpbHkgd2l0aCBBbmd1bGFyIG1ldGFkYXRhLlxuICogVGhlIGFkanVzdG1lbnRzIGluY2x1ZGUgd3JhcHBpbmcgY2xhc3NlcyB3aXRoIGtub3duIHNhZmUgb3Igbm8gc2lkZSBlZmZlY3RzIHdpdGggcHVyZVxuICogYW5ub3RhdGlvbnMgdG8gc3VwcG9ydCBkZWFkIGNvZGUgcmVtb3ZhbCBvZiB1bnVzZWQgY2xhc3Nlcy4gQW5ndWxhciBjb21waWxlciBnZW5lcmF0ZWRcbiAqIG1ldGFkYXRhIHN0YXRpYyBmaWVsZHMgbm90IHJlcXVpcmVkIGluIEFPVCBtb2RlIGFyZSBhbHNvIGVsaWRlZCB0byBiZXR0ZXIgc3VwcG9ydCBidW5kbGVyLVxuICogbGV2ZWwgdHJlZXNoYWtpbmcuXG4gKlxuICogQHJldHVybnMgQSBiYWJlbCBwbHVnaW4gb2JqZWN0IGluc3RhbmNlLlxuICovXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbWF4LWxpbmVzLXBlci1mdW5jdGlvblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gKCk6IFBsdWdpbk9iaiB7XG4gIHJldHVybiB7XG4gICAgdmlzaXRvcjoge1xuICAgICAgLy8gV2hlbiBhIGNsYXNzIGlzIGNvbnZlcnRlZCB0byBhIHZhcmlhYmxlIGRlY2xhcmF0aW9uLCB0aGUgZGVmYXVsdCBleHBvcnQgbXVzdCBiZSBtb3ZlZFxuICAgICAgLy8gdG8gYSBzdWJzZXF1ZW50IHN0YXRlbWVudCB0byBwcmV2ZW50IGEgSmF2YVNjcmlwdCBzeW50YXggZXJyb3IuXG4gICAgICBFeHBvcnREZWZhdWx0RGVjbGFyYXRpb24ocGF0aDogTm9kZVBhdGg8dHlwZXMuRXhwb3J0RGVmYXVsdERlY2xhcmF0aW9uPiwgc3RhdGU6IFBsdWdpblBhc3MpIHtcbiAgICAgICAgY29uc3QgZGVjbGFyYXRpb24gPSBwYXRoLmdldCgnZGVjbGFyYXRpb24nKTtcbiAgICAgICAgaWYgKCFkZWNsYXJhdGlvbi5pc0NsYXNzRGVjbGFyYXRpb24oKSkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHsgd3JhcERlY29yYXRvcnMgfSA9IHN0YXRlLm9wdHMgYXMgeyB3cmFwRGVjb3JhdG9yczogYm9vbGVhbiB9O1xuICAgICAgICBjb25zdCBhbmFseXNpcyA9IGFuYWx5emVDbGFzc1NpYmxpbmdzKHBhdGgsIGRlY2xhcmF0aW9uLm5vZGUuaWQsIHdyYXBEZWNvcmF0b3JzKTtcbiAgICAgICAgZXhwb3J0RGVmYXVsdEFuYWx5c2lzLnNldChkZWNsYXJhdGlvbi5ub2RlLCBhbmFseXNpcyk7XG5cbiAgICAgICAgLy8gU3BsaXR0aW5nIHRoZSBleHBvcnQgZGVjbGFyYXRpb24gaXMgbm90IG5lZWRlZCBpZiB0aGUgY2xhc3Mgd2lsbCBub3QgYmUgd3JhcHBlZFxuICAgICAgICBpZiAoYW5hbHlzaXMuaGFzUG90ZW50aWFsU2lkZUVmZmVjdHMpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBzcGxpdEV4cG9ydERlY2xhcmF0aW9uKHBhdGgpO1xuICAgICAgfSxcbiAgICAgIENsYXNzRGVjbGFyYXRpb24ocGF0aDogTm9kZVBhdGg8dHlwZXMuQ2xhc3NEZWNsYXJhdGlvbj4sIHN0YXRlOiBQbHVnaW5QYXNzKSB7XG4gICAgICAgIGNvbnN0IHsgbm9kZTogY2xhc3NOb2RlLCBwYXJlbnRQYXRoIH0gPSBwYXRoO1xuICAgICAgICBjb25zdCB7IHdyYXBEZWNvcmF0b3JzIH0gPSBzdGF0ZS5vcHRzIGFzIHsgd3JhcERlY29yYXRvcnM6IGJvb2xlYW4gfTtcblxuICAgICAgICBpZiAodmlzaXRlZENsYXNzZXMuaGFzKGNsYXNzTm9kZSkpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBbmFseXplIHNpYmxpbmcgc3RhdGVtZW50cyBmb3IgZWxlbWVudHMgb2YgdGhlIGNsYXNzIHRoYXQgd2VyZSBkb3dubGV2ZWxlZFxuICAgICAgICBjb25zdCBvcmlnaW4gPSBwYXJlbnRQYXRoLmlzRXhwb3J0TmFtZWREZWNsYXJhdGlvbigpID8gcGFyZW50UGF0aCA6IHBhdGg7XG4gICAgICAgIGNvbnN0IHsgd3JhcFN0YXRlbWVudFBhdGhzLCBoYXNQb3RlbnRpYWxTaWRlRWZmZWN0cyB9ID1cbiAgICAgICAgICBleHBvcnREZWZhdWx0QW5hbHlzaXMuZ2V0KGNsYXNzTm9kZSkgPz9cbiAgICAgICAgICBhbmFseXplQ2xhc3NTaWJsaW5ncyhvcmlnaW4sIGNsYXNzTm9kZS5pZCwgd3JhcERlY29yYXRvcnMpO1xuXG4gICAgICAgIHZpc2l0ZWRDbGFzc2VzLmFkZChjbGFzc05vZGUpO1xuXG4gICAgICAgIGlmIChoYXNQb3RlbnRpYWxTaWRlRWZmZWN0cykge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIG5vIHN0YXRlbWVudHMgdG8gd3JhcCwgY2hlY2sgZm9yIHN0YXRpYyBjbGFzcyBwcm9wZXJ0aWVzLlxuICAgICAgICAvLyBTdGF0aWMgY2xhc3MgcHJvcGVydGllcyBtYXkgYmUgZG93bmxldmVsZWQgYXQgbGF0ZXIgc3RhZ2VzIGluIHRoZSBidWlsZCBwaXBlbGluZVxuICAgICAgICAvLyB3aGljaCByZXN1bHRzIGluIGFkZGl0aW9uYWwgZnVuY3Rpb24gY2FsbHMgb3V0c2lkZSB0aGUgY2xhc3MgYm9keS4gVGhlc2UgY2FsbHNcbiAgICAgICAgLy8gdGhlbiBjYXVzZSB0aGUgY2xhc3MgdG8gYmUgcmVmZXJlbmNlZCBhbmQgbm90IGVsaWdpYmxlIGZvciByZW1vdmFsLiBTaW5jZSBpdCBpc1xuICAgICAgICAvLyBub3Qga25vd24gYXQgdGhpcyBzdGFnZSB3aGV0aGVyIHRoZSBjbGFzcyBuZWVkcyB0byBiZSBkb3dubGV2ZWxlZCwgdGhlIHRyYW5zZm9ybVxuICAgICAgICAvLyB3cmFwcyBjbGFzc2VzIHByZWVtcHRpdmVseSB0byBhbGxvdyBmb3IgcG90ZW50aWFsIHJlbW92YWwgd2l0aGluIHRoZSBvcHRpbWl6YXRpb25cbiAgICAgICAgLy8gc3RhZ2VzLlxuICAgICAgICBpZiAod3JhcFN0YXRlbWVudFBhdGhzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIGxldCBzaG91bGRXcmFwID0gZmFsc2U7XG4gICAgICAgICAgZm9yIChjb25zdCBlbGVtZW50IG9mIHBhdGguZ2V0KCdib2R5JykuZ2V0KCdib2R5JykpIHtcbiAgICAgICAgICAgIGlmIChlbGVtZW50LmlzQ2xhc3NQcm9wZXJ0eSgpKSB7XG4gICAgICAgICAgICAgIC8vIE9ubHkgbmVlZCB0byBhbmFseXplIHN0YXRpYyBwcm9wZXJ0aWVzXG4gICAgICAgICAgICAgIGlmICghZWxlbWVudC5ub2RlLnN0YXRpYykge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgLy8gQ2hlY2sgZm9yIHBvdGVudGlhbCBzaWRlIGVmZmVjdHMuXG4gICAgICAgICAgICAgIC8vIFRoZXNlIGNoZWNrcyBhcmUgY29uc2VydmF0aXZlIGFuZCBjb3VsZCBwb3RlbnRpYWxseSBiZSBleHBhbmRlZCBpbiB0aGUgZnV0dXJlLlxuICAgICAgICAgICAgICBjb25zdCBlbGVtZW50S2V5ID0gZWxlbWVudC5nZXQoJ2tleScpO1xuICAgICAgICAgICAgICBjb25zdCBlbGVtZW50VmFsdWUgPSBlbGVtZW50LmdldCgndmFsdWUnKTtcbiAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgIGVsZW1lbnRLZXkuaXNJZGVudGlmaWVyKCkgJiZcbiAgICAgICAgICAgICAgICAoIWVsZW1lbnRWYWx1ZS5pc0V4cHJlc3Npb24oKSB8fFxuICAgICAgICAgICAgICAgICAgY2FuV3JhcFByb3BlcnR5KGVsZW1lbnRLZXkubm9kZS5uYW1lLCBlbGVtZW50VmFsdWUpKVxuICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICBzaG91bGRXcmFwID0gdHJ1ZTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBOb3Qgc2FmZSB0byB3cmFwXG4gICAgICAgICAgICAgICAgc2hvdWxkV3JhcCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gICAgICAgICAgICB9IGVsc2UgaWYgKChlbGVtZW50IGFzIGFueSkuaXNTdGF0aWNCbG9jaygpKSB7XG4gICAgICAgICAgICAgIC8vIE9ubHkgbmVlZCB0byBhbmFseXplIHN0YXRpYyBibG9ja3NcbiAgICAgICAgICAgICAgY29uc3QgYm9keSA9IGVsZW1lbnQuZ2V0KCdib2R5Jyk7XG5cbiAgICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoYm9keSkgJiYgYm9keS5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICAgICAgLy8gTm90IHNhZmUgdG8gd3JhcFxuICAgICAgICAgICAgICAgIHNob3VsZFdyYXAgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGNvbnN0IGV4cHJlc3Npb24gPSBib2R5LmZpbmQoKG46IE5vZGVQYXRoPHR5cGVzLk5vZGU+KSA9PlxuICAgICAgICAgICAgICAgIG4uaXNFeHByZXNzaW9uU3RhdGVtZW50KCksXG4gICAgICAgICAgICAgICkgYXMgTm9kZVBhdGg8dHlwZXMuRXhwcmVzc2lvblN0YXRlbWVudD4gfCB1bmRlZmluZWQ7XG5cbiAgICAgICAgICAgICAgY29uc3QgYXNzaWdubWVudEV4cHJlc3Npb24gPSBleHByZXNzaW9uPy5nZXQoJ2V4cHJlc3Npb24nKTtcbiAgICAgICAgICAgICAgaWYgKGFzc2lnbm1lbnRFeHByZXNzaW9uPy5pc0Fzc2lnbm1lbnRFeHByZXNzaW9uKCkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBsZWZ0ID0gYXNzaWdubWVudEV4cHJlc3Npb24uZ2V0KCdsZWZ0Jyk7XG4gICAgICAgICAgICAgICAgaWYgKCFsZWZ0LmlzTWVtYmVyRXhwcmVzc2lvbigpKSB7XG4gICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoIWxlZnQuZ2V0KCdvYmplY3QnKS5pc1RoaXNFeHByZXNzaW9uKCkpIHtcbiAgICAgICAgICAgICAgICAgIC8vIE5vdCBzYWZlIHRvIHdyYXBcbiAgICAgICAgICAgICAgICAgIHNob3VsZFdyYXAgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGNvbnN0IGVsZW1lbnQgPSBsZWZ0LmdldCgncHJvcGVydHknKTtcbiAgICAgICAgICAgICAgICBjb25zdCByaWdodCA9IGFzc2lnbm1lbnRFeHByZXNzaW9uLmdldCgncmlnaHQnKTtcbiAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICBlbGVtZW50LmlzSWRlbnRpZmllcigpICYmXG4gICAgICAgICAgICAgICAgICAoIXJpZ2h0LmlzRXhwcmVzc2lvbigpIHx8IGNhbldyYXBQcm9wZXJ0eShlbGVtZW50Lm5vZGUubmFtZSwgcmlnaHQpKVxuICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgc2hvdWxkV3JhcCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIC8vIE5vdCBzYWZlIHRvIHdyYXBcbiAgICAgICAgICAgICAgICAgIHNob3VsZFdyYXAgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoIXNob3VsZFdyYXApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB3cmFwU3RhdGVtZW50Tm9kZXM6IHR5cGVzLlN0YXRlbWVudFtdID0gW107XG4gICAgICAgIGZvciAoY29uc3Qgc3RhdGVtZW50UGF0aCBvZiB3cmFwU3RhdGVtZW50UGF0aHMpIHtcbiAgICAgICAgICB3cmFwU3RhdGVtZW50Tm9kZXMucHVzaChzdGF0ZW1lbnRQYXRoLm5vZGUpO1xuICAgICAgICAgIHN0YXRlbWVudFBhdGgucmVtb3ZlKCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBXcmFwIGNsYXNzIGFuZCBzYWZlIHN0YXRpYyBhc3NpZ25tZW50cyBpbiBhIHB1cmUgYW5ub3RhdGVkIElJRkVcbiAgICAgICAgY29uc3QgY29udGFpbmVyID0gdHlwZXMuYXJyb3dGdW5jdGlvbkV4cHJlc3Npb24oXG4gICAgICAgICAgW10sXG4gICAgICAgICAgdHlwZXMuYmxvY2tTdGF0ZW1lbnQoW1xuICAgICAgICAgICAgY2xhc3NOb2RlLFxuICAgICAgICAgICAgLi4ud3JhcFN0YXRlbWVudE5vZGVzLFxuICAgICAgICAgICAgdHlwZXMucmV0dXJuU3RhdGVtZW50KHR5cGVzLmNsb25lTm9kZShjbGFzc05vZGUuaWQpKSxcbiAgICAgICAgICBdKSxcbiAgICAgICAgKTtcbiAgICAgICAgY29uc3QgcmVwbGFjZW1lbnRJbml0aWFsaXplciA9IHR5cGVzLmNhbGxFeHByZXNzaW9uKFxuICAgICAgICAgIHR5cGVzLnBhcmVudGhlc2l6ZWRFeHByZXNzaW9uKGNvbnRhaW5lciksXG4gICAgICAgICAgW10sXG4gICAgICAgICk7XG4gICAgICAgIGFubm90YXRlQXNQdXJlKHJlcGxhY2VtZW50SW5pdGlhbGl6ZXIpO1xuXG4gICAgICAgIC8vIFJlcGxhY2UgY2xhc3Mgd2l0aCBJSUZFIHdyYXBwZWQgY2xhc3NcbiAgICAgICAgY29uc3QgZGVjbGFyYXRpb24gPSB0eXBlcy52YXJpYWJsZURlY2xhcmF0aW9uKCdsZXQnLCBbXG4gICAgICAgICAgdHlwZXMudmFyaWFibGVEZWNsYXJhdG9yKHR5cGVzLmNsb25lTm9kZShjbGFzc05vZGUuaWQpLCByZXBsYWNlbWVudEluaXRpYWxpemVyKSxcbiAgICAgICAgXSk7XG4gICAgICAgIHBhdGgucmVwbGFjZVdpdGgoZGVjbGFyYXRpb24pO1xuICAgICAgfSxcbiAgICAgIENsYXNzRXhwcmVzc2lvbihwYXRoOiBOb2RlUGF0aDx0eXBlcy5DbGFzc0V4cHJlc3Npb24+LCBzdGF0ZTogUGx1Z2luUGFzcykge1xuICAgICAgICBjb25zdCB7IG5vZGU6IGNsYXNzTm9kZSwgcGFyZW50UGF0aCB9ID0gcGF0aDtcbiAgICAgICAgY29uc3QgeyB3cmFwRGVjb3JhdG9ycyB9ID0gc3RhdGUub3B0cyBhcyB7IHdyYXBEZWNvcmF0b3JzOiBib29sZWFuIH07XG5cbiAgICAgICAgLy8gQ2xhc3MgZXhwcmVzc2lvbnMgYXJlIHVzZWQgYnkgVHlwZVNjcmlwdCB0byByZXByZXNlbnQgZG93bmxldmVsIGNsYXNzL2NvbnN0cnVjdG9yIGRlY29yYXRvcnMuXG4gICAgICAgIC8vIElmIG5vdCB3cmFwcGluZyBkZWNvcmF0b3JzLCB0aGV5IGRvIG5vdCBuZWVkIHRvIGJlIHByb2Nlc3NlZC5cbiAgICAgICAgaWYgKCF3cmFwRGVjb3JhdG9ycyB8fCB2aXNpdGVkQ2xhc3Nlcy5oYXMoY2xhc3NOb2RlKSkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChcbiAgICAgICAgICAhY2xhc3NOb2RlLmlkIHx8XG4gICAgICAgICAgIXBhcmVudFBhdGguaXNWYXJpYWJsZURlY2xhcmF0b3IoKSB8fFxuICAgICAgICAgICF0eXBlcy5pc0lkZW50aWZpZXIocGFyZW50UGF0aC5ub2RlLmlkKSB8fFxuICAgICAgICAgIHBhcmVudFBhdGgubm9kZS5pZC5uYW1lICE9PSBjbGFzc05vZGUuaWQubmFtZVxuICAgICAgICApIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBvcmlnaW4gPSBwYXJlbnRQYXRoLnBhcmVudFBhdGg7XG4gICAgICAgIGlmICghb3JpZ2luLmlzVmFyaWFibGVEZWNsYXJhdGlvbigpIHx8IG9yaWdpbi5ub2RlLmRlY2xhcmF0aW9ucy5sZW5ndGggIT09IDEpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB7IHdyYXBTdGF0ZW1lbnRQYXRocywgaGFzUG90ZW50aWFsU2lkZUVmZmVjdHMgfSA9IGFuYWx5emVDbGFzc1NpYmxpbmdzKFxuICAgICAgICAgIG9yaWdpbixcbiAgICAgICAgICBwYXJlbnRQYXRoLm5vZGUuaWQsXG4gICAgICAgICAgd3JhcERlY29yYXRvcnMsXG4gICAgICAgICk7XG5cbiAgICAgICAgdmlzaXRlZENsYXNzZXMuYWRkKGNsYXNzTm9kZSk7XG5cbiAgICAgICAgaWYgKGhhc1BvdGVudGlhbFNpZGVFZmZlY3RzIHx8IHdyYXBTdGF0ZW1lbnRQYXRocy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB3cmFwU3RhdGVtZW50Tm9kZXM6IHR5cGVzLlN0YXRlbWVudFtdID0gW107XG4gICAgICAgIGZvciAoY29uc3Qgc3RhdGVtZW50UGF0aCBvZiB3cmFwU3RhdGVtZW50UGF0aHMpIHtcbiAgICAgICAgICB3cmFwU3RhdGVtZW50Tm9kZXMucHVzaChzdGF0ZW1lbnRQYXRoLm5vZGUpO1xuICAgICAgICAgIHN0YXRlbWVudFBhdGgucmVtb3ZlKCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBXcmFwIGNsYXNzIGFuZCBzYWZlIHN0YXRpYyBhc3NpZ25tZW50cyBpbiBhIHB1cmUgYW5ub3RhdGVkIElJRkVcbiAgICAgICAgY29uc3QgY29udGFpbmVyID0gdHlwZXMuYXJyb3dGdW5jdGlvbkV4cHJlc3Npb24oXG4gICAgICAgICAgW10sXG4gICAgICAgICAgdHlwZXMuYmxvY2tTdGF0ZW1lbnQoW1xuICAgICAgICAgICAgdHlwZXMudmFyaWFibGVEZWNsYXJhdGlvbignbGV0JywgW1xuICAgICAgICAgICAgICB0eXBlcy52YXJpYWJsZURlY2xhcmF0b3IodHlwZXMuY2xvbmVOb2RlKGNsYXNzTm9kZS5pZCksIGNsYXNzTm9kZSksXG4gICAgICAgICAgICBdKSxcbiAgICAgICAgICAgIC4uLndyYXBTdGF0ZW1lbnROb2RlcyxcbiAgICAgICAgICAgIHR5cGVzLnJldHVyblN0YXRlbWVudCh0eXBlcy5jbG9uZU5vZGUoY2xhc3NOb2RlLmlkKSksXG4gICAgICAgICAgXSksXG4gICAgICAgICk7XG4gICAgICAgIGNvbnN0IHJlcGxhY2VtZW50SW5pdGlhbGl6ZXIgPSB0eXBlcy5jYWxsRXhwcmVzc2lvbihcbiAgICAgICAgICB0eXBlcy5wYXJlbnRoZXNpemVkRXhwcmVzc2lvbihjb250YWluZXIpLFxuICAgICAgICAgIFtdLFxuICAgICAgICApO1xuICAgICAgICBhbm5vdGF0ZUFzUHVyZShyZXBsYWNlbWVudEluaXRpYWxpemVyKTtcblxuICAgICAgICAvLyBBZGQgdGhlIHdyYXBwZWQgY2xhc3MgZGlyZWN0bHkgdG8gdGhlIHZhcmlhYmxlIGRlY2xhcmF0aW9uXG4gICAgICAgIHBhcmVudFBhdGguZ2V0KCdpbml0JykucmVwbGFjZVdpdGgocmVwbGFjZW1lbnRJbml0aWFsaXplcik7XG4gICAgICB9LFxuICAgIH0sXG4gIH07XG59XG4iXX0=