/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import ts from 'typescript';
/**
 * Creates a TypeScript Transformer to transform Angular Component resource references into
 * static import statements. This transformer is used in Angular's JIT compilation mode to
 * support processing of component resources. When in AOT mode, the Angular AOT compiler handles
 * this processing and this transformer is not used.
 * @param getTypeChecker A function that returns a TypeScript TypeChecker instance for the program.
 * @returns A TypeScript transformer factory.
 */
export declare function createJitResourceTransformer(getTypeChecker: () => ts.TypeChecker): ts.TransformerFactory<ts.SourceFile>;
